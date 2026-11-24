export const BOARD_COLUMNS = [
  { id: 'new', title: 'Nowe' },
  { id: 'ready', title: 'Gotowe' },
  { id: 'needs-approval', title: 'Czeka na zgodę' },
  { id: 'queued', title: 'W kolejce' },
  { id: 'in-progress', title: 'W toku' },
  { id: 'your-decision', title: 'Twoja decyzja' },
  { id: 'blocked', title: 'Zablokowane' },
  { id: 'done', title: 'Zrobione' },
] as const

export type BoardColumnId = (typeof BOARD_COLUMNS)[number]['id']

export interface BoardTaskInput {
  state: 'open' | 'closed'
  labels: string[]
  /** Open factory PR of the task; `verdict` is the action of the current verdict. */
  pr: { open: boolean; verdict: string | null } | null
}

export const PAUSED_MARKER = 'czeka na wznowienie taśmy'

/** Assigns a task to one column; the first matching rule wins. */
export function boardColumn(input: BoardTaskInput): BoardColumnId {
  const has = (label: string) => input.labels.includes(label)
  if (input.state === 'closed' || has('rejected')) return 'done'
  if (has('blocked')) return 'blocked'
  if (has('needs-approval')) return 'needs-approval'
  if (input.pr?.open) {
    return input.pr.verdict === 'merge' || input.pr.verdict === 'escalate' ? 'your-decision' : 'in-progress'
  }
  if (has('queued')) return 'queued'
  if (has('ready')) return 'ready'
  return 'new'
}

export function pausedMarker(labels: string[]): string | null {
  return labels.includes('factory:paused') ? PAUSED_MARKER : null
}
