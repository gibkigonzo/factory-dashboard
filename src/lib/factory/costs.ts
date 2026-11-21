import { extractBlocks, isRecord, prProblem, type PrRef } from './blocks'
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

function texts(body: string, comments: PrComment[]): { text: string; source: Source }[] {
  return [{ text: body, source: 'pr-body' }, ...comments.map((c) => ({ text: c.body, source: 'comment' as const }))]
}

export function parseUsage(pr: PrRef, body: string, comments: PrComment[]): Parsed<UsageRecord[]> {
  const value: UsageRecord[] = []
  const problems: Problem[] = []
  for (const { text, source } of texts(body, comments)) {
    const blocks = extractBlocks(text, 'usage', pr)
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

export function parseLineProblems(pr: PrRef, body: string, comments: PrComment[]): Parsed<LineProblem[]> {
  const value: LineProblem[] = []
  const problems: Problem[] = []
  for (const { text, source } of texts(body, comments)) {
    const blocks = extractBlocks(text, 'line-problem', pr)
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
