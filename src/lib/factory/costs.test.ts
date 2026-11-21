import { describe, expect, it } from 'vitest'
import { parseLineProblems, parseUsage } from './costs'

const pr = { repo: 'o/r', number: 7 }
const comments = [{ id: 1, body: '<!-- factory:usage [{"stage":"review","cost_usd":0.5}] -->' }]

describe('parseUsage', () => {
  it('reads usage records from PR body and comments with source', () => {
    const body = '<!-- factory:usage [{"stage":"plan","cost_usd":1.25}] -->'
    const { value, problems } = parseUsage(pr, body, comments)
    expect(problems).toEqual([])
    expect(value).toEqual([
      { stage: 'plan', cost: 1.25, source: 'pr-body', pr: 7 },
      { stage: 'review', cost: 0.5, source: 'comment', pr: 7 },
    ])
  })

  it('invalid usage block does not stop other blocks of the PR', () => {
    const body =
      '<!-- factory:usage [oops -->\n<!-- factory:usage [{"stage":"plan","cost_usd":1}] -->'
    const { value, problems } = parseUsage(pr, body, [])
    expect(value).toHaveLength(1)
    expect(problems).toHaveLength(1)
    expect(problems[0].source.number).toBe(7)
  })
})

describe('parseLineProblems', () => {
  it('reads line problem with stage, description and time', () => {
    const body =
      '<!-- factory:line-problem {"stage":"build","problem":"lint fails","at":"2026-01-02T03:04:05Z"} -->'
    const { value } = parseLineProblems(pr, body, [])
    expect(value).toEqual([
      {
        stage: 'build',
        description: 'lint fails',
        at: '2026-01-02T03:04:05Z',
        source: 'pr-body',
        pr: 7,
      },
    ])
  })
})
