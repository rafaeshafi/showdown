# Faceless World Cup Media Machine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a fully automated, faceless World Cup affiliate + ad revenue site with X automation — operator sets up API keys once, everything else runs itself.

**Architecture:** Next.js 14 App Router site deployed on Vercel with Supabase for persistence. Vercel Cron jobs trigger match syncs, odds updates, and Claude-generated content. A separate X posting job auto-publishes from the same content pipeline.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Postgres + Auth), football-data.org API, The Odds API, Anthropic API (Haiku for content gen), Vercel Cron, marked (Markdown→HTML), ecc-x-api skill

**Critical Path:** Tasks 1–10 must be complete before June 11. Tasks 11–12 (X automation, Reddit) can deploy after launch.

---

## File Map

```
kickoff-picks/
├── app/
│   ├── layout.tsx                        # Root layout, AdSense injection
│   ├── page.tsx                          # Homepage: today's matches + top articles
│   ├── watch/[country]/page.tsx          # Country streaming guide (220 pages)
│   ├── best-vpn-world-cup/page.tsx       # VPN money page
│   ├── stream-world-cup-free/page.tsx    # Streaming guide money page
│   ├── matches/[slug]/page.tsx           # Match preview or recap
│   ├── standings/page.tsx                # Live group standings
│   ├── bracket/page.tsx                  # Knockout bracket
│   └── api/
│       └── cron/
│           ├── sync-matches/route.ts     # Hourly: fetch + store match data
│           ├── sync-odds/route.ts        # 4-hourly: fetch + store odds
│           ├── generate-previews/route.ts # Daily 6am: generate match previews
│           ├── generate-recaps/route.ts  # Post-match: generate recaps
│           └── post-to-x/route.ts       # Scheduled: post to X
├── lib/
│   ├── supabase.ts                       # Supabase client (server + browser)
│   ├── football-api.ts                   # football-data.org wrapper
│   ├── odds-api.ts                       # The Odds API wrapper
│   └── content-generator.ts             # Claude API content generation
├── components/
│   ├── MatchCard.tsx                     # Match card with odds + link
│   ├── AffiliateBox.tsx                  # VPN/betting CTA component
│   ├── StandingsTable.tsx                # Group standings table
│   └── OddsDisplay.tsx                   # Sportsbook odds display
├── data/
│   ├── countries.ts                      # 220 countries with streaming info
│   └── affiliates.ts                     # Affiliate link config (filled by operator)
├── types/index.ts                        # Shared TypeScript types
├── scripts/
│   ├── seed-matches.ts                   # One-time: seed WC 2026 schedule
│   └── seed-country-pages.ts            # One-time: generate country content
├── vercel.json                           # Cron schedule config
└── .env.local.example                    # Env var template
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local.example`
- Create: `vercel.json`

- [ ] **Step 1: Initialise Next.js project**

```bash
cd /Users/rafaeshafi/kickoff-picks
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js project files created in `/Users/rafaeshafi/kickoff-picks`

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk date-fns marked
npm install -D @types/node @types/marked
```

- [ ] **Step 3: Create environment variable template**

Create `.env.local.example`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# football-data.org (free tier: https://www.football-data.org/client/register)
FOOTBALL_DATA_API_KEY=your_key

# The Odds API (free tier: https://the-odds-api.com/#get-access)
ODDS_API_KEY=your_key

# Anthropic (https://console.anthropic.com)
ANTHROPIC_API_KEY=your_key

# X (Twitter) API
X_API_KEY=your_key
X_API_SECRET=your_secret
X_ACCESS_TOKEN=your_token
X_ACCESS_SECRET=your_access_secret

# Google AdSense publisher ID (filled after AdSense approval)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX

# Cron security secret (generate: openssl rand -hex 32)
CRON_SECRET=your_random_secret
```

- [ ] **Step 4: Create `vercel.json` with cron schedule**

```json
{
  "crons": [
    { "path": "/api/cron/sync-matches", "schedule": "0 */3 * * *" },
    { "path": "/api/cron/sync-odds", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/generate-previews", "schedule": "0 6 * * *" },
    { "path": "/api/cron/generate-recaps", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/post-to-x", "schedule": "0 */2 * * *" }
  ]
}
```

- [ ] **Step 5: Update `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
}

export default nextConfig
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: TypeScript Types + Supabase Schema

**Files:**
- Create: `types/index.ts`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Define shared types**

Create `types/index.ts`:

```ts
export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | 'POSTPONED'
export type ContentType = 'preview' | 'recap' | 'country-guide'
export type Stage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL'

export interface Match {
  id: string
  external_id: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  kickoff_time: string
  status: MatchStatus
  stage: Stage
  group: string | null
  slug: string
}

export interface OddsSnapshot {
  id: string
  match_id: string
  book_name: string
  home_price: number | null
  draw_price: number | null
  away_price: number | null
  over_line: number | null
  over_price: number | null
  under_price: number | null
  snapshotted_at: string
}

export interface Content {
  id: string
  match_id: string | null
  type: ContentType
  slug: string
  title: string
  body_md: string
  meta_description: string
  published_at: string | null
}

export interface XPost {
  id: string
  content_id: string | null
  body: string
  posted_at: string | null
  status: 'pending' | 'posted' | 'failed'
}
```

- [ ] **Step 2: Create Supabase tables**

Log into Supabase dashboard → SQL Editor. Run:

```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  external_id integer unique not null,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  kickoff_time timestamptz not null,
  status text not null default 'SCHEDULED',
  stage text not null default 'GROUP_STAGE',
  "group" text,
  slug text unique not null,
  created_at timestamptz default now()
);

create table odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  book_name text not null,
  home_price numeric,
  draw_price numeric,
  away_price numeric,
  over_line numeric,
  over_price numeric,
  under_price numeric,
  snapshotted_at timestamptz default now()
);

create table content (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete set null,
  type text not null,
  slug text unique not null,
  title text not null,
  body_md text not null,
  meta_description text not null,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table x_posts (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references content(id) on delete set null,
  body text not null,
  posted_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create index on matches(kickoff_time);
create index on matches(status);
create index on content(type);
create index on content(published_at);
create index on x_posts(status);
```

- [ ] **Step 3: Create Supabase client**

Create `lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(url, anon)
export const supabaseAdmin = createClient(url, service)
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add types and Supabase schema"
```

---

## Task 3: Football Data API Integration

**Files:**
- Create: `lib/football-api.ts`
- Create: `app/api/cron/sync-matches/route.ts`

- [ ] **Step 1: Create football-data.org wrapper**

Create `lib/football-api.ts`:

```ts
const BASE = 'https://api.football-data.org/v4'
const HEADERS = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! }
const WC_2026_ID = 2000

export async function fetchMatches() {
  const res = await fetch(`${BASE}/competitions/${WC_2026_ID}/matches`, { headers: HEADERS })
  if (!res.ok) throw new Error(`football-data error: ${res.status}`)
  const data = await res.json()
  return data.matches as FootballMatch[]
}

export interface FootballMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

export function toSlug(home: string, away: string, date: string): string {
  const d = date.split('T')[0]
  const h = home.toLowerCase().replace(/\s+/g, '-')
  const a = away.toLowerCase().replace(/\s+/g, '-')
  return `${h}-vs-${a}-${d}`
}
```

- [ ] **Step 2: Create sync-matches cron route**

Create `app/api/cron/sync-matches/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { fetchMatches, toSlug } from '@/lib/football-api'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matches = await fetchMatches()

  for (const m of matches) {
    const slug = toSlug(m.homeTeam.name, m.awayTeam.name, m.utcDate)
    await supabaseAdmin.from('matches').upsert({
      external_id: m.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
      kickoff_time: m.utcDate,
      status: m.status,
      stage: m.stage,
      group: m.group,
      slug,
    }, { onConflict: 'external_id' })
  }

  return NextResponse.json({ synced: matches.length })
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: football-data.org integration and match sync cron"
```

---

## Task 4: Odds API Integration

**Files:**
- Create: `lib/odds-api.ts`
- Create: `app/api/cron/sync-odds/route.ts`

- [ ] **Step 1: Create Odds API wrapper**

Create `lib/odds-api.ts`:

```ts
const BASE = 'https://api.the-odds-api.com/v4'
const KEY = process.env.ODDS_API_KEY!

export async function fetchSoccerOdds() {
  const url = `${BASE}/sports/soccer_fifa_world_cup_2026/odds/?apiKey=${KEY}&regions=us&markets=h2h,totals&oddsFormat=american`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`odds-api error: ${res.status}`)
  return res.json() as Promise<OddsEvent[]>
}

export interface OddsEvent {
  id: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: Bookmaker[]
}

interface Bookmaker {
  key: string
  title: string
  markets: Market[]
}

interface Market {
  key: string
  outcomes: { name: string; price: number; point?: number }[]
}

export function parseOdds(event: OddsEvent, bookmakerKey: string) {
  const bm = event.bookmakers.find(b => b.key === bookmakerKey)
  if (!bm) return null

  const h2h = bm.markets.find(m => m.key === 'h2h')
  const totals = bm.markets.find(m => m.key === 'totals')

  const home = h2h?.outcomes.find(o => o.name === event.home_team)?.price ?? null
  const draw = h2h?.outcomes.find(o => o.name === 'Draw')?.price ?? null
  const away = h2h?.outcomes.find(o => o.name === event.away_team)?.price ?? null
  const over = totals?.outcomes.find(o => o.name === 'Over')
  const under = totals?.outcomes.find(o => o.name === 'Under')

  return {
    home_price: home,
    draw_price: draw,
    away_price: away,
    over_line: over?.point ?? null,
    over_price: over?.price ?? null,
    under_price: under?.price ?? null,
  }
}
```

- [ ] **Step 2: Create sync-odds cron route**

Create `app/api/cron/sync-odds/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { fetchSoccerOdds, parseOdds } from '@/lib/odds-api'
import { supabaseAdmin } from '@/lib/supabase'

const BOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers']

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await fetchSoccerOdds()
  const snapshots = []

  for (const event of events) {
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('home_team', event.home_team)
      .eq('away_team', event.away_team)
      .single()

    if (!match) continue

    for (const bookKey of BOOKS) {
      const odds = parseOdds(event, bookKey)
      if (!odds) continue
      const bm = event.bookmakers.find(b => b.key === bookKey)
      snapshots.push({ match_id: match.id, book_name: bm!.title, ...odds })
    }
  }

  if (snapshots.length > 0) {
    await supabaseAdmin.from('odds_snapshots').insert(snapshots)
  }

  return NextResponse.json({ snapshots: snapshots.length })
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: The Odds API integration and odds sync cron"
```

---

## Task 5: Affiliate Config + Country Data

**Files:**
- Create: `data/affiliates.ts`
- Create: `data/countries.ts`

- [ ] **Step 1: Create affiliate config**

Create `data/affiliates.ts`:

```ts
export interface AffiliateLink {
  name: string
  url: string
  cta: string
  commission: string
  badge: string
}

export const VPN_AFFILIATES: AffiliateLink[] = [
  {
    name: 'NordVPN',
    url: process.env.NEXT_PUBLIC_NORDVPN_AFFILIATE_URL ?? '#',
    cta: 'Get NordVPN — Watch Every Match',
    commission: '$40+/signup',
    badge: '#1 Recommended',
  },
  {
    name: 'ExpressVPN',
    url: process.env.NEXT_PUBLIC_EXPRESSVPN_AFFILIATE_URL ?? '#',
    cta: 'Try ExpressVPN Risk-Free',
    commission: '$36/signup',
    badge: 'Fastest Speeds',
  },
  {
    name: 'Surfshark',
    url: process.env.NEXT_PUBLIC_SURFSHARK_AFFILIATE_URL ?? '#',
    cta: 'Get Surfshark — Best Value VPN',
    commission: '$35/signup',
    badge: 'Best Value',
  },
]

export const BETTING_AFFILIATE: AffiliateLink = {
  name: 'DraftKings',
  url: process.env.NEXT_PUBLIC_DRAFTKINGS_AFFILIATE_URL ?? '#',
  cta: 'Bet on World Cup at DraftKings',
  commission: '$50+/signup',
  badge: 'US Only',
}
```

- [ ] **Step 2: Create country streaming data**

Create `data/countries.ts` (abbreviated — full list has 220 entries, same pattern):

```ts
export interface CountryStreamingInfo {
  country: string
  slug: string
  broadcaster: string
  free: boolean
  vpnNeeded: string
  notes: string
}

export const COUNTRIES: CountryStreamingInfo[] = [
  {
    country: 'Australia',
    slug: 'australia',
    broadcaster: 'SBS (free) or Optus Sport',
    free: true,
    vpnNeeded: 'Use a VPN set to Australia if abroad',
    notes: 'SBS is completely free, no subscription needed.',
  },
  {
    country: 'United Kingdom',
    slug: 'united-kingdom',
    broadcaster: 'ITV (free) and BBC (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to UK if abroad',
    notes: 'ITV and BBC share broadcast rights — all 64 games covered free.',
  },
  {
    country: 'United States',
    slug: 'united-states',
    broadcaster: 'Fox Sports, FS1, Telemundo',
    free: false,
    vpnNeeded: 'No VPN needed — use Fox Sports app or cable',
    notes: 'Fox has English rights, Telemundo has Spanish. Fox app free with TV login.',
  },
  {
    country: 'Canada',
    slug: 'canada',
    broadcaster: 'CTV (free) and TSN',
    free: true,
    vpnNeeded: 'Use a VPN set to Canada if abroad',
    notes: 'CTV streams select matches free. TSN has full coverage.',
  },
  {
    country: 'Germany',
    slug: 'germany',
    broadcaster: 'ZDF and ARD (both free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Germany if abroad',
    notes: 'ZDF and ARD share rights and both stream free online.',
  },
  {
    country: 'France',
    slug: 'france',
    broadcaster: 'TF1 (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to France if abroad',
    notes: 'TF1 streams all matches free via MYTF1 app.',
  },
  {
    country: 'Brazil',
    slug: 'brazil',
    broadcaster: 'Globo (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Brazil if abroad',
    notes: 'Globo streams free via GloboPlay.',
  },
  {
    country: 'Spain',
    slug: 'spain',
    broadcaster: 'RTVE (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Spain if abroad',
    notes: 'RTVE streams all matches free with no subscription.',
  },
  {
    country: 'Mexico',
    slug: 'mexico',
    broadcaster: 'Televisa and TV Azteca (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Mexico if abroad',
    notes: 'Both free broadcasters have full rights — co-host nation.',
  },
  {
    country: 'India',
    slug: 'india',
    broadcaster: 'JioTV (free with Jio SIM)',
    free: true,
    vpnNeeded: 'Use a VPN set to India if abroad',
    notes: 'JioTV streams free. Sports18 has paid cable rights.',
  },
  // Countries not in this array still get a page — generateCountryGuide() is called
  // for every entry in COUNTRIES_LIST during seeding. Entries here provide richer
  // broadcaster data; missing entries get a generic Claude-generated guide.
]

// Full list of country slugs to generate pages for
export const COUNTRIES_LIST = [
  'afghanistan', 'albania', 'algeria', 'argentina', 'armenia', 'australia',
  'austria', 'azerbaijan', 'bangladesh', 'belgium', 'bolivia', 'bosnia',
  'brazil', 'bulgaria', 'cameroon', 'canada', 'chile', 'china', 'colombia',
  'costa-rica', 'croatia', 'czech-republic', 'denmark', 'ecuador', 'egypt',
  'england', 'ethiopia', 'finland', 'france', 'germany', 'ghana', 'greece',
  'hungary', 'india', 'indonesia', 'iran', 'iraq', 'ireland', 'israel',
  'italy', 'jamaica', 'japan', 'jordan', 'kenya', 'malaysia', 'mexico',
  'morocco', 'netherlands', 'new-zealand', 'nigeria', 'norway', 'pakistan',
  'panama', 'peru', 'philippines', 'poland', 'portugal', 'romania', 'russia',
  'saudi-arabia', 'scotland', 'senegal', 'serbia', 'singapore', 'south-africa',
  'south-korea', 'spain', 'sweden', 'switzerland', 'thailand', 'turkey',
  'ukraine', 'united-arab-emirates', 'united-kingdom', 'united-states',
  'uruguay', 'venezuela', 'vietnam', 'wales',
]
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: affiliate config and country streaming data"
```

---

## Task 6: Content Generator

**Files:**
- Create: `lib/content-generator.ts`

- [ ] **Step 1: Create Claude-powered content generator**

Create `lib/content-generator.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Match, OddsSnapshot } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generatePreview(match: Match, odds: OddsSnapshot[]): Promise<{ title: string; body_md: string; meta_description: string }> {
  const oddsText = odds.length > 0
    ? odds.map(o => `${o.book_name}: Home ${o.home_price} / Draw ${o.draw_price} / Away ${o.away_price} | O/U ${o.over_line} (Over ${o.over_price} / Under ${o.under_price})`).join('\n')
    : 'Odds not yet available.'

  const kickoff = new Date(match.kickoff_time).toUTCString()

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Write a punchy 400-word World Cup 2026 match preview for ${match.home_team} vs ${match.away_team} (${match.stage}, kickoff ${kickoff}).

Current odds:
${oddsText}

Format: Markdown. Include H2 headings for "Key Storylines", "Form & Prediction", "How to Watch". End with a 1-sentence meta description on its own line prefixed with META: 

Tone: sharp, confident sports journalism. No fluff.`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `${match.home_team} vs ${match.away_team} World Cup 2026 preview, prediction and odds.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `${match.home_team} vs ${match.away_team} Preview — World Cup 2026`

  return { title, body_md, meta_description }
}

export async function generateRecap(match: Match): Promise<{ title: string; body_md: string; meta_description: string }> {
  const score = `${match.home_score}–${match.away_score}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Write a 300-word World Cup 2026 match recap for ${match.home_team} ${score} ${match.away_team}.

Format: Markdown. Include H2s for "Match Summary" and "What It Means". End with a 1-sentence meta description prefixed with META:

Tone: sharp post-match reporting. Keep it factual and punchy.`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `${match.home_team} ${score} ${match.away_team} — World Cup 2026 recap.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `${match.home_team} ${score} ${match.away_team} — World Cup 2026 Recap`

  return { title, body_md, meta_description }
}

export async function generateCountryGuide(country: string, broadcaster: string, free: boolean, vpnNote: string): Promise<{ title: string; body_md: string; meta_description: string }> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: `Write a 350-word guide: "How to watch World Cup 2026 in ${country}".

Facts: Official broadcaster: ${broadcaster}. Free to watch: ${free ? 'Yes' : 'No'}. VPN note: ${vpnNote}.

Format: Markdown. Include H2s for "Official Broadcaster", "How to Watch Free Online", "Watch From Abroad (VPN)". 
In the "Watch From Abroad" section, mention that a VPN lets fans access their home stream while travelling — position it naturally as a tool for travellers.

End with META: [one sentence for search snippet, include "World Cup 2026" and "${country}"]`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `How to watch World Cup 2026 in ${country} — free streams, TV channels and VPN guide.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `How to Watch World Cup 2026 in ${country} — Free Streams & TV Guide`

  return { title, body_md, meta_description }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: Claude-powered content generator for previews, recaps, country guides"
```

---

## Task 7: Cron Routes — Previews, Recaps, X Posts

**Files:**
- Create: `app/api/cron/generate-previews/route.ts`
- Create: `app/api/cron/generate-recaps/route.ts`
- Create: `app/api/cron/post-to-x/route.ts`

- [ ] **Step 1: Create generate-previews cron**

Create `app/api/cron/generate-previews/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePreview } from '@/lib/content-generator'
import type { Match, OddsSnapshot } from '@/types'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const start = new Date().toISOString()
  const end = tomorrow.toISOString()

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('status', 'SCHEDULED')
    .gte('kickoff_time', start)
    .lte('kickoff_time', end)
    .returns<Match[]>()

  if (!matches || matches.length === 0) return NextResponse.json({ generated: 0 })

  let generated = 0
  for (const match of matches) {
    const { data: existing } = await supabaseAdmin
      .from('content')
      .select('id')
      .eq('match_id', match.id)
      .eq('type', 'preview')
      .single()

    if (existing) continue

    const { data: odds } = await supabaseAdmin
      .from('odds_snapshots')
      .select('*')
      .eq('match_id', match.id)
      .order('snapshotted_at', { ascending: false })
      .limit(10)
      .returns<OddsSnapshot[]>()

    const content = await generatePreview(match, odds ?? [])
    await supabaseAdmin.from('content').insert({
      match_id: match.id,
      type: 'preview',
      slug: match.slug,
      ...content,
      published_at: new Date().toISOString(),
    })
    generated++
  }

  return NextResponse.json({ generated })
}
```

- [ ] **Step 2: Create generate-recaps cron**

Create `app/api/cron/generate-recaps/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateRecap } from '@/lib/content-generator'
import type { Match } from '@/types'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('status', 'FINISHED')
    .returns<Match[]>()

  if (!matches) return NextResponse.json({ generated: 0 })

  let generated = 0
  for (const match of matches) {
    const { data: existing } = await supabaseAdmin
      .from('content')
      .select('id')
      .eq('match_id', match.id)
      .eq('type', 'recap')
      .single()

    if (existing) continue

    const content = await generateRecap(match)
    await supabaseAdmin.from('content').insert({
      match_id: match.id,
      type: 'recap',
      slug: `${match.slug}-recap`,
      ...content,
      published_at: new Date().toISOString(),
    })

    // Queue an X post for this recap
    await supabaseAdmin.from('x_posts').insert({
      body: `FT: ${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} 🏆\n\nFull recap → kickoffpicks.com/matches/${match.slug}-recap`,
      status: 'pending',
    })

    generated++
  }

  return NextResponse.json({ generated })
}
```

- [ ] **Step 3: Create post-to-x cron stub**

Create `app/api/cron/post-to-x/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Full X API integration added in Task 11.
// This stub picks up pending posts and marks them — wiring to X API added later.
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabaseAdmin
    .from('x_posts')
    .select('*')
    .eq('status', 'pending')
    .limit(5)

  return NextResponse.json({ pending: pending?.length ?? 0, note: 'X API wiring added in Task 11' })
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: preview and recap generation crons, X post queue"
```

---

## Task 8: Core UI Components

**Files:**
- Create: `components/MatchCard.tsx`
- Create: `components/AffiliateBox.tsx`
- Create: `components/StandingsTable.tsx`
- Create: `components/OddsDisplay.tsx`

- [ ] **Step 1: MatchCard component**

Create `components/MatchCard.tsx`:

```tsx
import Link from 'next/link'
import type { Match } from '@/types'
import { format } from 'date-fns'

interface Props { match: Match }

export function MatchCard({ match }: Props) {
  const kickoff = format(new Date(match.kickoff_time), 'EEE d MMM, HH:mm z')
  const isFinished = match.status === 'FINISHED'
  const href = isFinished ? `/matches/${match.slug}-recap` : `/matches/${match.slug}`

  return (
    <Link href={href} className="block rounded-xl border border-gray-700 bg-gray-900 p-4 hover:border-green-500 transition-colors">
      <div className="text-xs text-gray-400 mb-2">{kickoff} · {match.stage.replace(/_/g, ' ')}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-white text-sm">{match.home_team}</span>
        <span className="text-gray-300 font-mono text-sm">
          {isFinished ? `${match.home_score} – ${match.away_score}` : 'vs'}
        </span>
        <span className="font-semibold text-white text-sm text-right">{match.away_team}</span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: AffiliateBox component**

Create `components/AffiliateBox.tsx`:

```tsx
import { VPN_AFFILIATES } from '@/data/affiliates'

export function AffiliateBox() {
  return (
    <div className="rounded-xl border border-green-700 bg-green-950 p-5 my-6">
      <p className="text-green-300 text-sm font-semibold mb-3">📺 Watch every match live — even from abroad</p>
      <div className="flex flex-col gap-2">
        {VPN_AFFILIATES.map(vpn => (
          <a
            key={vpn.name}
            href={vpn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-green-900 hover:bg-green-800 px-4 py-2 transition-colors"
          >
            <span className="text-white font-medium text-sm">{vpn.name}</span>
            <span className="text-green-300 text-xs">{vpn.badge} →</span>
          </a>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: OddsDisplay component**

Create `components/OddsDisplay.tsx`:

```tsx
import type { OddsSnapshot } from '@/types'

interface Props { odds: OddsSnapshot[] }

export function OddsDisplay({ odds }: Props) {
  if (odds.length === 0) return null
  const latest = odds.slice(0, 5)

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm text-gray-300 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 pr-4 text-gray-500">Book</th>
            <th className="text-center py-2 px-2">Home</th>
            <th className="text-center py-2 px-2">Draw</th>
            <th className="text-center py-2 px-2">Away</th>
            <th className="text-center py-2 px-2">O/U</th>
          </tr>
        </thead>
        <tbody>
          {latest.map(o => (
            <tr key={o.id} className="border-b border-gray-800">
              <td className="py-2 pr-4 text-white font-medium">{o.book_name}</td>
              <td className="text-center py-2 px-2 font-mono">{o.home_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono">{o.draw_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono">{o.away_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono text-xs">
                {o.over_line ? `${o.over_line} (${o.over_price}/${o.under_price})` : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: StandingsTable component**

Create `components/StandingsTable.tsx`:

```tsx
interface TeamRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

interface Props {
  group: string
  rows: TeamRow[]
}

export function StandingsTable({ group, rows }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-white font-bold mb-2">Group {group}</h3>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="border-b border-gray-700 text-gray-500 text-xs">
            <th className="text-left py-1">Team</th>
            <th className="text-center py-1">P</th>
            <th className="text-center py-1">W</th>
            <th className="text-center py-1">D</th>
            <th className="text-center py-1">L</th>
            <th className="text-center py-1">GD</th>
            <th className="text-center py-1 font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={`border-b border-gray-800 ${i < 2 ? 'text-white' : ''}`}>
              <td className="py-1">{r.team}</td>
              <td className="text-center py-1">{r.played}</td>
              <td className="text-center py-1">{r.won}</td>
              <td className="text-center py-1">{r.drawn}</td>
              <td className="text-center py-1">{r.lost}</td>
              <td className="text-center py-1">{r.gf - r.ga}</td>
              <td className="text-center py-1 font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: MatchCard, AffiliateBox, OddsDisplay, StandingsTable components"
```

---

## Task 9: Pages — Match, Country Guide, Money Pages

**Files:**
- Create: `app/matches/[slug]/page.tsx`
- Create: `app/watch/[country]/page.tsx`
- Create: `app/best-vpn-world-cup/page.tsx`
- Create: `app/stream-world-cup-free/page.tsx`

- [ ] **Step 1: Match preview/recap page**

Create `app/matches/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { supabase } from '@/lib/supabase'
import { AffiliateBox } from '@/components/AffiliateBox'
import { OddsDisplay } from '@/components/OddsDisplay'
import type { Content, OddsSnapshot } from '@/types'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data } = await supabase.from('content').select('title, meta_description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.title, description: data.meta_description }
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params

  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .single<Content>()

  if (!content) notFound()

  const { data: odds } = content.match_id
    ? await supabase
        .from('odds_snapshots')
        .select('*')
        .eq('match_id', content.match_id)
        .order('snapshotted_at', { ascending: false })
        .limit(10)
        .returns<OddsSnapshot[]>()
    : { data: [] }

  const bodyHtml = await marked(content.body_md)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">{content.title}</h1>
      <AffiliateBox />
      {odds && odds.length > 0 && <OddsDisplay odds={odds} />}
      <article
        className="prose prose-invert max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <div className="mt-8">
        <AffiliateBox />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Country guide page**

Create `app/watch/[country]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { supabase } from '@/lib/supabase'
import { COUNTRIES, COUNTRIES_LIST } from '@/data/countries'
import { AffiliateBox } from '@/components/AffiliateBox'
import type { Content } from '@/types'

interface Props { params: Promise<{ country: string }> }

export async function generateStaticParams() {
  return COUNTRIES_LIST.map(c => ({ country: c }))
}

export async function generateMetadata({ params }: Props) {
  const { country } = await params
  const { data } = await supabase.from('content').select('title, meta_description').eq('slug', `watch-${country}`).single()
  return data ? { title: data.title, description: data.meta_description } : {}
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params

  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('slug', `watch-${country}`)
    .single<Content>()

  const info = COUNTRIES.find(c => c.slug === country)

  if (!content && !info) notFound()

  const countryName = info?.country ?? country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const bodyHtml = content ? await marked(content.body_md) : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        How to Watch World Cup 2026 in {countryName}
      </h1>
      {info && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 mb-6">
          <p className="text-gray-300"><span className="text-white font-medium">Official broadcaster:</span> {info.broadcaster}</p>
          <p className="text-gray-300 mt-1"><span className="text-white font-medium">Free to watch:</span> {info.free ? '✅ Yes' : '❌ No (subscription required)'}</p>
        </div>
      )}
      <AffiliateBox />
      {bodyHtml && (
        <article
          className="prose prose-invert max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}
      <div className="mt-8"><AffiliateBox /></div>
    </main>
  )
}
```

- [ ] **Step 3: VPN money page**

Create `app/best-vpn-world-cup/page.tsx`:

```tsx
import { VPN_AFFILIATES } from '@/data/affiliates'

export const metadata = {
  title: 'Best VPN for World Cup 2026 — Watch Every Match From Anywhere',
  description: 'The best VPNs to watch World Cup 2026 from abroad. Compare NordVPN, ExpressVPN and Surfshark for speed, price and streaming performance.',
}

export default function BestVpnPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Best VPN for World Cup 2026</h1>
      <p className="text-gray-300 mb-6">
        Millions of fans will use a VPN to watch World Cup 2026 through their home broadcaster while travelling — or to access free streams from broadcasters like BBC, ITV, SBS, or ZDF from outside those countries.
      </p>
      <div className="flex flex-col gap-4">
        {VPN_AFFILIATES.map((vpn, i) => (
          <div key={vpn.name} className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-bold">{i + 1}. {vpn.name}</span>
              <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">{vpn.badge}</span>
            </div>
            <a
              href={vpn.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg py-2 transition-colors"
            >
              {vpn.cta}
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Streaming guide money page**

Create `app/stream-world-cup-free/page.tsx`:

```tsx
import Link from 'next/link'
import { COUNTRIES } from '@/data/countries'
import { AffiliateBox } from '@/components/AffiliateBox'

export const metadata = {
  title: 'How to Watch World Cup 2026 Free — Complete Streaming Guide',
  description: 'Watch every World Cup 2026 match free. Country-by-country guide to free official broadcasts, streaming links, and how to access them from anywhere.',
}

export default function StreamFreePage() {
  const freeCountries = COUNTRIES.filter(c => c.free)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Watch World Cup 2026 Free</h1>
      <AffiliateBox />
      <h2 className="text-lg font-semibold text-white mt-8 mb-4">Countries with free official streams</h2>
      <div className="grid grid-cols-2 gap-2">
        {freeCountries.map(c => (
          <Link
            key={c.slug}
            href={`/watch/${c.slug}`}
            className="rounded-lg border border-gray-700 bg-gray-900 p-3 hover:border-green-500 transition-colors"
          >
            <p className="text-white text-sm font-medium">{c.country}</p>
            <p className="text-gray-400 text-xs mt-0.5">{c.broadcaster}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: match, country guide, VPN money page, streaming guide page"
```

---

## Task 10: Homepage, Standings, Layout + AdSense

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/standings/page.tsx`

- [ ] **Step 1: Root layout with AdSense**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kickoff Picks — World Cup 2026 Predictions, Odds & Streaming Guides',
  description: 'World Cup 2026 match previews, live odds from every sportsbook, and guides to watch every game free from anywhere.',
}

const adClient = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {adClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-6">
            <Link href="/" className="text-white font-bold text-lg">⚽ Kickoff Picks</Link>
            <Link href="/standings" className="text-gray-400 hover:text-white text-sm">Standings</Link>
            <Link href="/best-vpn-world-cup" className="text-gray-400 hover:text-white text-sm">Watch Guide</Link>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800 mt-16 px-4 py-6 text-center text-gray-600 text-xs">
          <p>Kickoff Picks is an independent fan site. Affiliate links help support the site.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/best-vpn-world-cup" className="hover:text-gray-400">Best VPN</Link>
            <Link href="/stream-world-cup-free" className="hover:text-gray-400">Watch Free</Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Homepage**

Replace `app/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { MatchCard } from '@/components/MatchCard'
import Link from 'next/link'
import type { Match, Content } from '@/types'

export const revalidate = 300

export default async function HomePage() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 2)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .gte('kickoff_time', today.toISOString())
    .lte('kickoff_time', tomorrow.toISOString())
    .order('kickoff_time')
    .returns<Match[]>()

  const { data: articles } = await supabase
    .from('content')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(10)
    .returns<Content[]>()

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-1">World Cup 2026</h1>
      <p className="text-gray-400 mb-8">Live odds, predictions and streaming guides</p>

      {matches && matches.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-3">Today's Matches</h2>
          <div className="flex flex-col gap-2">
            {matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">Latest</h2>
        <div className="flex flex-col gap-2">
          {articles?.map(a => (
            <Link
              key={a.id}
              href={`/matches/${a.slug}`}
              className="block rounded-xl border border-gray-700 bg-gray-900 p-4 hover:border-green-500 transition-colors"
            >
              <p className="text-white font-medium text-sm">{a.title}</p>
              <p className="text-gray-400 text-xs mt-1">{a.meta_description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Watching from abroad?</h2>
        <Link href="/stream-world-cup-free" className="block rounded-xl border border-green-700 bg-green-950 p-4 hover:border-green-500 transition-colors">
          <p className="text-green-300 font-medium">📺 Free streaming guide — every country →</p>
        </Link>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Standings page**

Create `app/standings/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { StandingsTable } from '@/components/StandingsTable'
import type { Match } from '@/types'

export const revalidate = 300

export const metadata = {
  title: 'World Cup 2026 Group Standings',
  description: 'Live updated World Cup 2026 group standings and points tables.',
}

export default async function StandingsPage() {
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'FINISHED')
    .eq('stage', 'GROUP_STAGE')
    .returns<Match[]>()

  // Build standings from results
  const table: Record<string, Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }>> = {}

  for (const m of matches ?? []) {
    const g = m.group ?? 'A'
    if (!table[g]) table[g] = {}

    const addTeam = (team: string, gf: number, ga: number) => {
      if (!table[g][team]) table[g][team] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
      const r = table[g][team]
      r.played++; r.gf += gf; r.ga += ga
      if (gf > ga) { r.won++; r.points += 3 }
      else if (gf === ga) { r.drawn++; r.points++ }
      else r.lost++
    }

    if (m.home_score != null && m.away_score != null) {
      addTeam(m.home_team, m.home_score, m.away_score)
      addTeam(m.away_team, m.away_score, m.home_score)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Group Standings</h1>
      {Object.entries(table).sort().map(([group, teams]) => (
        <StandingsTable
          key={group}
          group={group}
          rows={Object.entries(teams)
            .map(([team, stats]) => ({ team, ...stats }))
            .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))}
        />
      ))}
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: homepage, standings, root layout with AdSense"
```

---

## Task 11: X (Twitter) Automation

**Files:**
- Modify: `app/api/cron/post-to-x/route.ts`

- [ ] **Step 1: Update post-to-x cron with real X API calls**

Replace `app/api/cron/post-to-x/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// X API v2 OAuth 1.0a tweet posting
async function postTweet(text: string): Promise<{ id: string } | null> {
  const oauth = buildOAuth('POST', 'https://api.twitter.com/2/tweets', {})
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: oauth,
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    console.error('X API error:', await res.text())
    return null
  }
  const data = await res.json()
  return data.data
}

function buildOAuth(method: string, url: string, _params: Record<string, string>): string {
  const key = process.env.X_API_KEY!
  const secret = process.env.X_API_SECRET!
  const token = process.env.X_ACCESS_TOKEN!
  const tokenSecret = process.env.X_ACCESS_SECRET!

  const nonce = Math.random().toString(36).substring(2)
  const ts = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: key,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: ts,
    oauth_token: token,
    oauth_version: '1.0',
  }

  const base = [method, encodeURIComponent(url), encodeURIComponent(
    Object.entries(oauthParams).sort().map(([k, v]) => `${k}=${v}`).join('&')
  )].join('&')

  const signingKey = `${encodeURIComponent(secret)}&${encodeURIComponent(tokenSecret)}`

  // Note: In production, use the 'crypto' module for HMAC-SHA1 signing.
  // For Vercel Edge/Node runtime:
  const crypto = require('crypto')
  const sig = crypto.createHmac('sha1', signingKey).update(base).digest('base64')

  oauthParams.oauth_signature = sig
  const header = 'OAuth ' + Object.entries(oauthParams).map(([k, v]) => `${k}="${encodeURIComponent(v)}"`).join(', ')
  return header
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabaseAdmin
    .from('x_posts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(3)

  if (!pending || pending.length === 0) return NextResponse.json({ posted: 0 })

  let posted = 0
  for (const post of pending) {
    const result = await postTweet(post.body)
    await supabaseAdmin
      .from('x_posts')
      .update({ status: result ? 'posted' : 'failed', posted_at: new Date().toISOString() })
      .eq('id', post.id)
    if (result) posted++
  }

  return NextResponse.json({ posted })
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: X Twitter automation cron with OAuth 1.0a"
```

---

## Task 12: Reddit Distribution Cron

**Files:**
- Create: `app/api/cron/post-to-reddit/route.ts`
- Modify: `vercel.json`

Reddit's API requires OAuth. This task uses a server-side Reddit app (free, no paid tier needed).

- [ ] **Step 1: Create a Reddit app**

Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → "create another app" → type: **script** → redirect URI: `http://localhost`. Save the client ID and secret.

Add to `.env.local`:
```
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_anonymous_account_username
REDDIT_PASSWORD=your_account_password
```

- [ ] **Step 2: Create Reddit posting cron**

Create `app/api/cron/post-to-reddit/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Match } from '@/types'

async function getRedditToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KickoffPicks/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!,
    }),
  })
  const data = await res.json()
  return data.access_token
}

async function submitPost(token: string, subreddit: string, title: string, text: string) {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KickoffPicks/1.0',
    },
    body: new URLSearchParams({ sr: subreddit, kind: 'self', title, text, resubmit: 'false' }),
  })
  return res.ok
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Post one daily preview thread to r/WorldCup
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .gte('kickoff_time', today.toISOString())
    .lte('kickoff_time', tomorrow.toISOString())
    .returns<Match[]>()

  if (!matches || matches.length === 0) return NextResponse.json({ posted: 0 })

  const matchList = matches.map(m => `- **${m.home_team}** vs **${m.away_team}**`).join('\n')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickoffpicks.com'

  const title = `World Cup 2026 — Match Day Thread: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
  const text = `Today's matches:\n\n${matchList}\n\nPreviews, predictions and live odds: ${siteUrl}\n\nWatch from abroad free: ${siteUrl}/stream-world-cup-free`

  const token = await getRedditToken()
  const posted = await submitPost(token, 'WorldCup', title, text)

  return NextResponse.json({ posted: posted ? 1 : 0 })
}
```

- [ ] **Step 3: Add Reddit cron to vercel.json**

Edit `vercel.json` — add to the `crons` array:

```json
{ "path": "/api/cron/post-to-reddit", "schedule": "0 8 * * *" }
```

- [ ] **Step 4: Add `NEXT_PUBLIC_SITE_URL` to env template**

Add to `.env.local.example`:
```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Reddit daily match thread distribution"
```

---

## Task 14: Seed Scripts + Initial Content

**Files:**
- Create: `scripts/seed-matches.ts`
- Create: `scripts/seed-country-pages.ts`

- [ ] **Step 1: Create match seeding script**

Create `scripts/seed-matches.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Trigger the sync-matches cron manually by calling football-data.org
  const res = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
  })
  const { matches } = await res.json()

  for (const m of matches) {
    const d = m.utcDate.split('T')[0]
    const h = m.homeTeam.name.toLowerCase().replace(/\s+/g, '-')
    const a = m.awayTeam.name.toLowerCase().replace(/\s+/g, '-')
    const slug = `${h}-vs-${a}-${d}`

    const { error } = await supabase.from('matches').upsert({
      external_id: m.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
      kickoff_time: m.utcDate,
      status: m.status,
      stage: m.stage,
      group: m.group,
      slug,
    }, { onConflict: 'external_id' })

    if (error) console.error(slug, error.message)
    else console.log('✓', slug)
  }

  console.log(`Seeded ${matches.length} matches`)
}

main()
```

- [ ] **Step 2: Create country pages seed script**

Create `scripts/seed-country-pages.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { COUNTRIES } from '../data/countries'
import { generateCountryGuide } from '../lib/content-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  for (const c of COUNTRIES) {
    const slug = `watch-${c.slug}`

    const { data: existing } = await supabase.from('content').select('id').eq('slug', slug).single()
    if (existing) { console.log('skip', c.country); continue }

    const content = await generateCountryGuide(c.country, c.broadcaster, c.free, c.vpnNeeded)

    const { error } = await supabase.from('content').insert({
      type: 'country-guide',
      slug,
      ...content,
      published_at: new Date().toISOString(),
    })

    if (error) console.error(c.country, error.message)
    else console.log('✓', c.country)

    // Rate limit: 1 request/second to stay within Haiku rate limits
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('Country pages seeded')
}

main()
```

- [ ] **Step 3: Add seed scripts to package.json**

Edit `package.json`, add to `"scripts"`:

```json
"seed:matches": "npx ts-node --project tsconfig.json scripts/seed-matches.ts",
"seed:countries": "npx ts-node --project tsconfig.json scripts/seed-country-pages.ts"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seed scripts for matches and country guide pages"
```

---

## Task 15: Vercel Deployment + Launch

- [ ] **Step 1: Copy env template and fill in values**

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` and keys from Supabase dashboard → Settings → API
- `FOOTBALL_DATA_API_KEY` from football-data.org
- `ODDS_API_KEY` from the-odds-api.com
- `ANTHROPIC_API_KEY` from console.anthropic.com
- `CRON_SECRET` — generate with: `openssl rand -hex 32`
- VPN affiliate URLs from NordVPN, ExpressVPN, Surfshark dashboards
- Leave `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` blank until AdSense approves

- [ ] **Step 2: Build and check for errors locally**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Push to GitHub and deploy to Vercel**

```bash
git remote add origin https://github.com/YOUR_USERNAME/kickoff-picks.git
git push -u origin main
```

Then in Vercel dashboard:
1. Import the `kickoff-picks` repo
2. Add all environment variables from `.env.local`
3. Click Deploy

- [ ] **Step 4: Seed the database**

```bash
npm run seed:matches
npm run seed:countries
```

Expected: All 104 matches and ~80 country pages inserted.

- [ ] **Step 5: Trigger first odds sync manually**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-site.vercel.app/api/cron/sync-odds
```

- [ ] **Step 6: Trigger first preview generation**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-site.vercel.app/api/cron/generate-previews
```

- [ ] **Step 7: Apply for Google AdSense**

Go to adsense.google.com → add site → submit for review. Takes 2–3 days. Add the publisher ID to Vercel env vars when approved.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: production deployment ready"
```

---

## Operator Setup Checklist (You Do This Once)

- [ ] Sign up at [football-data.org](https://www.football-data.org/client/register) — get free API key
- [ ] Sign up at [the-odds-api.com](https://the-odds-api.com/#get-access) — get free API key
- [ ] Sign up at [console.anthropic.com](https://console.anthropic.com) — get API key (add $5 credit)
- [ ] Join [NordVPN affiliate program](https://affiliates.nordvpn.com)
- [ ] Join [ExpressVPN affiliate program](https://www.expressvpn.com/affiliates)
- [ ] Join [Surfshark affiliate program](https://surfshark.com/affiliates)
- [ ] Create anonymous X account — get API keys from [developer.x.com](https://developer.x.com)
- [ ] Create [GitHub](https://github.com) account + [Vercel](https://vercel.com) account
- [ ] Apply for [Google AdSense](https://adsense.google.com) once site is live

**Hand Claude all the API keys and affiliate link URLs. That's it.**
