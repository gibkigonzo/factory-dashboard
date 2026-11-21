import type { Parsed, Problem } from './problems'

export interface RepoWorkflows {
  repo: string
  workflows: { path: string; content: string }[]
}

export interface FactoryProject {
  repo: string
  /** Pinned factory version (tag, branch or SHA); null when the repo is not a factory project. */
  version: string | null
}

const PIPELINE_USES = /uses:\s*gibkigonzo\/factory\/\.github\/workflows\/pipeline\.yml(@\S*)?/

export function parseFactoryProjects(repos: RepoWorkflows[]): Parsed<FactoryProject[]> {
  const value: FactoryProject[] = []
  const problems: Problem[] = []
  for (const { repo, workflows } of repos) {
    let version: string | null = null
    let broken = false
    for (const workflow of workflows) {
      const match = PIPELINE_USES.exec(workflow.content)
      if (!match) continue
      const pinned = match[1]?.slice(1)
      if (!pinned) {
        problems.push({
          source: { kind: 'workflow', repo, path: workflow.path },
          reason: 'pipeline.yml entry has no version after @',
        })
        broken = true
        continue
      }
      version = pinned
      break
    }
    if (version !== null || !broken) value.push({ repo, version })
  }
  return { value, problems }
}
