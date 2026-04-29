'use client'
import { useEffect, useRef, useState } from 'react'
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
  const placesRef = useRef(places)
  const centerRef = useRef(center)
  const [mapReady, setMapReady] = useState(false)

  placesRef.current = places
  centerRef.current = center

  useEffect(() => {
    let mounted = true
    function tryInit() {
      if (!mounted) return
      if (window.naver?.maps) { initMap() }
      else { setTimeout(tryInit, 100) }
    }
    tryInit()
    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapReady) renderPlaces()
  }, [places, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  function initMap() {
    if (!mapRef.current) return
    const c = centerRef.current
    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(c?.lat ?? 37.5443, c?.lng ?? 127.0557),
      zoom: 14,
      mapTypeId: window.naver.maps.MapTypeId.NORMAL,
    })
    setMapReady(true)
  }

  function renderPlaces() {
    const map = mapInstanceRef.current
    if (!map || !window.naver) return
    const currentPlaces = placesRef.current

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    polylineRef.current?.setMap(null)

    const coords = currentPlaces
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
