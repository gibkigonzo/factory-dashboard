import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from '@playwright/test'

// Ekran <nazwa> ma zrzut <nazwa>@<szerokość>.png, a gdy istnieje makieta design/<nazwa>.html,
// także wzorzec <nazwa>@<szerokość>.ref.png wyrenderowany w tej samej przeglądarce.
const SCREENS = [
  { name: 'projects', path: '/' },
  { name: 'patterns', path: '/patterns' },
]
const WIDTHS = [390, 1280]
const OUT = process.env.FACTORY_SCREENSHOTS ?? 'screenshots'

mkdirSync(OUT, { recursive: true })

for (const screen of SCREENS) {
  for (const width of WIDTHS) {
    test(`${screen.name}@${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(screen.path)
      // Trasy ładują się leniwie: zrzut dopiero po wyrenderowaniu ekranu i po załadowaniu czcionek.
      await page.locator('#root > *').first().waitFor()
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `${OUT}/${screen.name}@${width}.png`, fullPage: true, animations: 'disabled' })

      const design = resolve('design', `${screen.name}.html`)
      if (!existsSync(design)) return
      await page.goto(pathToFileURL(design).href)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `${OUT}/${screen.name}@${width}.ref.png`, fullPage: true, animations: 'disabled' })
    })
  }
}
