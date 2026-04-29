import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCourse } from '@/lib/claude'
import { getTravelTime } from '@/lib/apis/tmap'
import type { Place } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const opts = await req.json().catch(() => null)
  if (!opts?.region) return NextResponse.json({ error: 'region required' }, { status: 400 })

  const supabase = await createClient()

  const { data: places, error } = await supabase
    .from('places')
    .select('*')
    .contains('region', [opts.region.split('·')[0]])
    .eq('is_active', true)
    .is('expires_at', null)
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!places || places.length === 0) {
    return NextResponse.json({ error: '해당 지역에 저장된 장소가 없습니다' }, { status: 404 })
  }

  let course
  try {
    course = await generateCourse(places as Place[], opts)
  } catch (err) {
    return NextResponse.json(
      { error: '코스 생성 실패', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }

  for (let i = 0; i < course.places.length - 1; i++) {
    const from = course.places[i]
    const to = course.places[i + 1]
    if (from.lat && from.lng && to.lat && to.lng) {
      const travel = await getTravelTime(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng },
        opts.transport
      )
      course.places[i].travel_to_next_minutes = travel.minutes
      course.places[i].travel_mode = travel.mode
    }
  }

  return NextResponse.json(course)
}
