import { isRecord } from './blocks'
import type { Parsed, Problem } from './problems'
import type { LineState } from './stop'

export interface JournalTask {
  issue?: number
  pr?: number
  title: string
  state: string
  level?: string
  verdict?: string
  rating?: string
  rounds: number
  stages: Record<string, number>
}

export interface JournalLineProblem {
  stage: string
  description: string
  at: string
  issue?: number
  pr?: number
}

export type Journal =
  | { status: 'missing' }
  | { status: 'invalid' }
  | {
      status: 'present'
      updated?: string
      line: LineState
      tasks: JournalTask[]
      lineProblems: JournalLineProblem[]
    }

const PATH = 'journal.json'

function problem(repo: string, reason: string, issue?: number): Problem {
  const source: Problem['source'] =
    issue === undefined ? { kind: 'repo', repo, path: PATH } : { kind: 'issue', repo, number: issue, path: PATH }
  return { source, reason }
}

function optNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readStages(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined
  const stages: Record<string, number> = {}
  for (const [name, cost] of Object.entries(value)) {
    if (typeof cost !== 'number' || !Number.isFinite(cost)) return undefined
    stages[name] = cost
  }
  return stages
}

function readTask(row: unknown): JournalTask | string {
  if (!isRecord(row)) return 'Row is not an object'
  if (typeof row.title !== 'string') return 'Row lacks title'
  if (typeof row.state !== 'string') return 'Row lacks state'
  const rounds = optNumber(row.rounds)
  if (rounds === undefined) return 'Row has rounds that is not a number'
  const stages = readStages(row.stages)
  if (stages === undefined) return 'Row has stages that is not a map of costs'
  const task: JournalTask = { title: row.title, state: row.state, rounds, stages }
  const issue = optNumber(row.issue)
  const pr = optNumber(row.pr)
  const level = optString(row.level)
  const verdict = optString(row.verdict)
  const rating = optString(row.rating)
  if (issue !== undefined) task.issue = issue
  if (pr !== undefined) task.pr = pr
  if (level !== undefined) task.level = level
  if (verdict !== undefined) task.verdict = verdict
  if (rating !== undefined) task.rating = rating
  return task
}

function readLine(stopped: unknown): LineState | undefined {
  if (stopped === null || stopped === undefined) return { stopped: false }
  const issue = isRecord(stopped) ? optNumber(stopped.issue) : optNumber(stopped)
  return issue === undefined ? undefined : { stopped: true, issue }
}

function readLineProblem(entry: unknown): JournalLineProblem | undefined {
  if (!isRecord(entry)) return undefined
  const { stage, problem: description, at } = entry
  if (typeof stage !== 'string' || typeof description !== 'string' || typeof at !== 'string') return undefined
  const result: JournalLineProblem = { stage, description, at }
  const issue = optNumber(entry.issue)
  const pr = optNumber(entry.pr)
  if (issue !== undefined) result.issue = issue
  if (pr !== undefined) result.pr = pr
  return result
}

function readList<T>(
  repo: string,
  list: unknown,
  name: string,
  read: (entry: unknown) => T | string | undefined,
  problems: Problem[],
): T[] {
  if (list === undefined) return []
  if (!Array.isArray(list)) {
    problems.push(problem(repo, `Field ${name} is not a list`))
    return []
  }
  const value: T[] = []
  for (const entry of list) {
    const result = read(entry)
    if (result === undefined || typeof result === 'string') {
      const issue = isRecord(entry) ? optNumber(entry.issue) : undefined
      problems.push(problem(repo, typeof result === 'string' ? result : `Entry of ${name} is invalid`, issue))
    } else {
      value.push(result)
    }
  }
  return value
}

/**
 * Reads the text of `journal.json` from the `factory-journal` branch.
 * `null` means the branch does not exist yet, which is a state and not a problem.
 * A bad row is skipped and reported, and does not stop the others.
 */
export function parseJournal(repo: string, text: string | null): Parsed<Journal> {
  if (text === null) return { value: { status: 'missing' }, problems: [] }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { value: { status: 'invalid' }, problems: [problem(repo, 'File journal.json has invalid JSON')] }
  }
  if (!isRecord(data) || !Array.isArray(data.rows)) {
    return { value: { status: 'invalid' }, problems: [problem(repo, 'File journal.json has no list of rows')] }
  }
  const problems: Problem[] = []
  const line = readLine(data.stopped)
  if (line === undefined) problems.push(problem(repo, 'Field stopped has no issue number'))
  const tasks = readList(repo, data.rows, 'rows', readTask, problems)
  const lineProblems = readList(repo, data.lineProblems, 'lineProblems', readLineProblem, problems)
  const updated = optString(data.updated)
  return {
    value: {
      status: 'present',
      ...(updated === undefined ? {} : { updated }),
      line: line ?? { stopped: false },
      tasks,
      lineProblems,
    },
    problems,
  }
}
