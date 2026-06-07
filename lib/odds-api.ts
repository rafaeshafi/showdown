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
