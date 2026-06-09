import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { generatePreview } from '../lib/content-generator'
import type { Match, OddsSnapshot } from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Seed previews for entire remaining group stage (through June 27)
  const lookahead = new Date()
  lookahead.setDate(lookahead.getDate() + 21)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['SCHEDULED', 'TIMED'])
    .gte('kickoff_time', new Date().toISOString())
    .lte('kickoff_time', lookahead.toISOString())
    .order('kickoff_time', { ascending: true })
    .returns<Match[]>()

  if (!matches?.length) {
    console.log('No upcoming matches in lookahead window')
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
      const { error } = await supabase.from('content').insert({
        match_id: match.id,
        type: 'preview',
        slug: match.slug,
        title: content.title,
        body_md: content.body_md,
        meta_description: content.meta_description,
        published_at: new Date().toISOString(),
      })
      if (error) throw new Error(error.message)
      console.log(`✓ ${match.slug}`)
      generated++
    } catch (e) {
      console.log(`✗ ${match.slug}:`, (e as Error).message)
    }
  }

  console.log(`Generated ${generated} previews`)
}

main().catch(console.error)
