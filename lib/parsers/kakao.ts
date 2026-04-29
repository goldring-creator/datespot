import type { ParsedPlace } from './router'

export async function parseKakaoUrl(url: string): Promise<ParsedPlace | null> {
  let finalUrl = url
  if (url.includes('kko.to')) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      finalUrl = res.url
    } catch { return null }
  }

  const linkMatch = finalUrl.match(/\/link\/map\/([^,]+),([-\d.]+),([-\d.]+)/)
  if (linkMatch) {
    return {
      name: decodeURIComponent(linkMatch[1]),
      lat: parseFloat(linkMatch[2]),
      lng: parseFloat(linkMatch[3]),
      sourceUrl: url,
    }
  }

  const placeMatch = finalUrl.match(/\/place\/(\d+)/)
  if (placeMatch) {
    return fetchKakaoPlace(placeMatch[1], url)
  }

  return null
}

async function fetchKakaoPlace(placeId: string, sourceUrl: string): Promise<ParsedPlace | null> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${placeId}&size=1`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const doc = data.documents?.[0]
  if (!doc) return null

  return {
    name: doc.place_name,
    category: mapKakaoCategory(doc.category_group_code),
    address: doc.road_address_name || doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    sourceUrl,
  }
}

function mapKakaoCategory(code: string): string {
  const map: Record<string, string> = {
    CE7: 'cafe', FD6: 'restaurant', CT1: 'exhibition',
    MT1: 'shopping', AT4: 'park',
  }
  return map[code] ?? 'activity'
}
