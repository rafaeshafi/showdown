import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

const adClient = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

export const metadata: Metadata = {
  title: 'Showdown — World Cup 2026 Predictions, Odds & Streaming Guides',
  metadataBase: new URL('https://showdown.vercel.app'),
  description: 'World Cup 2026 match previews, live odds from every sportsbook, and guides to watch every game free from anywhere.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6004755636683447" />
        {adClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-6">
            <Link href="/" className="text-white font-bold text-lg">⚽ Showdown</Link>
            <Link href="/standings" className="text-gray-400 hover:text-white text-sm">Standings</Link>
            <Link href="/best-vpn-world-cup" className="text-gray-400 hover:text-white text-sm">Watch Guide</Link>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800 mt-16 px-4 py-6 text-center text-gray-600 text-xs">
          <p>Showdown is an independent fan site. Affiliate links help support the site.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/best-vpn-world-cup" className="hover:text-gray-400">Best VPN</Link>
            <Link href="/stream-world-cup-free" className="hover:text-gray-400">Watch Free</Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
