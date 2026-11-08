// Run against the local Vite server after installing Playwright in the shared QA temp directory.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(join(process.env.TEMP, 'portfolio-navigation-qa/node_modules/playwright/index.mjs')).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const base = process.env.PORTFOLIO_QA_URL ?? 'http://127.0.0.1:5183/'
const output = join(process.env.TEMP, 'portfolio-navigation-qa/screenshots')
await mkdir(output, { recursive: true })
const errors = []
const checks = []
async function pose(page, value, direction) {
  await page.waitForFunction(({ value, direction }) => {
    const muse = document.querySelector('[data-muse-pose]')
    return muse?.dataset.musePose === value && (!direction || muse.dataset.museDirection === direction)
  }, { value, direction })
}
async function skip(page) {
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click()
  await page.locator('.portfolio-app[data-intro-active="false"]').waitFor({ state: 'attached' })
}
async function screenshot(page, name) { await page.screenshot({ path: join(output, name) }) }
async function noOverlap(page) {
  const result = await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Make Muse tumble"]')
    const muse = button.getBoundingClientRect()
    const overlap = [...document.querySelectorAll('.particle-controls,.section-progress,.site-header')].filter(element => {
      const rect = element.getBoundingClientRect()
      return muse.left < rect.right && muse.right > rect.left && muse.top < rect.bottom && muse.bottom > rect.top
    }).map(element => element.className)
    return { overlap, inside: muse.left >= 0 && muse.right <= innerWidth && muse.top >= 0 && muse.bottom <= innerHeight }
  })
  assert.deepEqual(result.overlap, [], 'Mascot stays clear of fixed portfolio controls')
  assert.ok(result.inside, 'Mascot stays inside the viewport')
}
async function centeredAboveProgress(page, mobile = false) {
  const placement = await page.evaluate(() => {
    const muse = document.querySelector('[data-muse-pose]').getBoundingClientRect()
    const bar = document.querySelector('.section-progress > div').getBoundingClientRect()
    return { offset: Math.abs(muse.left + muse.width / 2 - bar.left - bar.width / 2), bottom: muse.bottom, barTop: bar.top, height: muse.height }
  })
  assert.ok(placement.offset <= 1, `Muse stays centered above actual progress bar: ${placement.offset}px`)
  assert.ok(placement.bottom <= placement.barTop, 'Muse stands above the progress bar')
  assert.ok(placement.height < (mobile ? 80 : 102), 'Muse is shorter than its previous silhouette')
}
async function runningDetails(page, mobile = false) {
  await page.waitForFunction(() => document.querySelector('[data-muse-expression]')?.dataset.museExpression === 'run')
  const shed = await page.locator('.muse-shed circle').count()
  assert.ok(shed > 0 && shed <= 24, `Running sheds a bounded particle population: ${shed}`)
  await centeredAboveProgress(page, mobile)
}

try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 696 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  assert.equal(await page.locator('[data-muse-pose]').count(), 0, 'Muse stays hidden during collision intro')
  await page.waitForFunction(() => document.querySelector('.particle-canvas')?.dataset.introPhase === 'burst')
  await page.waitForTimeout(700)
  await screenshot(page, 'mascot-shared-collision-formation.png')
  await pose(page, 'wave')
  assert.ok(await page.locator('[data-muse-pose] svg circle').count() > 20, 'Muse is visibly built from particle circles')
  assert.equal(await page.locator('[data-muse-pose] .muse-eyes circle').count(), 2, 'Muse has exactly two eye particles')
  assert.ok(await page.locator('.muse-mouth circle').count() > 2, 'Muse has a visible particle smile')
  await screenshot(page, 'mascot-desktop-wave.png')
  await pose(page, 'idle')
  await noOverlap(page)
  await centeredAboveProgress(page)
  assert.equal(await page.locator('[data-muse-expression]').getAttribute('data-muse-expression'), 'smile')
  assert.equal(await page.locator('.muse-shed circle').count(), 0, 'Idle does not retain shed particles')
  await screenshot(page, 'mascot-desktop-idle.png')
  await page.locator('[data-muse-pose]').hover()
  await page.waitForFunction(() => document.querySelector('[data-muse-expression]')?.dataset.museExpression === 'curious')
  await screenshot(page, 'mascot-desktop-curious.png')
  await page.mouse.move(800, 350)
  await page.waitForFunction(() => document.querySelector('[data-muse-expression]')?.dataset.museExpression === 'smile')
  checks.push('Muse forms during the shared collision, hands off directly to a wave, then idles with exactly two eye particles')

  await page.locator('nav a[href="#projects"]').click()
  await pose(page, 'run')
  await runningDetails(page)
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-muse-direction'), 'right')
  await screenshot(page, 'mascot-desktop-run-right.png')
  await pose(page, 'idle')
  assert.equal(await page.locator('.muse-shed circle').count(), 0, 'Shed particles clear after running')
  await page.locator('nav a[href="#home"]').click()
  await pose(page, 'run')
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-muse-direction'), 'left')
  await pose(page, 'idle')
  await page.mouse.move(800, 350)
  await page.mouse.wheel(0, 350)
  await pose(page, 'run')
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-muse-direction'), 'right')
  const performance = await page.locator('.muse-travel').elementHandle()
  await page.mouse.wheel(0, 120)
  assert.ok(await performance.evaluate(node => node === document.querySelector('.muse-travel')), 'Same-direction scroll retains the existing animation element')
  await screenshot(page, 'mascot-desktop-scroll-right.png')
  await page.mouse.wheel(0, -200)
  await pose(page, 'run', 'left')
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-muse-direction'), 'left')
  await screenshot(page, 'mascot-desktop-scroll-left.png')
  await pose(page, 'idle')
  await page.evaluate(() => window.scrollTo({ top: scrollY + 250, behavior: 'instant' }))
  await pose(page, 'run')
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-muse-direction'), 'right')
  await pose(page, 'idle')
  checks.push('Wheel and direct scroll-position changes drive direction; same-direction scrolling preserves animation identity and stopping restores idle')
  const button = page.getByRole('button', { name: 'Make Muse tumble', exact: true })
  await button.focus(); await button.press('Enter')
  await pose(page, 'fall')
  await screenshot(page, 'mascot-desktop-tumble.png')
  await pose(page, 'idle')
  checks.push('Section clicks run in both directions; keyboard activation tumbles and recovers')

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  mobile.on('pageerror', error => errors.push(error.message))
  await mobile.goto(base); await skip(mobile); await pose(mobile, 'idle')
  await noOverlap(mobile)
  await centeredAboveProgress(mobile, true)
  await screenshot(mobile, 'mascot-mobile-idle.png')
  await mobile.getByRole('button', { name: 'Make Muse tumble', exact: true }).tap()
  await pose(mobile, 'fall'); await screenshot(mobile, 'mascot-mobile-tumble.png')
  await pose(mobile, 'idle')
  await mobile.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }))
  await pose(mobile, 'run')
  await runningDetails(mobile, true)
  await pose(mobile, 'idle')
  assert.equal(await mobile.locator('.muse-shed circle').count(), 0)
  checks.push('390px mobile mascot remains in bounds and clear of fixed controls; touch activation works')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(base)
  await page.locator('.portfolio-app[data-intro-active="false"]').waitFor({ state: 'attached' })
  assert.equal(await page.locator('[data-muse-pose]').getAttribute('data-reduced-motion'), 'true')
  await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }))
  await pose(page, 'run')
  assert.equal(await page.locator('.muse-shed circle').count(), 0, 'Reduced motion suppresses running shed particles')
  await page.getByRole('button', { name: 'Make Muse tumble', exact: true }).click()
  await pose(page, 'fall')
  const activeAnimations = await page.locator('[data-muse-pose]').evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)
  assert.equal(activeAnimations, 0, 'Reduced motion feedback does not animate')
  checks.push('Reduced motion keeps static interaction feedback without running animations')
  assert.deepEqual(errors, [], 'No browser runtime errors')
  console.log(JSON.stringify({ passed: checks, screenshots: output, runtimeErrors: errors }, null, 2))
} finally { await browser.close() }
