import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { supabase } from '@/lib/supabase'
import { COUNTRIES, COUNTRIES_LIST } from '@/data/countries'
import { AffiliateBox } from '@/components/AffiliateBox'
import type { Content } from '@/types'

interface Props { params: Promise<{ country: string }> }

export async function generateStaticParams() {
  return COUNTRIES_LIST.map(c => ({ country: c }))
}

export async function generateMetadata({ params }: Props) {
  const { country } = await params
  const { data } = await supabase.from('content').select('title, meta_description').eq('slug', `watch-${country}`).single()
  return data ? { title: data.title, description: data.meta_description } : {}
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params

  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('slug', `watch-${country}`)
    .single<Content>()

  const info = COUNTRIES.find(c => c.slug === country)

  if (!content && !info) notFound()

  const countryName = info?.country ?? country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const bodyHtml = content ? await marked(content.body_md) : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        How to Watch World Cup 2026 in {countryName}
      </h1>
      {info && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 mb-6">
          <p className="text-gray-300"><span className="text-white font-medium">Official broadcaster:</span> {info.broadcaster}</p>
          <p className="text-gray-300 mt-1"><span className="text-white font-medium">Free to watch:</span> {info.free ? '✅ Yes' : '❌ No (subscription required)'}</p>
        </div>
      )}
      <AffiliateBox />
      {bodyHtml && (
        <article
          className="prose prose-invert max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}
      <div className="mt-8"><AffiliateBox /></div>
    </main>
  )
}
