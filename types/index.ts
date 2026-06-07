export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'FINISHED' | 'POSTPONED'
export type ContentType = 'preview' | 'recap' | 'country-guide'
export type Stage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL'

export interface Match {
  id: string
  external_id: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  kickoff_time: string
  status: MatchStatus
  stage: Stage
  group: string | null
  slug: string
}

export interface OddsSnapshot {
  id: string
  match_id: string
  book_name: string
  home_price: number | null
  draw_price: number | null
  away_price: number | null
  over_line: number | null
  over_price: number | null
  under_price: number | null
  snapshotted_at: string
}

export interface Content {
  id: string
  match_id: string | null
  type: ContentType
  slug: string
  title: string
  body_md: string
  meta_description: string
  published_at: string | null
}

export interface XPost {
  id: string
  content_id: string | null
  body: string
  posted_at: string | null
  status: 'pending' | 'posted' | 'failed'
}
