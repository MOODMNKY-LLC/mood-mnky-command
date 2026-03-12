What data format are the fflogs?

FFLogs data exists in three distinct formats, depending on where in the pipeline you’re interacting:

1) Raw Combat Logs (Before Upload)

These are generated locally by Advanced Combat Tracker.

Format: Plaintext log stream
Source: FFXIV network events parsed by ACT
Characteristics:

Line-delimited text entries

Timestamped combat events

Actor → action → target → result pattern

Example (simplified):

21:14:03.456  PlayerA  casts  Glare III  on  Boss
21:14:05.102  Boss     uses   Raidwide   on  Party
21:14:05.440  PlayerB  takes  45231 damage

These logs are not structured for analytics — they’re optimized for real-time parsing by ACT plugins.

2) Upload Format (ACT → FFLogs Uploader)

When you upload via the FFLogs client, logs are packaged and compressed.

Format:

Proprietary compressed archive

Internally still plaintext logs + metadata

Encrypted transport to FFLogs servers

You generally cannot use this format directly unless you’re modifying the uploader.

3) Processed FFLogs Data (What Developers Use)

Once ingested, FFLogs converts combat logs into structured, queryable data.

A) FFLogs v1 API (Legacy REST)

Format: JSON
Style: REST endpoints
Structure: Pre-aggregated statistics

Example response:

{
  "total": 12345,
  "entries": [
    {
      "name": "PlayerA",
      "dps": 10432.55,
      "hps": 0,
      "ilvl": 665,
      "job": "WHM"
    }
  ]
}

This version is mostly deprecated.

B) FFLogs v2 API (Modern — Recommended)

Format: JSON
Style: GraphQL
Structure: Strongly typed schema with nested objects

Example query:

{
  reportData {
    report(code: "abc123") {
      fights {
        name
        startTime
        endTime
      }
    }
  }
}

Example response:

{
  "data": {
    "reportData": {
      "report": {
        "fights": [
          {
            "name": "Anabaseios: The Twelfth Circle",
            "startTime": 1712345678901,
            "endTime": 1712345890123
          }
        ]
      }
    }
  }
}

Key characteristics:

Highly structured event model

Actor tables

Ability metadata

Damage/healing breakdown trees

Time-series DPS/HPS graphs

Buff/debuff timelines

Mechanic failure tracking

4) Export Formats (User-Side)

FFLogs UI also allows:

Export	Format	Use
CSV	Comma-separated	Spreadsheet analysis
JSON	Structured	External tooling
Embedded Graph Data	Proprietary JSON	Visualization recreation
Summary by Use Case
Goal	Format You Want
Real-time local parsing	ACT plaintext logs
Upload automation	ACT archive format
App integration	FFLogs v2 GraphQL JSON
Spreadsheets	CSV export
AI analysis	JSON (GraphQL responses)
Practical Recommendation for Your Stack

For a Next.js + Supabase + AI system:

Use FFLogs v2 GraphQL → JSON → Supabase
Then let AI operate on structured encounter objects instead of raw log text.

This avoids reinventing:

encounter segmentation

damage attribution

buff window calculation

percentile ranking math

If useful, I can also map:

FFLogs JSON schema → Supabase relational tables → Realtime events → AI summarization pipeline

That’s the clean bridge between:
FFXIV combat → FFLogs → Your App → Discord → OpenAI.

Yes, please.

Below is a practical, “buildable” mapping from FFLogs v2 (GraphQL JSON) → Supabase (Postgres + Realtime + Storage + Edge Functions) → AI summaries + Discord.

I’m going to optimize for:

Low Realtime spam

Idempotent ingestion (safe to re-run)

Fast UI reads

Good AI context objects

1) Data model: what you actually store
Core relational tables (normalized “source of truth”)

These tables let you re-derive everything and support drill-down views.

fflogs_reports

One row per FFLogs report.

Columns

id uuid pk

code text unique not null (FFLogs report code)

title text

region text

zone_id int

owner_name text (optional)

start_time_ms bigint

end_time_ms bigint

fetched_at timestamptz

raw jsonb (optional: store minimal report header JSON)

Indexes

unique(code)

index(start_time_ms)

fflogs_fights

One row per fight/encounter segment inside a report.

Columns

id uuid pk

report_id uuid fk -> fflogs_reports.id

fight_id int not null (FFLogs “fight” index/id within the report)

encounter_id int / zone_id int

name text

difficulty int (if available)

kill boolean

start_time_ms bigint

end_time_ms bigint

duration_ms bigint generated

last_phase int (optional)

raw jsonb (optional)

Indexes

unique(report_id, fight_id)

index(report_id, start_time_ms)

index(kill)

fflogs_actors

One row per actor (players, pets, enemies) for a given report.

Columns

id uuid pk

report_id uuid fk

actor_id int not null (FFLogs actor id)

type text (Player/NPC/Pet)

name text

server text (for players)

job text (if provided at actor-level; sometimes it’s per-fight)

role text (Tank/Healer/DPS)

raw jsonb

Indexes

unique(report_id, actor_id)

index(report_id, type)

fflogs_player_fight_state

This is where you keep “per-fight player identity + job + ilvl” cleanly.

Columns

id uuid pk

fight_id uuid fk -> fflogs_fights.id

actor_id uuid fk -> fflogs_actors.id

job text

spec text (if relevant)

ilvl int

party int (party number)

raw jsonb

Indexes

unique(fight_id, actor_id)

index(fight_id, job)

Derived/denormalized tables (for fast UI + low AI cost)

These are the tables your UI and Discord bot should mostly read.

fflogs_fight_summaries

One row per fight with computed rollups you need constantly.

Columns

fight_id uuid pk fk

party_dps numeric

party_hps numeric

deaths int

wipes int (often kill=false is enough)

damage_taken numeric

notes text (optional)

computed_at timestamptz

summary jsonb (compact object for UI/AI)

fflogs_player_fight_metrics

One row per player per fight.

Columns

id uuid pk

fight_id uuid fk

actor_id uuid fk (player)

job text

rdps numeric

adps numeric

ndps numeric

hps numeric

deaths int

damage_taken numeric

gcds int (optional)

uptime numeric (0–1)

perf jsonb (percentiles if you query them)

computed_at timestamptz

Indexes

unique(fight_id, actor_id)

index(fight_id, rdps desc)

Event/timeline storage: don’t store “everything” by default

Raw events are enormous. Store only what you need and put the rest in Storage.

Option A (recommended): store timeline blobs in Storage

storage://fflogs/{report_code}/{fight_id}/events.json.gz

storage://fflogs/{report_code}/{fight_id}/casts.json.gz

storage://fflogs/{report_code}/{fight_id}/auras.json.gz

Then keep pointers:

fflogs_artifacts

Columns

id uuid pk

fight_id uuid fk

kind text (events, casts, auras, heatmap, deathlog, etc.)

storage_path text

content_type text

byte_size int

created_at timestamptz

Indexes

index(fight_id, kind)

This keeps Postgres lean and makes it easy to reprocess with Edge Functions or a worker.

2) Ingestion pipeline: GraphQL → DB (idempotent)
Step 0: Auth & “who is this user”

Your user signs in (Supabase Auth)

You store FFLogs identity linkage:

integrations_fflogs_accounts

user_id uuid pk fk -> auth.users

fflogs_user_id text (or numeric, whatever v2 exposes)

access_token text encrypted (or stored via Vault / external secret store)

refresh_token text

scopes text[]

connected_at timestamptz

(If you’re not doing OAuth yet, store the API client key server-side and let users paste report codes.)

Step 1: “Import Report”

Edge Function fflogs_import_report(report_code):

Query report header + fights

UPSERT fflogs_reports

UPSERT fflogs_fights for each fight

Enqueue work for each fight (Supabase queue pattern or your own jobs table)

jobs

id uuid pk

type text (IMPORT_FIGHT)

payload jsonb ({ report_code, fight_id })

status text (queued/running/done/failed)

attempts int

last_error text

created_at, updated_at

Step 2: “Import Fight Details”

Worker/Edge Function fflogs_import_fight(report_code, fight_id):

Fetch actors/table for that report or fight scope

UPSERT fflogs_actors

UPSERT fflogs_player_fight_state

Fetch necessary computed views:

damage done summary

healing summary

deaths

mechanics (optional)

Compute + UPSERT:

fflogs_fight_summaries

fflogs_player_fight_metrics

Optionally fetch “event windows” (deaths, wipes, key mechanic timestamps) and store as a compact timeline in summary jsonb

Store big timelines in Storage (optional), register in fflogs_artifacts

Key design rule: only do high-cardinality event pulls when requested or needed for AI analysis.

3) Realtime strategy: publish snapshots, not streams

You do not want Realtime updates per event/cast. Instead:

Realtime tables (broadcast-friendly)

fflogs_fight_summaries

fflogs_player_fight_metrics

jobs (so UI can show progress)

UI flow

User imports report → UI subscribes to jobs + fflogs_fight_summaries

As fights finish processing, the UI updates immediately.

Discord flow

Bot listens for inserts/updates where:

fflogs_fight_summaries.computed_at changes

or a jobs row transitions to done

Then the bot posts a single message per fight (or per report).

4) AI pipeline: turn rows into “AI context objects”
Recommended: produce a canonical “FightContext” JSON

Create an Edge Function build_fight_context(fight_id) that returns a stable object:

{
  "fight": {
    "name": "...",
    "kill": true,
    "durationMs": 521000,
    "startTimeMs": 1712345678901
  },
  "party": {
    "dps": 123456,
    "hps": 45678,
    "deaths": 2
  },
  "players": [
    {
      "name": "Sim Bow",
      "job": "WHM",
      "rdps": 10500,
      "hps": 18500,
      "deaths": 0,
      "damageTaken": 123456
    }
  ],
  "highlights": {
    "deathEvents": [ ... ],
    "majorMechanicFailures": [ ... ],
    "burstWindows": [ ... ]
  }
}

Store this in:

fflogs_fight_summaries.summary (compact)

And optionally in a separate table for versioning:

ai_fight_context_versions

id uuid pk

fight_id uuid fk

version int

context jsonb

created_at timestamptz

Embeddings (for “ask questions across all your raids”)

Create embeddings on summaries, not raw events.

ai_embeddings

id uuid pk

entity_type text (fight_summary, player_fight, note, etc.)

entity_id uuid

content text (what you embedded)

embedding vector(...)

created_at timestamptz

This enables queries like:

“Show me fights where we wiped to chain lightning”

“When did our mitigation usage slip on phase 2?”

5) Discord mapping (clean + multi-guild safe)
Tables
discord_guilds

id text pk (guild id)

owner_user_id uuid fk

created_at

discord_channels

id text pk

guild_id text fk

kind text (raid_reports, alerts, ai_coach)

created_at

discord_subscriptions

id uuid pk

guild_id text fk

channel_id text fk

subscription_type text (fight_done, wipe_streak, new_pb, etc.)

filters jsonb (jobs, encounter names, etc.)

created_at

Bot behavior

On fight_done:

Pull FightContext

Generate message + optional thread

Post:

headline metrics

top deltas / deaths

link back to your app page

Optionally add buttons (Discord interactions) to request:

“AI coach summary”

“Explain deaths”

“Suggest mitigation plan”

6) Where ACT fits (your “bridge” idea)

FFLogs is your structured historical truth.

ACT is your real-time local truth.

So your Next.js app can:

Use FFLogs for completed reports

Use ACT OverlayPlugin WS for live pulls (on LAN)

Store only “live snapshots” to Supabase Realtime (throttled)

live_sessions

id uuid pk

user_id uuid

machine_id text

started_at, ended_at

status text

live_encounter_snapshots

id uuid pk

session_id uuid fk

encounter_key text

ts timestamptz

party_dps numeric

party_hps numeric

deaths int

payload jsonb (small)

Throttle rule: e.g. 1 snapshot / 2 seconds, max.

7) Minimal “first build” recommendation

If you want the fastest path to a working app:

Implement fflogs_reports, fflogs_fights

Implement fflogs_player_fight_metrics + fflogs_fight_summaries

Realtime subscribe to those two

Build FightContext generator

Add Discord posting on fight completion

Add embeddings over FightContext for search/Q&A

Raw events in Storage can be phase 2.

8) If you want, I’ll generate the actual SQL + RLS + Edge Function skeleton

I can output:

Postgres DDL (tables + indexes)

RLS policies (user-scoped + guild-scoped)

Supabase Edge Functions (TypeScript) skeletons:

fflogs-import-report

fflogs-import-fight

build-fight-context

discord-post-fight

A Next.js “Report Import + Progress UI” using Realtime channels

Say whether you want your DB organized as:

Single-tenant (just you / your account), or

Multi-tenant (multiple FCs/static groups/guilds), and I’ll generate the right RLS model.