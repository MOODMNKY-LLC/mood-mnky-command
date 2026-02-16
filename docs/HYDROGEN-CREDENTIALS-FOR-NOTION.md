# Hydrogen / MNKY VERSE Credentials for Notion

Source: Shopify Admin → Hydrogen → MNKY VERSE → Environments and variables.

**Consolidation:** See [CREDENTIALS-CONSOLIDATION-GUIDE.md](./CREDENTIALS-CONSOLIDATION-GUIDE.md) for updating the 11 credential pages to match the "Shopify Hydrogen & Oxygen" / "MNKY VERSE" schema and removing duplicates.

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

| Key | Value | Secret | Description |
|-----|-------|--------|-------------|
| `PUBLIC_STORE_DOMAIN` | `mood-mnky-3.myshopify.com` | No | Shopify store domain (MNKY VERSE) |
| `NEXT_PUBLIC_STORE_DOMAIN` | `mood-mnky-3.myshopify.com` | No | Same, client-exposed |
| `PUBLIC_STOREFRONT_API_TOKEN` | `db20199e723efb587568e0bc85de217e` | No | Public Storefront API token |
| `NEXT_PUBLIC_STOREFRONT_API_TOKEN` | `db20199e723efb587568e0bc85de217e` | No | Same, client-exposed |
| `PRIVATE_STOREFRONT_API_TOKEN` | `***REDACTED***` (set in env) | **Yes** | Private Storefront API token |
| `PUBLIC_STOREFRONT_ID` | `1000099429` | No | Hydrogen storefront numeric ID |
| `NEXT_PUBLIC_STOREFRONT_ID` | `1000099429` | No | Same, client-exposed (ShopifyProvider) |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | `3f6a4b45-b9b7-4f6d-80d4-4e44b1d96f4e` | No | Customer Account API client ID |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | `https://shopify.com/69343281426` | No | Customer Account API auth URL |
| `SHOP_ID` | `69343281426` | No | Numeric Shopify shop ID |
| `SESSION_SECRET` | `dc27f0ce540d9be2c836ddbc87ebfbbcf3cede12` | **Yes** | Remix session secret (full Hydrogen only) |

---

**Rotate** `PRIVATE_STOREFRONT_API_TOKEN` if ever exposed. Update in Shopify Admin → Hydrogen → Storefront API → Rotate private access token.
