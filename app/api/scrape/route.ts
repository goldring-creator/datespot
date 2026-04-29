import { NextRequest, NextResponse } from 'next/server'
import { parseUrl } from '@/lib/parsers/router'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { url } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  const place = await parseUrl(url)
  if (!place) {
    return NextResponse.json({ error: '장소를 찾을 수 없습니다' }, { status: 422 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: place.name,
        category: place.category ?? null,
        address: place.address ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
        naver_url: place.naverUrl ?? null,
        instagram_url: place.instagramUrl ?? null,
        source_url: place.sourceUrl,
        submitted_by: user.id,
      })
      .select()
      .single()

    if (!error && data) return NextResponse.json(data)
  }

  return NextResponse.json(place)
}
