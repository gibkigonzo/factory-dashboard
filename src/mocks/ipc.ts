import { mockIPC } from '@tauri-apps/api/mocks'

/** Odpowiedzi komend Rusta w e2e i na zrzutach, po nazwie komendy. Dopisuje je zadanie, które dodaje komendę. */
const responses: Record<string, unknown> = {}

export function installIpcMock(): void {
  mockIPC((command) => {
    if (command in responses) return responses[command]
    throw new Error(`Brak odpowiedzi testowej dla komendy ${command}`)
  })
}
