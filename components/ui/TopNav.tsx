'use client'
import Link from 'next/link'
import { Button } from './Button'

export function TopNav() {
  return (
    <nav className="h-12 bg-[#F5EDFF] border-b border-[rgba(170,96,204,0.22)] flex items-center justify-between px-5 shadow-sm">
      <Link
        href="/"
        className="text-sm font-extrabold tracking-widest"
        style={{
          background: 'linear-gradient(90deg,#AA60CC,#DC6EA0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        DATESPOT
      </Link>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          aria-label="링크 추가"
          onClick={() => document.dispatchEvent(new CustomEvent('open-link-input'))}
        >
          📎 링크 추가
        </Button>
        <Button variant="ghost" aria-label="장소 검색">🔍 장소 검색</Button>
        <Link href="/places"><Button aria-label="장소 저장소">💜 저장소</Button></Link>
      </div>
    </nav>
  )
}
