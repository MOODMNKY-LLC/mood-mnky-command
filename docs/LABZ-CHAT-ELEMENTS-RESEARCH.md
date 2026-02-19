# LABZ Chat Elements & Frosted Glass Research

Summary of best practices used to drive the LABZ Chat Assistant implementation.

## Frosted glass (chat/dialog)

- **Technique:** Use `backdrop-filter: blur()` (and `-webkit-backdrop-filter` for Safari) with semi-transparent backgrounds. Typical alpha: light 0.1–0.25, dark 0.15–0.3. Keep blur moderate (e.g. 8–15px / Tailwind `backdrop-blur-md` to `backdrop-blur-2xl`).
- **Contrast and accessibility:** Ensure text and controls maintain sufficient contrast on the translucent surface; avoid relying on glass alone for critical UI. Use theme tokens (e.g. `bg-background/75`, `border-border/50`) so light/dark stay readable.
- **Consistency:** Apply the same glass treatment to header, footer, and conversation area so the dialog feels like one surface. Use root design tokens only (no Verse tokens in LABZ).
- **Performance:** Avoid animating blur on large areas; use moderate blur radius. Fallbacks: solid background when `backdrop-filter` is not supported.

## Elements AI SDK component mapping (LABZ)

| Component           | Data source / use                          | Status        |
|--------------------|---------------------------------------------|---------------|
| Attachments        | Prompt input files; message file parts     | Wired         |
| Conversation       | Scroll, empty state, content                | Wired         |
| Message            | message.parts (text, tool, reasoning)       | Wired         |
| Prompt Input       | useChat, submit, attachments                | Wired         |
| Reasoning          | part.type === "reasoning"                   | Wired         |
| Tool               | part.type.startsWith("tool-")               | Wired         |
| ConversationDownload | messages → markdown export                | Wire now      |
| Shimmer            | status === "submitted" (loading)            | Wire now      |
| Suggestion         | Empty state; clickable prompts              | Wire now      |
| Sources            | part.type === "source-document" / source   | Stub / when API returns |
| Inline Citation    | Citation data in parts                       | Stub / when API returns |
| Chain of Thought   | Same as Reasoning or multi-step             | Use Reasoning |
| Context            | Token/context window if exposed              | Optional      |
| Task / Plan / Queue| Part types when stream supports             | Stub          |
| Checkpoint         | Checkpoint/restore state                     | Future        |
| Confirmation       | Tool confirm (accept/reject)                 | Needs API     |
| Model Selector    | Request body `model`                        | Needs API     |

## Integration order (message parts)

Recommended order when rendering assistant message parts: (1) Reasoning / chain-of-thought, (2) Tool calls (input/output), (3) Text, (4) Sources / citations when present. Keep loading (Shimmer) above the first streaming message; empty state with Suggestion when no messages.
