/**
 * Visual verification against ../PipeMind-data/ui/*.png.
 *
 * Requires the backend on :8000 and the dev server on :5173.
 *   node scripts/screenshot.mjs [route] [outputName]
 */
import { chromium } from 'playwright'

const route = process.argv[2] ?? '/app'
const name = process.argv[3] ?? 'workspace'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 1024 } })
const page = await ctx.newPage()

const errors = []
page.on('console', m => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', e => errors.push(String(e)))

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
await page.fill('input[type=email]', 'jbelioussema33@gmail.com')
await page.fill('input[type=password]', 'password')
await page.click('button[type=submit]')
await page.waitForURL('**/app', { timeout: 15000 })

if (route !== '/app') {
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' })
}

await page.waitForLoadState('networkidle')
await page.waitForTimeout(1200)
await page.screenshot({ path: `/tmp/${name}-dark.png` })

await page.click('button[aria-label*="light theme"]').catch(() => {})
await page.waitForTimeout(600)
await page.screenshot({ path: `/tmp/${name}-light.png` })

console.log(`wrote /tmp/${name}-{dark,light}.png`)
console.log('console errors:', errors.length ? errors : 'none')

await browser.close()
