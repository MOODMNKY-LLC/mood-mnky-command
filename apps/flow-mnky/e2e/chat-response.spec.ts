/**
 * E2E: Send a chat message and assert the assistant reply is shown (not "no response").
 * Run: pnpm exec playwright test e2e/chat-response.spec.ts
 * Requires: app on port 3015, E2E_TEST_EMAIL + E2E_TEST_PASSWORD in env for login.
 */
import { test, expect } from '@playwright/test'

test.describe('Chat response', () => {
  test('sends message and shows assistant reply (not "no response")', async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('[flow-mnky:no-response]')) console.log('Browser:', text)
    })
    await page.goto('/')

    // If redirected to login, sign in
    if (page.url().includes('/auth/login')) {
      const email = process.env.E2E_TEST_EMAIL?.trim()
      const password = process.env.E2E_TEST_PASSWORD?.trim()
      if (!email || !password) {
        test.skip()
        return
      }
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/password/i).fill(password)
      await page.getByRole('button', { name: /sign in|log in|login|submit/i }).click()
      await page.waitForURL((u) => !u.pathname.includes('/auth/login'), { timeout: 15_000 })
    }

    await page.goto('/app/chat')

    // Wait for chat UI: input or empty state
    const input = page.getByTestId('chat-input')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await expect(input).toBeEnabled({ timeout: 15_000 })

    const testMessage = 'Reply with exactly: E2E OK'
    await input.fill(testMessage)
    await input.press('Enter')

    // Wait for at least one assistant message to appear (no longer "Thinking...", and content present)
    const assistantMessages = page.locator('[data-testid="chat-message"][data-role="assistant"]')
    await expect(assistantMessages.first()).toBeVisible({ timeout: 60_000 })

    const lastAssistant = assistantMessages.last()
    // Wait until not showing loading and has some content
    await expect(lastAssistant).not.toContainText('Thinking...', { timeout: 60_000 })
    const contentEl = lastAssistant.getByTestId('chat-message-content')
    const content = await contentEl.textContent()
    console.log('Assistant reply received:', content?.trim() ?? '(empty)')
    expect(content, 'Assistant message should have content').toBeTruthy()
    expect(
      content!.trim(),
      'Assistant replied with "(no response)" — check Flowise response shape and parse-flowise-response.ts / SSE parsing in chat-shell'
    ).not.toContain('(no response)')
  })
})
