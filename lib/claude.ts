import Anthropic from '@anthropic-ai/sdk'
import type { Place, GeneratedCourse, PlannerOptions } from '@/lib/supabase/types'

const client = new Anthropic()

export function buildCoursePrompt(places: Place[], opts: {
  region: string; dayOfWeek: string; startTime: string; endTime: string; transport: string; mood: string
}): string {
  const placeList = places.map(p =>
    `- ID: ${p.id} | 이름: ${p.name} | 카테고리: ${p.category} | 주소: ${p.address} | 지역: ${p.region?.join(',')}`
  ).join('\n')

  return `당신은 데이트 코스 전문가입니다. 아래 장소 목록에서 최적의 데이트 코스를 짜주세요.

조건:
- 요일: ${opts.dayOfWeek}
- 시간: ${opts.startTime} ~ ${opts.endTime}
- 지역: ${opts.region}
- 이동수단: ${opts.transport === 'subway' ? '대중교통' : '자동차'}
- 분위기: ${opts.mood}

장소 목록:
${placeList}

응답은 반드시 아래 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{
  "title": "코스 제목",
  "description": "코스 전체 설명 1-2문장",
  "places": [
    {
      "id": "장소ID",
      "visit_time": "HH:MM",
      "duration_minutes": 90,
      "travel_to_next_minutes": 20,
      "travel_mode": "subway",
      "visit_reason": "이 장소를 선택한 이유 한 문장"
    }
  ]
}`
}

export async function generateCourse(places: Place[], opts: PlannerOptions): Promise<GeneratedCourse> {
  const prompt = buildCoursePrompt(places, opts)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: '당신은 한국 데이트 코스 전문가입니다. 항상 유효한 JSON만 응답합니다.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]+\}/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  const raw = JSON.parse(jsonMatch[0])

  const coursePlaces = raw.places.map((cp: { id: string; visit_time: string; duration_minutes: number; travel_to_next_minutes: number | null; travel_mode: string | null; visit_reason?: string }) => {
    const place = places.find(p => p.id === cp.id)
    if (!place) throw new Error(`장소 ID ${cp.id} 없음`)
    return { ...place, ...cp }
  })

  return { title: raw.title, description: raw.description, places: coursePlaces }
}
