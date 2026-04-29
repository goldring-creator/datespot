import type { ParsedPlace } from './router'

const KAKAO_DOMAINS = ['map.kakao.com', 'place.kakao.com', 'kakao.com']

export async function parseKakaoUrl(url: string): Promise<ParsedPlace | null> {
  let finalUrl = url
  if (url.includes('kko.to')) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      })
      finalUrl = res.url
      // SSRF 방어: 리다이렉트 후 도메인이 카카오인지 확인
      const redirectHost = new URL(finalUrl).hostname
      if (!KAKAO_DOMAINS.some(d => redirectHost === d || redirectHost.endsWith('.' + d))) {
        return null
      }
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
    {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    }
  )
  if (!res.ok) return null
  let data: any
  try { data = await res.json() } catch { return null }
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
