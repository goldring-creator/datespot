// app/courses/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/ui/TopNav'
import { notFound } from 'next/navigation'
import type { CoursePlace } from '@/lib/supabase/types'
import { PlaceCard } from '@/components/planner/PlaceCard'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: places } = await supabase
    .from('places')
    .select('*')
    .in('id', course.place_ids)

  const orderedPlaces = course.place_ids.map((pid: string) =>
    places?.find(p => p.id === pid)
  ).filter(Boolean) as CoursePlace[]

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#2D1B4E' }}>{course.title}</h1>
        {course.ai_description && (
          <p className="text-sm mb-4" style={{ color: '#9060B8' }}>{course.ai_description}</p>
        )}
        <div className="flex gap-4 text-xs mb-6" style={{ color: '#A088B8' }}>
          {course.scheduled_date && <span>📅 {course.scheduled_date}</span>}
          {course.start_time && <span>⏰ {course.start_time} ~ {course.end_time}</span>}
          {course.transport && <span>{course.transport === 'subway' ? '🚇 대중교통' : '🚗 자동차'}</span>}
        </div>
        {orderedPlaces.map((place, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            index={i}
            travelMinutes={place.travel_to_next_minutes}
            travelMode={place.travel_mode}
          />
        ))}
      </main>
    </div>
  )
}
