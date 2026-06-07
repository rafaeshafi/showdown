import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const res = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
  })
  const { matches } = await res.json()

  for (const m of matches) {
    if (!m.homeTeam?.name || !m.awayTeam?.name) continue
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
