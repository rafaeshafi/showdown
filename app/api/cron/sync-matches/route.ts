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
