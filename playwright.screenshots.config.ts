import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

// Zrzuty dla taśmy fabryki: ekrany aplikacji i makiety z design/ w tej samej przeglądarce.
export default defineConfig({
  ...base,
  testDir: 'e2e/screenshots',
  testIgnore: [],
  workers: 1,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
