// components/places/PlaceGrid.tsx
'use client'
import type { Place } from '@/lib/supabase/types'

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽', exhibition: '🎨', movie: '🎬',
  bar: '🍷', shopping: '🛍', park: '🌿', activity: '🎯',
}

interface PlaceGridProps {
  places: Place[]
}

export function PlaceGrid({ places }: PlaceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {places.map(place => (
        <div key={place.id} className="rounded-2xl overflow-hidden border"
             style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(170,96,204,0.2)' }}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{CATEGORY_EMOJI[place.category ?? ''] ?? '📍'}</span>
              <span className="text-xs font-bold" style={{ color: '#9040B8' }}>{place.category}</span>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#2D1B4E' }}>{place.name}</h3>
            {place.address && <p className="text-xs mb-2" style={{ color: '#A088B8' }}>{place.address}</p>}
            {place.description && <p className="text-xs leading-relaxed mb-3" style={{ color: '#5D407A' }}>{place.description}</p>}
            <div className="flex gap-1.5">
              {place.naver_url && (
                <a href={place.naver_url} target="_blank" rel="noopener noreferrer"
                   className="text-xs px-2 py-1 rounded-lg"
                   style={{ background: '#E8FFF2', border: '1px solid rgba(3,199,90,0.3)', color: '#047A38' }}>
                  🟢 지도
                </a>
              )}
              <span className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: '#EDE0FF', color: '#7830A8' }}>
                💜 {place.bookmark_count}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
