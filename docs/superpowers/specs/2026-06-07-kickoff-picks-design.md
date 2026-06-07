# Kickoff Picks — Design Spec
**Date:** 2026-06-07  
**Status:** Approved  
**Context:** 2026 FIFA World Cup (Jun 11 – Jul 19). Zero-cost build, non-technical operator, Claude Code builds everything.

---

## What It Is

A peer-to-peer play-money betting exchange for the World Cup. Users post prop bets into a marketplace and other users take the opposite side. No house. No sportsbook. Pure peer-to-peer, anchored to real sportsbook lines.

Everyone starts with 10,000 coins. Coins are locked in escrow when a bet is matched. Results auto-settle from live match data. A leaderboard tracks group standings.

---

## Core Mechanic

1. User browses upcoming matches and their real-time sportsbook odds
2. User posts a bet: picks a prop → picks a side (Over/Under, Yes/No, Team) → sets a coin amount
3. Bet sits as **open** in the marketplace
4. Another user sees it and clicks "Take it" — locking in the opposite side
5. Both players' coins go into escrow
6. Match concludes → result auto-fetched from API → winner receives the full pot

---

## Features (MVP)

### Auth & Groups
- Email magic-link auth (no password)
- Create a private group → shareable invite link
- Join a group via code or link
- Global marketplace + group-filtered view

### Odds Data Layer
- Background job polls **The Odds API** (free tier) every 3-4 hours
- Fetches lines from DraftKings, FanDuel, BetMGM, Caesars, BetRivers for every World Cup match
- Caches to database; displays consensus line + per-book breakdown
- Stores timestamped snapshots for line movement history
- Designed to stay within 500 free requests for the full tournament

### Prop Menu (sourced from real sportsbooks)
| Category | Props | Data Source |
|---|---|---|
| Match | Moneyline, O/U goals, Both teams to score, Correct score, Draw no bet | The Odds API (free) |
| Team | O/U corners, O/U cards, First team to score, Clean sheet | The Odds API (free) |
| Player | Anytime scorer, First scorer, O/U shots, O/U tackles, Card props | The Odds API (may require paid tier for some markets — fallback: manual entry) |
| Tournament | Golden Boot, Champion, Top scorer by group | Manual lines at tournament start; settle on Jul 19 |

### Bet Marketplace
- Feed of open (unmatched) bets, filterable by match / prop type / coin range
- Post a bet: prop selector → side → coin amount → confirm
- Take a bet: one-click, coins deducted from balance, status → matched
- Bet card shows: prop, both sides, coin amount, creator name, time posted
- Line movement indicator (up/down arrow + magnitude since last poll)

### Escrow & Settlement
- On match: both players' coins deducted, held in `bets.escrow`
- On result: winning side receives `amount * 2`, loser receives 0
- Draws / incomplete props: full refund to both parties
- Settlement runs automatically via Vercel Cron job after match ends

### Leaderboard
- Group leaderboard: coins, W/L record, win rate, biggest single win
- All-time tab + weekly tab
- "Sharpest pick" badge for the user with highest win rate (min 10 bets)

### Line Movement Tracker
- Tap any prop → view 24h odds history chart
- Shows which books moved first
- Shows open bet volume on Kickoff Picks vs. line direction

---

## Data Models

```
users         id, email, display_name, coin_balance, group_id, created_at
groups        id, name, invite_code, created_by, created_at
matches       id, home_team, away_team, kickoff_time, status, home_score, away_score
props         id, match_id, type, line, description
odds_snapshots  id, prop_id, book_name, over_price, under_price, snapshotted_at
bets          id, prop_id, creator_id, taker_id, creator_side, amount, status, settled_at
```

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend + API routes | Next.js 14 (App Router) | Free |
| Hosting + Cron | Vercel | Free |
| Database + Auth + Realtime | Supabase (free tier) | Free |
| Match data & results | football-data.org API | Free |
| Live odds (20+ books) | The Odds API | Free tier |
| Design / logo / assets | Canva MCP | Already connected |

**Total infrastructure cost: $0**

---

## Pages / Routes

| Route | Description |
|---|---|
| `/` | Landing — join or create group |
| `/group/[code]` | Group home — leaderboard + active bets feed |
| `/market` | Full open bets marketplace |
| `/matches` | Upcoming matches with odds cards |
| `/matches/[id]` | Match detail — all props + line movement |
| `/bet/new` | Post a bet wizard |
| `/profile` | My bets (open, matched, settled) + P&L |

---

## Monetization Roadmap

| Phase | Timing | Mechanic |
|---|---|---|
| Free | Now | Build users, validate engagement |
| Kickoff Pro | Month 2 | $4.99/mo — custom prop creation, advanced stats, no ads |
| Real-money pools | Month 6+ | Sweepstakes mechanic or licensed partner API |
| Multi-sport | Post-WC | Same engine for NFL, Champions League, NBA |

---

## Out of Scope (MVP)

- Real money / fiat payments
- Mobile app (iOS/Android) — web-first, mobile-responsive
- Live in-play betting
- Chat / messaging
- Push notifications (Phase 2)
