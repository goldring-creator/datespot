import type { Place } from '@/lib/supabase/types'

export async function fetchCurrentMovies(): Promise<Partial<Place>[]> {
  const today = new Date()
  const targetDate = new Date(today.setDate(today.getDate() - 1))
    .toISOString().slice(0, 10).replace(/-/g, '')

  try {
    const res = await fetch(
      `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json?key=${process.env.KOBIS_API_KEY}&targetDt=${targetDate}&weekGb=0`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.boxOfficeResult?.weeklyBoxOfficeList ?? []).slice(0, 10).map((item: {
      movieNm: string; rank: string; audiCnt: string
    }) => ({
      name: item.movieNm,
      category: 'movie' as const,
      description: `박스오피스 ${item.rank}위 · ${parseInt(item.audiCnt).toLocaleString()}명 관람`,
      is_active: true,
    }))
  } catch { return [] }
}
