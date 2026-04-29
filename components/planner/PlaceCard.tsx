import type { CoursePlace } from '@/lib/supabase/types'

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽', exhibition: '🎨', movie: '🎬',
  bar: '🍷', shopping: '🛍', park: '🌿', activity: '🎯',
}

interface PlaceCardProps {
  place: CoursePlace
  index: number
  travelMinutes: number | null
  travelMode: string | null
}

export function PlaceCard({ place, index, travelMinutes, travelMode }: PlaceCardProps) {
  const emoji = CATEGORY_EMOJI[place.category ?? ''] ?? '📍'

  return (
    <>
      <div className="rounded-xl p-3 mb-2 relative"
           style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(170,96,204,0.2)' }}>
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style={{ background: 'linear-gradient(135deg,#AA60CC,#DC6EA0)' }}>
          {index + 1}
        </div>
        <p className="text-xs font-bold mb-0.5" style={{ color: '#9040B8' }}>
          {emoji} {place.category} · {place.visit_time}
        </p>
        <p className="text-sm font-bold mb-0.5" style={{ color: '#2D1B4E' }}>{place.name}</p>
        {place.address && <p className="text-xs mb-1.5" style={{ color: '#A088B8' }}>{place.address}</p>}
        {place.description && <p className="text-xs leading-relaxed mb-2" style={{ color: '#5D407A' }}>{place.description}</p>}
        <div className="flex gap-1.5">
          {place.naver_url && (
            <a href={place.naver_url} target="_blank" rel="noopener noreferrer"
               className="text-xs px-2 py-1 rounded-md font-medium"
               style={{ background: '#E8FFF2', border: '1px solid rgba(3,199,90,0.35)', color: '#047A38' }}>
              🟢 네이버지도
            </a>
          )}
          {place.instagram_url && (
            <a href={place.instagram_url} target="_blank" rel="noopener noreferrer"
               className="text-xs px-2 py-1 rounded-md font-medium"
               style={{ background: '#FFE8F2', border: '1px solid rgba(220,110,160,0.4)', color: '#B84878' }}>
              📸 인스타
            </a>
          )}
        </div>
      </div>

      {travelMinutes !== null && (
        <div className="flex items-center gap-2 mb-2 px-1 text-xs" style={{ color: '#A088B8' }}>
          <div className="flex-1 h-px" style={{ background: 'rgba(170,96,204,0.2)' }} />
          {travelMode === 'walk' ? '🚶' : travelMode === 'subway' ? '🚇' : '🚗'} {travelMinutes}분
          <div className="flex-1 h-px" style={{ background: 'rgba(170,96,204,0.2)' }} />
        </div>
      )}
    </>
  )
}
