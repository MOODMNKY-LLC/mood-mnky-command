# E2E tests (Playwright)

## Chat response test (`chat-response.spec.ts`)

**Purpose:** Sends a message in the chat and asserts the assistant reply is shown (not "(no response)"). Use this to debug parsing/response issues.

## Tools tests (`tools.spec.ts`)

**Purpose:** Verifies the tools popover (wrench icon) opens, shows the tool list, and that sending a message with tools open (or after toggling a tool) still receives an assistant reply.

- **Opens tools popover** – Clicks the wrench, asserts the tools panel is visible and shows either flow tools or built-in/integrations.
- **Send with tools opened** – Opens tools, closes popover, sends a message, asserts assistant reply.
- **Toggle tool and send** – Opens tools, toggles one tool’s switch, sends a message, asserts assistant reply.

Tool availability and behavior (which tools the flow actually uses) depend on the Flowise chatflow config; these tests only verify UI and that the run endpoint returns a valid reply.

### Prerequisites

1. **App running** on port 3015:
   ```bash
   pnpm run dev:flow-mnky
   ```

2. **Login credentials** (required if your app uses Supabase auth): set in `.env.local` or env:
   - `E2E_TEST_EMAIL` – test user email
   - `E2E_TEST_PASSWORD` – test user password

### Run

```bash
# From repo root
pnpm --filter flow-mnky run test:e2e

# Only the chat response test
pnpm --filter flow-mnky run test:e2e -- e2e/chat-response.spec.ts

# Only the tools tests
pnpm --filter flow-mnky run test:e2e -- e2e/tools.spec.ts

# With UI (inspect and step through)
pnpm --filter flow-mnky run test:e2e:ui
```

If `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are not set and the app redirects to login, the tests are **skipped**.

When the test fails because the assistant message is "(no response)", the assertion message points to Flowise response parsing (`parse-flowise-response.ts` and SSE handling in `chat-shell.tsx`).
