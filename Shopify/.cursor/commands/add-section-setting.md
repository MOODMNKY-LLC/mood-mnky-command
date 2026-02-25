Task: Add a new Shopify section setting safely.

Steps:
1) Identify the correct section file in `sections/`.
2) Add a new setting to `{% schema %}` with:
   - type, id, label, default, and constraints if needed
3) Wire the setting into markup with a safe default behavior.
4) Do NOT break existing settings/blocks.
5) Provide a short manual testing list in the theme editor and storefront.

Output:
- The exact schema JSON diff
- The markup change
- Manual test checklist
