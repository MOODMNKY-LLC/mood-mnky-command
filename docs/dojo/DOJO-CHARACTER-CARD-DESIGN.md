# Dojo Character Card — Design Memo

The Dojo home profile block uses the **Elements AI SDK Agent** component ([apps/web/components/ai-elements/agent.tsx](../apps/web/components/ai-elements/agent.tsx)) to present a "character card" with user avatar and account summary, while keeping the same card rhythm as other Dojo cards (e.g. Flowise agent cards).

## Prop mapping (profile → Agent)

| Agent piece        | Profile usage                          | Notes                                      |
|--------------------|----------------------------------------|--------------------------------------------|
| **Agent**          | Card wrapper                           | Unchanged; `rounded-lg border bg-card`.    |
| **AgentHeader**    | name = displayName; model = `Lvl N`    | Optional `icon` = user Avatar (replaces BotIcon). |
| **AgentContent**   | Container for summary + CTA           | Unchanged.                                  |
| **AgentInstructions** | One-line summary (e.g. XP total)   | Optional `label` = "Summary" (default "Instructions"). |
| **Custom**         | "Profile & account" link              | Sibling to AgentInstructions inside AgentContent. |

We do **not** use AgentTools/AgentOutput for the character card to avoid fake tool objects and keep the block compact. Linked accounts (Shopify badge) stay in the header.

## Avatar strategy

- **AgentHeader** is extended with an optional `icon?: React.ReactNode` prop. When provided, it is rendered **instead of** the default `BotIcon`, so the Dojo card passes the user's Avatar component. Flowise config does not pass `icon`, so existing Agent cards are unchanged.

## Design system

- Dojo uses root design tokens (grayscale primary, card, muted) per [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md). No new tokens. Reuse shadcn Avatar, Badge, and existing Agent border/padding.
