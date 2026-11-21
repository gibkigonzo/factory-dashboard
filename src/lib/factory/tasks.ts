import type { Parsed, Problem } from './problems'

export const PIPELINE_LABELS = [
  'idea',
  'ready',
  'planned',
  'queued',
  'needs-approval',
  'blocked',
  'split',
  'rejected',
  'refactor',
  'factory:paused',
] as const

export const KNOWN_FACTORY_LABELS: readonly string[] = [...PIPELINE_LABELS, 'factory:stopped']

export interface GithubIssue {
  number: number
  state: 'open' | 'closed'
  labels: { name: string }[]
}

export interface Task {
  number: number
  labels: string[]
}

export function parseTasks(repo: string, issues: GithubIssue[]): Parsed<Task[]> {
  const value: Task[] = []
  const problems: Problem[] = []
  for (const issue of issues) {
    const names = issue.labels.map((label) => label.name)
    for (const name of names) {
      if (name.startsWith('factory:') && !KNOWN_FACTORY_LABELS.includes(name)) {
        problems.push({
          source: { kind: 'issue', repo, number: issue.number },
          reason: `Unknown factory label: ${name}`,
        })
      }
    }
    const labels = names.filter((name) => (PIPELINE_LABELS as readonly string[]).includes(name))
    if (labels.length > 0) value.push({ number: issue.number, labels })
  }
  return { value, problems }
}

export function taskNumberFromBranch(branch: string): number | null {
  const match = /^factory\/(\d+)-.+$/.exec(branch)
  return match ? Number(match[1]) : null
}
