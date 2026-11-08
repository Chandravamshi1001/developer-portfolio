// Optional real-browser QA, separate from Vitest's jsdom suite.
// Install Playwright under %TEMP%/portfolio-navigation-qa, then run this file
// with the portfolio preview available at PORTFOLIO_QA_URL (default localhost:5173).
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(join(process.env.TEMP, 'portfolio-navigation-qa/node_modules/playwright/index.mjs')).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const base = process.env.PORTFOLIO_QA_URL ?? 'http://127.0.0.1:5173/'
const output = join(process.env.TEMP, 'portfolio-navigation-qa/screenshots')
await mkdir(output, { recursive: true })
const checks = []
const errors = []
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 2, `${message}: actual ${actual}, expected ${expected}`)
async function ready(page) {
  await page.locator('.portfolio-app[data-intro-active]').waitFor({ state: 'attached' })
  const skip = page.getByRole('button', { name: 'Skip intro', exact: true })
  if (await skip.isVisible()) await skip.click()
  await page.locator('.portfolio-app[data-intro-active="false"]').waitFor({ state: 'attached' })
  await page.locator('.site-header').waitFor({ state: 'visible' })
  await page.waitForFunction(() => !document.querySelector('.site-header')?.closest('[inert]'))
  await page.waitForTimeout(200)
}
async function metrics(page) {
  return page.evaluate(() => {
    const track = document.querySelector('.section-track')
    const viewport = document.querySelector('.section-viewport')
    const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform)
    return {
      x: matrix.m41, y: matrix.m42, scroll: scrollY, travel: track.scrollWidth - viewport.clientWidth,
      maxScroll: document.documentElement.scrollHeight - innerHeight,
      pins: document.querySelectorAll('.pin-spacer').length,
      horizontal: Boolean(document.querySelector('.is-horizontal')),
      pageWidth: document.documentElement.scrollWidth, width: innerWidth,
      viewportScroll: viewport.scrollLeft,
      sections: [...document.querySelectorAll('.portfolio-section')].map(section => ({ id: section.id, left: section.offsetLeft, width: section.offsetWidth, top: section.getBoundingClientRect().top })),
      active: document.querySelector('nav [aria-current]')?.getAttribute('href'),
      nested: [...document.querySelectorAll('.section-scroll')].filter(region => ['auto', 'scroll'].includes(getComputedStyle(region).overflowY)).length,
      canvasPosition: getComputedStyle(document.querySelector('.particle-canvas')).position,
      canvasInsideTrack: Boolean(track.querySelector('canvas')),
    }
  })
}
async function scroll(page, top) {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top)
  await page.waitForTimeout(180)
}
async function expectScroll(page, top) {
  await page.waitForFunction(top => Math.abs(window.scrollY - top) < 2, top).catch(async error => {
    const state = await metrics(page)
    await page.screenshot({ path: join(output, 'navigation-scroll-failure.png') })
    throw new Error(`Expected root scroll ${top}; observed ${JSON.stringify(state)}`, { cause: error })
  })
  await page.waitForTimeout(100)
}
async function noClippedText(page) {
  const clipped = await page.evaluate(() => {
    const problems = []
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom
    for (const section of document.querySelectorAll('.portfolio-section')) {
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (!node.textContent.trim() || node.parentElement.closest('.sr-only') || !node.parentElement.checkVisibility()) continue
        const range = document.createRange(); range.selectNodeContents(node)
        for (const rect of range.getClientRects()) {
          if (rect.width && rect.height && (rect.top < headerBottom - 1 || rect.bottom > innerHeight - 1)) problems.push({ section: section.id, text: node.textContent.slice(0, 65), top: rect.top, bottom: rect.bottom })
        }
      }
    }
    return problems
  })
  assert.deepEqual(clipped, [], `Text outside usable pinned viewport: ${JSON.stringify(clipped)}`)
}

try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 696 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  const skipIntro = page.getByRole('button', { name: 'Skip intro', exact: true })
  await skipIntro.waitFor({ state: 'visible' })
  assert.ok(await page.locator('.hero-statement').isVisible(), 'Portfolio text stays visible during the initial two-star scene')
  assert.ok(await page.locator('.site-header').isVisible(), 'Header stays visible during the initial two-star scene')
  assert.ok(await page.locator('.portfolio-content').evaluate(content => content.inert), 'Visible portfolio remains inert during the intro')
  assert.equal(await page.locator('.pin-spacer').count(), 0, 'Navigation is not pinned before collision')
  await page.screenshot({ path: join(output, 'intro-two-stars.png') })
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.introPhase === 'burst')
  assert.ok(await page.locator('.hero-statement').isVisible(), 'Portfolio text stays visible through the collision burst')
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(output, 'intro-collision-burst.png') })
  await skipIntro.waitFor({ state: 'hidden', timeout: 15000 })
  await ready(page)
  assert.ok(await page.locator('.hero-statement').isVisible(), 'Portfolio text appears when the intro finishes')
  checks.push('Initial collision intro completes naturally before enabling navigation')
  let state = await metrics(page)
  assert.equal(state.horizontal, true); assert.equal(state.pins, 1)
  near(state.x, 0, 'Home starts at zero')
  near(state.maxScroll, state.travel, 'Pin distance equals measured track travel')
  assert.equal(state.nested, 0); assert.equal(state.pageWidth, state.width)
  assert.equal(state.canvasPosition, 'fixed'); assert.equal(state.canvasInsideTrack, false)
  await page.screenshot({ path: join(output, 'desktop-home.png') })
  await page.locator('nav a[href="#projects"]').click()
  await page.waitForFunction(() => document.querySelector('nav [aria-current]')?.getAttribute('href') === '#projects')
  await page.locator('.particle-controls summary').click()
  await page.getByRole('button', { name: 'Replay intro', exact: true }).click()
  await skipIntro.waitFor({ state: 'visible' })
  assert.equal(await page.locator('.pin-spacer').count(), 0, 'Replay releases the navigation pin')
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.introPhase === 'burst')
  await page.setViewportSize({ width: 1280, height: 800 })
  assert.ok(await page.locator('.hero-statement').isVisible(), 'Mid-burst resize preserves visible content')
  await page.screenshot({ path: join(output, 'intro-resized-burst.png') })
  await ready(page)
  assert.equal(await page.locator('.pin-spacer').count(), 1, 'Skip restores exactly one navigation pin')
  await page.setViewportSize({ width: 1536, height: 696 })
  await page.locator('nav a[href="#home"]').click()
  await expectScroll(page, 0)
  checks.push('Replay from Projects suspends navigation, mid-burst resize preserves visible content, and Skip restores a single pin')
  await page.locator('.particle-controls summary').click()
  const canvasBefore = await page.locator('canvas').evaluate(canvas => canvas.toDataURL())
  await page.waitForTimeout(100)
  assert.notEqual(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), canvasBefore, 'Ambient canvas continues animating')
  const nameMotion = await page.evaluate(async () => {
    const { createNameParticles } = await import('/src/features/particles/renderer.ts')
    const { stepParticles, freezeParticle } = await import('/src/features/particles/physics.ts')
    const { portfolio } = await import('/src/content/portfolio.ts')
    const rect = document.querySelector('[data-particle-name]').getBoundingClientRect()
    const names = createNameParticles(portfolio.nameLines, rect, 10000)
    const sample = names[0]
    let maximum = 0
    for (let frame = 0; frame < 432; frame++) {
      stepParticles(names, 1 / 60, frame / 60, innerWidth, innerHeight)
      maximum = Math.max(maximum, Math.hypot(sample.x - sample.target.x, sample.y - sample.target.y))
    }
    freezeParticle(sample)
    const frozen = { x: sample.x, y: sample.y }
    for (let frame = 0; frame < 120; frame++) stepParticles(names, 1 / 60, frame / 60, innerWidth, innerHeight)
    return { maximum, count: names.length, frozenStatic: sample.x === frozen.x && sample.y === frozen.y }
  })
  assert.ok(nameMotion.maximum > .1 && nameMotion.maximum <= 3, 'Name has the restored gentle heartbeat')
  assert.ok(nameMotion.count > 0 && nameMotion.count <= 1800, 'Name retains original particle population limit')
  assert.ok(nameMotion.frozenStatic, 'Frozen name particles ignore the heartbeat')
  await page.locator('.particle-controls summary').click()
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click()
  const pausedCanvas = await page.locator('canvas').evaluate(canvas => canvas.toDataURL())
  await page.waitForTimeout(200)
  assert.equal(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), pausedCanvas, 'Pause keeps name and background static')
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click()
  await page.locator('.particle-controls summary').click()
  checks.push(`Name heartbeat moves within ${nameMotion.maximum.toFixed(2)}px using ${nameMotion.count} particles; frozen particles and Pause remain static`)
  await page.mouse.move(900, 400); await page.mouse.wheel(0, 400); await page.waitForTimeout(200)
  state = await metrics(page); near(state.x, -state.scroll, 'Native downward wheel continuously translates whole track')
  assert.ok(state.scroll > 0); near(state.y, 0, 'No vertical track translation')
  await page.mouse.wheel(0, -200); await page.waitForTimeout(200)
  const reversed = await metrics(page); assert.ok(reversed.scroll < state.scroll); near(reversed.x, -reversed.scroll, 'Upward wheel reverses track')
  await scroll(page, 1536); state = await metrics(page); assert.equal(state.active, '#about'); near(state.sections[1].top, 0, 'About remains vertically pinned')
  await scroll(page, 3072); state = await metrics(page); assert.equal(state.active, '#experience')
  await scroll(page, 2304); near((await metrics(page)).x, -2304, 'Fractional reverse progress')
  await scroll(page, state.travel); state = await metrics(page); near(state.x, -state.travel, 'Contact ends at exact travel'); near(state.sections.at(-1).top, 0, 'End does not jump vertically')
  await scroll(page, 0); near((await metrics(page)).sections[0].top, 0, 'Pin entry has no vertical jump')
  checks.push('1536×696: native wheel forward/reverse, fractional progress, Home/About/Experience/Contact, pin distance and endpoints, fixed independently animated Canvas, no nested/main overflow')

  for (const id of ['home', 'about', 'experience', 'projects', 'skills', 'education', 'contact']) {
    await page.goto(`${base}#${id}`); await page.reload(); await ready(page)
    state = await metrics(page)
    near(state.scroll, state.sections.find(section => section.id === id).left, `Direct #${id}`)
    assert.equal(state.active, `#${id}`)
  }
  checks.push('All seven cold-load section hashes load at correct measured offsets')

  await page.goto(base); await ready(page)
  state = await metrics(page)
  const experiencePosition = state.sections.find(section => section.id === 'experience').left + 300
  const skillsPosition = state.sections.find(section => section.id === 'skills').left + 300
  await scroll(page, experiencePosition)
  await page.locator('nav a[href="#projects"]').click(); await expectScroll(page, state.sections.find(section => section.id === 'projects').left)
  await scroll(page, skillsPosition)
  await page.goBack(); await expectScroll(page, experiencePosition)
  await page.goForward(); await expectScroll(page, skillsPosition)
  assert.equal((await metrics(page)).active, '#skills')
  checks.push('Navigation click plus actual browser Back/Forward restores manual Experience/Skills positions despite stale section hashes')

  await page.goto(`${base}#projects`); await ready(page)
  await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(400)
  state = await metrics(page)
  near(state.scroll, state.sections.find(section => section.id === 'projects').left, 'Resize preserves Projects')
  near(state.maxScroll, state.travel, 'Resize recalculates pin distance'); assert.equal(state.pins, 1)
  checks.push('Resize 1536×696→1280×800 preserves Projects and recalculates measured travel with one pin')

  for (const viewport of [{ width: 1536, height: 696 }, { width: 1000, height: 560 }]) {
    await page.setViewportSize(viewport); await page.goto(base); await ready(page)
    await noClippedText(page)
    await page.locator('.card-details').evaluateAll(details => details.forEach(detail => { detail.open = true }))
    await page.waitForTimeout(350)
    await noClippedText(page)
    state = await metrics(page)
    assert.equal(state.nested, 0); assert.equal(state.pageWidth, state.width)
    near(state.maxScroll, state.travel, 'Expanded details refresh travel')
    for (const summary of [page.locator('#projects summary').first(), page.locator('#projects summary').last()]) {
      await summary.focus(); await page.waitForTimeout(150)
      state = await metrics(page); assert.equal(state.viewportScroll, 0)
      const focused = await page.evaluate(() => { const rect = document.activeElement.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: innerWidth } })
      assert.ok(focused.left >= -1 && focused.right <= focused.width + 1, 'Native focus reveals first and later-column summaries without nested scrolling')
    }
    await page.screenshot({ path: join(output, `desktop-expanded-${viewport.width}x${viewport.height}.png`) })
    checks.push(`${viewport.width}×${viewport.height}: all collapsed/expanded text within vertical viewport, details remain accessible via track continuation, no nested bars, focus reveals offscreen element`)
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  mobile.on('pageerror', error => errors.push(error.message))
  await mobile.goto(base); await ready(mobile)
  await mobile.screenshot({ path: join(output, 'mobile-home-name.png') })
  state = await metrics(mobile); assert.equal(state.horizontal, false); assert.equal(state.pins, 0); assert.equal(state.pageWidth, state.width); assert.equal(state.nested, 0)
  assert.ok(state.sections[1].top > 700)
  await mobile.getByRole('button', { name: /Menu/ }).click(); await mobile.locator('nav a[href="#projects"]').click()
  await mobile.waitForFunction(() => document.activeElement?.id === 'projects')
  await mobile.waitForFunction(() => Math.abs(document.getElementById('projects').getBoundingClientRect().top - 96) < 2)
  near(await mobile.locator('#projects').evaluate(section => section.getBoundingClientRect().top), 96, 'Mobile anchor respects header padding')
  await mobile.locator('#projects .card-details').evaluateAll(details => details.forEach(detail => { detail.open = true }))
  assert.ok(await mobile.locator('#projects').evaluate(section => section.scrollHeight <= section.clientHeight), 'Expanded mobile section grows naturally')
  await mobile.screenshot({ path: join(output, 'mobile-projects.png') })
  checks.push('390×844 touch: ordinary vertical flow, mobile menu navigation, readable naturally growing expanded details, no horizontal clipping')

  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width: 1536, height: 696 }); await page.goto(`${base}#projects`); await ready(page)
  state = await metrics(page); assert.equal(state.horizontal, false); assert.equal(state.pins, 0); assert.equal(state.nested, 0)
  assert.ok(state.sections[1].top !== state.sections[0].top)
  const reducedBefore = await page.locator('canvas').evaluate(canvas => canvas.toDataURL()); await page.waitForTimeout(100)
  assert.equal(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), reducedBefore, 'Reduced motion stops ambient animation')
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(300)
  assert.equal((await metrics(page)).pins, 1)
  checks.push('Reduced motion uses vertical flow and static particles; changing preference back restores exactly one pin')
  await page.goto(`${base}#home`); await page.waitForTimeout(150)
  await page.goto(`${base}#about`); await page.waitForTimeout(150)
  state = await metrics(page)
  near(state.scroll, state.sections[1].left, 'Same-document external fragment aligns entire About panel')
  assert.equal(state.viewportScroll, 0, 'Native fragment focus does not scroll nested viewport')
  checks.push('Same-document external fragment navigation aligns full section and resets native viewport scroll')
  assert.deepEqual(errors, [], 'No browser runtime errors')
  console.log(JSON.stringify({ passed: checks, screenshots: output, runtimeErrors: errors }, null, 2))
} finally {
  await browser.close()
}
