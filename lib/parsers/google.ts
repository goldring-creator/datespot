import type { ParsedPlace } from './router'

export async function parseGoogleMapsUrl(url: string): Promise<ParsedPlace | null> {
  const coordMatch = url.match(/@([-\d.]+),([-\d.]+)/)
  if (coordMatch) {
    const pathName = url.match(/\/place\/([^/@]+)\//)
    const name = pathName ? decodeURIComponent(pathName[1].replace(/\+/g, ' ')) : '구글맵 장소'
    return {
      name,
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
      sourceUrl: url,
    }
  }

  const qMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/)
  if (qMatch) {
    return {
      name: '구글맵 장소',
      lat: parseFloat(qMatch[1]),
      lng: parseFloat(qMatch[2]),
      sourceUrl: url,
    }
  }

  return null
}
