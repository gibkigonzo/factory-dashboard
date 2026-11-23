export type FactoryCommand = '/approve' | '/reject' | '/change' | '/split' | '/stop' | '/start' | '/release'

export interface CommandContext {
  place: 'issue' | 'pr' | 'project'
  labels: string[]
  hasOpenFactoryPr: boolean
  lineStopped: boolean
  /** Text typed after the command. */
  text: string
}

/** `null` means the command does not exist in this place (hidden). */
export type CommandAvailability = { available: true } | { available: false; reason: string } | null

const ok: CommandAvailability = { available: true }
const no = (reason: string): CommandAvailability => ({ available: false, reason })

export function commandAvailability(command: FactoryCommand, ctx: CommandContext): CommandAvailability {
  switch (command) {
    case '/split':
      if (ctx.place !== 'issue') return null
      return ctx.hasOpenFactoryPr ? no('Za późno na podział: zadanie ma już PR') : ok
    case '/change':
      if (ctx.place !== 'pr') return null
      return ctx.text.trim() === '' ? no('Wpisz uwagi') : ok
    case '/approve':
      if (ctx.place === 'project') return null
      if (ctx.place === 'issue' && !ctx.labels.includes('needs-approval')) {
        return no('Zadanie nie czeka na Twoją zgodę.')
      }
      return ok
    case '/reject':
      return ctx.place === 'project' ? null : ok
    case '/stop':
      return ctx.lineStopped ? no('Taśma już stoi.') : ok
    case '/start':
      return ok
    case '/release':
      return ctx.place === 'project' ? ok : null
  }
}

export type ReleaseKind = 'patch' | 'minor' | 'major'

export function releaseKind(arg?: string): ReleaseKind {
  const value = arg?.trim().toLowerCase()
  return value === 'minor' || value === 'major' ? value : 'patch'
}
