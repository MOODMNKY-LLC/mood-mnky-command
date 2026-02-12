# AI Chat – Blending Flow Documentation

## Overview

The MNKY Chat provides a human-in-the-loop fragrance blending experience that replicates the on-site lab flow (e.g., Christian crafting leather + blood orange + cinnamon/vanilla). Users are guided step-by-step through fragrance selection, proportion refinement, saving blends, vessel selection, wax calculation, and candle-making instructions.

## Blending Mode

- **Toggle**: Use the flask icon in the chat input bar to enable/disable blending mode.
- **Suggested prompts**: "Blend a custom fragrance" or "Help me blend a custom scent" auto-enable blending mode.
- **Behavior**: When blending mode is on, the system prompt instructs the model to follow the Full Lab-Style Blending Flow and use blending-specific tools.

## Workflow Stages

1. **Fragrance selection** – User names oils (e.g., leather, blood orange, cinnamon + vanilla). Tools: `search_fragrance_oils`, `get_fragrance_oil_by_id`.
2. **Proportion refinement** – User expresses preferences (e.g., "more leather", "less citrus"). Tool: `calculate_blend_proportions`.
3. **Save the blend** – User confirms satisfaction. Tool: `save_custom_blend`. Model suggests descriptive names and tags (spicy, woodsy, gourmand).
4. **Vessel selection** – User picks a candle vessel. Tool: `list_containers`.
5. **Wax calculation** – Tool: `calculate_wax_for_vessel`. Returns wax grams, fragrance load grams, container name.
6. **Making instructions** – Model provides temperature, wick, and pour instructions from blending knowledge (no tool).

## Chat Tools

| Tool | Purpose |
|------|---------|
| `search_fragrance_oils` | Search oils by name, family, or notes |
| `get_fragrance_oil_by_id` | Get full details for a single oil |
| `calculate_blend_proportions` | Compute suggested proportions; supports "more X, less Y" preferences |
| `save_custom_blend` | Persist blend to `saved_blends` (user-scoped) |
| `list_saved_blends` | List user's saved blends |
| `get_saved_blend` | Retrieve a saved blend by ID |
| `list_containers` | List candle vessels (optionally filter by capacity) |
| `calculate_wax_for_vessel` | Calculate wax and fragrance amounts for a vessel |

## Saved Blends

- **Table**: `saved_blends`
- **RLS**: Users can only select/insert/update/delete their own rows.
- **Schema**: `user_id`, `name`, `product_type`, `batch_weight_g`, `fragrance_load_pct`, `fragrances` (jsonb), `notes`, `created_at`, `updated_at`.
- **`fragrances` format**: `[{ "oilId": "uuid", "oilName": "Leather", "proportionPct": 40 }, ...]`

## API

- **Route**: `POST /api/chat`
- **Body**: `{ messages, model?, webSearch?, mode?: "blending" }`
- **Auth**: Requires authenticated Supabase user (session cookie).

## Files

- `lib/chat/tools.ts` – Tool definitions
- `lib/chat/blending-calc.ts` – Proportion and wax calculation helpers
- `lib/chat/system-prompt.ts` – System prompt and blending workflow
- `app/api/chat/route.ts` – Chat API route
- `app/(dashboard)/chat/page.tsx` – Chat UI
