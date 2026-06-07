export interface CountryStreamingInfo {
  country: string
  slug: string
  broadcaster: string
  free: boolean
  vpnNeeded: string
  notes: string
}

export const COUNTRIES: CountryStreamingInfo[] = [
  {
    country: 'Australia',
    slug: 'australia',
    broadcaster: 'SBS (free) or Optus Sport',
    free: true,
    vpnNeeded: 'Use a VPN set to Australia if abroad',
    notes: 'SBS is completely free, no subscription needed.',
  },
  {
    country: 'United Kingdom',
    slug: 'united-kingdom',
    broadcaster: 'ITV (free) and BBC (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to UK if abroad',
    notes: 'ITV and BBC share broadcast rights — all 64 games covered free.',
  },
  {
    country: 'United States',
    slug: 'united-states',
    broadcaster: 'Fox Sports, FS1, Telemundo',
    free: false,
    vpnNeeded: 'No VPN needed — use Fox Sports app or cable',
    notes: 'Fox has English rights, Telemundo has Spanish. Fox app free with TV login.',
  },
  {
    country: 'Canada',
    slug: 'canada',
    broadcaster: 'CTV (free) and TSN',
    free: true,
    vpnNeeded: 'Use a VPN set to Canada if abroad',
    notes: 'CTV streams select matches free. TSN has full coverage.',
  },
  {
    country: 'Germany',
    slug: 'germany',
    broadcaster: 'ZDF and ARD (both free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Germany if abroad',
    notes: 'ZDF and ARD share rights and both stream free online.',
  },
  {
    country: 'France',
    slug: 'france',
    broadcaster: 'TF1 (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to France if abroad',
    notes: 'TF1 streams all matches free via MYTF1 app.',
  },
  {
    country: 'Brazil',
    slug: 'brazil',
    broadcaster: 'Globo (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Brazil if abroad',
    notes: 'Globo streams free via GloboPlay.',
  },
  {
    country: 'Spain',
    slug: 'spain',
    broadcaster: 'RTVE (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Spain if abroad',
    notes: 'RTVE streams all matches free with no subscription.',
  },
  {
    country: 'Mexico',
    slug: 'mexico',
    broadcaster: 'Televisa and TV Azteca (free)',
    free: true,
    vpnNeeded: 'Use a VPN set to Mexico if abroad',
    notes: 'Both free broadcasters have full rights — co-host nation.',
  },
  {
    country: 'India',
    slug: 'india',
    broadcaster: 'JioTV (free with Jio SIM)',
    free: true,
    vpnNeeded: 'Use a VPN set to India if abroad',
    notes: 'JioTV streams free. Sports18 has paid cable rights.',
  },
]

// Full list of country slugs to generate pages for
export const COUNTRIES_LIST = [
  'afghanistan', 'albania', 'algeria', 'argentina', 'armenia', 'australia',
  'austria', 'azerbaijan', 'bangladesh', 'belgium', 'bolivia', 'bosnia',
  'brazil', 'bulgaria', 'cameroon', 'canada', 'chile', 'china', 'colombia',
  'costa-rica', 'croatia', 'czech-republic', 'denmark', 'ecuador', 'egypt',
  'england', 'ethiopia', 'finland', 'france', 'germany', 'ghana', 'greece',
  'hungary', 'india', 'indonesia', 'iran', 'iraq', 'ireland', 'israel',
  'italy', 'jamaica', 'japan', 'jordan', 'kenya', 'malaysia', 'mexico',
  'morocco', 'netherlands', 'new-zealand', 'nigeria', 'norway', 'pakistan',
  'panama', 'peru', 'philippines', 'poland', 'portugal', 'romania', 'russia',
  'saudi-arabia', 'scotland', 'senegal', 'serbia', 'singapore', 'south-africa',
  'south-korea', 'spain', 'sweden', 'switzerland', 'thailand', 'turkey',
  'ukraine', 'united-arab-emirates', 'united-kingdom', 'united-states',
  'uruguay', 'venezuela', 'vietnam', 'wales',
]
