import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { COUNTRIES } from '../data/countries'
import { generateCountryGuide } from '../lib/content-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  for (const c of COUNTRIES) {
    const slug = `watch-${c.slug}`

    const { data: existing } = await supabase.from('content').select('id').eq('slug', slug).single()
    if (existing) { console.log('skip', c.country); continue }

    const content = await generateCountryGuide(c.country, c.broadcaster, c.free, c.vpnNeeded)

    const { error } = await supabase.from('content').insert({
      type: 'country-guide',
      slug,
      ...content,
      published_at: new Date().toISOString(),
    })

    if (error) console.error(c.country, error.message)
    else console.log('✓', c.country)

    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('Country pages seeded')
}

main()
