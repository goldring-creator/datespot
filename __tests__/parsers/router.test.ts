import { detectSource } from '@/lib/parsers/router'

describe('detectSource', () => {
  test('네이버지도 URL', () => {
    expect(detectSource('https://map.naver.com/v5/entry/place/1234567')).toBe('naver')
  })
  test('네이버 플레이스 URL', () => {
    expect(detectSource('https://naver.com/local/place/1234')).toBe('naver')
  })
  test('카카오맵 URL', () => {
    expect(detectSource('https://map.kakao.com/link/map/카페,37.5,127.0')).toBe('kakao')
  })
  test('카카오 단축 URL', () => {
    expect(detectSource('https://kko.to/abc123')).toBe('kakao')
  })
  test('인스타그램 URL', () => {
    expect(detectSource('https://www.instagram.com/p/ABC123/')).toBe('instagram')
  })
  test('네이버 블로그', () => {
    expect(detectSource('https://blog.naver.com/user/123456')).toBe('blog')
  })
  test('티스토리', () => {
    expect(detectSource('https://example.tistory.com/123')).toBe('blog')
  })
  test('구글맵', () => {
    expect(detectSource('https://maps.google.com/maps?q=37.5,127.0')).toBe('google')
  })
  test('알 수 없는 URL', () => {
    expect(detectSource('https://example.com/restaurant')).toBe('generic')
  })
})
