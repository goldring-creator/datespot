import type { ParsedPlace } from '@/lib/parsers/router'

export async function searchKakaoLocal(query: string, region?: string): Promise<ParsedPlace[]> {
  const params = new URLSearchParams({
    query: region ? `${region} ${query}` : query,
    size: '5',
  })
  try {
    const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.documents ?? []).map((doc: {
      place_name: string; category_group_code: string;
      road_address_name: string; address_name: string;
      y: string; x: string; place_url: string
    }) => ({
      name: doc.place_name,
      category: mapCategory(doc.category_group_code),
      address: doc.road_address_name || doc.address_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      sourceUrl: doc.place_url,
    }))
  } catch { return [] }
}

function mapCategory(code: string): string {
  const map: Record<string, string> = {
    CE7: 'cafe', FD6: 'restaurant', CT1: 'exhibition', MT1: 'shopping', AT4: 'park',
  }
  return map[code] ?? 'activity'
}
