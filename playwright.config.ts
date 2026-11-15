import { defineConfig, devices } from '@playwright/test'

// E2E na froncie z Vite: wywołania Rusta podmienia src/mocks/ipc.ts, bez sieci i bez tokenu.
export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'screenshots/**',
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { baseURL: 'http://localhost:1420' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    env: { VITE_MOCK_IPC: '1' },
  },
})
