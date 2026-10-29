import { test, expect } from '@playwright/test'

// Requires the Java API on 127.0.0.1:8080. Start it with:
//   java -jar server/target/personal-cosmos-api-0.0.1-SNAPSHOT.jar
// and run with E2E_BACKEND=1.
const backendEnabled = process.env.E2E_BACKEND === '1'

test.setTimeout(90000)

async function seedProfile(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('personal-cosmos:profile', JSON.stringify({
      name: 'Cloud Tester',
      timezone: 'UTC',
      currency: 'USD',
      onboarded: true,
    }))
  })
}

test.describe('cloud account', () => {
  test.skip(!backendEnabled, 'Set E2E_BACKEND=1 with the Java API running')

  test('register, sync a task, upload a file, and keep the session', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await seedProfile(page)
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Open personal settings' }).click()
    await page.getByRole('button', { name: 'CREATE ACCOUNT' }).first().click()
    const email = `e2e-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('cosmos-e2e-password')
    await page.getByRole('button', { name: 'CREATE ACCOUNT' }).last().click()
    await expect(page.locator('.settings-account h3')).toHaveText(email)
    await page.getByRole('button', { name: 'Close settings' }).click()

    await page.locator('.planet-nav__item', { hasText: 'EARTH' }).click()
    await expect(page.locator('.dashboard-header h1')).toBeVisible()
    const taskTitle = `Cloud task ${Date.now()}`
    await page.getByLabel('Task title').fill(taskTitle)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.waitForTimeout(1600)

    const cloudState = await page.evaluate(async () => {
      const envelope = JSON.parse(window.localStorage.getItem('personal-cosmos:auth'))
      const token = envelope?.value?.token
      const response = await fetch('/api/v1/state', { headers: { Authorization: `Bearer ${token}` } })
      return response.json()
    })
    const taskEntry = cloudState.find((entry) => entry.key.startsWith('personal-cosmos:earth-tasks'))
    expect(taskEntry).toBeTruthy()
    expect(JSON.stringify(taskEntry.value)).toContain(taskTitle)

    await page.locator('.back-button').click()
    await expect(page.locator('.planet-dashboard')).toHaveCount(0)
    await page.goto('/world/mars', { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    const uploadName = `cloud-note-${Date.now()}.txt`
    await page.getByLabel('File name').fill(uploadName)
    await page.setInputFiles('input[type="file"][aria-label="Choose a file to upload"]', {
      name: uploadName,
      mimeType: 'text/plain',
      buffer: Buffer.from('Personal Cosmos upload test'),
    })
    await page.getByRole('button', { name: 'ADD TO VAULT' }).click()
    await expect(page.locator('.file-row', { hasText: uploadName })).toBeVisible()
    const cloudFiles = await page.evaluate(async () => {
      const envelope = JSON.parse(window.localStorage.getItem('personal-cosmos:auth'))
      const response = await fetch('/api/v1/files', {
        headers: { Authorization: `Bearer ${envelope?.value?.token}` },
      })
      return response.json()
    })
    expect(cloudFiles.some((file) => file.name === uploadName)).toBe(true)

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.getByRole('button', { name: 'Open personal settings' }).click()
    await expect(page.locator('.settings-account h3')).toHaveText(email)
    await expect(page.locator('.settings-account')).toContainText(/Synced|sync/i)

    expect(errors).toEqual([])
    await page.close()
  })
})
