import { supabase } from '@/lib/supabase'
import { MatchCard } from '@/components/MatchCard'
import Link from 'next/link'
import type { Match, Content } from '@/types'

export const revalidate = 300

export default async function HomePage() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 2)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .gte('kickoff_time', today.toISOString())
    .lte('kickoff_time', tomorrow.toISOString())
    .order('kickoff_time')
    .returns<Match[]>()

  const { data: articles } = await supabase
    .from('content')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(10)
    .returns<Content[]>()

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-1">World Cup 2026</h1>
      <p className="text-gray-400 mb-8">Live odds, predictions and streaming guides</p>

      {matches && matches.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-3">Today's Matches</h2>
          <div className="flex flex-col gap-2">
            {matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">Latest</h2>
        <div className="flex flex-col gap-2">
          {articles?.map(a => (
            <Link
              key={a.id}
              href={`/matches/${a.slug}`}
              className="block rounded-xl border border-gray-700 bg-gray-900 p-4 hover:border-green-500 transition-colors"
            >
              <p className="text-white font-medium text-sm">{a.title}</p>
              <p className="text-gray-400 text-xs mt-1">{a.meta_description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Watching from abroad?</h2>
        <Link href="/stream-world-cup-free" className="block rounded-xl border border-green-700 bg-green-950 p-4 hover:border-green-500 transition-colors">
          <p className="text-green-300 font-medium">📺 Free streaming guide — every country →</p>
        </Link>
      </section>
    </main>
  )
}
