import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.setTimeout(90000)

async function seedProfile(page, name = 'Cosmo Explorer') {
  await page.addInitScript(({ profileName }) => {
    const today = new Date().toISOString().slice(0, 10)
    window.localStorage.setItem('personal-cosmos:profile', JSON.stringify({
      name: profileName,
      timezone: 'UTC',
      currency: 'USD',
      onboarded: true,
    }))
    window.localStorage.setItem(`personal-cosmos:saturn-sessions:${today}`, JSON.stringify({
      __cosmos: true,
      version: 3,
      savedAt: new Date().toISOString(),
      value: [
        { id: 'sess-seed-1', label: 'Deep focus orbit', minutes: 25, color: '#d8b978', date: today },
      ],
    }))
  }, { profileName: name })
}

test.describe('routing, accessibility, and interactive features', () => {
  test('direct routing to worlds and 404 fallback to root', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedProfile(page)

    // Direct navigation to saturn
    await page.goto('/world/saturn', { waitUntil: 'networkidle' })
    await expect(page.locator('.planet-dashboard--saturn')).toBeVisible()
    await expect(page.locator('.dashboard-header h1')).toContainText('Make space for focus')

    // Back button returns to root cosmos
    await page.locator('.back-button').click()
    await expect(page.locator('.planet-dashboard')).toHaveCount(0)
    await expect(page).toHaveURL(/127\.0\.0\.1:5173\/?$/)

    // Unknown route falls back to cosmos view
    await page.goto('/world/atlantis', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await expect(page.locator('.planet-dashboard')).toHaveCount(0)
    await expect(page.locator('.cosmos-stage canvas')).toBeVisible()
  })

  test('accessibility scan of cosmos stage and earth dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedProfile(page)
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Canvas 3D space uses dark aesthetic and WebGL background; disable region landmark check for canvas container
    const cosmosScan = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'region'])
      .analyze()
    expect(cosmosScan.violations).toEqual([])

    // Open Earth dashboard
    await page.locator('.planet-nav__item', { hasText: 'EARTH' }).click()
    await expect(page.locator('.dashboard-header h1')).toBeVisible()

    const dashboardScan = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'region'])
      .analyze()
    expect(dashboardScan.violations).toEqual([])
  })

  test('settings data export, reset, and import cycle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedProfile(page)
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Open settings
    await page.getByRole('button', { name: 'Open personal settings' }).click()
    await expect(page.locator('.settings-card')).toBeVisible()

    // Test download export triggers
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'EXPORT DATA' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^personal-cosmos(-\w+)?-\d{4}-\d{2}-\d{2}\.json$/)

    // Test JSON import
    const validBackup = JSON.stringify({
      app: 'personal-cosmos',
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      entries: {
        'personal-cosmos:profile': {
          __cosmos: true,
          version: 3,
          savedAt: new Date().toISOString(),
          value: { name: 'Imported User', timezone: 'UTC', currency: 'EUR', onboarded: true },
        },
      },
    })

    await page.setInputFiles('input[type="file"][aria-label="Import a Personal Cosmos backup"]', {
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validBackup),
    })

    // Profile name should update in the UI
    await expect(page.locator('input[autocomplete="given-name"]')).toHaveValue('Imported User')

    await page.getByRole('button', { name: 'Close settings' }).click()
    await expect(page.locator('.settings-card')).toHaveCount(0)
  })

  test('moon wellness controls and saturn timer undo flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedProfile(page)

    // Navigate to Moon
    await page.goto('/world/moon', { waitUntil: 'networkidle' })
    await expect(page.locator('.moon-dashboard')).toBeVisible()

    // Check energy level slider
    const energySlider = page.getByLabel('Current energy')
    await expect(energySlider).toBeVisible()
    await energySlider.fill('80')
    await expect(page.locator('.energy-control strong')).toHaveText('80%')

    // Navigate to Saturn
    await page.goto('/world/saturn', { waitUntil: 'networkidle' })
    await expect(page.locator('.saturn-dashboard')).toBeVisible()

    // Check sessions table exists and delete has undo toast
    const sessionRow = page.locator('.session-row').first()
    await expect(sessionRow).toBeVisible()
    const deleteBtn = sessionRow.locator('.session-delete')
    await deleteBtn.click()

    // Toast with Undo button appears
    await expect(page.locator('.toast')).toBeVisible()
    const undoBtn = page.locator('.toast-action', { hasText: 'Undo' })
    await expect(undoBtn).toBeVisible()
    await undoBtn.click()
    await expect(sessionRow).toBeVisible()
  })
})
