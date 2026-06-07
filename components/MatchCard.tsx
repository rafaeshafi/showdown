import Link from 'next/link'
import type { Match } from '@/types'
import { format } from 'date-fns'

interface Props { match: Match }

export function MatchCard({ match }: Props) {
  const kickoff = format(new Date(match.kickoff_time), 'EEE d MMM, HH:mm z')
  const isFinished = match.status === 'FINISHED'
  const href = isFinished ? `/matches/${match.slug}-recap` : `/matches/${match.slug}`

  return (
    <Link href={href} className="block rounded-xl border border-gray-700 bg-gray-900 p-4 hover:border-green-500 transition-colors">
      <div className="text-xs text-gray-400 mb-2">{kickoff} · {match.stage.replace(/_/g, ' ')}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-white text-sm">{match.home_team}</span>
        <span className="text-gray-300 font-mono text-sm">
          {isFinished ? `${match.home_score} – ${match.away_score}` : 'vs'}
        </span>
        <span className="font-semibold text-white text-sm text-right">{match.away_team}</span>
      </div>
    </Link>
  )
}
