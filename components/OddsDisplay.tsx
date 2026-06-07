import type { OddsSnapshot } from '@/types'

interface Props { odds: OddsSnapshot[] }

export function OddsDisplay({ odds }: Props) {
  if (odds.length === 0) return null
  const latest = odds.slice(0, 5)

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm text-gray-300 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 pr-4 text-gray-500">Book</th>
            <th className="text-center py-2 px-2">Home</th>
            <th className="text-center py-2 px-2">Draw</th>
            <th className="text-center py-2 px-2">Away</th>
            <th className="text-center py-2 px-2">O/U</th>
          </tr>
        </thead>
        <tbody>
          {latest.map(o => (
            <tr key={o.id} className="border-b border-gray-800">
              <td className="py-2 pr-4 text-white font-medium">{o.book_name}</td>
              <td className="text-center py-2 px-2 font-mono">{o.home_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono">{o.draw_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono">{o.away_price ?? '–'}</td>
              <td className="text-center py-2 px-2 font-mono text-xs">
                {o.over_line ? `${o.over_line} (${o.over_price}/${o.under_price})` : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
