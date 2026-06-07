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
