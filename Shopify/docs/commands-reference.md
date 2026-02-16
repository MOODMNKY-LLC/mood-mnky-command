# Commands Reference

Custom Cursor commands for Shopify theme development. Invoke via `/` in chat.

## Theme Development Commands

### /theme-change-plan

**Purpose**: Create a safe implementation plan before coding.

**Output**:
1. Goal statement (1–2 sentences)
2. Proposed approach (bulleted)
3. Files likely to change (list)
4. Risks and regressions to watch (bulleted)
5. Manual test checklist tailored to the change (bulleted)

**When to use**: Before implementing any non-trivial change. Always prefer minimal changes and preserve section schema integrity.

**Example**: "I want to add a 'Show price' toggle to the product grid section" → Run `/theme-change-plan` → Get plan → Implement.

---

### /liquid-snippet-extract

**Purpose**: Extract repeated Liquid/HTML markup into a snippet.

**Steps**:
1. Identify duplicated markup and its variable dependencies
2. Create a new snippet in `snippets/` with a clear name
3. Replace duplicates with `{% render 'snippet-name', ... %}` and pass required variables
4. Ensure no schema or block behavior changes

**Output**: Patch summary, snippet file created, call sites updated, manual test list.

**When to use**: When you see the same markup repeated in multiple places (e.g. product cards, collection items).

---

### /add-section-setting

**Purpose**: Add a new Shopify section setting safely.

**Steps**:
1. Identify the correct section file in `sections/`
2. Add a new setting to `{% schema %}` with type, id, label, default, constraints
3. Wire the setting into markup with a safe default
4. Do NOT break existing settings/blocks
5. Provide manual testing list for editor and storefront

**Output**: Schema JSON diff, markup change, manual test checklist.

**When to use**: When adding a configurable option to a section (e.g. color picker, checkbox, select).

---

### /fix-theme-bug

**Purpose**: Fix a Shopify theme bug with minimal blast radius.

**Protocol**:
1. Ask: where is it happening (template/section), what triggers it?
2. Locate the most likely file(s) and explain why
3. Propose a minimal patch
4. Implement and summarize changes
5. Provide regression test checklist

**Constraints**: Prefer local patch in the responsible section/snippet. Avoid editing `layout/theme.liquid` unless unavoidable.

**When to use**: When debugging a specific bug (layout break, JS error, form not submitting, etc.).

---

### /performance-pass

**Purpose**: Perform a performance pass on the edited area.

**Checklist**:
- Identify render-blocking assets added/changed
- Reduce DOM churn in JS
- Ensure images are responsive and not oversized
- Avoid expensive CSS selectors

**Output**: Findings, proposed edits, patch, manual verification steps.

**When to use**: After implementation, before shipping. Especially important when adding new JS or images.

---

### /accessibility-pass

**Purpose**: Perform an accessibility pass on the edited area.

**Checklist**:
- Keyboard navigation works
- Focus indicators visible
- Form labels present
- Buttons/links semantically correct
- ARIA only when necessary and correct

**Output**: Issues found, fixes applied, keyboard-only walkthrough test steps.

**When to use**: After implementation, before shipping. Required for forms and interactive UI.

---

## Research Command

### /theme-research-plan

**Purpose**: Conduct deep research for complex theme decisions (migration, performance strategy, architecture).

**Invokes**: The deep-thinking protocol (`.cursor/rules/deep-thinking.mdc`).

**Phases**:
1. Initial engagement: Clarifying questions
2. Research planning: 3–5 themes, wait for approval
3. Mandated research cycles: Brave → Sequential Thinking → Tavily → FireCrawl as needed
4. Final report: Knowledge development, analysis, practical implications

**When to use**: Choosing theme architecture, migrating themes, optimizing performance at scale, evaluating third-party solutions, before major refactors.

---

## General Command

### /pr

**Purpose**: Create a PR with a descriptive title using GitHub CLI. Commits first if needed.

---

## Suggested Order

| Phase | Commands |
|-------|----------|
| Planning | `/theme-change-plan` or `/theme-research-plan` |
| Implementing | `/liquid-snippet-extract`, `/add-section-setting`, `/fix-theme-bug` |
| Finalizing | `/performance-pass`, `/accessibility-pass` |
