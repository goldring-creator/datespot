'use client'
import { useState } from 'react'
import { PlannerForm } from './PlannerForm'
import { CourseResult } from './CourseResult'
import type { GeneratedCourse, PlannerOptions } from '@/lib/supabase/types'

interface RightPanelProps {
  onCourseGenerated: (course: GeneratedCourse) => void
}

export function RightPanel({ onCourseGenerated }: RightPanelProps) {
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState<GeneratedCourse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (opts: PlannerOptions) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: GeneratedCourse = await res.json()
      setCourse(data)
      onCourseGenerated(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="w-[340px] flex flex-col h-full border-l overflow-hidden"
           style={{ background: '#F5EDFF', borderColor: 'rgba(170,96,204,0.18)' }}>
      <PlannerForm onSubmit={handleSubmit} loading={loading} />
      {error && <p className="text-xs text-red-500 px-4 py-2">{error}</p>}
      {course && <CourseResult course={course} />}
      {!course && !loading && (
        <div className="flex-1 flex items-center justify-center text-xs text-center px-6"
             style={{ color: '#B0A0C0' }}>
          조건을 설정하고<br />AI 코스 추천을 받아보세요 💜
        </div>
      )}
    </aside>
  )
}
