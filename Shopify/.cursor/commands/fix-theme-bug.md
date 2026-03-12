Task: Fix a Shopify theme bug with minimal blast radius.

Protocol:
1) Ask: where is it happening (template/section), and what triggers it?
2) Locate the most likely file(s) and explain why.
3) Propose a minimal patch.
4) Implement and summarize changes.
5) Provide a regression test checklist.

Constraints:
- Prefer local patch in the responsible section/snippet.
- Avoid editing `layout/theme.liquid` unless unavoidable.
