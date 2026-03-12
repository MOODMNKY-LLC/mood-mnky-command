#!/usr/bin/env node
/**
 * Fetches Discord guild and channels and prints a server map (Markdown).
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE. Guild ID from argv[2] or resolved from NEXT_PUBLIC_DISCORD_INVITE_URL.
 * Run: dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs [guildId]
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const CHANNEL_TYPE = { 0: "text", 2: "voice", 4: "category", 5: "announcement", 15: "forum" };

const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;
if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

async function discordJson(path) {
  const res = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

let guildId = process.argv[2];
if (!guildId) {
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";
  const match = inviteUrl.match(/discord\.gg\/([a-zA-Z0-9]+)/) || inviteUrl.match(/\/([a-zA-Z0-9]+)$/);
  const code = match ? match[1] : inviteUrl.trim().split("/").pop();
  if (!code) {
    console.error("Pass guildId as first argument or set NEXT_PUBLIC_DISCORD_INVITE_URL");
    process.exit(1);
  }
  const invite = await discordJson(`/invites/${code}?with_counts=true`);
  guildId = invite.guild?.id;
  if (!guildId) {
    console.error("Invite response missing guild.id");
    process.exit(1);
  }
}

const [guild, channels] = await Promise.all([
  discordJson(`/guilds/${guildId}?with_counts=true`),
  discordJson(`/guilds/${guildId}/channels`),
]);

const name = guild.name || "Discord Server";
const approx = guild.approximate_member_count ?? guild.approximate_presence_count ?? "—";

const byParent = new Map();
const categories = [];
for (const ch of channels) {
  const typeLabel = CHANNEL_TYPE[ch.type] || `type-${ch.type}`;
  const row = { ...ch, typeLabel };
  if (ch.type === 4) {
    categories.push({ ...row, position: ch.position });
  } else {
    const key = ch.parent_id || "_none_";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  }
}

categories.sort((a, b) => a.position - b.position);
for (const [, list] of byParent) list.sort((a, b) => a.position - b.position);

const lines = [
  `# Discord Server Map: ${name}`,
  "",
  "| Field | Value |",
  "|-------|-------|",
  `| Guild ID | \`${guildId}\` |`,
  `| Approx. members | ${approx} |`,
  "",
  "## Categories and channels",
  "",
];

for (const cat of categories) {
  lines.push(`### ${cat.name} (category)`);
  lines.push("");
  const children = byParent.get(cat.id) || [];
  if (children.length === 0) {
    lines.push("*No channels in this category.*");
  } else {
    lines.push("| Channel | Type | ID |");
    lines.push("|---------|------|-----|");
    for (const ch of children) {
      lines.push(`| #${ch.name} | ${ch.typeLabel} | \`${ch.id}\` |`);
    }
  }
  lines.push("");
}

const uncategorized = byParent.get("_none_") || [];
if (uncategorized.length > 0) {
  lines.push("### Uncategorized");
  lines.push("");
  lines.push("| Channel | Type | ID |");
  lines.push("|---------|------|-----|");
  for (const ch of uncategorized) {
    lines.push(`| #${ch.name} | ${ch.typeLabel} | \`${ch.id}\` |`);
  }
  lines.push("");
}

lines.push("---");
lines.push("");
lines.push("## Category IDs (for API / parent_id)");
lines.push("");
lines.push("| Category name | Category ID |");
lines.push("|--------------|-------------|");
for (const cat of categories) {
  lines.push(`| ${cat.name} | \`${cat.id}\` |`);
}
lines.push("");
lines.push("---");
lines.push("");
lines.push("## MNKY categories summary");
lines.push("");
lines.push("**MNKY categories** (names containing \"MNKY\"):");
const mnkyCats = categories.filter((c) => /mnky/i.test(c.name));
if (mnkyCats.length === 0) {
  lines.push("- None found. Consider adding categories such as **MNKY VERSE**, **MNKY LABZ**, **MNKY BOX**.");
} else {
  for (const c of mnkyCats) {
    const children = byParent.get(c.id) || [];
    lines.push(`- **${c.name}**: ${children.length} channel(s) — ${children.map((ch) => `#${ch.name}`).join(", ") || "—"}`);
  }
}

console.log(lines.join("\n"));
