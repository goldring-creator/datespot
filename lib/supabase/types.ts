// lib/supabase/types.ts
export type PlaceCategory = 'cafe' | 'restaurant' | 'exhibition' | 'movie' | 'bar' | 'shopping' | 'park' | 'activity'
export type Transport = 'subway' | 'car'

export interface Place {
  id: string
  name: string
  category: PlaceCategory | null
  address: string | null
  lat: number | null
  lng: number | null
  description: string | null
  naver_url: string | null
  instagram_url: string | null
  source_url: string | null
  region: string[] | null
  tags: string[] | null
  expires_at: string | null
  submitted_by: string | null
  bookmark_count: number
  is_active: boolean
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  place_id: string
  created_at: string
}

export interface Course {
  id: string
  user_id: string
  title: string
  place_ids: string[]
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  transport: Transport | null
  ai_description: string | null
  is_public: boolean
  created_at: string
}

export interface CoursePlace extends Place {
  visit_time: string
  duration_minutes: number
  travel_to_next_minutes: number | null
  travel_mode: string | null
  visit_reason?: string
}

export interface GeneratedCourse {
  title: string
  description: string
  places: CoursePlace[]
}

export interface PlannerOptions {
  region: string
  dayOfWeek: string
  startTime: string
  endTime: string
  transport: Transport
  mood: string
}
