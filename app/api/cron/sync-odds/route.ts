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
