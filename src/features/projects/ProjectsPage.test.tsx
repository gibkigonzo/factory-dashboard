import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProjectsPage } from './ProjectsPage'

describe('ProjectsPage', () => {
  it('shows the projects heading', () => {
    render(<ProjectsPage />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Projekty')
  })
})
