# Formula Catalog

Browse and calculate formulations for bath, body, and cosmetic products from the Whole Elise catalog.

## Browsing Formulas

1. Go to **Formulas** in the sidebar
2. Use the **search** box to filter by name, description, or tags
3. Use the **category tabs** – All, Skincare, Haircare, DIY, Candle – to narrow results
4. Click a formula card to select it

## Formula Calculator

When you select a formula:

1. The **Formula Calculator** appears on the right
2. Enter your **batch size** (e.g., 100 for 100g or 100ml)
3. The calculator shows adjusted amounts for each ingredient
4. Links to **Whole Elise** tutorial when available

## Formula Card Details

Each card shows:

- Formula name
- Category badge (Skincare, Candle, etc.)
- Tags
- Product type (e.g., candle, lotion)

## Export to PDF

Formulas can be exported as a PDF card (recipe + ingredients) via Adobe PDF Services.

**Endpoint**: `POST /api/formulas/[id]/export-pdf`

- **Path parameter**: Formula `id` (UUID) or `slug` (e.g. `body-butter-basic`)
- **Auth**: Requires authenticated session (cookie or Authorization header)
- **Response**: PDF file attachment (download)

Example (with auth cookie):

```bash
curl -X POST https://your-app.com/api/formulas/abc123/export-pdf \
  -H "Cookie: sb-xxx-auth-token=..." \
  -o formula.pdf
```

Environment variables: `PDF_SERVICES_CLIENT_ID` and `PDF_SERVICES_CLIENT_SECRET` (or `ADOBE_CLIENT_ID` / `ADOBE_CLIENT_SECRET` if the same project has PDF Services). See [Adobe PDF Services](https://developer.adobe.com/document-services/docs/overview/pdf-services-api/).

## Tips

- Use search to find formulas by wax type, wick type, or ingredient
- Candle formulas include wick and wax recommendations
- External links to Whole Elise provide full tutorials
