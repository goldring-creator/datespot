import type { Place } from '@/lib/supabase/types'

export async function fetchCurrentExhibitions(): Promise<Partial<Place>[]> {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const res = await fetch(
      `http://www.culture.go.kr/openapi/rest/publicperformancedisplays/period?serviceKey=${process.env.CULTURE_API_KEY}&from=${today}&to=${today}&rows=10&place=서울&type=D`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []

    const text = await res.text()
    const items = [...text.matchAll(/<title>([^<]+)<\/title>[\s\S]*?<startDate>([^<]+)<\/startDate>[\s\S]*?<endDate>([^<]+)<\/endDate>/g)]
    return items.slice(0, 10).map(m => ({
      name: m[1],
      category: 'exhibition' as const,
      description: `${m[2]} ~ ${m[3]}`,
      expires_at: new Date(m[3]).toISOString(),
      is_active: true,
    }))
  } catch { return [] }
}
