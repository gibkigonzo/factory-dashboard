import { describe, expect, it } from 'vitest'
import { lineState } from './stop'
import type { GithubIssue } from './tasks'

const stopped = (number: number, state: 'open' | 'closed'): GithubIssue => ({
  number,
  state,
  labels: [{ name: 'factory:stopped' }],
})

describe('lineState', () => {
  it('reports stop only for open factory:stopped issue', () => {
    expect(lineState([stopped(7, 'open')])).toEqual({ stopped: true, issue: 7 })
    expect(lineState([stopped(7, 'closed')])).toEqual({ stopped: false })
    expect(lineState([])).toEqual({ stopped: false })
  })
})
