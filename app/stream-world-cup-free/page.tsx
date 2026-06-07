import Link from 'next/link'
import { COUNTRIES } from '@/data/countries'
import { AffiliateBox } from '@/components/AffiliateBox'

export const metadata = {
  title: 'How to Watch World Cup 2026 Free — Complete Streaming Guide',
  description: 'Watch every World Cup 2026 match free. Country-by-country guide to free official broadcasts, streaming links, and how to access them from anywhere.',
}

export default function StreamFreePage() {
  const freeCountries = COUNTRIES.filter(c => c.free)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Watch World Cup 2026 Free</h1>
      <AffiliateBox />
      <h2 className="text-lg font-semibold text-white mt-8 mb-4">Countries with free official streams</h2>
      <div className="grid grid-cols-2 gap-2">
        {freeCountries.map(c => (
          <Link
            key={c.slug}
            href={`/watch/${c.slug}`}
            className="rounded-lg border border-gray-700 bg-gray-900 p-3 hover:border-green-500 transition-colors"
          >
            <p className="text-white text-sm font-medium">{c.country}</p>
            <p className="text-gray-400 text-xs mt-0.5">{c.broadcaster}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
