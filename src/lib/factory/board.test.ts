import { describe, expect, it } from 'vitest'
import { BOARD_COLUMNS, boardColumn, pausedMarker, type BoardTaskInput } from './board'

const task = (labels: string[], extra: Partial<BoardTaskInput> = {}): BoardTaskInput => ({
  state: 'open',
  labels,
  pr: null,
  ...extra,
})

describe('board columns', () => {
  it('columns are in owner order', () => {
    expect(BOARD_COLUMNS.map((c) => c.title)).toEqual([
      'Nowe',
      'Gotowe',
      'Czeka na zgodę',
      'W kolejce',
      'W toku',
      'Twoja decyzja',
      'Zablokowane',
      'Zrobione',
    ])
  })

  it.each([
    [['blocked', 'queued'], {}, 'blocked'],
    [['queued'], {}, 'queued'],
    [['ready'], { state: 'closed' as const }, 'done'],
    [['rejected', 'ready'], {}, 'done'],
    [['needs-approval', 'ready'], {}, 'needs-approval'],
    [['ready'], {}, 'ready'],
    [['idea'], {}, 'new'],
    [['planned'], {}, 'new'],
    [['blocked', 'needs-approval'], {}, 'blocked'],
    [['blocked'], { state: 'closed' as const }, 'done'],
    [['blocked', 'rejected'], {}, 'done'],
    [['blocked', 'rejected'], { pr: { open: true, verdict: 'merge' } }, 'done'],
  ])('label rules map to columns with precedence %j', (labels, extra, column) => {
    expect(boardColumn(task(labels, extra))).toBe(column)
  })

  it.each([
    ['merge', 'your-decision'],
    ['escalate', 'your-decision'],
    ['change', 'in-progress'],
    [null, 'in-progress'],
  ])('open factory PR maps to your-decision or in-progress by verdict %s', (verdict, column) => {
    expect(boardColumn(task(['queued'], { pr: { open: true, verdict } }))).toBe(column)
  })

  it.each([
    [['blocked'], { pr: { open: true, verdict: 'merge' } }, 'blocked'],
    [['needs-approval'], { pr: { open: true, verdict: 'merge' } }, 'needs-approval'],
    [['queued'], { pr: { open: false, verdict: 'merge' } }, 'queued'],
    [['ready'], { pr: { open: false, verdict: 'escalate' } }, 'ready'],
    [['queued', 'planned'], {}, 'queued'],
    [['planned', 'ready'], {}, 'ready'],
  ])('precedence around the factory PR and in-progress rule %j', (labels, extra, column) => {
    expect(boardColumn(task(labels, extra))).toBe(column)
  })

  it('factory:paused keeps column and sets paused marker', () => {
    expect(boardColumn(task(['ready', 'factory:paused']))).toBe('ready')
    expect(pausedMarker(['ready', 'factory:paused'])).toBe('czeka na wznowienie taśmy')
    expect(pausedMarker(['ready'])).toBeNull()
  })
})
