import { expect, test } from '@playwright/test'

test('start page shows projects', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projekty')
})
