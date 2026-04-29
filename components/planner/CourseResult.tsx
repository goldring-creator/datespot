import type { GeneratedCourse } from '@/lib/supabase/types'
import { PlaceCard } from './PlaceCard'

interface CourseResultProps {
  course: GeneratedCourse
}

export function CourseResult({ course }: CourseResultProps) {
  return (
    <>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(170,96,204,0.14)', background: '#F5EDFF' }}>
        <p className="text-sm font-bold mb-1" style={{ color: '#2D1B4E' }}>{course.title}</p>
        <div className="flex gap-3 text-xs" style={{ color: '#9060B8' }}>
          <span>🗺 {course.places.length}곳</span>
          <span>⏱ 약 {Math.round(
            course.places.reduce((acc, p) => acc + p.duration_minutes + (p.travel_to_next_minutes ?? 0), 0) / 60
          )}시간</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {course.places.map((place, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            index={i}
            travelMinutes={place.travel_to_next_minutes}
            travelMode={place.travel_mode}
          />
        ))}
      </div>
    </>
  )
}
