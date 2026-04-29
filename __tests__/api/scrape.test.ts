import { POST } from '@/app/api/scrape/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/parsers/router', () => ({
  parseUrl: jest.fn().mockResolvedValue({
    name: '테스트 카페',
    category: 'cafe',
    address: '서울 성동구',
    lat: 37.544,
    lng: 127.055,
    sourceUrl: 'https://map.naver.com/test',
  }),
  detectSource: jest.fn().mockReturnValue('naver'),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}))

describe('POST /api/scrape', () => {
  test('유효한 URL → 장소 반환', async () => {
    const req = new NextRequest('http://localhost/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://map.naver.com/test' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.name).toBe('테스트 카페')
  })

  test('URL 없으면 400', async () => {
    const req = new NextRequest('http://localhost/api/scrape', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
