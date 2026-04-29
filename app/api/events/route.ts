import { NextResponse } from 'next/server'
import { fetchCurrentMovies } from '@/lib/apis/kobis'
import { fetchCurrentExhibitions } from '@/lib/apis/culture'

export const revalidate = 3600

export async function GET() {
  const [movies, exhibitions] = await Promise.all([
    fetchCurrentMovies(),
    fetchCurrentExhibitions(),
  ])
  return NextResponse.json({ movies, exhibitions })
}
