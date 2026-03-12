/**
 * Updates the 11 Hydrogen credential pages in MOOD MNKY Credentials
 * with Parent Program = "Shopify Hydrogen & Oxygen", Use Cases = "MNKY VERSE",
 * and correct Key Code / Examples values.
 *
 * Run: pnpm tsx scripts/update-notion-hydrogen-credentials.ts
 * Requires: NOTION_API_KEY in .env or .env.local
 */

import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = "2022-06-28";

// The 11 env-var pages (user moved into DB) + 6 existing "Shopify Hydrogen & Oxygen" blanks.
// Update both sets - use first 6 to populate the blank H&O pages, and our 11 with full data.
const BLANK_H_O_PAGES = [
  "309cd2a6-5422-803a-b47b-ef14fde56e22",
  "309cd2a6-5422-80c0-a6e5-d8cf7a3ae20a",
  "309cd2a6-5422-8001-bfdb-d17571f6e889",
  "309cd2a6-5422-80dc-b8be-c2463801be5e",
  "309cd2a6-5422-80ce-8366-c91d28b0d2b5",
  // Keep 309cd2a6-5422-80b6-99ef-e208441c0f85 (Production Deployment URL)
];

const CREDENTIALS: Array<{
  pageId: string;
  keyCode: string;
  examples: string;
  useCases: string;
}> = [
  {
    pageId: "309cd2a6-5422-81f6-af99-e32b2b03e7f7",
    keyCode: "PUBLIC_STORE_DOMAIN",
    examples: "mood-mnky-3.myshopify.com",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-81c5-95c7-d3234531dffc",
    keyCode: "NEXT_PUBLIC_STORE_DOMAIN",
    examples: "mood-mnky-3.myshopify.com",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-8101-b6c3-cf6c0d1caa71",
    keyCode: "PUBLIC_STOREFRONT_API_TOKEN",
    examples: "db20199e723efb587568e0bc85de217e",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-8115-a629-c97cdf13929a",
    keyCode: "NEXT_PUBLIC_STOREFRONT_API_TOKEN",
    examples: "db20199e723efb587568e0bc85de217e",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-8156-9f66-eb196c7ffdf5",
    keyCode: "PRIVATE_STOREFRONT_API_TOKEN",
    examples: process.env.PRIVATE_STOREFRONT_API_TOKEN ?? "***REDACTED***",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-8130-b85a-f51be6b04db1",
    keyCode: "PUBLIC_STOREFRONT_ID",
    examples: "1000099429",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-81df-99e8-e42e706619a1",
    keyCode: "NEXT_PUBLIC_STOREFRONT_ID",
    examples: "1000099429",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-81bd-85d2-ecce7307bbaa",
    keyCode: "PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID",
    examples: "3f6a4b45-b9b7-4f6d-80d4-4e44b1d96f4e",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-81ff-b915-de1f08265f99",
    keyCode: "PUBLIC_CUSTOMER_ACCOUNT_API_URL",
    examples: "https://shopify.com/69343281426",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-8115-bbc4-cf86d829fddc",
    keyCode: "SHOP_ID",
    examples: "69343281426",
    useCases: "MNKY VERSE",
  },
  {
    pageId: "309cd2a6-5422-81e8-81c2-dd8aecf95fde",
    keyCode: "SESSION_SECRET",
    examples: "dc27f0ce540d9be2c836ddbc87ebfbbcf3cede12",
    useCases: "MNKY VERSE",
  },
];

function richText(content: string) {
  return { rich_text: [{ text: { content } }] };
}

function title(content: string) {
  return { title: [{ text: { content } }] };
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("NOTION_API_KEY is required. Set it in .env or .env.local");
    process.exit(1);
  }

  // Update the 5 blank "Shopify Hydrogen & Oxygen" DB pages with first 5 credentials
  const first5Creds = CREDENTIALS.slice(0, 5);
  for (let i = 0; i < BLANK_H_O_PAGES.length && i < first5Creds.length; i++) {
    const cred = first5Creds[i];
    await updatePage(BLANK_H_O_PAGES[i], cred.keyCode, cred.examples);
  }

  // Create remaining 6 credentials as new database rows
  const remainingCreds = CREDENTIALS.slice(5);
  const DB_ID = "6f2a478a094342d59c80e03eb6c2a5ef";
  for (const cred of remainingCreds) {
    await createPageInDatabase(DB_ID, cred.keyCode, cred.examples);
  }

  console.log("Done.");
}

async function updatePage(
  pageId: string,
  keyCode: string,
  examples: string
) {
  const properties: Record<string, unknown> = {
    "Key Code": richText(keyCode),
    "Examples:": richText(examples),
    "Use Cases ": richText("MNKY VERSE"),
    "Parent Program": title("Shopify Hydrogen & Oxygen"),
  };

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed ${pageId} (${keyCode}):`, res.status, err);
    return;
  }
  console.log(`Updated: ${keyCode}`);
}

async function createPageInDatabase(
  databaseId: string,
  keyCode: string,
  examples: string
) {
  const properties: Record<string, unknown> = {
    "Parent Program": title("Shopify Hydrogen & Oxygen"),
    "Key Code": richText(keyCode),
    "Examples:": richText(examples),
    "Use Cases ": richText("MNKY VERSE"),
  };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Create failed ${keyCode}:`, res.status, err);
    return;
  }
  console.log(`Created: ${keyCode}`);
}

main().catch(console.error);
