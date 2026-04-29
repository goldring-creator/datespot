import { parseUrl } from '../lib/parsers/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const urls = [
  'https://naver.me/FtG5XYxn',
  'https://naver.me/F6lTzmvL',
  'https://naver.me/5k7f8hG4',
]

async function seed() {
  for (const url of urls) {
    try {
      console.log('Parsing:', url)
      const place = await parseUrl(url)
      if (!place) { console.error('  → parse 실패:', url); continue }
      console.log('  → 파싱 완료:', place.name, place.address)

      const { data, error } = await supabase
        .from('places')
        .insert({
          name: place.name,
          category: place.category ?? 'restaurant',
          address: place.address ?? null,
          lat: place.lat ?? null,
          lng: place.lng ?? null,
          description: null,
          naver_url: place.naverUrl ?? url,
          source_url: url,
          region: [],
          tags: [],
          is_active: true,
          bookmark_count: 0,
        })
        .select('id, name')
        .single()

      if (error) console.error('  → DB 에러:', error.message)
      else console.log('  ✓ 저장됨:', data?.name, '(id:', data?.id + ')')
    } catch (e) {
      console.error('  → 실패:', e instanceof Error ? e.message : e)
    }
  }
}

seed()
