# Flowise detailed streaming (SSE events)

When the Tool Agent has **Enable Detailed Streaming** turned on in Flowise, the prediction stream sends extra SSE events that describe intermediate steps (reasoning, tool use, LLM calls). The app can use these to show chain-of-thought and tool progress in the UI.

## Event types

| Event           | When / meaning |
|-----------------|----------------|
| `token`         | A chunk of the final assistant text. Data is often a JSON-stringified string or raw string. |
| `message`       | Same as token in some flows; final message text chunk. |
| `agentMessage`  | Agent output text chunk (same handling as token). |
| `metadata`      | Contains `chatId` for conversation continuity. Data is JSON `{ chatId?: string }`. |
| `agent_trace`   | **Detailed streaming only.** One step of agent execution. Data is JSON with a `step` field and optional content. |
| `end`           | Stream finished. |

## agent_trace payload (detailed streaming)

Each `agent_trace` event has `data` as JSON. Typical shape:

- **step**: string indicating the operation, e.g. `llm_start`, `llm_end`, `tool_start`, `tool_end`, `tool_error`, chain start/end, or agent thinking/reasoning.
- **message** / **content** / **text**: optional string with the step description or reasoning snippet.

The client parses `event: agent_trace` and `data: {...}` and uses it to:

1. **Reasoning / chain-of-thought** – Append reasoning text to a separate buffer and show it in the **Reasoning** component (Elements AI SDK) while streaming, with **Shimmer** for “thinking” when there is no main content yet.
2. **Main content** – Keep appending `token` / `message` / `agentMessage` to the main reply; when the stream ends, the full reply is in `content`.

## How the app uses it

- **chat-shell** (`processSSELine`): Handles `token`, `message`, `agentMessage` for main text; handles `metadata` for `chatId`; handles `agent_trace` to accumulate optional `reasoningContent` on the assistant message.
- **chat-messages**: Renders assistant messages with optional `reasoningContent` in the **Reasoning** component; uses **Shimmer** for “Thinking...” when there is no content yet; uses **parseReasoningBlock(content)** for persisted messages that store reasoning as `<think>` or ` ```reasoning` blocks.
- **Persistence**: When the stream ends, if we have both reasoning and main text, we merge them into `content` as ` ```reasoning\n...\n```\n\n` + main so saved messages still contain the reasoning block and existing parsing still works.

## References

- Flowise PR: [Add Detailed Streaming to the Tool Agent #4155](https://github.com/FlowiseAI/Flowise/pull/4155)
- Elements AI SDK: [Reasoning](https://elements.ai-sdk.dev/components/reasoning), [Conversation](https://elements.ai-sdk.dev/components/conversation)
