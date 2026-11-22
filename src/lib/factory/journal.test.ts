import { describe, expect, it } from 'vitest'
import { parseJournal } from './journal'

const row = (n: number, extra: Record<string, unknown> = {}) => ({
  issue: n,
  pr: n + 100,
  title: `Task ${n}`,
  state: 'merged',
  level: 'High',
  verdict: 'approve',
  rating: 'good',
  rounds: 2,
  stages: { plan: 0.5, implement: 1.25 },
  ...extra,
})

const journal = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ updated: '2026-01-01T00:00:00Z', stopped: null, rows: [row(1), row(2), row(3)], ...extra })

function present(text: string | null) {
  const { value, problems } = parseJournal('o/r', text)
  if (value.status !== 'present') throw new Error(`status ${value.status}`)
  return { value, problems }
}

describe('parseJournal', () => {
  it('reads three rows into three tasks with all fields', () => {
    const { value, problems } = present(journal())
    expect(problems).toEqual([])
    expect(value.tasks).toHaveLength(3)
    expect(value.tasks[0]).toEqual({
      issue: 1,
      pr: 101,
      title: 'Task 1',
      state: 'merged',
      level: 'High',
      verdict: 'approve',
      rating: 'good',
      rounds: 2,
      stages: { plan: 0.5, implement: 1.25 },
    })
  })

  it('stopped with issue 7 gives stopped line state', () => {
    expect(present(journal({ stopped: 7 })).value.line).toEqual({ stopped: true, issue: 7 })
    expect(present(journal({ stopped: { issue: 7, since: 'x', reason: 'y' } })).value.line).toEqual({
      stopped: true,
      issue: 7,
    })
  })

  it('stopped null gives running line state', () => {
    expect(present(journal({ stopped: null })).value.line).toEqual({ stopped: false })
  })

  it('missing journal branch gives missing state without problems', () => {
    expect(parseJournal('o/r', null)).toEqual({ value: { status: 'missing' }, problems: [] })
  })

  it('row with text rounds is skipped and reported with issue number and reason', () => {
    const rows = [row(1), row(2, { rounds: 'dwie' }), row(3)]
    const { value, problems } = present(journal({ rows }))
    expect(value.tasks.map((t) => t.issue)).toEqual([1, 3])
    expect(problems).toHaveLength(1)
    expect(problems[0]?.source).toMatchObject({ kind: 'issue', number: 2 })
    expect(problems[0]?.reason).toContain('rounds')
  })

  it('lineProblems give stage, description and time', () => {
    const lineProblems = [{ stage: 'review', problem: 'timeout', at: '2026-01-02T10:00:00Z' }, { stage: 'x' }]
    const { value, problems } = present(journal({ lineProblems }))
    expect(value.lineProblems).toEqual([{ stage: 'review', description: 'timeout', at: '2026-01-02T10:00:00Z' }])
    expect(problems).toHaveLength(1)
  })

  it('invalid JSON gives invalid state and one problem', () => {
    const { value, problems } = parseJournal('o/r', '{nope')
    expect(value.status).toBe('invalid')
    expect(problems).toHaveLength(1)
  })
})
