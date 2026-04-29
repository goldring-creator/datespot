import { extractNaverPlaceId } from '@/lib/parsers/naver'

describe('extractNaverPlaceId', () => {
  test('entry/place URL', () => {
    expect(extractNaverPlaceId('https://map.naver.com/v5/entry/place/11819069')).toBe('11819069')
  })
  test('place URL with query', () => {
    expect(extractNaverPlaceId('https://map.naver.com/v5/search/카페?c=14138560.0,4508040.0,15,0,0,0,dh&place=11819069')).toBe('11819069')
  })
  test('잘못된 URL → null', () => {
    expect(extractNaverPlaceId('https://naver.com')).toBeNull()
  })
})
