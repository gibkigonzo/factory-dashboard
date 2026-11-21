import type { GithubIssue } from './tasks'

export type LineState = { stopped: false } | { stopped: true; issue: number }

export function lineState(issues: GithubIssue[]): LineState {
  const numbers = issues
    .filter((i) => i.state === 'open' && i.labels.some((l) => l.name === 'factory:stopped'))
    .map((i) => i.number)
  return numbers.length > 0 ? { stopped: true, issue: Math.min(...numbers) } : { stopped: false }
}
