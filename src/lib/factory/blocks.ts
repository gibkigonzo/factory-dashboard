import type { Parsed, Problem } from './problems'

export interface PrRef {
  repo: string
  number: number
}

export function prProblem(pr: PrRef, reason: string): Problem {
  return { source: { kind: 'pr', repo: pr.repo, number: pr.number }, reason }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reads all `<!-- factory:<name> <JSON> -->` blocks from a text.
 * A block with invalid JSON becomes a problem and does not stop the others.
 */
export function extractBlocks(text: string, name: string, pr: PrRef): Parsed<unknown[]> {
  const pattern = new RegExp(`<!--\\s*factory:${name}\\s+([\\s\\S]*?)\\s*-->`, 'g')
  const value: unknown[] = []
  const problems: Problem[] = []
  for (const match of text.matchAll(pattern)) {
    try {
      value.push(JSON.parse(match[1] ?? ''))
    } catch {
      problems.push(prProblem(pr, `Block factory:${name} has invalid JSON`))
    }
  }
  return { value, problems }
}
