export type MarketCountry = {
  id: string;
  label: string;
  keywords: string[];
};

/** Location substring keywords per country (aligned with portals.yml location_filter). */
export const MARKET_COUNTRY_CATALOG: MarketCountry[] = [
  {
    id: 'germany',
    label: 'Germany',
    keywords: [
      'germany',
      'deutschland',
      'dach',
      'berlin',
      'munich',
      'münchen',
      'hamburg',
      'frankfurt',
      'cologne',
      'köln',
      'stuttgart',
      'düsseldorf',
    ],
  },
  {
    id: 'netherlands',
    label: 'Netherlands',
    keywords: [
      'netherlands',
      'nederland',
      'holland',
      'amsterdam',
      'rotterdam',
      'utrecht',
      'eindhoven',
      'the hague',
      'den haag',
    ],
  },
  {
    id: 'poland',
    label: 'Poland',
    keywords: [
      'poland',
      'polska',
      'warsaw',
      'warszawa',
      'krakow',
      'kraków',
      'wroclaw',
      'wrocław',
      'gdansk',
      'gdańsk',
      'poznan',
      'poznań',
      'lodz',
      'łódź',
    ],
  },
  {
    id: 'belgium',
    label: 'Belgium',
    keywords: ['belgium', 'belgique', 'belgië', 'brussels', 'bruxelles', 'antwerp', 'antwerpen', 'ghent', 'gent', 'leuven'],
  },
  {
    id: 'sweden',
    label: 'Sweden',
    keywords: ['sweden', 'sverige', 'stockholm', 'gothenburg', 'göteborg', 'malmo', 'malmö', 'lund'],
  },
  {
    id: 'denmark',
    label: 'Denmark',
    keywords: ['denmark', 'danmark', 'copenhagen', 'københavn', 'aarhus', 'århus', 'odense'],
  },
  {
    id: 'ireland',
    label: 'Ireland',
    keywords: ['ireland', 'éire', 'dublin', 'cork', 'galway'],
  },
  {
    id: 'france',
    label: 'France',
    keywords: ['france', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'nantes'],
  },
  {
    id: 'finland',
    label: 'Finland',
    keywords: ['finland', 'suomi', 'helsinki', 'espoo', 'tampere'],
  },
  {
    id: 'switzerland',
    label: 'Switzerland',
    keywords: ['switzerland', 'schweiz', 'suisse', 'zurich', 'zürich', 'geneva', 'genève', 'basel', 'bern'],
  },
  {
    id: 'czech-republic',
    label: 'Czech Republic',
    keywords: ['czech', 'czechia', 'prague', 'praha', 'brno'],
  },
  {
    id: 'estonia',
    label: 'Estonia',
    keywords: ['estonia', 'eesti', 'tallinn', 'tartu'],
  },
  {
    id: 'portugal',
    label: 'Portugal',
    keywords: ['portugal', 'lisbon', 'lisboa', 'porto'],
  },
  {
    id: 'spain',
    label: 'Spain',
    keywords: ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'seville'],
  },
  {
    id: 'austria',
    label: 'Austria',
    keywords: ['austria', 'österreich', 'vienna', 'wien', 'salzburg', 'graz'],
  },
  {
    id: 'norway',
    label: 'Norway',
    keywords: ['norway', 'norge', 'oslo', 'bergen', 'trondheim'],
  },
  {
    id: 'lithuania',
    label: 'Lithuania',
    keywords: ['lithuania', 'lietuva', 'vilnius', 'kaunas'],
  },
  {
    id: 'romania',
    label: 'Romania',
    keywords: ['romania', 'românia', 'bucharest', 'bucurești', 'cluj'],
  },
  {
    id: 'hungary',
    label: 'Hungary',
    keywords: ['hungary', 'magyarország', 'budapest'],
  },
  {
    id: 'italy',
    label: 'Italy',
    keywords: ['italy', 'italia', 'milan', 'milano', 'rome', 'roma', 'turin', 'torino'],
  },
];

export const REMOTE_COUNTRY_ID = 'remote';

export const REMOTE_KEYWORDS = [
  'remote',
  'worldwide',
  'anywhere',
  'wfh',
  'work from home',
  'fully remote',
  'distributed',
  'europe',
  'eu',
  'emea',
];

export const DEFAULT_PRIMARY_COUNTRY_LABELS = [
  'Germany',
  'Netherlands',
  'Poland',
  'Belgium',
  'Sweden',
  'Denmark',
];

const catalogById = new Map(MARKET_COUNTRY_CATALOG.map((c) => [c.id, c]));
const catalogByLabel = new Map(MARKET_COUNTRY_CATALOG.map((c) => [c.label.toLowerCase(), c]));

export function findMarketCountry(id: string): MarketCountry | undefined {
  if (id === REMOTE_COUNTRY_ID) {
    return { id: REMOTE_COUNTRY_ID, label: 'Remote / EU', keywords: REMOTE_KEYWORDS };
  }
  return catalogById.get(id);
}

export function resolveMarketCountries(primaryLabels: string[], allLabels: string[]): MarketCountry[] {
  const order = allLabels.length > 0 ? allLabels : MARKET_COUNTRY_CATALOG.map((c) => c.label);
  const primarySet = new Set(
    (primaryLabels.length > 0 ? primaryLabels : DEFAULT_PRIMARY_COUNTRY_LABELS).map((l) => l.toLowerCase()),
  );

  const seen = new Set<string>();
  const out: MarketCountry[] = [];

  for (const label of order) {
    const entry = catalogByLabel.get(label.toLowerCase());
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push({ ...entry, primary: primarySet.has(label.toLowerCase()) } as MarketCountry & { primary?: boolean });
  }

  for (const entry of MARKET_COUNTRY_CATALOG) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push({ ...entry, primary: primarySet.has(entry.label.toLowerCase()) } as MarketCountry & { primary?: boolean });
  }

  return out;
}

/** PostgREST `.or()` filter for location column (includes empty location for board feeds). */
export function buildLocationOrFilter(keywords: string[]): string {
  const parts = keywords.map((k) => `location.ilike.%${escapeIlike(k)}%`);
  parts.push('location.is.null', 'location.eq.');
  return parts.join(',');
}

function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, '');
}
