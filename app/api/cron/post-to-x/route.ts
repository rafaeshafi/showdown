import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHmac } from 'crypto'

async function postTweet(text: string): Promise<{ id: string } | null> {
  const oauth = buildOAuth('POST', 'https://api.twitter.com/2/tweets')
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: oauth,
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    console.error('X API error:', await res.text())
    return null
  }
  const data = await res.json()
  return data.data
}

function buildOAuth(method: string, url: string): string {
  const key = process.env.X_API_KEY!
  const secret = process.env.X_API_SECRET!
  const token = process.env.X_ACCESS_TOKEN!
  const tokenSecret = process.env.X_ACCESS_SECRET!

  const nonce = Math.random().toString(36).substring(2)
  const ts = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: key,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: ts,
    oauth_token: token,
    oauth_version: '1.0',
  }

  const base = [
    method,
    encodeURIComponent(url),
    encodeURIComponent(
      Object.entries(oauthParams)
        .sort()
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
    ),
  ].join('&')

  const signingKey = `${encodeURIComponent(secret)}&${encodeURIComponent(tokenSecret)}`
  const sig = createHmac('sha1', signingKey).update(base).digest('base64')

  oauthParams.oauth_signature = sig
  const header =
    'OAuth ' +
    Object.entries(oauthParams)
      .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
      .join(', ')
  return header
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabaseAdmin
    .from('x_posts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(3)

  if (!pending || pending.length === 0) return NextResponse.json({ posted: 0 })

  let posted = 0
  for (const post of pending) {
    const result = await postTweet(post.body)
    await supabaseAdmin
      .from('x_posts')
      .update({
        status: result ? 'posted' : 'failed',
        posted_at: new Date().toISOString(),
      })
      .eq('id', post.id)
    if (result) posted++
  }

  return NextResponse.json({ posted })
}
