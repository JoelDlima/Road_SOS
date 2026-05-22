import { fetchWithTimeout } from '../fetch-utils';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.EXPO_PUBLIC_GOOGLE_SEARCH_CX;

const ROAD_SAFETY_SITES = [
  'morth.nic.in', 'nhai.gov.in', 'who.int', 'redcross.org',
  'mayoclinic.org', 'nhtsa.gov', 'cdc.gov', 'nih.gov',
  'icmr.nic.in', 'roadsafety.gov.in', 'pib.gov.in',
  'bprd.nic.in', 'parivahan.gov.in', 'nhsrcindia.org',
];

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

export async function searchRoadSafety(query: string): Promise<{
  results: SearchResult[];
  source: 'web' | 'offline';
}> {
  if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
    return { results: [], source: 'offline' };
  }

  const siteQuery = ROAD_SAFETY_SITES.map(s => `site:${s}`).join(' OR ');
  const fullQuery = `${query} (${siteQuery})`;

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(fullQuery)}&num=5`;
    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) return { results: [], source: 'offline' };

    const data = await response.json() as { items?: Array<{ title: string; snippet: string; link: string }> };
    const results: SearchResult[] = (data.items || []).map((item) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    }));

    return { results, source: 'web' };
  } catch {
    return { results: [], source: 'offline' };
  }
}

export function formatSearchResultsForLLM(results: SearchResult[]): string {
  if (results.length === 0) return 'No web results found (offline or API unavailable).';
  return results.map((r, i) =>
    `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.link}`
  ).join('\n');
}
