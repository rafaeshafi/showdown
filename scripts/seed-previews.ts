import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Match, OddsSnapshot } from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function generatePreview(match: Match, odds: OddsSnapshot[]) {
  const oddsText = odds.length
    ? `Home win: ${odds[0].home_price ?? '?'}, Draw: ${odds[0].draw_price ?? '?'}, Away win: ${odds[0].away_price ?? '?'}`
    : 'Odds not yet available'

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write a 300-word World Cup 2026 match preview for ${match.home_team} vs ${match.away_team} on ${match.kickoff_time?.split('T')[0]}.
Odds: ${oddsText}
Group: ${match.group ?? 'TBD'}

Return JSON exactly like:
{"title": "...", "body": "...", "meta_description": "..."}`,
      },
    ],
  })

  const text = (msg.content[0] as { type: string; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0]) as { title: string; body: string; meta_description: string }
}

async function main() {
  const lookahead = new Date()
  lookahead.setDate(lookahead.getDate() + 7)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['SCHEDULED', 'TIMED'])
    .gte('kickoff_time', new Date().toISOString())
    .lte('kickoff_time', lookahead.toISOString())
    .returns<Match[]>()

  if (!matches?.length) {
    console.log('No upcoming matches in next 7 days')
    return
  }

  console.log(`Found ${matches.length} upcoming matches`)
  let generated = 0

  for (const match of matches) {
    const { data: existing } = await supabase
      .from('content')
      .select('id')
      .eq('match_id', match.id)
      .eq('type', 'preview')
      .single()

    if (existing) {
      console.log(`skip ${match.slug}`)
      continue
    }

    const { data: odds } = await supabase
      .from('odds_snapshots')
      .select('*')
      .eq('match_id', match.id)
      .order('snapshotted_at', { ascending: false })
      .limit(10)
      .returns<OddsSnapshot[]>()

    try {
      const content = await generatePreview(match, odds ?? [])
      await supabase.from('content').insert({
        match_id: match.id,
        type: 'preview',
        slug: match.slug,
        ...content,
        published_at: new Date().toISOString(),
      })
      console.log(`✓ ${match.slug}`)
      generated++
    } catch (e) {
      console.log(`✗ ${match.slug}:`, (e as Error).message)
    }
  }

  console.log(`Generated ${generated} previews`)
}

main().catch(console.error)
