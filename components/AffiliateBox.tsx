import { VPN_AFFILIATES } from '@/data/affiliates'

export function AffiliateBox() {
  return (
    <div className="rounded-xl border border-green-700 bg-green-950 p-5 my-6">
      <p className="text-green-300 text-sm font-semibold mb-3">📺 Watch every match live — even from abroad</p>
      <div className="flex flex-col gap-2">
        {VPN_AFFILIATES.map(vpn => (
          <a
            key={vpn.name}
            href={vpn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-green-900 hover:bg-green-800 px-4 py-2 transition-colors"
          >
            <span className="text-white font-medium text-sm">{vpn.name}</span>
            <span className="text-green-300 text-xs">{vpn.badge} →</span>
          </a>
        ))}
      </div>
    </div>
  )
}
