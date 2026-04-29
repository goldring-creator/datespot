export type UrlSource = 'naver' | 'kakao' | 'instagram' | 'blog' | 'google' | 'generic'

export interface ParsedPlace {
  name: string
  category?: string
  address?: string
  lat?: number
  lng?: number
  naverUrl?: string
  instagramUrl?: string
  sourceUrl: string
}

export function detectSource(url: string): UrlSource {
  const u = url.toLowerCase()
  if (u.includes('map.naver.com') || u.includes('naver.com/local') || u.includes('naver.me')) return 'naver'
  if (u.includes('map.kakao.com') || u.includes('kko.to')) return 'kakao'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('blog.naver.com') || u.includes('tistory.com') || u.includes('brunch.co.kr')) return 'blog'
  if (u.includes('maps.google.com') || u.includes('goo.gl/maps')) return 'google'
  return 'generic'
}

export async function parseUrl(url: string): Promise<ParsedPlace | null> {
  const source = detectSource(url)
  switch (source) {
    case 'naver': {
      const { parseNaverUrl } = await import('./naver')
      return parseNaverUrl(url)
    }
    case 'kakao': {
      const { parseKakaoUrl } = await import('./kakao')
      return parseKakaoUrl(url)
    }
    case 'instagram': {
      const { parseInstagramUrl } = await import('./instagram')
      return parseInstagramUrl(url)
    }
    case 'blog': {
      const { parseBlogUrl } = await import('./blog')
      return parseBlogUrl(url)
    }
    case 'google': {
      const { parseGoogleMapsUrl } = await import('./google')
      return parseGoogleMapsUrl(url)
    }
    default: {
      const { parseGenericUrl } = await import('./generic')
      return parseGenericUrl(url)
    }
  }
}
