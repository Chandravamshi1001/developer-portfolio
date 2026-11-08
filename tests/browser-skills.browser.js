// Optional Chrome acceptance check against the Skills Explorer worktree server.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(join(process.env.TEMP, 'portfolio-navigation-qa/node_modules/playwright/index.mjs')).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const base = process.env.PORTFOLIO_QA_URL ?? 'http://127.0.0.1:5184/'
const output = join(process.env.TEMP, 'portfolio-navigation-qa/screenshots/skills')
await mkdir(output, { recursive: true })
const errors = []
const checks = []
async function ready(page) {
  await page.locator('.portfolio-app[data-intro-active]').waitFor({ state: 'attached' })
  const skip = page.getByRole('button', { name: 'Skip intro', exact: true })
  if (await skip.isVisible()) await skip.click()
  await page.locator('.portfolio-app[data-intro-active="false"]').waitFor({ state: 'attached' })
  await page.waitForFunction(() => document.querySelector('nav [aria-current]')?.getAttribute('href') === '#skills')
}
async function select(page, name) {
  const card = page.locator('#skills').getByRole('button', { name, exact: true })
  // Follow the page's real scroll track to the card before clicking; letting
  // Playwright scroll a clipped child competes with native focus alignment.
  await card.evaluate(node => {
    const rect = node.getBoundingClientRect()
    const horizontal = Boolean(document.querySelector('.is-horizontal'))
    const delta = horizontal ? rect.left + rect.width / 2 - innerWidth / 2 : rect.top + rect.height / 2 - innerHeight / 2
    window.scrollBy({ top: delta, behavior: 'instant' })
  })
  await page.waitForFunction(name => {
    const node = [...document.querySelectorAll('#skills button[data-skill-id]')].find(node => node.querySelector('span')?.textContent === name)
    if (!node) return false
    const rect = node.getBoundingClientRect()
    const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0
    return rect.left >= 0 && rect.right <= innerWidth && rect.top >= header && rect.bottom <= innerHeight && document.querySelector('.section-viewport').scrollLeft === 0
  }, name, { timeout: 3000 })
  await page.waitForTimeout(100)
  await card.click()
  await page.locator('#skill-detail-heading').filter({ hasText: name }).waitFor({ state: 'attached', timeout: 3000 }).catch(async error => {
    const state = await page.evaluate(() => ({ heading: document.querySelector('#skill-detail-heading')?.textContent, selected: document.querySelector('[data-skill-id][aria-pressed="true"]')?.outerHTML, focus: document.activeElement?.outerHTML.slice(0, 300), hasFocus: document.hasFocus(), scroll: scrollY, track: getComputedStyle(document.querySelector('.section-track')).transform, viewportScroll: document.querySelector('.section-viewport').scrollLeft }))
    await page.screenshot({ path: join(output, 'skills-selection-failure.png') })
    throw new Error(`${name} click did not select its detail: ${JSON.stringify(state)}`, { cause: error })
  })
  await page.waitForFunction(() => {
    const node = document.querySelector('#skill-detail-heading')
    if (!node) return false
    const rect = node.getBoundingClientRect()
    const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0
    return rect.left >= 0 && rect.right <= innerWidth && rect.top >= header && rect.bottom <= innerHeight
  }, undefined, { timeout: 3000 }).catch(async error => {
    const rect = await page.locator('#skill-detail-heading').evaluate(node => node.getBoundingClientRect().toJSON())
    await page.screenshot({ path: join(output, 'skills-selection-failure.png') })
    throw new Error(`${name} detail heading is outside the usable viewport: ${JSON.stringify(rect)}`, { cause: error })
  })
  const detailLayout = await page.locator('#skill-detail').evaluate(node => {
    const rect = node.getBoundingClientRect()
    return { fragments: node.getClientRects().length, left: rect.left, right: rect.right, width: innerWidth }
  })
  assert.equal(detailLayout.fragments, 1, `${name} evidence panel stays visually together rather than splitting across columns`)
  assert.ok(detailLayout.left >= 0 && detailLayout.right <= detailLayout.width, `${name} evidence panel fits horizontally within the viewport`)
  return card
}
async function noPageOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(size.scroll <= size.width + 1, `No horizontal document clipping: ${size.scroll}/${size.width}`)
}

try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 696 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}#skills`)
  await ready(page)
  const ratings = await page.evaluate(async () => (await import('/tests/skills-expectations.ts')).approvedSkillRatings)
  assert.equal(await page.locator('#skills button[data-skill-id]').count(), 41)
  await select(page, 'Java')
  await page.screenshot({ path: join(output, 'skills-desktop-java.png') })
  const reader = page.locator('#skill-detail')
  const readerOverflows = await reader.evaluate(node => node.scrollHeight > node.clientHeight)
  if (readerOverflows) {
    await reader.focus()
    await reader.press('End')
    await page.waitForFunction(() => {
      const node = document.querySelector('#skill-detail')
      return Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop) <= 2
    })
    const lastEvidenceVisible = await reader.locator('.skill-reference').last().evaluate(node => {
      const reference = node.getBoundingClientRect(), panel = node.closest('#skill-detail').getBoundingClientRect()
      return reference.top >= panel.top && reference.bottom <= panel.bottom
    })
    assert.ok(lastEvidenceVisible, 'Keyboard End exposes the final Java project reference within its cohesive reader')
    await page.screenshot({ path: join(output, 'skills-desktop-java-reader-end.png') })
    const python = await select(page, 'Python')
    assert.equal(await reader.evaluate(node => node.scrollTop), 0, 'Switching skills resets the evidence reader to its new title and meter')
    assert.ok(await python.evaluate(node => node === document.activeElement), 'Switching from a scrolled reader retains the selected card focus')
  }
  for (const [name, value] of Object.entries(ratings)) {
    const card = await select(page, name)
    assert.equal(await card.getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('#skills button[data-skill-id][aria-pressed="true"]').count(), 1)
    const meter = page.locator('#skill-detail [role="meter"]')
    assert.equal(Number(await meter.getAttribute('aria-valuemin')), 0)
    assert.equal(Number(await meter.getAttribute('aria-valuemax')), 5)
    assert.equal(Number(await meter.getAttribute('aria-valuenow')), value)
    assert.equal(await page.locator('#skill-detail').count(), 1, 'Switching reuses one panel')
  }
  checks.push('All 41 skills select one stable detail panel with exact owner-approved 0–5 values')
  const java = await select(page, 'Java')
  await java.focus()
  await java.press('Enter')
  assert.ok(await java.evaluate(node => node === document.activeElement), 'Selecting does not steal focus')
  await page.keyboard.press('Tab')
  const nextId = await page.locator(':focus').getAttribute('data-skill-id')
  assert.ok(nextId, 'Normal Tab reaches another skill')
  const next = page.locator(`#skills button[data-skill-id="${nextId}"]`)
  await page.keyboard.press('Space')
  assert.equal(await next.getAttribute('aria-pressed'), 'true')
  const keyboardFocus = await next.evaluate(node => ({ retained: node === document.activeElement, actual: document.activeElement?.outerHTML.slice(0, 300), hasFocus: document.hasFocus() }))
  if (!keyboardFocus.retained) await page.screenshot({ path: join(output, 'skills-keyboard-focus-failure.png') })
  assert.ok(keyboardFocus.retained, `Space selection preserves button focus: ${keyboardFocus.actual}`)
  await noPageOverflow(page)
  await page.screenshot({ path: join(output, 'skills-desktop-selected.png') })
  checks.push('Native Enter/Space/Tab switch skills without moving focus into the panel')

  for (const viewport of [{ width: 1000, height: 560 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto(`${base}#skills`)
    await ready(page)
    await select(page, 'AWS')
    await noPageOverflow(page)
    assert.ok(await page.locator('#skill-detail').isVisible())
    await select(page, 'React')
    await page.screenshot({ path: join(output, `skills-${viewport.width}x${viewport.height}.png`) })
  }
  checks.push('Short desktop and 390px mobile preserve reachable switching and avoid horizontal document overflow')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}#skills`)
  await ready(page)
  await select(page, 'AWS')
  const fillRatio = await page.locator('#skill-detail .skill-confidence-fill').evaluate(node => {
    const fill = node.getBoundingClientRect(), bar = node.parentElement.getBoundingClientRect()
    return fill.width / bar.width
  })
  assert.ok(Math.abs(fillRatio - .9) < .01, `4.5/5 reduced-motion bar fills directly to90%: ${fillRatio}`)
  const animations = await page.locator('#skills').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)
  assert.equal(animations, 0, 'Reduced motion exposes the final rating without running animations')
  assert.equal(await page.locator('.pin-spacer').count(), 0, 'Reduced motion preserves vertical navigation fallback')
  checks.push('Reduced motion renders the selected rating immediately and retains vertical navigation')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed: checks, screenshots: output, runtimeErrors: errors }, null, 2))
} finally { await browser.close() }
