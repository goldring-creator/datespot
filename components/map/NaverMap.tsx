'use client'
import { useEffect, useRef } from 'react'
import type { CoursePlace } from '@/lib/supabase/types'

interface NaverMapProps {
  places: CoursePlace[]
  center?: { lat: number; lng: number }
}

declare global {
  interface Window { naver: any }
}

export function NaverMap({ places, center }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`
    script.onload = initMap
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) renderPlaces()
  }, [places])

  function initMap() {
    if (!mapRef.current) return
    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(center?.lat ?? 37.5443, center?.lng ?? 127.0557),
      zoom: 14,
      mapTypeId: window.naver.maps.MapTypeId.NORMAL,
    })
    renderPlaces()
  }

  function renderPlaces() {
    const map = mapInstanceRef.current
    if (!map || !window.naver) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    polylineRef.current?.setMap(null)

    const coords = places
      .filter(p => p.lat && p.lng)
      .map((p, i) => {
        const pos = new window.naver.maps.LatLng(p.lat!, p.lng!)
        const marker = new window.naver.maps.Marker({
          position: pos,
          map,
          icon: {
            content: `<div style="background:linear-gradient(135deg,#AA60CC,#DC6EA0);color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 0 0 5px rgba(170,96,204,0.22)">${i + 1}</div>`,
            anchor: new window.naver.maps.Point(17, 17),
          },
        })
        markersRef.current.push(marker)
        return pos
      })

    if (coords.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        path: coords,
        map,
        strokeColor: '#AA60CC',
        strokeWeight: 3,
        strokeStyle: 'shortdash',
        strokeOpacity: 0.75,
      })
    }

    if (coords.length > 0) {
      map.setCenter(coords[Math.floor(coords.length / 2)])
    }
  }

  return (
    <div ref={mapRef} className="w-full h-full"
         style={{ background: 'linear-gradient(150deg,#D8C4F4,#E8D0F8,#F4C8E8)' }} />
  )
}
