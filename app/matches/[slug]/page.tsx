import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { supabase } from '@/lib/supabase'
import { AffiliateBox } from '@/components/AffiliateBox'
import { OddsDisplay } from '@/components/OddsDisplay'
import type { Content, OddsSnapshot } from '@/types'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data } = await supabase.from('content').select('title, meta_description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.title, description: data.meta_description }
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params

  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .single<Content>()

  if (!content) notFound()

  const { data: odds } = content.match_id
    ? await supabase
        .from('odds_snapshots')
        .select('*')
        .eq('match_id', content.match_id)
        .order('snapshotted_at', { ascending: false })
        .limit(10)
        .returns<OddsSnapshot[]>()
    : { data: [] }

  const bodyHtml = await marked(content.body_md)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">{content.title}</h1>
      <AffiliateBox />
      {odds && odds.length > 0 && <OddsDisplay odds={odds} />}
      <article
        className="prose prose-invert max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <div className="mt-8">
        <AffiliateBox />
      </div>
    </main>
  )
}
