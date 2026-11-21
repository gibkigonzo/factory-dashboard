import { describe, expect, it } from 'vitest'
import { extractBlocks } from './blocks'

const pr = { repo: 'o/r', number: 7 }

describe('extractBlocks', () => {
  it('invalid JSON block becomes a problem with PR number and reason while other blocks parse', () => {
    const text =
      '<!-- factory:usage [{"a":1}] -->\n<!-- factory:usage {broken -->\n<!-- factory:usage [2] -->'
    const result = extractBlocks(text, 'usage', pr)
    expect(result.value).toEqual([[{ a: 1 }], [2]])
    expect(result.problems).toHaveLength(1)
    expect(result.problems[0].source).toMatchObject({ kind: 'pr', repo: 'o/r', number: 7 })
    expect(result.problems[0].reason).not.toBe('')
  })
})
