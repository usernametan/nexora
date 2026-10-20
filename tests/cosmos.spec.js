import { test, expect } from '@playwright/test'

test.setTimeout(60000)

async function verifyDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  await expect(page.locator('.cosmos-stage canvas')).toBeVisible()
  await expect(page.locator('.spaceship-cursor.is-enabled')).toBeVisible()
  await expect(page.locator('.planet-nav__item')).toHaveCount(7)
  const immediateShipState = await page.evaluate(() => {
    const ship = document.querySelector('.spaceship-cursor')
    const before = ship.style.transform
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1100, clientY: 420, pointerType: 'mouse' }))
    return { before, after: ship.style.transform }
  })
  expect(immediateShipState.after).toBe(immediateShipState.before)
  expect(immediateShipState.after).not.toContain('1100px')
  const shipSamples = []
  for (let frame = 0; frame < 6; frame += 1) {
    await page.waitForTimeout(16)
    const transform = await page.locator('.spaceship-cursor').evaluate((element) => element.style.transform)
    shipSamples.push(transform)
  }
  expect(new Set(shipSamples).size).toBeGreaterThan(2)
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/tmp/opencode/cosmos-desktop.png', fullPage: true })

  const earthPoint = await page.evaluate(() => {
    const label = [...document.querySelectorAll('.planet-label')].find((element) => element.querySelector('strong')?.textContent === 'Earth')
    const transform = label?.parentElement?.parentElement?.style.transform
    const match = transform?.match(/translate3d\((-?[\d.]+)px, (-?[\d.]+)px/)
    return match ? { x: Number(match[1]), y: Number(match[2]) + 52 } : null
  })
  expect(earthPoint).not.toBeNull()
  await page.mouse.click(earthPoint.x, earthPoint.y)
  await expect(page.locator('.dashboard-header h1')).toContainText('Good morning, Tan')
  await page.locator('.back-button').click()
  await expect(page.locator('.planet-dashboard')).toHaveCount(0)
  await page.waitForTimeout(500)

  const dashboards = [
    ['EARTH', 'Good morning, Tan'],
    ['MOON', 'A quieter kind of progress'],
    ['MARS', 'What you know,'],
    ['SATURN', 'Make space for focus'],
  ]

  for (const [buttonName, heading] of dashboards) {
    await page.locator('.planet-nav__item', { hasText: buttonName }).click()
    await expect(page.locator('.planet-dashboard')).toBeVisible()
    await expect(page.locator('.dashboard-header h1')).toContainText(heading)
    await page.waitForTimeout(650)
    await page.locator('.back-button').click()
    await expect(page.locator('.planet-dashboard')).toHaveCount(0)
    await page.waitForTimeout(500)
  }

  for (const planet of ['MERCURY', 'JUPITER', 'NEPTUNE']) {
    await page.locator('.planet-nav__item', { hasText: planet }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Coming soon' })).toBeVisible()
    await page.locator('.locked-close').click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }

  expect(errors).toEqual([])
  await page.close()
  return errors
}

async function verifyMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await expect(page.locator('.cosmos-stage canvas')).toBeVisible()
  await page.screenshot({ path: '/tmp/opencode/cosmos-mobile.png', fullPage: true })
  await page.locator('.planet-nav__item', { hasText: 'EARTH' }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.dashboard-shell')).toBeVisible()
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport)
  await page.screenshot({ path: '/tmp/opencode/cosmos-mobile-earth.png', fullPage: true })
  expect(errors).toEqual([])
  await page.close()
  return errors
}

test('desktop cosmos and dashboard flows', async ({ browser }) => {
  const errors = await verifyDesktop(browser)
  expect(errors).toEqual([])
})

test('mobile cosmos and dashboard flow', async ({ browser }) => {
  const errors = await verifyMobile(browser)
  expect(errors).toEqual([])
})

test('dashboard state persists across navigation and reload', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const openEarth = async () => {
    await page.locator('.planet-nav__item', { hasText: 'EARTH' }).click()
    await page.waitForTimeout(1200)
  }

  await openEarth()
  const firstTask = page.locator('.task-row').first()
  await expect(firstTask).toHaveAttribute('aria-pressed', 'true')
  await firstTask.click()
  await expect(firstTask).toHaveAttribute('aria-pressed', 'false')

  await page.locator('.back-button').click()
  await expect(page.locator('.planet-dashboard')).toHaveCount(0)
  await page.waitForTimeout(500)

  await openEarth()
  await expect(page.locator('.task-row').first()).toHaveAttribute('aria-pressed', 'false')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await openEarth()
  await expect(page.locator('.task-row').first()).toHaveAttribute('aria-pressed', 'false')

  expect(errors).toEqual([])
  await page.close()
})
