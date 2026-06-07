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

    await supabaseAdmin.from('x_posts').insert({
      body: `FT: ${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} 🏆\n\nFull recap → kickoffpicks.com/matches/${match.slug}-recap`,
      status: 'pending',
    })

    generated++
  }

  return NextResponse.json({ generated })
}
