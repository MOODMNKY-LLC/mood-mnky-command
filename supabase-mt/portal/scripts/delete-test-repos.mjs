/**
 * One-off: delete test GitHub repos using GITHUB_TOKEN from supabase-mt/.env.local.
 * Run from repo root: node supabase-mt/portal/scripts/delete-test-repos.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local is at supabase-mt/.env.local; script is portal/scripts/delete-test-repos.mjs
const envPath = join(__dirname, "..", "..", ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local at supabase-mt/.env.local");
  process.exit(1);
}
const raw = readFileSync(envPath, "utf-8");
const line = raw.split(/\r?\n/).find((l) => {
  const t = l.trim();
  return (t.startsWith("GITHUB_TOKEN=") || t.startsWith("GITHUB_ACCESS_TOKEN=")) && !t.startsWith("#");
});
if (!line) {
  console.error("GITHUB_TOKEN or GITHUB_ACCESS_TOKEN not set in .env.local");
  process.exit(1);
}
let token = line.slice(line.indexOf("=") + 1).trim();
if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))
  token = token.slice(1, -1).trim();

const REPOS = ["my-app", "testetstwe", "testtesttest", "test2", "testtest", "test-app"];
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function main() {
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) {
    console.error("GitHub auth failed:", userRes.status, await userRes.text());
    process.exit(1);
  }
  const user = await userRes.json();
  const owner = user.login;
  console.log("Deleting repos as", owner, "...\n");

  for (const repo of REPOS) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: "DELETE",
      headers,
    });
    if (res.status === 204 || res.status === 404) {
      console.log(res.status === 404 ? `${repo} (already gone)` : `Deleted ${repo}`);
    } else {
      console.error(`${repo}: ${res.status}`, await res.text());
    }
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
