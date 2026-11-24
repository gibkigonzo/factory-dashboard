import { authoredBlocks, isRecord, prProblem, TRUSTED_AUTHORS, type PrRef } from './blocks'
import type { Parsed, Problem } from './problems'
import type { PrComment } from './verdicts'

type Source = 'pr-body' | 'comment'

export interface UsageRecord {
  stage: string
  cost: number
  source: Source
  pr: number
}

export interface LineProblem {
  stage: string
  description: string
  at: string
  source: Source
  pr: number
}

export interface PrBody {
  body: string
  user: { login: string }
}

function texts(body: PrBody, comments: PrComment[]): { text: string; author: string; source: Source }[] {
  return [
    { text: body.body, author: body.user.login, source: 'pr-body' },
    ...comments.map((c) => ({ text: c.body, author: c.user.login, source: 'comment' as const })),
  ]
}

export function parseUsage(
  pr: PrRef,
  body: PrBody,
  comments: PrComment[],
  trusted: readonly string[] = TRUSTED_AUTHORS,
): Parsed<UsageRecord[]> {
  const value: UsageRecord[] = []
  const problems: Problem[] = []
  for (const { text, author, source } of texts(body, comments)) {
    const blocks = authoredBlocks(text, author, 'usage', pr, trusted)
    problems.push(...blocks.problems)
    for (const block of blocks.value) {
      if (!Array.isArray(block)) {
        problems.push(prProblem(pr, 'Block factory:usage is not a list'))
        continue
      }
      for (const item of block) {
        const cost = isRecord(item) ? (item.cost_usd ?? item.cost) : undefined
        if (!isRecord(item) || typeof item.stage !== 'string' || typeof cost !== 'number') {
          problems.push(prProblem(pr, 'Entry of factory:usage lacks stage or cost'))
          continue
        }
        value.push({ stage: item.stage, cost, source, pr: pr.number })
      }
    }
  }
  return { value, problems }
}

export function parseLineProblems(
  pr: PrRef,
  body: PrBody,
  comments: PrComment[],
  trusted: readonly string[] = TRUSTED_AUTHORS,
): Parsed<LineProblem[]> {
  const value: LineProblem[] = []
  const problems: Problem[] = []
  for (const { text, author, source } of texts(body, comments)) {
    const blocks = authoredBlocks(text, author, 'line-problem', pr, trusted)
    problems.push(...blocks.problems)
    for (const block of blocks.value) {
      const description = isRecord(block) ? (block.problem ?? block.message) : undefined
      if (
        !isRecord(block) ||
        typeof block.stage !== 'string' ||
        typeof description !== 'string' ||
        typeof block.at !== 'string'
      ) {
        problems.push(prProblem(pr, 'Block factory:line-problem lacks stage, problem or at'))
        continue
      }
      value.push({ stage: block.stage, description, at: block.at, source, pr: pr.number })
    }
  }
  return { value, problems }
}
