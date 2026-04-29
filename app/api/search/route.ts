import { NextRequest, NextResponse } from 'next/server'
import { searchKakaoLocal } from '@/lib/apis/kakao-local'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const region = req.nextUrl.searchParams.get('region') ?? undefined
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  const results = await searchKakaoLocal(q, region)
  return NextResponse.json(results)
}
