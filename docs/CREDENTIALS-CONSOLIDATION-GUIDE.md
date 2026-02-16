# Credentials Consolidation Guide — Shopify Hydrogen & Oxygen / MNKY VERSE

## Status: Completed

The script `pnpm tsx scripts/update-notion-hydrogen-credentials.ts` has been run to:

1. **Update 5 blank** "Shopify Hydrogen & Oxygen" pages with: PUBLIC_STORE_DOMAIN, NEXT_PUBLIC_STORE_DOMAIN, PUBLIC_STOREFRONT_API_TOKEN, NEXT_PUBLIC_STOREFRONT_API_TOKEN, PRIVATE_STOREFRONT_API_TOKEN.
2. **Create 6 new** database rows for: PUBLIC_STOREFRONT_ID, NEXT_PUBLIC_STOREFRONT_ID, PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID, PUBLIC_CUSTOMER_ACCOUNT_API_URL, SHOP_ID, SESSION_SECRET.
3. **Kept** the "Production Deployment URL" page (separate credential).

## Optional cleanup

- **11 child pages** (PUBLIC_STORE_DOMAIN, etc.) live under the Credentials page as subpages, not as DB rows. You can delete them to avoid clutter — all values are now in the database.

---

## Optional: Delete the 11 child pages

These were created as subpages of Credentials (not DB rows). They’re now redundant — safe to delete:

| Page | URL |
|------|-----|
| PUBLIC_STORE_DOMAIN | https://www.notion.so/309cd2a6542281f6af99e32b2b03e7f7 |
| NEXT_PUBLIC_STORE_DOMAIN | https://www.notion.so/309cd2a6542281c595c7d3234531dffc |
| PUBLIC_STOREFRONT_API_TOKEN | https://www.notion.so/309cd2a654228101b6c3cf6c0d1caa71 |
| NEXT_PUBLIC_STOREFRONT_API_TOKEN | https://www.notion.so/309cd2a654228115a629c97cdf13929a |
| PRIVATE_STOREFRONT_API_TOKEN | https://www.notion.so/309cd2a6542281569f66eb196c7ffdf5 |
| PUBLIC_STOREFRONT_ID | https://www.notion.so/309cd2a654228130b85af51be6b04db1 |
| NEXT_PUBLIC_STOREFRONT_ID | https://www.notion.so/309cd2a6542281df99e8e42e706619a1 |
| PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID | https://www.notion.so/309cd2a6542281bd85d2ecce7307bbaa |
| PUBLIC_CUSTOMER_ACCOUNT_API_URL | https://www.notion.so/309cd2a6542281ffb915de1f08265f99 |
| SHOP_ID | https://www.notion.so/309cd2a654228115bbc4cf86d829fddc |
| SESSION_SECRET | https://www.notion.so/309cd2a6542281e881c2dd8aecf95fde |

**Keep:** The "Production Deployment URL" page (https://www.notion.so/309cd2a6542280b699efe208441c0f85) — different credential.

---

## Run the script again

To re-sync or fix values:

```bash
pnpm tsx scripts/update-notion-hydrogen-credentials.ts
```
