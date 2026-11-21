import { describe, expect, it } from 'vitest'
import { parseTasks, taskNumberFromBranch, type GithubIssue } from './tasks'

const issue = (number: number, ...labels: string[]): GithubIssue => ({
  number,
  state: 'open',
  labels: labels.map((name) => ({ name })),
})

describe('parseTasks', () => {
  it('keeps pipeline labels and drops issues without them', () => {
    const { value, problems } = parseTasks('o/r', [issue(1, 'blocked', 'queued', 'bug'), issue(2, 'bug'), issue(3)])
    expect(value).toEqual([{ number: 1, labels: ['blocked', 'queued'] }])
    expect(problems).toEqual([])
  })

  it('reports unknown factory: label as problem and keeps other labels', () => {
    const { value, problems } = parseTasks('o/r', [issue(5, 'queued', 'factory:xyz')])
    expect(value).toEqual([{ number: 5, labels: ['queued'] }])
    expect(problems).toHaveLength(1)
    expect(problems[0]?.source).toEqual({ kind: 'issue', repo: 'o/r', number: 5 })
    expect(problems[0]?.reason).toContain('factory:xyz')
  })
})

describe('taskNumberFromBranch', () => {
  it('matches only factory/<number>-<name>', () => {
    expect(taskNumberFromBranch('factory/42-nowy-ekran')).toBe(42)
    expect(taskNumberFromBranch('feature/42-nowy-ekran')).toBeNull()
    expect(taskNumberFromBranch('factory/nowy-ekran')).toBeNull()
  })
})
