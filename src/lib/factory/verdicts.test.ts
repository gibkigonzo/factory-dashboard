import { describe, expect, it } from 'vitest'
import { parseVerdicts, type PrComment } from './verdicts'

const pr = { repo: 'o/r', number: 7 }

function comment(id: number, round: number, reactions: PrComment['reactions'] = []): PrComment {
  return {
    id,
    body: `<!-- factory:shadow -->\n<!-- factory:shadow-data {"round":${round},"level":"High","action":"escalate"} -->`,
    reactions,
  }
}

const react = (login: string, content: string) => ({ user: { login }, content })

describe('parseVerdicts', () => {
  it('reads shadow verdict round, level and action', () => {
    const { value } = parseVerdicts(pr, 'o', [comment(1, 2)])
    expect(value.current).toMatchObject({ round: 2, level: 'High', action: 'escalate' })
  })

  it('returns all rounds and marks the highest round as current', () => {
    const { value } = parseVerdicts(pr, 'o', [comment(2, 2), comment(1, 1)])
    expect(value.verdicts.map((v) => v.round)).toEqual([1, 2])
    expect(value.current?.round).toBe(2)
  })

  it('owner +1 gives agree and -1 gives disagree', () => {
    const up = parseVerdicts(pr, 'o', [comment(1, 1, [react('o', '+1')])])
    const down = parseVerdicts(pr, 'o', [comment(1, 1, [react('o', '-1')])])
    expect(up.value.current?.rating).toBe('agree')
    expect(down.value.current?.rating).toBe('disagree')
  })

  it('reactions of other users do not change the rating', () => {
    const result = parseVerdicts(pr, 'o', [comment(1, 1, [react('x', '+1'), react('y', '-1')])])
    expect(result.value.current?.rating).toBe('none')
    expect(result.problems).toEqual([])
  })

  it('owner +1 and -1 together give no rating and a problem with PR number', () => {
    const result = parseVerdicts(pr, 'o', [comment(1, 1, [react('o', '+1'), react('o', '-1')])])
    expect(result.value.current?.rating).toBe('none')
    expect(result.problems).toHaveLength(1)
    expect(result.problems[0].source.number).toBe(7)
  })
})
