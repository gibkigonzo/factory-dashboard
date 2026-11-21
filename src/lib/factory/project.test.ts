import { describe, expect, it } from 'vitest'
import { parseFactoryProjects } from './project'

const workflow = (suffix: string) => [
  {
    path: '.github/workflows/factory.yml',
    content: 'jobs:\n  p:\n    uses: gibkigonzo/factory/.github/workflows/pipeline.yml' + suffix + '\n',
  },
]

describe('parseFactoryProjects', () => {
  it('reads pinned version or marks non-factory project', () => {
    const { value, problems } = parseFactoryProjects([
      { repo: 'o/a', workflows: workflow('@v1') },
      { repo: 'o/b', workflows: [{ path: 'ci.yml', content: 'name: ci\n' }] },
    ])
    expect(value).toEqual([
      { repo: 'o/a', version: 'v1' },
      { repo: 'o/b', version: null },
    ])
    expect(problems).toEqual([])
  })

  it('reports missing version and keeps other projects', () => {
    const { value, problems } = parseFactoryProjects([
      { repo: 'o/a', workflows: workflow('') },
      { repo: 'o/c', workflows: workflow('@') },
      { repo: 'o/b', workflows: workflow('@v2') },
    ])
    expect(value).toEqual([{ repo: 'o/b', version: 'v2' }])
    expect(problems.map((p) => p.source.repo)).toEqual(['o/a', 'o/c'])
    expect(problems[0]?.reason).toBeTruthy()
  })
})
