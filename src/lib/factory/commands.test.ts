import { describe, expect, it } from 'vitest'
import { commandAvailability, releaseKind, type CommandContext } from './commands'

const ctx = (extra: Partial<CommandContext> = {}): CommandContext => ({
  place: 'issue',
  labels: [],
  hasOpenFactoryPr: false,
  lineStopped: false,
  text: '',
  ...extra,
})

describe('commands', () => {
  it('split and change availability', () => {
    expect(commandAvailability('/split', ctx({ hasOpenFactoryPr: true }))).toEqual({
      available: false,
      reason: 'Za późno na podział: zadanie ma już PR',
    })
    expect(commandAvailability('/split', ctx({ labels: ['idea'] }))).toEqual({ available: true })
    expect(commandAvailability('/change', ctx())).toBeNull()
    expect(commandAvailability('/change', ctx({ place: 'pr' }))).toEqual({ available: false, reason: 'Wpisz uwagi' })
    expect(commandAvailability('/change', ctx({ place: 'pr', text: 'popraw' }))).toEqual({ available: true })
  })

  it('approve requires needs-approval and release defaults to patch', () => {
    expect(commandAvailability('/approve', ctx())).toMatchObject({ available: false })
    expect(commandAvailability('/approve', ctx({ labels: ['needs-approval'] }))).toEqual({ available: true })
    expect(releaseKind()).toBe('patch')
    expect(releaseKind('minor')).toBe('minor')
    expect(releaseKind('major')).toBe('major')
    expect(commandAvailability('/release', ctx({ place: 'project' }))).toEqual({ available: true })
  })

  it('stop and start rules', () => {
    expect(commandAvailability('/stop', ctx())).toEqual({ available: true })
    expect(commandAvailability('/stop', ctx({ lineStopped: true }))).toMatchObject({ available: false })
    expect(commandAvailability('/start', ctx({ lineStopped: true }))).toEqual({ available: true })
    expect(commandAvailability('/start', ctx())).toEqual({ available: true })
  })
})
