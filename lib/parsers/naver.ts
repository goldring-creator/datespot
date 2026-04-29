import type { ParsedPlace } from './router'

export function extractNaverPlaceId(url: string): string | null {
  const entryMatch = url.match(/entry\/place\/(\d+)/)
  if (entryMatch) return entryMatch[1]
  const queryMatch = url.match(/[?&]place=(\d+)/)
  if (queryMatch) return queryMatch[1]
  return null
}

export async function parseNaverUrl(url: string): Promise<ParsedPlace | null> {
  const placeId = extractNaverPlaceId(url)
  if (!placeId) return null

  // Naver Maps 모바일 장소 요약 API (place ID 직접 조회)
  const res = await fetch(
    `https://map.naver.com/v5/api/sites/summary/${placeId}?lang=ko`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        Referer: 'https://map.naver.com/',
      },
      signal: AbortSignal.timeout(8000),
    }
  )
  if (!res.ok) return null

  let data: any
  try { data = await res.json() } catch { return null }

  const site = data.site ?? data
  if (!site?.name) return null

  return {
    name: site.name,
    category: mapNaverCategory(site.categoryName ?? site.category ?? ''),
    address: site.roadAddress ?? site.address ?? undefined,
    lat: site.y ? parseFloat(site.y) : undefined,
    lng: site.x ? parseFloat(site.x) : undefined,
    naverUrl: url,
    sourceUrl: url,
  }
}

function mapNaverCategory(cat: string): string {
  if (cat.includes('카페')) return 'cafe'
  if (cat.includes('음식') || cat.includes('식당') || cat.includes('맛집')) return 'restaurant'
  if (cat.includes('전시') || cat.includes('박물관') || cat.includes('갤러리')) return 'exhibition'
  if (cat.includes('영화')) return 'movie'
  if (cat.includes('쇼핑')) return 'shopping'
  if (cat.includes('공원')) return 'park'
  return 'activity'
}
