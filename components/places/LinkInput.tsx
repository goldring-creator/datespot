'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { detectSource, type ParsedPlace } from '@/lib/parsers/router'

const SOURCE_LABELS: Record<string, string> = {
  naver: '🟢 네이버지도',
  kakao: '🟡 카카오맵',
  instagram: '📸 인스타그램',
  blog: '📝 블로그',
  google: '🗺 구글맵',
  generic: '🔗 일반 링크',
}

interface LinkInputProps {
  onSuccess: (place: ParsedPlace) => void
}

export function LinkInput({ onSuccess }: LinkInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detected = url ? SOURCE_LABELS[detectSource(url)] : null

  const handleSubmit = async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess(data)
      setUrl('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white/80 rounded-2xl border" style={{ borderColor: 'rgba(170,96,204,0.2)' }}>
      <p className="text-xs font-bold mb-2" style={{ color: '#9040B8' }}>📎 링크로 장소 추가</p>
      {detected && <p className="text-xs mb-1.5" style={{ color: '#AA60CC' }}>{detected} 감지됨</p>}
      <input
        aria-label="장소 링크"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="네이버지도·카카오맵·인스타·블로그 링크"
        className="w-full rounded-xl border text-sm px-3 py-2 mb-2 bg-white/75"
        style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      {error && <p className="text-xs text-red-400 mb-1.5">{error}</p>}
      <Button className="w-full py-2" onClick={handleSubmit} disabled={loading || !url}>
        {loading ? '추출 중...' : '장소 추가하기'}
      </Button>
    </div>
  )
}
