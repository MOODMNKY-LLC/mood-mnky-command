/**
 * E2E: Tools popover and tool selection. Verifies the wrench opens the tools panel,
 * tools can be toggled, and a message sent with tools enabled gets a reply.
 * Run: pnpm exec playwright test e2e/tools.spec.ts
 * Requires: app on port 3015, E2E_TEST_EMAIL + E2E_TEST_PASSWORD in env for login.
 */
import { test, expect } from '@playwright/test'

async function ensureLoggedIn(page: import('@playwright/test').Page) {
  await page.goto('/')
  if (page.url().includes('/auth/login')) {
    const email = process.env.E2E_TEST_EMAIL?.trim()
    const password = process.env.E2E_TEST_PASSWORD?.trim()
    if (!email || !password) {
      test.skip()
      return false
    }
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in|login|submit/i }).click()
    await page.waitForURL((u) => !u.pathname.includes('/auth/login'), { timeout: 15_000 })
  }
  return true
}

test.describe('Tools popover and selection', () => {
  test('opens tools popover when clicking wrench and shows tool list', async ({ page }) => {
    const ok = await ensureLoggedIn(page)
    if (!ok) return

    await page.goto('/app/chat')
    const input = page.getByTestId('chat-input')
    await expect(input).toBeVisible({ timeout: 15_000 })

    const toolsTrigger = page.getByTestId('tools-trigger')
    await expect(toolsTrigger).toBeVisible()
    await toolsTrigger.click()

    const popover = page.getByTestId('tools-popover')
    await expect(popover).toBeVisible({ timeout: 5_000 })

    // Either flow tools or built-in tools section is present
    const hasFlowTools = await popover.getByText(/Turn tools on or off|Available tools/i).count() > 0
    const hasBuiltIn = await popover.getByText(/Built-in|Integrations/i).count() > 0
    expect(hasFlowTools || hasBuiltIn).toBeTruthy()
  })

  test('sends message with tools panel opened and receives assistant reply', async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('[flow-mnky:no-response]')) console.log('Browser:', text)
    })

    const ok = await ensureLoggedIn(page)
    if (!ok) return

    await page.goto('/app/chat')
    const input = page.getByTestId('chat-input')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await expect(input).toBeEnabled({ timeout: 15_000 })

    // Open tools popover (optional: verifies it doesn't block send)
    const toolsTrigger = page.getByTestId('tools-trigger')
    await toolsTrigger.click()
    const popover = page.getByTestId('tools-popover')
    await expect(popover).toBeVisible({ timeout: 5_000 })
    // Close so focus is back on input for typing (or we can type with popover open)
    await toolsTrigger.click()
    await expect(popover).not.toBeVisible()

    const testMessage = 'Reply with exactly: E2E tools OK'
    await input.fill(testMessage)
    await input.press('Enter')

    const assistantMessages = page.locator('[data-testid="chat-message"][data-role="assistant"]')
    await expect(assistantMessages.first()).toBeVisible({ timeout: 60_000 })
    const lastAssistant = assistantMessages.last()
    await expect(lastAssistant).not.toContainText('Thinking...', { timeout: 60_000 })
    const contentEl = lastAssistant.getByTestId('chat-message-content')
    const content = await contentEl.textContent()
    expect(content, 'Assistant message should have content').toBeTruthy()
    expect(content!.trim()).not.toContain('(no response)')
  })

  test('toggle a tool and send message receives reply', async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('[flow-mnky:no-response]')) console.log('Browser:', text)
    })

    const ok = await ensureLoggedIn(page)
    if (!ok) return

    await page.goto('/app/chat')
    const input = page.getByTestId('chat-input')
    await expect(input).toBeVisible({ timeout: 15_000 })

    const toolsTrigger = page.getByTestId('tools-trigger')
    await toolsTrigger.click()
    const popover = page.getByTestId('tools-popover')
    await expect(popover).toBeVisible({ timeout: 5_000 })

    // Find first tool row and its switch (role=switch); toggle one if present
    const firstSwitch = popover.getByRole('switch').first()
    const switchCount = await popover.getByRole('switch').count()
    if (switchCount > 0) {
      await firstSwitch.click()
      // Popover may still be open; close so we can type
      await toolsTrigger.click()
    }

    const testMessage = 'Say hello in one short sentence.'
    await input.fill(testMessage)
    await input.press('Enter')

    const assistantMessages = page.locator('[data-testid="chat-message"][data-role="assistant"]')
    await expect(assistantMessages.first()).toBeVisible({ timeout: 60_000 })
    const lastAssistant = assistantMessages.last()
    await expect(lastAssistant).not.toContainText('Thinking...', { timeout: 60_000 })
    const contentEl = lastAssistant.getByTestId('chat-message-content')
    const content = await contentEl.textContent()
    expect(content).toBeTruthy()
    expect(content!.trim()).not.toContain('(no response)')
  })
})
