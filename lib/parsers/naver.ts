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

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${placeId}&display=1`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_MAP_CLIENT_SECRET!,
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    name: item.title.replace(/<[^>]+>/g, ''),
    category: mapNaverCategory(item.category),
    address: item.roadAddress || item.address,
    lat: parseFloat(item.mapy) / 1e7,
    lng: parseFloat(item.mapx) / 1e7,
    naverUrl: url,
    sourceUrl: url,
  }
}

export async function parseGoogleMapsUrl(url: string): Promise<ParsedPlace | null> {
  const coordMatch = url.match(/@([-\d.]+),([-\d.]+)/)
  if (!coordMatch) return null
  return {
    name: '구글맵 장소',
    lat: parseFloat(coordMatch[1]),
    lng: parseFloat(coordMatch[2]),
    sourceUrl: url,
  }
}

function mapNaverCategory(cat: string): string {
  if (cat.includes('카페')) return 'cafe'
  if (cat.includes('음식') || cat.includes('식당')) return 'restaurant'
  if (cat.includes('전시') || cat.includes('박물관')) return 'exhibition'
  if (cat.includes('영화')) return 'movie'
  if (cat.includes('쇼핑')) return 'shopping'
  if (cat.includes('공원')) return 'park'
  return 'activity'
}
