import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { COUNTRIES_LIST } from '@/data/countries'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://showdown.vercel.app'
  const now = new Date().toISOString()

  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/standings`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/best-vpn-world-cup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/stream-world-cup-free`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]

  // Country pages
  const countries: MetadataRoute.Sitemap = COUNTRIES_LIST.map(slug => ({
    url: `${base}/watch/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Match pages (published previews only)
  const { data: content } = await supabase
    .from('content')
    .select('slug, published_at')
    .eq('type', 'preview')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const matches: MetadataRoute.Sitemap = (content ?? []).map(c => ({
    url: `${base}/matches/${c.slug}`,
    lastModified: c.published_at ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...statics, ...countries, ...matches]
}
