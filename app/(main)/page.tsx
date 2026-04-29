'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { TopNav } from '@/components/ui/TopNav'
import { RightPanel } from '@/components/planner/RightPanel'
import type { GeneratedCourse } from '@/lib/supabase/types'

const NaverMap = dynamic(
  () => import('@/components/map/NaverMap').then(m => m.NaverMap),
  {
    ssr: false,
    loading: () => <div className="w-full h-full" style={{ background: 'linear-gradient(150deg,#D8C4F4,#F4C8E8)' }} />,
  }
)

export default function MainPage() {
  const [course, setCourse] = useState<GeneratedCourse | null>(null)

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <NaverMap places={course?.places ?? []} />
          <div className="absolute top-4 left-4 bg-white/80 rounded-full px-4 py-1.5 text-xs font-semibold border"
               style={{ color: '#6B3A96', borderColor: 'rgba(170,96,204,0.32)' }}>
            📍 {course ? course.places[0]?.region?.[0] ?? '전체' : '지역 선택'}
          </div>
        </main>
        <RightPanel onCourseGenerated={setCourse} />
      </div>
    </div>
  )
}
