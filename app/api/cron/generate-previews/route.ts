import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePreview } from '@/lib/content-generator'
import type { Match, OddsSnapshot } from '@/types'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lookahead = new Date()
  lookahead.setDate(lookahead.getDate() + 7)
  const start = new Date().toISOString()
  const end = lookahead.toISOString()

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
