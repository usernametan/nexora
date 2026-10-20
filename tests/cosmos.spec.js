import { test, expect } from '@playwright/test'

test.setTimeout(60000)

async function seedProfile(page, name = 'Tan', timezone = 'UTC') {
  await page.addInitScript(({ profileName, profileTimezone }) => {
    window.localStorage.setItem('personal-cosmos:profile', JSON.stringify({
      name: profileName,
      timezone: profileTimezone,
      onboarded: true,
    }))
  }, { profileName: name, profileTimezone: timezone })
}

async function verifyDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await seedProfile(page)
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
  await expect(page.locator('.dashboard-header h1')).toHaveText(/^Good (night|morning|afternoon|evening), Tan$/)
  await page.locator('.back-button').click()
  await expect(page.locator('.planet-dashboard')).toHaveCount(0)
  await page.waitForTimeout(500)

  const dashboards = [
    ['EARTH', 'Tan'],
    ['MOON', 'A quieter kind of progress'],
    ['MARS', 'What you know,'],
    ['SATURN', 'Make space for focus'],
    ['MERCURY', 'Small things,'],
    ['JUPITER', 'Money, in'],
    ['NEPTUNE', 'Ideas worth'],
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

  expect(errors).toEqual([])
  await page.close()
  return errors
}

async function verifyMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  await seedProfile(page)
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await expect(page.locator('.cosmos-stage canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open personal settings' })).toBeVisible()
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
  await seedProfile(page)
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
  const firstTask = page.locator('.task-toggle').first()
  await expect(firstTask).toHaveAttribute('aria-pressed', 'true')
  await firstTask.click()
  await expect(firstTask).toHaveAttribute('aria-pressed', 'false')

  await page.locator('.back-button').click()
  await expect(page.locator('.planet-dashboard')).toHaveCount(0)
  await page.waitForTimeout(500)

  await openEarth()
  await expect(page.locator('.task-toggle').first()).toHaveAttribute('aria-pressed', 'false')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await openEarth()
  await expect(page.locator('.task-toggle').first()).toHaveAttribute('aria-pressed', 'false')

  expect(errors).toEqual([])
  await page.close()
})

test('quick tools create, edit, and delete records', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await seedProfile(page)
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const openPlanet = async (name) => {
    await page.locator('.planet-nav__item', { hasText: name }).click()
    await page.waitForTimeout(1200)
  }

  const closePlanet = async () => {
    await page.locator('.back-button').click()
    await expect(page.locator('.planet-dashboard')).toHaveCount(0)
    await page.waitForTimeout(500)
  }

  await openPlanet('EARTH')
  await page.getByLabel('Task title').fill('Review the orbit notes')
  await page.locator('.task-composer .mini-action').click()
  const newTask = page.locator('.task-row', { hasText: 'Review the orbit notes' })
  await expect(newTask).toBeVisible()
  await page.getByRole('button', { name: 'Edit Review the orbit notes' }).click()
  await page.getByLabel('Task title').fill('Review the edited orbit notes')
  await page.locator('.task-composer .mini-action').click()
  await expect(page.locator('.task-row', { hasText: 'Review the edited orbit notes' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Review the edited orbit notes' }).click()
  await expect(page.locator('.task-row', { hasText: 'Review the edited orbit notes' })).toHaveCount(0)
  await closePlanet()

  await openPlanet('MERCURY')
  await page.getByLabel('Item title').fill('Buy stamps')
  await page.getByLabel('Item detail').fill('Post office on the corner')
  await page.getByRole('button', { name: 'CAPTURE' }).click()
  await expect(page.locator('.mercury-row', { hasText: 'Buy stamps' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Buy stamps' }).click()
  await expect(page.locator('.mercury-row', { hasText: 'Buy stamps' })).toHaveCount(0)
  await closePlanet()

  await openPlanet('JUPITER')
  await page.getByLabel('Expense title').fill('Notebook refill')
  await page.getByLabel('Expense amount').fill('12.50')
  await page.getByRole('button', { name: 'LOG EXPENSE' }).click()
  await expect(page.locator('.expense-row', { hasText: 'Notebook refill' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Notebook refill' }).click()
  await expect(page.locator('.expense-row', { hasText: 'Notebook refill' })).toHaveCount(0)
  await closePlanet()

  await openPlanet('NEPTUNE')
  await page.getByLabel('Bookmark title').fill('Playwright docs')
  await page.getByLabel('Bookmark URL').fill('playwright.dev')
  await page.getByLabel('Bookmark tags').fill('testing, reference')
  await page.getByRole('button', { name: 'SAVE LINK' }).click()
  const bookmark = page.locator('.bookmark-card', { hasText: 'Playwright docs' })
  await expect(bookmark).toBeVisible()
  await expect(bookmark.getByText('playwright.dev')).toBeVisible()
  await page.getByRole('button', { name: 'Delete Playwright docs' }).click()
  await expect(page.locator('.bookmark-card', { hasText: 'Playwright docs' })).toHaveCount(0)

  expect(errors).toEqual([])
  await page.close()
})

test('onboarding personalizes the clock and exposes data controls', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  await expect(page.getByRole('heading', { name: 'Make this cosmos yours' })).toBeVisible()
  await page.getByLabel('Your name').fill('Nova')
  await page.getByLabel('Time zone').selectOption('UTC')
  await page.getByRole('button', { name: 'ENTER THE COSMOS' }).click()
  await expect(page.getByRole('heading', { name: 'Make this cosmos yours' })).toHaveCount(0)

  await page.locator('.planet-nav__item', { hasText: 'EARTH' }).click()
  await expect(page.locator('.dashboard-header h1')).toHaveText(/^Good (night|morning|afternoon|evening), Nova$/)
  await page.getByRole('button', { name: 'Open personal settings' }).click()
  await expect(page.getByRole('button', { name: 'EXPORT DATA' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'RESET ALL DATA' })).toBeVisible()

  expect(errors).toEqual([])
  await page.close()
})
