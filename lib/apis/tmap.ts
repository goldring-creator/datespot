interface TravelTime {
  minutes: number
  mode: string
}

export async function getTravelTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  transport: 'subway' | 'car'
): Promise<TravelTime> {
  if (transport === 'car') {
    try {
      const res = await fetch('https://apis.openapi.sk.com/tmap/routes?version=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          appKey: process.env.TMAP_API_KEY!,
        },
        body: JSON.stringify({
          startX: from.lng, startY: from.lat,
          endX: to.lng, endY: to.lat,
          reqCoordType: 'WGS84GEO', resCoordType: 'WGS84GEO',
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return { minutes: 20, mode: 'car' }
      const data = await res.json()
      const seconds = data.features?.[0]?.properties?.totalTime ?? 1200
      return { minutes: Math.ceil(seconds / 60), mode: 'car' }
    } catch { return { minutes: 20, mode: 'car' } }
  }

  try {
    const res = await fetch(
      `https://apis.openapi.sk.com/transit/routes?version=1&startX=${from.lng}&startY=${from.lat}&endX=${to.lng}&endY=${to.lat}&count=1`,
      {
        headers: { appKey: process.env.TMAP_API_KEY! },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return { minutes: 25, mode: 'subway' }
    const data = await res.json()
    const minutes = data.metaData?.plan?.itineraries?.[0]?.duration
      ? Math.ceil(data.metaData.plan.itineraries[0].duration / 60)
      : 25
    return { minutes, mode: 'subway' }
  } catch { return { minutes: 25, mode: 'subway' } }
}
