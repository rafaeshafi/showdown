interface TeamRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

interface Props {
  group: string
  rows: TeamRow[]
}

export function StandingsTable({ group, rows }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-white font-bold mb-2">Group {group}</h3>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="border-b border-gray-700 text-gray-500 text-xs">
            <th className="text-left py-1">Team</th>
            <th className="text-center py-1">P</th>
            <th className="text-center py-1">W</th>
            <th className="text-center py-1">D</th>
            <th className="text-center py-1">L</th>
            <th className="text-center py-1">GD</th>
            <th className="text-center py-1 font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={`border-b border-gray-800 ${i < 2 ? 'text-white' : ''}`}>
              <td className="py-1">{r.team}</td>
              <td className="text-center py-1">{r.played}</td>
              <td className="text-center py-1">{r.won}</td>
              <td className="text-center py-1">{r.drawn}</td>
              <td className="text-center py-1">{r.lost}</td>
              <td className="text-center py-1">{r.gf - r.ga}</td>
              <td className="text-center py-1 font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
