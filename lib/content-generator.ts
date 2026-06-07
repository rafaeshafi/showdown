import Anthropic from '@anthropic-ai/sdk'
import type { Match, OddsSnapshot } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generatePreview(match: Match, odds: OddsSnapshot[]): Promise<{ title: string; body_md: string; meta_description: string }> {
  const oddsText = odds.length > 0
    ? odds.map(o => `${o.book_name}: Home ${o.home_price} / Draw ${o.draw_price} / Away ${o.away_price} | O/U ${o.over_line} (Over ${o.over_price} / Under ${o.under_price})`).join('\n')
    : 'Odds not yet available.'

  const kickoff = new Date(match.kickoff_time).toUTCString()

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Write a punchy 400-word World Cup 2026 match preview for ${match.home_team} vs ${match.away_team} (${match.stage}, kickoff ${kickoff}).

Current odds:
${oddsText}

Format: Markdown. Include H2 headings for "Key Storylines", "Form & Prediction", "How to Watch". End with a 1-sentence meta description on its own line prefixed with META:

Tone: sharp, confident sports journalism. No fluff.`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `${match.home_team} vs ${match.away_team} World Cup 2026 preview, prediction and odds.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `${match.home_team} vs ${match.away_team} Preview — World Cup 2026`

  return { title, body_md, meta_description }
}

export async function generateRecap(match: Match): Promise<{ title: string; body_md: string; meta_description: string }> {
  const score = `${match.home_score}–${match.away_score}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Write a 300-word World Cup 2026 match recap for ${match.home_team} ${score} ${match.away_team}.

Format: Markdown. Include H2s for "Match Summary" and "What It Means". End with a 1-sentence meta description prefixed with META:

Tone: sharp post-match reporting. Keep it factual and punchy.`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `${match.home_team} ${score} ${match.away_team} — World Cup 2026 recap.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `${match.home_team} ${score} ${match.away_team} — World Cup 2026 Recap`

  return { title, body_md, meta_description }
}

export async function generateCountryGuide(country: string, broadcaster: string, free: boolean, vpnNote: string): Promise<{ title: string; body_md: string; meta_description: string }> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: `Write a 350-word guide: "How to watch World Cup 2026 in ${country}".

Facts: Official broadcaster: ${broadcaster}. Free to watch: ${free ? 'Yes' : 'No'}. VPN note: ${vpnNote}.

Format: Markdown. Include H2s for "Official Broadcaster", "How to Watch Free Online", "Watch From Abroad (VPN)".
In the "Watch From Abroad" section, mention that a VPN lets fans access their home stream while travelling — position it naturally as a tool for travellers.

End with META: [one sentence for search snippet, include "World Cup 2026" and "${country}"]`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const metaMatch = raw.match(/META:\s*(.+)/)
  const meta_description = metaMatch ? metaMatch[1].trim() : `How to watch World Cup 2026 in ${country} — free streams, TV channels and VPN guide.`
  const body_md = raw.replace(/META:.+/, '').trim()
  const title = `How to Watch World Cup 2026 in ${country} — Free Streams & TV Guide`

  return { title, body_md, meta_description }
}
