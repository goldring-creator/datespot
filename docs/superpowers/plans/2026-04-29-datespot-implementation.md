# DATESPOT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 커플 데이트 코스 플래닝 웹앱 — 링크(네이버·카카오·인스타·블로그)로 장소를 공유 DB에 수집하고 Claude AI가 요일·시간·이동수단 맞춤 코스를 생성한다.

**Architecture:** Next.js 15 App Router + Supabase(PostgreSQL·Auth) 풀스택. 링크 파싱은 서버 API Route에서 Playwright로 처리하고, AI 코스 생성은 Claude API + Tmap 이동시간 보정. 지도는 Naver Maps JS API, 커뮤니티 장소 풀은 Supabase RLS로 보호.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase JS v2, @anthropic-ai/sdk, Playwright, Naver Maps JS API, Tmap API, Kakao Local API, KOBIS API, Jest + Testing Library

---

## 파일 구조 (전체)

```
date-course-app/
├── app/
│   ├── (auth)/login/page.tsx          # 로그인 페이지
│   ├── (main)/page.tsx                # 메인: 지도 + 우측 플래너 패널
│   ├── places/page.tsx                # 커뮤니티 장소 저장소
│   ├── courses/[id]/page.tsx          # 저장 코스 상세
│   ├── api/
│   │   ├── scrape/route.ts            # POST: URL → 장소 정보
│   │   ├── course/route.ts            # POST: AI 코스 생성
│   │   ├── search/route.ts            # GET: Kakao Local 검색
│   │   └── events/route.ts            # GET: 영화·전시 목록
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── map/
│   │   ├── NaverMap.tsx               # 지도 렌더러 (dynamic import)
│   │   ├── PlacePin.tsx               # 핀 + 번호 오버레이
│   │   └── RouteOverlay.tsx           # 경로 점선 폴리라인
│   ├── planner/
│   │   ├── RightPanel.tsx             # 우측 패널 컨테이너
│   │   ├── PlannerForm.tsx            # 조건 입력 폼
│   │   ├── CourseResult.tsx           # AI 코스 요약 + 장소 리스트
│   │   └── PlaceCard.tsx              # 장소 1개 카드 (링크·설명 포함)
│   ├── places/
│   │   ├── LinkInput.tsx              # URL 자동감지 입력창
│   │   └── PlaceGrid.tsx              # 커뮤니티 장소 그리드
│   └── ui/
│       ├── TopNav.tsx
│       └── Button.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # 브라우저 클라이언트
│   │   ├── server.ts                  # 서버 클라이언트 (cookies)
│   │   └── types.ts                   # DB 타입 (Place, Course, Bookmark)
│   ├── parsers/
│   │   ├── router.ts                  # URL → 적합한 파서 선택
│   │   ├── naver.ts                   # 네이버지도·플레이스 파서
│   │   ├── kakao.ts                   # 카카오맵 파서
│   │   ├── instagram.ts               # Playwright 인스타 파서
│   │   ├── blog.ts                    # Playwright 블로그 파서
│   │   └── generic.ts                 # 범용 Playwright + Claude Vision
│   ├── apis/
│   │   ├── tmap.ts                    # Tmap 이동시간 API
│   │   ├── kakao-local.ts             # Kakao Local 검색 API
│   │   ├── kobis.ts                   # KOBIS 영화 API
│   │   └── culture.ts                 # 문화공공데이터 전시 API
│   └── claude.ts                      # Claude API 래퍼 (코스 생성)
├── supabase/migrations/
│   └── 001_initial_schema.sql
├── __tests__/
│   ├── parsers/router.test.ts
│   ├── parsers/naver.test.ts
│   ├── parsers/kakao.test.ts
│   ├── api/scrape.test.ts
│   ├── api/course.test.ts
│   └── lib/claude.test.ts
├── .env.local.example
├── jest.config.ts
├── next.config.ts
└── tailwind.config.ts
```

---

## Phase 1: 프로젝트 초기화

### Task 1: Next.js 프로젝트 생성 + 의존성 설치

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- Create: `.env.local.example`
- Create: `jest.config.ts`

- [ ] **Step 1: 프로젝트 생성**

```bash
cd "/Users/goldring/Desktop/creating program"
npx create-next-app@latest date-course-app \
  --typescript --tailwind --eslint --app --src-dir=false \
  --import-alias="@/*"
cd date-course-app
```

- [ ] **Step 2: 추가 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  @anthropic-ai/sdk \
  playwright \
  @testing-library/react @testing-library/jest-dom \
  jest jest-environment-jsdom ts-jest \
  @types/jest
```

- [ ] **Step 3: jest.config.ts 작성**

```typescript
// jest.config.ts
import type { Config } from 'jest'
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathPattern: '__tests__',
}
export default config
```

- [ ] **Step 4: .env.local.example 작성**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=
NAVER_MAP_CLIENT_SECRET=

KAKAO_REST_API_KEY=
NEXT_PUBLIC_KAKAO_JS_KEY=

TMAP_API_KEY=

KOBIS_API_KEY=
CULTURE_API_KEY=

INSTAGRAM_COOKIES_PATH=~/.instagram/goldpic__/cookies.json
```

- [ ] **Step 5: next.config.ts — 외부 이미지 도메인 허용**

```typescript
// next.config.ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdninstagram.com' },
      { hostname: '*.cdninstagram.com' },
      { hostname: 'blogfiles.naver.net' },
    ],
  },
}
export default nextConfig
```

- [ ] **Step 6: 실행 확인**

```bash
npm run dev
```
Expected: `http://localhost:3000` 에서 Next.js 기본 페이지 표시

- [ ] **Step 7: 커밋**

```bash
git init && git add -A
git commit -m "chore: initialize Next.js 15 + dependencies"
```

---

### Task 2: Supabase 프로젝트 + DB 마이그레이션

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Supabase 프로젝트 생성**

[supabase.com](https://supabase.com) → New Project → 이름: `datespot`
Project URL과 anon key를 `.env.local`에 복사.

- [ ] **Step 2: DB 마이그레이션 작성**

```sql
-- supabase/migrations/001_initial_schema.sql

create extension if not exists "uuid-ossp";

create table places (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text check (category in ('cafe','restaurant','exhibition','movie','bar','shopping','park','activity')),
  address       text,
  lat           float8,
  lng           float8,
  description   text,
  naver_url     text,
  instagram_url text,
  source_url    text,
  region        text[],
  tags          text[],
  expires_at    timestamptz,
  submitted_by  uuid references auth.users on delete set null,
  bookmark_count int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

create table bookmarks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users on delete cascade not null,
  place_id   uuid references places on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, place_id)
);

create table courses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users on delete cascade not null,
  title           text not null,
  place_ids       uuid[] not null,
  scheduled_date  date,
  start_time      time,
  end_time        time,
  transport       text check (transport in ('subway','car')),
  ai_description  text,
  is_public       boolean default false,
  created_at      timestamptz default now()
);

-- RLS
alter table places enable row level security;
alter table bookmarks enable row level security;
alter table courses enable row level security;

-- places: 누구나 읽기, 로그인한 유저만 쓰기
create policy "places_read" on places for select using (is_active = true);
create policy "places_insert" on places for insert with check (auth.uid() is not null);

-- bookmarks: 본인 데이터만
create policy "bookmarks_own" on bookmarks using (auth.uid() = user_id);

-- courses: 본인만 + 공개 코스는 읽기 허용
create policy "courses_own" on courses using (auth.uid() = user_id);
create policy "courses_public_read" on courses for select using (is_public = true);
```

Supabase Dashboard → SQL Editor에 붙여넣고 Run 실행.

- [ ] **Step 3: DB 타입 작성**

```typescript
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
```

- [ ] **Step 4: Supabase 브라우저 클라이언트**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Supabase 서버 클라이언트**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add Supabase client + DB schema"
```

---

### Task 3: Auth — Google + 카카오 로그인

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/auth/callback/route.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Supabase Dashboard에서 OAuth 설정**

Dashboard → Authentication → Providers:
- **Google:** Client ID/Secret 입력 (Google Cloud Console에서 발급)
- **Kakao:** Client ID 입력 (Kakao Developers에서 발급)
  - Redirect URI: `{SUPABASE_URL}/auth/v1/callback`

- [ ] **Step 2: Auth callback route 작성**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 3: 로그인 페이지 작성**

```typescript
// app/(auth)/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const signIn = async (provider: 'google' | 'kakao') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, #EFE4FF, #F8E4F4)' }}>
      <div className="bg-white rounded-2xl p-10 shadow-lg flex flex-col gap-4 w-80">
        <h1 className="text-xl font-bold text-center" style={{ color: '#2D1B4E' }}>
          💜 DATESPOT
        </h1>
        <p className="text-sm text-center" style={{ color: '#9060B8' }}>
          함께 쌓아가는 데이트 코스
        </p>
        <button
          onClick={() => signIn('google')}
          className="w-full py-3 rounded-xl border font-semibold text-sm"
          style={{ borderColor: 'rgba(170,96,204,0.3)', color: '#2D1B4E' }}
        >
          Google로 시작하기
        </button>
        <button
          onClick={() => signIn('kakao')}
          className="w-full py-3 rounded-xl font-semibold text-sm text-[#3C1E1E]"
          style={{ background: '#FEE500' }}
        >
          카카오로 시작하기
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: layout.tsx에 기본 메타 설정**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DATESPOT',
  description: '우리만의 데이트 코스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: 로그인 동작 확인**

```bash
npm run dev
```
`http://localhost:3000/login` 접속 → Google/카카오 버튼 표시 확인

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add Google + Kakao OAuth login"
```

---

### Task 4: 디자인 시스템 (Tailwind + CSS 변수)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/TopNav.tsx`

- [ ] **Step 1: tailwind.config.ts — 커스텀 컬러**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      '#EFE4FF',
          panel:   '#F5EDFF',
          primary: '#AA60CC',
          pink:    '#DC6EA0',
          text:    '#2D1B4E',
          muted:   '#9060B8',
          border:  'rgba(170,96,204,0.22)',
        },
      },
    },
  },
}
export default config
```

- [ ] **Step 2: globals.css — 기본 스타일**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #EFE4FF;
  color: #2D1B4E;
  font-family: -apple-system, 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(170,96,204,0.3); border-radius: 2px; }
```

- [ ] **Step 3: Button 컴포넌트**

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80'
  const styles = {
    primary: 'text-white',
    ghost: 'bg-[#F0E4FF] border border-[rgba(170,96,204,0.3)] text-brand-muted',
  }
  const gradientStyle = variant === 'primary'
    ? { background: 'linear-gradient(90deg,#AA60CC,#DC6EA0)', boxShadow: '0 4px 14px rgba(170,96,204,0.35)' }
    : {}

  return (
    <button className={`${base} ${styles[variant]} ${className}`} style={gradientStyle} {...props} />
  )
}
```

- [ ] **Step 4: TopNav 컴포넌트**

```typescript
// components/ui/TopNav.tsx
'use client'
import Link from 'next/link'
import { Button } from './Button'

export function TopNav() {
  return (
    <nav className="h-12 bg-[#F5EDFF] border-b border-[rgba(170,96,204,0.22)] flex items-center justify-between px-5 shadow-sm">
      <Link href="/" className="text-sm font-extrabold tracking-widest"
            style={{ background: 'linear-gradient(90deg,#AA60CC,#DC6EA0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        DATESPOT
      </Link>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => document.dispatchEvent(new CustomEvent('open-link-input'))}>
          📎 링크 추가
        </Button>
        <Button variant="ghost">🔍 장소 검색</Button>
        <Link href="/places"><Button>💜 저장소</Button></Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add design system + TopNav + Button"
```

---

## Phase 2: 지도 + 플래너 UI

### Task 5: Naver Maps 통합

**Files:**
- Create: `components/map/NaverMap.tsx`
- Create: `components/map/PlacePin.tsx`
- Create: `components/map/RouteOverlay.tsx`

> Naver Maps JS API는 SSR에서 작동하지 않으므로 `dynamic import + ssr:false` 필수.

- [ ] **Step 1: NaverMap.tsx 작성**

```typescript
// components/map/NaverMap.tsx
'use client'
import { useEffect, useRef } from 'react'
import type { CoursePlace } from '@/lib/supabase/types'

interface NaverMapProps {
  places: CoursePlace[]
  center?: { lat: number; lng: number }
}

declare global {
  interface Window { naver: any }
}

export function NaverMap({ places, center }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`
    script.onload = initMap
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) renderPlaces()
  }, [places])

  function initMap() {
    if (!mapRef.current) return
    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(
        center?.lat ?? 37.5443,
        center?.lng ?? 127.0557
      ),
      zoom: 14,
      mapTypeId: window.naver.maps.MapTypeId.NORMAL,
    })
    renderPlaces()
  }

  function renderPlaces() {
    const map = mapInstanceRef.current
    if (!map || !window.naver) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    polylineRef.current?.setMap(null)

    const coords = places
      .filter(p => p.lat && p.lng)
      .map((p, i) => {
        const pos = new window.naver.maps.LatLng(p.lat!, p.lng!)
        const marker = new window.naver.maps.Marker({
          position: pos,
          map,
          icon: {
            content: `<div style="background:linear-gradient(135deg,#AA60CC,#DC6EA0);color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 0 0 5px rgba(170,96,204,0.22)">${i + 1}</div>`,
            anchor: new window.naver.maps.Point(17, 17),
          },
        })
        markersRef.current.push(marker)
        return pos
      })

    if (coords.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        path: coords,
        map,
        strokeColor: '#AA60CC',
        strokeWeight: 3,
        strokeStyle: 'shortdash',
        strokeOpacity: 0.75,
      })
    }

    if (coords.length > 0) {
      map.setCenter(coords[Math.floor(coords.length / 2)])
    }
  }

  return (
    <div ref={mapRef} className="w-full h-full"
         style={{ background: 'linear-gradient(150deg,#D8C4F4,#E8D0F8,#F4C8E8)' }} />
  )
}
```

- [ ] **Step 2: dynamic import wrapper (SSR 비활성화)**

```typescript
// app/(main)/page.tsx 에서 사용할 때:
// import dynamic from 'next/dynamic'
// const NaverMap = dynamic(() => import('@/components/map/NaverMap').then(m => m.NaverMap), { ssr: false })
// — Task 7에서 실제 연결
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: add NaverMap component with pin + polyline rendering"
```

---

### Task 6: PlannerForm 컴포넌트

**Files:**
- Create: `components/planner/PlannerForm.tsx`

- [ ] **Step 1: PlannerForm 작성**

```typescript
// components/planner/PlannerForm.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Transport } from '@/lib/supabase/types'

import type { PlannerOptions } from '@/lib/supabase/types'

interface PlannerFormProps {
  onSubmit: (options: PlannerOptions) => void
  loading: boolean
}

const REGIONS = ['성수·뚝섬', '한남·이태원', '홍대·합정', '강남·청담', '종로·인사동', '여의도', '잠실', '신촌·연대']
const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
const MOODS = ['선택 안 함', '로맨틱', '액티브', '문화·예술', '맛집 위주', '야외']

export function PlannerForm({ onSubmit, loading }: PlannerFormProps) {
  const [opts, setOpts] = useState<PlannerOptions>({
    region: '성수·뚝섬',
    dayOfWeek: '토요일',
    startTime: '14:00',
    endTime: '20:00',
    transport: 'subway',
    mood: '선택 안 함',
  })

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick}
      className="flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all"
      style={{
        background: active ? 'linear-gradient(90deg,#AA60CC,#DC6EA0)' : 'rgba(255,255,255,0.75)',
        color: active ? 'white' : '#7830A8',
        borderColor: active ? 'transparent' : 'rgba(170,96,204,0.28)',
      }}>
      {label}
    </button>
  )

  return (
    <div className="p-4" style={{ background: 'linear-gradient(160deg,#EFE4FF,#F8E4F4)' }}>
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9040B8' }}>✨ 코스 플래너</p>

      <div className="mb-2">
        <label className="text-xs text-brand-muted mb-1 block">지역</label>
        <select value={opts.region} onChange={e => setOpts(o => ({ ...o, region: e.target.value }))}
          className="w-full rounded-xl border text-sm px-3 py-2 bg-white/75"
          style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }}>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="text-xs text-brand-muted mb-1 block">요일</label>
          <select value={opts.dayOfWeek} onChange={e => setOpts(o => ({ ...o, dayOfWeek: e.target.value }))}
            className="w-full rounded-xl border text-xs px-3 py-2 bg-white/75"
            style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-brand-muted mb-1 block">분위기</label>
          <select value={opts.mood} onChange={e => setOpts(o => ({ ...o, mood: e.target.value }))}
            className="w-full rounded-xl border text-xs px-3 py-2 bg-white/75"
            style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }}>
            {MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="text-xs text-brand-muted mb-1 block">시작</label>
          <input type="time" value={opts.startTime}
            onChange={e => setOpts(o => ({ ...o, startTime: e.target.value }))}
            className="w-full rounded-xl border text-sm px-3 py-2 bg-white/75"
            style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-brand-muted mb-1 block">종료</label>
          <input type="time" value={opts.endTime}
            onChange={e => setOpts(o => ({ ...o, endTime: e.target.value }))}
            className="w-full rounded-xl border text-sm px-3 py-2 bg-white/75"
            style={{ borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }} />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {chip('🚇 대중교통', opts.transport === 'subway', () => setOpts(o => ({ ...o, transport: 'subway' })))}
        {chip('🚗 자동차', opts.transport === 'car', () => setOpts(o => ({ ...o, transport: 'car' })))}
      </div>

      <Button className="w-full py-3" onClick={() => onSubmit(opts)} disabled={loading}>
        {loading ? '코스 생성 중...' : '✨ AI 코스 추천받기'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "feat: add PlannerForm component"
```

---

### Task 7: PlaceCard + CourseResult + RightPanel

**Files:**
- Create: `components/planner/PlaceCard.tsx`
- Create: `components/planner/CourseResult.tsx`
- Create: `components/planner/RightPanel.tsx`

- [ ] **Step 1: PlaceCard 작성**

```typescript
// components/planner/PlaceCard.tsx
import type { CoursePlace } from '@/lib/supabase/types'

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽', exhibition: '🎨', movie: '🎬',
  bar: '🍷', shopping: '🛍', park: '🌿', activity: '🎯',
}

interface PlaceCardProps {
  place: CoursePlace
  index: number
  travelMinutes: number | null
  travelMode: string | null
}

export function PlaceCard({ place, index, travelMinutes, travelMode }: PlaceCardProps) {
  const emoji = CATEGORY_EMOJI[place.category ?? ''] ?? '📍'

  return (
    <>
      <div className="rounded-xl p-3 mb-2 relative"
           style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(170,96,204,0.2)' }}>
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style={{ background: 'linear-gradient(135deg,#AA60CC,#DC6EA0)' }}>
          {index + 1}
        </div>
        <p className="text-xs font-bold mb-0.5" style={{ color: '#9040B8' }}>
          {emoji} {place.category} · {place.visit_time}
        </p>
        <p className="text-sm font-bold mb-0.5" style={{ color: '#2D1B4E' }}>{place.name}</p>
        {place.address && <p className="text-xs mb-1.5" style={{ color: '#A088B8' }}>{place.address}</p>}
        {place.description && <p className="text-xs leading-relaxed mb-2" style={{ color: '#5D407A' }}>{place.description}</p>}
        <div className="flex gap-1.5">
          {place.naver_url && (
            <a href={place.naver_url} target="_blank" rel="noopener"
               className="text-xs px-2 py-1 rounded-md font-medium"
               style={{ background: '#E8FFF2', border: '1px solid rgba(3,199,90,0.35)', color: '#047A38' }}>
              🟢 네이버지도
            </a>
          )}
          {place.instagram_url && (
            <a href={place.instagram_url} target="_blank" rel="noopener"
               className="text-xs px-2 py-1 rounded-md font-medium"
               style={{ background: '#FFE8F2', border: '1px solid rgba(220,110,160,0.4)', color: '#B84878' }}>
              📸 인스타
            </a>
          )}
        </div>
      </div>

      {travelMinutes !== null && (
        <div className="flex items-center gap-2 mb-2 px-1 text-xs" style={{ color: '#A088B8' }}>
          <div className="flex-1 h-px" style={{ background: 'rgba(170,96,204,0.2)' }} />
          {travelMode === 'walk' ? '🚶' : travelMode === 'subway' ? '🚇' : '🚗'} {travelMinutes}분
          <div className="flex-1 h-px" style={{ background: 'rgba(170,96,204,0.2)' }} />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: CourseResult 작성**

```typescript
// components/planner/CourseResult.tsx
import type { GeneratedCourse } from '@/lib/supabase/types'
import { PlaceCard } from './PlaceCard'

interface CourseResultProps {
  course: GeneratedCourse
}

export function CourseResult({ course }: CourseResultProps) {
  return (
    <>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(170,96,204,0.14)', background: '#F5EDFF' }}>
        <p className="text-sm font-bold mb-1" style={{ color: '#2D1B4E' }}>{course.title}</p>
        <div className="flex gap-3 text-xs" style={{ color: '#9060B8' }}>
          <span>🗺 {course.places.length}곳</span>
          <span>⏱ 약 {Math.round(
            course.places.reduce((acc, p) => acc + p.duration_minutes + (p.travel_to_next_minutes ?? 0), 0) / 60
          )}시간</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {course.places.map((place, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            index={i}
            travelMinutes={place.travel_to_next_minutes}
            travelMode={place.travel_mode}
          />
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 3: RightPanel 작성**

```typescript
// components/planner/RightPanel.tsx
'use client'
import { useState } from 'react'
import { PlannerForm, PlannerOptions } from './PlannerForm'
import { CourseResult } from './CourseResult'
import type { GeneratedCourse } from '@/lib/supabase/types'

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
    } catch (e: any) {
      setError(e.message)
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
```

- [ ] **Step 4: 메인 페이지 조립**

```typescript
// app/(main)/page.tsx
'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { TopNav } from '@/components/ui/TopNav'
import { RightPanel } from '@/components/planner/RightPanel'
import type { GeneratedCourse } from '@/lib/supabase/types'

const NaverMap = dynamic(
  () => import('@/components/map/NaverMap').then(m => m.NaverMap),
  { ssr: false, loading: () => <div className="w-full h-full" style={{ background: 'linear-gradient(150deg,#D8C4F4,#F4C8E8)' }} /> }
)

export default function MainPage() {
  const [course, setCourse] = useState<GeneratedCourse | null>(null)

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <NaverMap places={course?.places ?? []} />
          <div className="absolute top-4 left-4 bg-white/88 rounded-full px-4 py-1.5 text-xs font-semibold border"
               style={{ color: '#6B3A96', borderColor: 'rgba(170,96,204,0.32)' }}>
            📍 {course ? course.places[0]?.region?.[0] ?? '전체' : '지역 선택'}
          </div>
        </main>
        <RightPanel onCourseGenerated={setCourse} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 화면 확인**

```bash
npm run dev
```
`http://localhost:3000` → 지도(라벤더 배경) + 우측 플래너 패널 렌더링 확인

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: assemble main page with map + right panel"
```

---

## Phase 3: 링크 파서

### Task 8: URL 라우터 + 타입

**Files:**
- Create: `lib/parsers/router.ts`
- Create: `__tests__/parsers/router.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// __tests__/parsers/router.test.ts
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/parsers/router.test.ts
```
Expected: FAIL (detectSource not defined)

- [ ] **Step 3: router.ts 구현**

```typescript
// lib/parsers/router.ts
export type UrlSource = 'naver' | 'kakao' | 'instagram' | 'blog' | 'google' | 'generic'

export interface ParsedPlace {
  name: string
  category?: string
  address?: string
  lat?: number
  lng?: number
  naverUrl?: string
  instagramUrl?: string
  sourceUrl: string
}

export function detectSource(url: string): UrlSource {
  const u = url.toLowerCase()
  if (u.includes('map.naver.com') || u.includes('naver.com/local')) return 'naver'
  if (u.includes('map.kakao.com') || u.includes('kko.to')) return 'kakao'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('blog.naver.com') || u.includes('tistory.com') || u.includes('brunch.co.kr')) return 'blog'
  if (u.includes('maps.google.com') || u.includes('goo.gl/maps')) return 'google'
  return 'generic'
}

export async function parseUrl(url: string): Promise<ParsedPlace | null> {
  const source = detectSource(url)
  switch (source) {
    case 'naver': {
      const { parseNaverUrl } = await import('./naver')
      return parseNaverUrl(url)
    }
    case 'kakao': {
      const { parseKakaoUrl } = await import('./kakao')
      return parseKakaoUrl(url)
    }
    case 'instagram': {
      const { parseInstagramUrl } = await import('./instagram')
      return parseInstagramUrl(url)
    }
    case 'blog': {
      const { parseBlogUrl } = await import('./blog')
      return parseBlogUrl(url)
    }
    case 'google': {
      const { parseGoogleMapsUrl } = await import('./naver')
      return parseGoogleMapsUrl(url)
    }
    default: {
      const { parseGenericUrl } = await import('./generic')
      return parseGenericUrl(url)
    }
  }
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/parsers/router.test.ts
```
Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add URL source router with tests"
```

---

### Task 9: 네이버·카카오·구글맵 파서

**Files:**
- Create: `lib/parsers/naver.ts`
- Create: `lib/parsers/kakao.ts`
- Create: `__tests__/parsers/naver.test.ts`

- [ ] **Step 1: 네이버 파서 테스트**

```typescript
// __tests__/parsers/naver.test.ts
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/parsers/naver.test.ts
```

- [ ] **Step 3: naver.ts 구현**

```typescript
// lib/parsers/naver.ts
import type { ParsedPlace } from './router'

export function extractNaverPlaceId(url: string): string | null {
  const entryMatch = url.match(/entry\/place\/(\d+)/)
  if (entryMatch) return entryMatch[1]
  const queryMatch = url.match(/[?&]place=(\d+)/)
  if (queryMatch) return queryMatch[1]
  return null
}

export async function parseNaverUrl(url: string): Promise<ParsedPlace | null> {
  const placeId = extractNaverPlaceId(url)
  if (!placeId) return null

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${placeId}&display=1`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_MAP_CLIENT_SECRET!,
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    name: item.title.replace(/<[^>]+>/g, ''),
    category: mapNaverCategory(item.category),
    address: item.roadAddress || item.address,
    lat: parseFloat(item.mapy) / 1e7,
    lng: parseFloat(item.mapx) / 1e7,
    naverUrl: url,
    sourceUrl: url,
  }
}

export async function parseGoogleMapsUrl(url: string): Promise<ParsedPlace | null> {
  const coordMatch = url.match(/@([-\d.]+),([-\d.]+)/)
  if (!coordMatch) return null
  return {
    name: '구글맵 장소',
    lat: parseFloat(coordMatch[1]),
    lng: parseFloat(coordMatch[2]),
    sourceUrl: url,
  }
}

function mapNaverCategory(cat: string): string {
  if (cat.includes('카페')) return 'cafe'
  if (cat.includes('음식') || cat.includes('식당')) return 'restaurant'
  if (cat.includes('전시') || cat.includes('박물관')) return 'exhibition'
  if (cat.includes('영화')) return 'movie'
  if (cat.includes('쇼핑')) return 'shopping'
  if (cat.includes('공원')) return 'park'
  return 'activity'
}
```

- [ ] **Step 4: kakao.ts 구현**

```typescript
// lib/parsers/kakao.ts
import type { ParsedPlace } from './router'

export async function parseKakaoUrl(url: string): Promise<ParsedPlace | null> {
  // kko.to 단축 URL은 먼저 리다이렉트 추적
  let finalUrl = url
  if (url.includes('kko.to')) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      finalUrl = res.url
    } catch { return null }
  }

  // map.kakao.com/link/map/{name},{lat},{lng}
  const linkMatch = finalUrl.match(/\/link\/map\/([^,]+),([-\d.]+),([-\d.]+)/)
  if (linkMatch) {
    return {
      name: decodeURIComponent(linkMatch[1]),
      lat: parseFloat(linkMatch[2]),
      lng: parseFloat(linkMatch[3]),
      sourceUrl: url,
    }
  }

  // place ID 추출 후 Kakao Local API 조회
  const placeMatch = finalUrl.match(/\/place\/(\d+)/)
  if (placeMatch) {
    return fetchKakaoPlace(placeMatch[1], url)
  }

  return null
}

async function fetchKakaoPlace(placeId: string, sourceUrl: string): Promise<ParsedPlace | null> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${placeId}&size=1`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const doc = data.documents?.[0]
  if (!doc) return null

  return {
    name: doc.place_name,
    category: mapKakaoCategory(doc.category_group_code),
    address: doc.road_address_name || doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    sourceUrl,
  }
}

function mapKakaoCategory(code: string): string {
  const map: Record<string, string> = {
    CE7: 'cafe', FD6: 'restaurant', CT1: 'exhibition',
    MT1: 'shopping', AT4: 'park',
  }
  return map[code] ?? 'activity'
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npx jest __tests__/parsers/naver.test.ts
```
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add Naver + Kakao + Google Maps URL parsers"
```

---

### Task 10: 인스타그램 Playwright 파서

**Files:**
- Create: `lib/parsers/instagram.ts`

> goldpic__ 세션 쿠키는 `instagram` 스킬로 저장된 경로 (`INSTAGRAM_COOKIES_PATH`) 를 사용.

- [ ] **Step 1: instagram.ts 구현**

```typescript
// lib/parsers/instagram.ts
import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import type { ParsedPlace } from './router'

const COOKIES_PATH = process.env.INSTAGRAM_COOKIES_PATH
  ?? path.join(process.env.HOME!, '.instagram/goldpic__/cookies.json')

export async function parseInstagramUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  // 저장된 쿠키 로드
  if (fs.existsSync(COOKIES_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'))
    await context.addCookies(cookies)
  }

  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    // 1. 위치 태그 (DOM 직접 추출)
    const locationEl = await page.$('[data-testid="location-name"], a[href*="/explore/locations/"]')
    if (locationEl) {
      const locationText = await locationEl.innerText()
      if (locationText.trim()) {
        await browser.close()
        return { name: locationText.trim(), sourceUrl: url, instagramUrl: url }
      }
    }

    // 2. 캡션에서 📍 또는 해시태그 파싱
    const caption = await page.$eval(
      '[data-testid="post-comment-root"] span, article span',
      (el: Element) => el.textContent ?? '',
    ).catch(() => '')

    const pinMatch = caption.match(/📍\s*([^\n#@]+)/)
    if (pinMatch) {
      await browser.close()
      return { name: pinMatch[1].trim(), sourceUrl: url, instagramUrl: url }
    }

    // 3. Claude Vision 분석 (이미지에서 장소 추출)
    const imgSrc = await page.$eval('article img', (el: HTMLImageElement) => el.src).catch(() => null)
    if (imgSrc) {
      const place = await extractPlaceFromImage(imgSrc, url)
      if (place) { await browser.close(); return place }
    }

    await browser.close()
    return null
  } catch {
    await browser.close()
    return null
  }
}

async function extractPlaceFromImage(imageUrl: string, sourceUrl: string): Promise<ParsedPlace | null> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic()

    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')
    const mediaType = 'image/jpeg'

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: '이 사진에서 장소(카페·식당·전시 등) 이름이나 위치 힌트가 보이면 JSON으로 답해줘: {"name": "장소명", "address": "주소(있으면)"}. 없으면 null.' },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[^}]+\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.name) return null

    return { name: parsed.name, address: parsed.address, sourceUrl, instagramUrl: sourceUrl }
  } catch { return null }
}
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "feat: add Instagram Playwright parser with Vision fallback"
```

---

### Task 11: 블로그·범용 파서

**Files:**
- Create: `lib/parsers/blog.ts`
- Create: `lib/parsers/generic.ts`

- [ ] **Step 1: blog.ts 구현**

```typescript
// lib/parsers/blog.ts
import { chromium } from 'playwright'
import type { ParsedPlace } from './router'

export async function parseBlogUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    // 네이버 블로그: 본문 iframe 진입
    if (url.includes('blog.naver.com')) {
      const frame = page.frame({ name: 'mainFrame' }) ?? page
      const mapLink = await frame.$('a[href*="map.naver.com"], a[href*="kko.to"]')
      if (mapLink) {
        const href = await mapLink.getAttribute('href')
        if (href) {
          await browser.close()
          // 재귀적으로 해당 지도 링크 파싱
          const { parseUrl } = await import('./router')
          return parseUrl(href)
        }
      }
    }

    // 모든 블로그: 내부 지도 링크 탐색
    const mapLinks = await page.$$eval(
      'a[href*="map.naver.com"], a[href*="map.kakao.com"], a[href*="kko.to"]',
      (els: Element[]) => els.map(el => el.getAttribute('href')).filter(Boolean)
    )
    if (mapLinks.length > 0) {
      await browser.close()
      const { parseUrl } = await import('./router')
      return parseUrl(mapLinks[0] as string)
    }

    // 텍스트에서 장소명 + 주소 추출 시도
    const bodyText = await page.$eval('article, .se-main-container, #postViewArea, body',
      (el: Element) => el.textContent?.slice(0, 2000) ?? ''
    ).catch(() => '')

    await browser.close()
    return extractPlaceFromText(bodyText, url)
  } catch {
    await browser.close()
    return null
  }
}

function extractPlaceFromText(text: string, sourceUrl: string): ParsedPlace | null {
  const pinMatch = text.match(/📍\s*([^\n]{2,30})/)
  if (pinMatch) return { name: pinMatch[1].trim(), sourceUrl }

  const addrMatch = text.match(/서울\s+\S+구\s+\S+/)
  if (addrMatch) return { address: addrMatch[0], name: addrMatch[0], sourceUrl }

  return null
}
```

- [ ] **Step 2: generic.ts 구현**

```typescript
// lib/parsers/generic.ts
import { chromium } from 'playwright'
import type { ParsedPlace } from './router'

export async function parseGenericUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 })

    // schema.org LocalBusiness 마크업 추출
    const jsonLd = await page.$$eval('script[type="application/ld+json"]',
      (els: Element[]) => els.map(el => {
        try { return JSON.parse(el.textContent ?? '') } catch { return null }
      }).filter(Boolean)
    )

    for (const schema of jsonLd) {
      if (schema['@type'] === 'LocalBusiness' || schema['@type'] === 'Restaurant' || schema['@type'] === 'CafeOrCoffeeShop') {
        const geo = schema.geo
        await browser.close()
        return {
          name: schema.name,
          address: schema.address?.streetAddress ?? schema.address,
          lat: geo?.latitude ? parseFloat(geo.latitude) : undefined,
          lng: geo?.longitude ? parseFloat(geo.longitude) : undefined,
          sourceUrl: url,
        }
      }
    }

    // OG 태그 최후 수단
    const ogTitle = await page.$eval('meta[property="og:title"]', (el: Element) => el.getAttribute('content')).catch(() => null)
    await browser.close()
    if (ogTitle) return { name: ogTitle, sourceUrl: url }
    return null
  } catch {
    await browser.close()
    return null
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: add blog + generic Playwright parsers"
```

---

### Task 12: Scrape API Route + LinkInput UI

**Files:**
- Create: `app/api/scrape/route.ts`
- Create: `components/places/LinkInput.tsx`
- Create: `__tests__/api/scrape.test.ts`

- [ ] **Step 1: scrape API 테스트 작성**

```typescript
// __tests__/api/scrape.test.ts
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/api/scrape.test.ts
```

- [ ] **Step 3: scrape route 구현**

```typescript
// app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseUrl } from '@/lib/parsers/router'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { url } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  const place = await parseUrl(url)
  if (!place) {
    return NextResponse.json({ error: '장소를 찾을 수 없습니다' }, { status: 422 })
  }

  // Supabase에 저장 (로그인한 경우)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: place.name,
        category: place.category ?? null,
        address: place.address ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
        naver_url: place.naverUrl ?? null,
        instagram_url: place.instagramUrl ?? null,
        source_url: place.sourceUrl,
        submitted_by: user.id,
      })
      .select()
      .single()

    if (!error && data) return NextResponse.json(data)
  }

  return NextResponse.json(place)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/api/scrape.test.ts
```
Expected: PASS

- [ ] **Step 5: LinkInput 컴포넌트**

```typescript
// components/places/LinkInput.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { detectSource } from '@/lib/parsers/router'

const SOURCE_LABELS: Record<string, string> = {
  naver: '🟢 네이버지도',
  kakao: '🟡 카카오맵',
  instagram: '📸 인스타그램',
  blog: '📝 블로그',
  google: '🗺 구글맵',
  generic: '🔗 일반 링크',
}

interface LinkInputProps {
  onSuccess: (place: any) => void
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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white/80 rounded-2xl border" style={{ borderColor: 'rgba(170,96,204,0.2)' }}>
      <p className="text-xs font-bold mb-2" style={{ color: '#9040B8' }}>📎 링크로 장소 추가</p>
      {detected && <p className="text-xs mb-1.5" style={{ color: '#AA60CC' }}>{detected} 감지됨</p>}
      <input
        value={url} onChange={e => setUrl(e.target.value)}
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
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add scrape API route + LinkInput component"
```

---

## Phase 4: AI 코스 생성

### Task 13: Claude API 래퍼

**Files:**
- Create: `lib/claude.ts`
- Create: `__tests__/lib/claude.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// __tests__/lib/claude.test.ts
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/lib/claude.test.ts
```

- [ ] **Step 3: claude.ts 구현**

```typescript
// lib/claude.ts
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

export async function generateCourse(places: Place[], opts: {
  region: string; dayOfWeek: string; startTime: string; endTime: string; transport: string; mood: string
}): Promise<GeneratedCourse> {
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

  // Place 데이터를 CoursePlace로 병합
  const coursePlaces = raw.places.map((cp: any) => {
    const place = places.find(p => p.id === cp.id)
    if (!place) throw new Error(`장소 ID ${cp.id} 없음`)
    return { ...place, ...cp }
  })

  return { title: raw.title, description: raw.description, places: coursePlaces }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/claude.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add Claude API wrapper with course generation"
```

---

### Task 14: Tmap 이동시간 보정 + Course API Route

**Files:**
- Create: `lib/apis/tmap.ts`
- Create: `app/api/course/route.ts`
- Create: `__tests__/api/course.test.ts`

- [ ] **Step 1: tmap.ts 구현**

```typescript
// lib/apis/tmap.ts
interface TravelTime {
  minutes: number
  mode: string
}

export async function getTravelTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  transport: 'subway' | 'car'
): Promise<TravelTime> {
  if (transport === 'car') {
    const res = await fetch('https://apis.openapi.sk.com/tmap/routes?version=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        appKey: process.env.TMAP_API_KEY!,
      },
      body: JSON.stringify({
        startX: from.lng, startY: from.lat,
        endX: to.lng, endY: to.lat,
        reqCoordType: 'WGS84GEO', resCoordType: 'WGS84GEO',
      }),
    })
    if (!res.ok) return { minutes: 20, mode: 'car' }
    const data = await res.json()
    const seconds = data.features?.[0]?.properties?.totalTime ?? 1200
    return { minutes: Math.ceil(seconds / 60), mode: 'car' }
  }

  // 대중교통: Tmap 대중교통 API
  const res = await fetch(
    `https://apis.openapi.sk.com/transit/routes?version=1&startX=${from.lng}&startY=${from.lat}&endX=${to.lng}&endY=${to.lat}&count=1`,
    { headers: { appKey: process.env.TMAP_API_KEY! } }
  )
  if (!res.ok) return { minutes: 25, mode: 'subway' }
  const data = await res.json()
  const minutes = data.metaData?.plan?.itineraries?.[0]?.duration
    ? Math.ceil(data.metaData.plan.itineraries[0].duration / 60)
    : 25
  return { minutes, mode: 'subway' }
}
```

- [ ] **Step 2: course API route 구현**

```typescript
// app/api/course/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCourse } from '@/lib/claude'
import { getTravelTime } from '@/lib/apis/tmap'
import type { Place } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const opts = await req.json().catch(() => null)
  if (!opts?.region) return NextResponse.json({ error: 'region required' }, { status: 400 })

  const supabase = await createClient()

  // 지역 장소 조회 (region 배열에 포함되는 것)
  const { data: places, error } = await supabase
    .from('places')
    .select('*')
    .contains('region', [opts.region.split('·')[0]])
    .eq('is_active', true)
    .is('expires_at', null)
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!places || places.length === 0) {
    return NextResponse.json({ error: '해당 지역에 저장된 장소가 없습니다' }, { status: 404 })
  }

  // AI 코스 생성
  const course = await generateCourse(places as Place[], opts)

  // Tmap으로 실제 이동시간 보정
  for (let i = 0; i < course.places.length - 1; i++) {
    const from = course.places[i]
    const to = course.places[i + 1]
    if (from.lat && from.lng && to.lat && to.lng) {
      const travel = await getTravelTime(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng },
        opts.transport
      )
      course.places[i].travel_to_next_minutes = travel.minutes
      course.places[i].travel_mode = travel.mode
    }
  }

  return NextResponse.json(course)
}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: add course API route with Tmap travel time correction"
```

---

## Phase 5: 검색·이벤트

### Task 15: Kakao Local 검색 API

**Files:**
- Create: `lib/apis/kakao-local.ts`
- Create: `app/api/search/route.ts`

- [ ] **Step 1: kakao-local.ts 구현**

```typescript
// lib/apis/kakao-local.ts
import type { ParsedPlace } from '@/lib/parsers/router'

export async function searchKakaoLocal(query: string, region?: string): Promise<ParsedPlace[]> {
  const params = new URLSearchParams({ query: region ? `${region} ${query}` : query, size: '5' })
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  })
  if (!res.ok) return []

  const data = await res.json()
  return (data.documents ?? []).map((doc: any) => ({
    name: doc.place_name,
    category: mapCategory(doc.category_group_code),
    address: doc.road_address_name || doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    naverUrl: undefined,
    sourceUrl: doc.place_url,
  }))
}

function mapCategory(code: string): string {
  const map: Record<string, string> = {
    CE7: 'cafe', FD6: 'restaurant', CT1: 'exhibition', MT1: 'shopping', AT4: 'park',
  }
  return map[code] ?? 'activity'
}
```

- [ ] **Step 2: search route 구현**

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchKakaoLocal } from '@/lib/apis/kakao-local'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const region = req.nextUrl.searchParams.get('region') ?? undefined
  if (!q) return NextResponse.json([], { status: 400 })

  const results = await searchKakaoLocal(q, region)
  return NextResponse.json(results)
}
```

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: add Kakao Local search API"
```

---

### Task 16: KOBIS 영화 + 문화 전시 API

**Files:**
- Create: `lib/apis/kobis.ts`
- Create: `lib/apis/culture.ts`
- Create: `app/api/events/route.ts`

- [ ] **Step 1: kobis.ts 구현**

```typescript
// lib/apis/kobis.ts
import type { Place } from '@/lib/supabase/types'

export async function fetchCurrentMovies(): Promise<Partial<Place>[]> {
  const today = new Date()
  const targetDate = new Date(today.setDate(today.getDate() - 1))
    .toISOString().slice(0, 10).replace(/-/g, '')

  const res = await fetch(
    `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json?key=${process.env.KOBIS_API_KEY}&targetDt=${targetDate}&weekGb=0`
  )
  if (!res.ok) return []
  const data = await res.json()

  return (data.boxOfficeResult?.weeklyBoxOfficeList ?? []).slice(0, 10).map((item: any) => ({
    name: item.movieNm,
    category: 'movie' as const,
    description: `박스오피스 ${item.rank}위 · ${parseInt(item.audiCnt).toLocaleString()}명 관람`,
    is_active: true,
  }))
}
```

- [ ] **Step 2: culture.ts 구현**

```typescript
// lib/apis/culture.ts
import type { Place } from '@/lib/supabase/types'

export async function fetchCurrentExhibitions(): Promise<Partial<Place>[]> {
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(
    `http://www.culture.go.kr/openapi/rest/publicperformancedisplays/period?serviceKey=${process.env.CULTURE_API_KEY}&from=${today}&to=${today}&rows=10&place=서울&type=D`
  )
  if (!res.ok) return []

  try {
    const text = await res.text()
    const items = [...text.matchAll(/<title>([^<]+)<\/title>.*?<startDate>([^<]+)<\/startDate>.*?<endDate>([^<]+)<\/endDate>/gs)]
    return items.slice(0, 10).map(m => ({
      name: m[1],
      category: 'exhibition' as const,
      description: `${m[2]} ~ ${m[3]}`,
      expires_at: new Date(m[3]).toISOString(),
      is_active: true,
    }))
  } catch { return [] }
}
```

- [ ] **Step 3: events route 구현**

```typescript
// app/api/events/route.ts
import { NextResponse } from 'next/server'
import { fetchCurrentMovies } from '@/lib/apis/kobis'
import { fetchCurrentExhibitions } from '@/lib/apis/culture'

export const revalidate = 3600 // 1시간 캐시

export async function GET() {
  const [movies, exhibitions] = await Promise.all([
    fetchCurrentMovies(),
    fetchCurrentExhibitions(),
  ])
  return NextResponse.json({ movies, exhibitions })
}
```

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add KOBIS + culture exhibition API routes"
```

---

## Phase 6: 커뮤니티 장소 저장소

### Task 17: Places 페이지

**Files:**
- Create: `components/places/PlaceGrid.tsx`
- Create: `app/places/page.tsx`

- [ ] **Step 1: PlaceGrid 컴포넌트**

```typescript
// components/places/PlaceGrid.tsx
'use client'
import type { Place } from '@/lib/supabase/types'

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽', exhibition: '🎨', movie: '🎬',
  bar: '🍷', shopping: '🛍', park: '🌿', activity: '🎯',
}

const CATEGORIES = ['전체', 'cafe', 'restaurant', 'exhibition', 'movie', 'park', 'activity']

interface PlaceGridProps {
  places: Place[]
}

export function PlaceGrid({ places }: PlaceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {places.map(place => (
        <div key={place.id} className="rounded-2xl overflow-hidden border"
             style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(170,96,204,0.2)' }}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{CATEGORY_EMOJI[place.category ?? ''] ?? '📍'}</span>
              <span className="text-xs font-bold" style={{ color: '#9040B8' }}>{place.category}</span>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#2D1B4E' }}>{place.name}</h3>
            {place.address && <p className="text-xs mb-2" style={{ color: '#A088B8' }}>{place.address}</p>}
            {place.description && <p className="text-xs leading-relaxed mb-3" style={{ color: '#5D407A' }}>{place.description}</p>}
            <div className="flex gap-1.5">
              {place.naver_url && (
                <a href={place.naver_url} target="_blank" rel="noopener"
                   className="text-xs px-2 py-1 rounded-lg"
                   style={{ background: '#E8FFF2', border: '1px solid rgba(3,199,90,0.3)', color: '#047A38' }}>
                  🟢 지도
                </a>
              )}
              <span className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: '#EDE0FF', color: '#7830A8' }}>
                💜 {place.bookmark_count}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: places 페이지**

```typescript
// app/places/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/ui/TopNav'
import { PlaceGrid } from '@/components/places/PlaceGrid'

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>
}) {
  const { region, category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('bookmark_count', { ascending: false })
    .limit(48)

  if (region) query = query.contains('region', [region])
  if (category) query = query.eq('category', category)

  const { data: places } = await query

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-2" style={{ color: '#2D1B4E' }}>
          💜 장소 저장소
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9060B8' }}>
          유저들이 함께 모은 데이트 장소들
        </p>
        <PlaceGrid places={places ?? []} />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 동작 확인**

```bash
npm run dev
```
`http://localhost:3000/places` → 저장된 장소 그리드 표시 확인

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add community places page + PlaceGrid"
```

---

### Task 18: 저장 코스 상세 페이지 (/courses/[id])

**Files:**
- Create: `app/courses/[id]/page.tsx`

- [ ] **Step 1: 코스 상세 페이지 구현**

```typescript
// app/courses/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/ui/TopNav'
import { notFound } from 'next/navigation'
import type { CoursePlace } from '@/lib/supabase/types'
import { PlaceCard } from '@/components/planner/PlaceCard'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: places } = await supabase
    .from('places')
    .select('*')
    .in('id', course.place_ids)

  const orderedPlaces = course.place_ids.map((pid: string) =>
    places?.find(p => p.id === pid)
  ).filter(Boolean) as CoursePlace[]

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#2D1B4E' }}>{course.title}</h1>
        {course.ai_description && (
          <p className="text-sm mb-4" style={{ color: '#9060B8' }}>{course.ai_description}</p>
        )}
        <div className="flex gap-4 text-xs mb-6" style={{ color: '#A088B8' }}>
          {course.scheduled_date && <span>📅 {course.scheduled_date}</span>}
          {course.start_time && <span>⏰ {course.start_time} ~ {course.end_time}</span>}
          {course.transport && <span>{course.transport === 'subway' ? '🚇 대중교통' : '🚗 자동차'}</span>}
        </div>
        {orderedPlaces.map((place, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            index={i}
            travelMinutes={place.travel_to_next_minutes}
            travelMode={place.travel_mode}
          />
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "feat: add saved course detail page"
```

---

## Phase 7: 마무리

### Task 18: 전체 테스트 + 환경변수 확인

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx jest --passWithNoTests
```
Expected: 모든 테스트 PASS

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 3: .env.local 실제 키 입력 후 로컬 동작 확인**

체크리스트:
- `http://localhost:3000` 지도 렌더링
- `/login` Google/카카오 로그인
- 플래너 폼 작성 후 AI 코스 생성 버튼 → 지도에 핀 표시
- 네이버지도 링크 붙여넣기 → 장소 추출
- `/places` 저장소 페이지

- [ ] **Step 4: GitHub 저장소 생성 + 초기 푸시**

```bash
gh repo create date-course-app --public --source=. --remote=origin --push
```

- [ ] **Step 5: Vercel 배포**

```bash
npx vercel --prod
```
환경변수는 Vercel Dashboard → Settings → Environment Variables에 입력.

- [ ] **Step 6: 최종 커밋**

```bash
git add -A
git commit -m "chore: production ready"
git push origin main
```

---

## 테스트 전략 요약

| 대상 | 방법 | 파일 |
|------|------|------|
| URL 라우터 | Jest 유닛 | `__tests__/parsers/router.test.ts` |
| 네이버 파서 | Jest 유닛 | `__tests__/parsers/naver.test.ts` |
| Scrape API | Jest + mock | `__tests__/api/scrape.test.ts` |
| Claude 프롬프트 | Jest 유닛 | `__tests__/lib/claude.test.ts` |
| 전체 UI | 수동 (로컬 dev) | — |

---

## API 키 발급 위치

| 키 | 발급처 |
|----|--------|
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | [네이버 클라우드 플랫폼](https://www.ncloud.com) → Maps |
| `NAVER_MAP_CLIENT_SECRET` | 동일 |
| `KAKAO_REST_API_KEY` | [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 |
| `TMAP_API_KEY` | [SK Open API](https://openapi.sk.com) → Tmap |
| `KOBIS_API_KEY` | [KOBIS 오픈API](https://www.kobis.or.kr/kobis/business/mast/apim/openApiRegist.do) |
| `CULTURE_API_KEY` | [문화공공데이터광장](https://www.culture.go.kr/data/openapi/openapiView.do) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
