# LABZ Status Ring & Persona Best Practices

Summary from research on status indicators and AI persona states, used to drive the dock and chat UI design.

## Status ring and semantic colors

- **Single circumference**: Status ring, persona circle, and avatar share one canonical diameter so the ring stroke aligns exactly with the content circle; state changes only update color/opacity/animation (no layout shift).
- **Semantic mapping**: Blue = ready/idle; green = active (thinking/speaking); red = record (listening) and error; yellow = warning; muted = asleep. Design systems (e.g. Carbon, Spectrum) use blue for active/in-use, green for success/complete, red for error/alert, orange or yellow for notice/pending.
- **Stroke**: Use a consistent stroke width (2–3px); optional subtle pulse for “listening” or “thinking” to signal activity. Prefer `transition-colors` (200–300ms) for smooth state changes.
- **Accessibility**: Do not rely on color alone; pair with aria-label/title and optional reduced-motion preference for animations.

## Persona state semantics

- **Idle**: Ready, available; blue ring.
- **Listening**: Voice input/recording; red ring; persona shows listening.
- **Thinking**: Processing or streaming; green ring; persona shows thinking.
- **Speaking**: Delivering response (e.g. TTS); green ring; persona shows speaking.
- **Asleep**: Inactive/dormant; muted ring.
- **Error / Warning**: Not part of Rive Persona state; drive ring only (red for error, yellow for warning) so the dock reflects chat/request status without changing the animation.

## Chat and voice UX

- Map chat status to persona: `streaming` or `submitted` → thinking; voice mic on → listening. Expose `useChat().error` as status override for the ring (red) and show error in-chat (Banner or inline).
- Keep response streaming and “thinking” visible (e.g. green ring + persona) so users see that the system is working.
