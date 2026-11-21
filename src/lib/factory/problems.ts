export interface Problem {
  source: {
    kind: 'repo' | 'issue' | 'pr' | 'workflow'
    repo: string
    number?: number
    path?: string
  }
  reason: string
}

export interface Parsed<T> {
  value: T
  problems: Problem[]
}
