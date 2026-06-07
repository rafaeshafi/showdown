# Faceless World Cup Media Machine — Design Spec
**Date:** 2026-06-07  
**Status:** Approved  
**Context:** 2026 FIFA World Cup (Jun 11 – Jul 19, 38 days). Zero cost, zero operator involvement after setup, fully automated by Claude Code. Completely faceless — no personal brand.

---

## What It Is

A fully automated, faceless content and affiliate operation targeting World Cup 2026 traffic. Three components run in parallel: an SEO affiliate site, an X (Twitter) automation account, and Reddit distribution. Claude Code builds, deploys, writes, and publishes everything. The operator signs up for affiliate programs and hands over API keys — that is the full extent of their involvement.

---

## Components

### 1. SEO Affiliate Site (Primary Revenue Engine)

A Next.js site deployed on Vercel (free tier). Claude generates and publishes new content automatically every day via a scheduled Vercel Cron job.

**Content Claude auto-publishes:**

| Page Type | Trigger | Affiliate Angle |
|---|---|---|
| "How to watch World Cup in [country]" | One-time at launch, one per country | VPN affiliate links |
| Match preview | Morning of each match | Odds links, betting affiliate |
| Match recap | 30 min after final whistle | Next-match preview links |
| Live standings + bracket | Updated after every result | Internal links to previews |
| "Best VPN for World Cup 2026" | Evergreen, published day 1 | Primary VPN affiliate page |
| "Where to stream every World Cup match free" | Evergreen, published day 1 | VPN + streaming affiliates |

**Affiliate programs (operator signs up once, ~30 min):**

| Program | Commission | Notes |
|---|---|---|
| NordVPN | $40–80/signup | Highest volume VPN affiliate |
| ExpressVPN | $36/signup | |
| Surfshark | $35/signup | |
| DraftKings affiliate | $50–200/qualified signup | US only, check state rules |
| Amazon Associates | 3–8% on merch | World Cup jerseys, scarves, etc. |

**Ads:** Google AdSense applied once the site is live with at least 10 published pages (approval typically 2–3 days after that). Injected automatically into all page layouts via a layout wrapper — ads activate as soon as the AdSense code is added, no site rebuild needed.

**Data sources (all free):**
- `football-data.org` — match schedule, results, standings
- The Odds API — pre-match odds for preview pages

**SEO targeting:**
- Primary: "[country] World Cup 2026 stream", "watch World Cup free [country]"
- Secondary: "[team] vs [team] prediction", "World Cup 2026 odds"
- Long-tail: "how to watch World Cup in [country] without cable"

---

### 2. X (Twitter) Automation (Audience Growth + Ad Revenue)

A new anonymous X account. Claude auto-posts 8–10 times/day using the `ecc-x-api` skill via a scheduled job.

**Post types and cadence:**

| Type | When | Volume |
|---|---|---|
| Pre-match prediction + odds | 2h before kickoff | Per match |
| Live score update | During match (halftime + FT) | Per match |
| Post-match hot take + stats | 15 min after FT | Per match |
| Line movement alert | When odds shift >10% | As triggered |
| Poll ("Who wins X vs Y?") | Day before each match | 1/day |
| "Thread: How to watch today's games free" | Match days | Links to site |
| Off-day stat/trivia post | Non-match days | 2/day |

**Monetization path:** X ad revenue sharing requires 500 followers + 5M impressions within 90 days. World Cup content with polls and live updates has a realistic shot at this threshold. Site affiliate links included in relevant posts.

---

### 3. Reddit Distribution (Traffic Driver)

Claude posts original value-add content in World Cup communities. No spam — substantive posts that naturally drive traffic to the site.

**Target subreddits:** r/WorldCup, r/soccer, r/soccerbetting, r/fantasyfootball, r/povertyfinance (for "watch free" content)

**Post types:**
- Pre-tournament: "Full guide to watching every World Cup 2026 match for free" → links to site
- Match days: Prediction threads, odds breakdowns
- Post-match: Stat summaries with site link for full recap

---

## Technical Architecture

```
football-data.org API  ──┐
The Odds API           ──┼──▶  Vercel Cron Job (every 3h)
                          │         │
                          │    Supabase DB ◀── stores matches, odds, content
                          │         │
                          └──▶  Next.js site (Vercel, free)
                                    │
                          ┌─────────┼─────────┐
                          ▼         ▼         ▼
                      Site pages  X posts  Reddit posts
                     (auto-pub)  (ecc-x-api) (Claude)
```

### Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend + API routes + Cron | Next.js 14 + Vercel | Free |
| Database | Supabase free tier | Free |
| Auth (admin only) | Supabase magic link | Free |
| Match data + results | football-data.org | Free |
| Live odds | The Odds API | Free tier (500 req/mo) |
| X posting | ecc-x-api skill | Existing |
| Graphics (site + X) | Canva MCP | Already connected |
| Ads | Google AdSense | Free |

**Total monthly cost: $0**

---

## Data Models

```
matches       id, home_team, away_team, kickoff_time, status, home_score, away_score, stage
odds          id, match_id, book_name, market, home_price, draw_price, away_price, total_line, snapshotted_at
content       id, match_id, type (preview|recap|country-guide), slug, body_md, published_at, affiliate_links_injected
posts         id, platform (x|reddit), content_id, body, posted_at, status
```

---

## Automation Jobs

| Job | Schedule | Action |
|---|---|---|
| `sync-matches` | Every 3h | Pull upcoming + completed matches from football-data.org |
| `sync-odds` | Every 4h | Pull odds from The Odds API, store snapshot |
| `generate-previews` | Daily 6am | Claude generates preview for each match that day |
| `generate-recaps` | 30 min after FT | Claude generates recap using final score + stats |
| `post-to-x` | Per trigger | Posts scheduled X content |
| `post-to-reddit` | Daily | Posts one substantive Reddit thread |
| `update-standings` | After each result | Regenerates standings + bracket pages |

---

## Pages / Routes

| Route | Content |
|---|---|
| `/` | Tournament hub — today's matches, standings, top articles |
| `/watch/[country]` | Country-specific streaming guide (220+ pages) |
| `/best-vpn-world-cup` | Evergreen VPN money page |
| `/stream-world-cup-free` | Evergreen streaming guide |
| `/matches/[slug]` | Match preview or recap |
| `/standings` | Live group standings |
| `/bracket` | Live knockout bracket |

---

## Operator Setup Checklist (One-Time, ~1 Hour)

- [ ] Create GitHub account + connect to Vercel (free)
- [ ] Sign up for NordVPN affiliate program
- [ ] Sign up for ExpressVPN affiliate program  
- [ ] Sign up for Surfshark affiliate program
- [ ] Sign up for DraftKings affiliate (if in eligible US state)
- [ ] Sign up for Amazon Associates
- [ ] Apply for Google AdSense
- [ ] Create anonymous X account
- [ ] Obtain: football-data.org API key (free), The Odds API key (free), X API key

Hand Claude the affiliate link codes + API keys. Done.

---

## Revenue Projection

| Stream | Basis | Conservative | Optimistic |
|---|---|---|---|
| VPN affiliates | Organic search traffic | $1,500 | $6,000+ |
| Betting affiliates | US search traffic | $800 | $3,000+ |
| AdSense | 2–5K pageviews/day | $150 | $500 |
| X ad revenue | Follower growth | $0–50 | $200–500 |
| **Total** | | **~$2,500** | **$9,500+** |

Variance is almost entirely driven by how fast the country-guide pages rank on Google. VPN affiliate pages for "[country] World Cup stream" convert extremely well — these are high-intent queries from people who have already decided they want to watch.

---

## Out of Scope (Now)

- YouTube automation (copyright risk on highlight content)
- TikTok (video generation adds complexity, Phase 2)
- Newsletter (lower priority than search + social)
- Real-time live score widget (API rate limits)
- Paid traffic / ads spend
