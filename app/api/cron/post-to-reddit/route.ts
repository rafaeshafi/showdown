import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Match } from '@/types'

async function getRedditToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KickoffPicks/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!,
    }),
  })
  const data = await res.json()
  return data.access_token
}

async function submitPost(token: string, subreddit: string, title: string, text: string): Promise<boolean> {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'KickoffPicks/1.0',
    },
    body: new URLSearchParams({ sr: subreddit, kind: 'self', title, text, resubmit: 'false' }),
  })
  return res.ok
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .gte('kickoff_time', today.toISOString())
    .lte('kickoff_time', tomorrow.toISOString())
    .returns<Match[]>()

  if (!matches || matches.length === 0) return NextResponse.json({ posted: 0 })

  const matchList = matches.map(m => `- **${m.home_team}** vs **${m.away_team}**`).join('\n')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickoffpicks.com'

  const title = `World Cup 2026 — Match Day Thread: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })}`
  const text = `Today's matches:\n\n${matchList}\n\nPreviews, predictions and live odds: ${siteUrl}\n\nWatch from abroad free: ${siteUrl}/stream-world-cup-free`

  const token = await getRedditToken()
  const posted = await submitPost(token, 'WorldCup', title, text)

  return NextResponse.json({ posted: posted ? 1 : 0 })
}
