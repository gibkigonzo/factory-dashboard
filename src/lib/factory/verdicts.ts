import { extractBlocks, isRecord, prProblem, type PrRef } from './blocks'
import type { Parsed, Problem } from './problems'

export type Rating = 'agree' | 'disagree' | 'none'

export interface PrComment {
  id: number
  body: string
  reactions?: { user: { login: string }; content: string }[]
}

export interface ShadowVerdict {
  round: number
  level: string
  action: string
  commentId: number
  rating: Rating
}

export interface Verdicts {
  verdicts: ShadowVerdict[]
  current: ShadowVerdict | null
}

function rate(comment: PrComment, owner: string, pr: PrRef, problems: Problem[]): Rating {
  const own = new Set((comment.reactions ?? []).filter((r) => r.user.login === owner).map((r) => r.content))
  const up = own.has('+1')
  const down = own.has('-1')
  if (up && down) {
    problems.push(prProblem(pr, `Owner gave both +1 and -1 on comment ${comment.id}`))
    return 'none'
  }
  if (up) return 'agree'
  if (down) return 'disagree'
  return 'none'
}

export function parseVerdicts(pr: PrRef, owner: string, comments: PrComment[]): Parsed<Verdicts> {
  const verdicts: ShadowVerdict[] = []
  const problems: Problem[] = []
  for (const comment of comments) {
    if (!/<!--\s*factory:shadow\s*-->/.test(comment.body)) continue
    const blocks = extractBlocks(comment.body, 'shadow-data', pr)
    problems.push(...blocks.problems)
    for (const block of blocks.value) {
      if (
        !isRecord(block) ||
        typeof block.round !== 'number' ||
        typeof block.level !== 'string' ||
        typeof block.action !== 'string'
      ) {
        problems.push(prProblem(pr, 'Block factory:shadow-data lacks round, level or action'))
        continue
      }
      verdicts.push({
        round: block.round,
        level: block.level,
        action: block.action,
        commentId: comment.id,
        rating: rate(comment, owner, pr, problems),
      })
    }
  }
  verdicts.sort((a, b) => a.round - b.round)
  return { value: { verdicts, current: verdicts[verdicts.length - 1] ?? null }, problems }
}
