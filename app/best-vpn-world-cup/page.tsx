import { VPN_AFFILIATES } from '@/data/affiliates'

export const metadata = {
  title: 'Best VPN for World Cup 2026 — Watch Every Match From Anywhere',
  description: 'The best VPNs to watch World Cup 2026 from abroad. Compare NordVPN, ExpressVPN and Surfshark for speed, price and streaming performance.',
}

export default function BestVpnPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Best VPN for World Cup 2026</h1>
      <p className="text-gray-300 mb-6">
        Millions of fans will use a VPN to watch World Cup 2026 through their home broadcaster while travelling — or to access free streams from broadcasters like BBC, ITV, SBS, or ZDF from outside those countries.
      </p>
      <div className="flex flex-col gap-4">
        {VPN_AFFILIATES.map((vpn, i) => (
          <div key={vpn.name} className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-bold">{i + 1}. {vpn.name}</span>
              <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">{vpn.badge}</span>
            </div>
            <a
              href={vpn.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg py-2 transition-colors"
            >
              {vpn.cta}
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
