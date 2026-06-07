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
