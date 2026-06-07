export interface AffiliateLink {
  name: string
  url: string
  cta: string
  commission: string
  badge: string
}

export const VPN_AFFILIATES: AffiliateLink[] = [
  {
    name: 'NordVPN',
    url: process.env.NEXT_PUBLIC_NORDVPN_AFFILIATE_URL ?? '#',
    cta: 'Get NordVPN — Watch Every Match',
    commission: '$40+/signup',
    badge: '#1 Recommended',
  },
  {
    name: 'ExpressVPN',
    url: process.env.NEXT_PUBLIC_EXPRESSVPN_AFFILIATE_URL ?? '#',
    cta: 'Try ExpressVPN Risk-Free',
    commission: '$36/signup',
    badge: 'Fastest Speeds',
  },
  {
    name: 'Surfshark',
    url: process.env.NEXT_PUBLIC_SURFSHARK_AFFILIATE_URL ?? '#',
    cta: 'Get Surfshark — Best Value VPN',
    commission: '$35/signup',
    badge: 'Best Value',
  },
]

export const BETTING_AFFILIATE: AffiliateLink = {
  name: 'DraftKings',
  url: process.env.NEXT_PUBLIC_DRAFTKINGS_AFFILIATE_URL ?? '#',
  cta: 'Bet on World Cup at DraftKings',
  commission: '$50+/signup',
  badge: 'US Only',
}
