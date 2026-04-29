import { buildCoursePrompt } from '@/lib/claude'
import type { Place } from '@/lib/supabase/types'

const mockPlaces: Place[] = [
  { id: '1', name: '앤트러사이트', category: 'cafe', address: '서울 성동구', lat: 37.544, lng: 127.055, description: null, naver_url: null, instagram_url: null, source_url: null, region: ['성수'], tags: null, expires_at: null, submitted_by: null, bookmark_count: 0, is_active: true, created_at: '' },
  { id: '2', name: '오스테리아', category: 'restaurant', address: '서울 용산구', lat: 37.534, lng: 126.994, description: null, naver_url: null, instagram_url: null, source_url: null, region: ['한남'], tags: null, expires_at: null, submitted_by: null, bookmark_count: 0, is_active: true, created_at: '' },
]

describe('buildCoursePrompt', () => {
  test('프롬프트에 장소명 포함', () => {
    const prompt = buildCoursePrompt(mockPlaces, {
      region: '성수·한남', dayOfWeek: '토요일',
      startTime: '14:00', endTime: '20:00',
      transport: 'subway', mood: '로맨틱',
    })
    expect(prompt).toContain('앤트러사이트')
    expect(prompt).toContain('토요일')
    expect(prompt).toContain('14:00')
    expect(prompt).toContain('subway')
  })
})
