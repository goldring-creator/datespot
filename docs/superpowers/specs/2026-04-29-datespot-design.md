# DATESPOT — 설계 문서

**작성일:** 2026-04-29  
**상태:** 승인됨  

---

## 1. 프로젝트 개요

커플 데이트 코스 플래닝 웹앱. 유저들이 링크(네이버지도·카카오맵·인스타·블로그 등)나 검색으로 장소를 공유 DB에 쌓고, AI(Claude)가 요일·시간·이동수단에 맞춰 최적 코스를 짜준다.

**차별점:** 링크 한 줄로 장소 수집 → 커뮤니티 공유 풀 → AI 코스 생성

---

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 15 (App Router) + TypeScript |
| 스타일 | Tailwind CSS (Purple × Pink 파스텔 디자인 시스템) |
| 백엔드 | Next.js API Routes (서버리스) |
| DB·Auth | Supabase (PostgreSQL + Supabase Auth) |
| 지도 | Naver Maps JavaScript API |
| AI 추천 | Claude API (claude-sonnet-4-6) |
| 링크 스크래핑 | Playwright (goldpic__ Instagram 계정 세션) |
| 이동시간 | Tmap Routing API |
| 장소 검색 | Kakao Local API |
| 영화 정보 | KOBIS 공공 API |
| 전시·공연 | 문화공공데이터광장 API |
| 배포 | Vercel (GitHub 연동 자동 배포) |

---

## 3. 디자인 시스템

- **테마:** Purple × Pink 파스텔 미드톤
- **배경:** `#EFE4FF` (라벤더 틴트)
- **패널:** `#F5EDFF`
- **프라이머리:** `#AA60CC`
- **세컨더리(핑크):** `#DC6EA0`
- **텍스트:** `#2D1B4E`
- **레이아웃:** 지도 메인(좌) + 플래너·장소 리스트 패널(우 340px 고정)

---

## 4. 레이아웃 구조

```
┌─────────────────────────────────────────┬──────────────┐
│  TopNav: DATESPOT | 링크추가 | 검색 | 저장소          │
├─────────────────────────────────────────┼──────────────┤
│                                         │ 코스 플래너  │
│          네이버 지도 (메인)              │ 요일/시간/   │
│                                         │ 지역/이동수단│
│  📍핀1 ──── 📍핀2 ──── 📍핀3           │ [AI 추천 버튼│
│  (경로 점선)                            ├──────────────┤
│                                         │ 코스 제목    │
│  [지역칩] [지도 컨트롤]                 │ 메타 정보    │
│                                         ├──────────────┤
│                                         │ 장소 1       │
│                                         │ 장소 2  (스크│
│                                         │ 장소 3   롤) │
└─────────────────────────────────────────┴──────────────┘
```

---

## 5. DB 스키마

```sql
-- Supabase Auth가 users 테이블 기본 제공

-- 공유 장소 풀 (커뮤니티 전체 공유)
places (
  id            uuid primary key,
  name          text not null,
  category      text,           -- cafe | restaurant | exhibition | movie | bar | shopping | park | activity
  address       text,
  lat           float8,
  lng           float8,
  description   text,           -- AI 또는 유저 작성
  naver_url     text,
  instagram_url text,
  source_url    text,           -- 원본 링크 (블로그 등)
  region        text[],         -- ['성수', '한남'] 태그 배열
  tags          text[],         -- ['분위기좋은', '포토스팟'] 등
  expires_at    timestamptz,    -- 영화·전시 종료일
  submitted_by  uuid references auth.users,
  bookmark_count int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
)

-- 개인 북마크
bookmarks (
  id         uuid primary key,
  user_id    uuid references auth.users,
  place_id   uuid references places,
  created_at timestamptz default now(),
  unique(user_id, place_id)
)

-- 저장된 코스
courses (
  id              uuid primary key,
  user_id         uuid references auth.users,
  title           text,
  place_ids       uuid[],         -- 방문 순서대로 정렬된 장소 배열 (인덱스 = 방문 순서)
  scheduled_date  date,
  start_time      time,
  end_time        time,
  transport       text,           -- subway | car
  ai_description  text,
  is_public       boolean default false,
  created_at      timestamptz default now()
)
```

---

## 6. 링크 파서 — URL 라우터

입력창 하나로 URL 패턴을 자동 감지해 적합한 파서로 라우팅.

| URL 패턴 | 파서 | 방식 | 정확도 |
|----------|------|------|--------|
| `map.naver.com` | 네이버지도 파서 | place_id → Naver API | ✅ 높음 |
| `naver.com/local` | 네이버 플레이스 | place_id → Naver API | ✅ 높음 |
| `map.kakao.com`, `kko.to` | 카카오맵 파서 | place_id → Kakao API | ✅ 높음 |
| `instagram.com` | 인스타 파서 | Playwright(goldpic__) | ⚠️ 중간 |
| `blog.naver.com`, `tistory.com`, `brunch.co.kr` | 블로그 파서 | Playwright → 내부 지도 링크 추출 → 텍스트 파싱 | ⚠️ 중간 |
| `maps.google.com` | 구글맵 파서 | 좌표 URL 파싱 | ✅ 높음 |
| 그 외 | 범용 파서 | Playwright + Claude Vision | ⚠️ 낮음 |

**인스타 폴백 체인:**
1. 위치 태그 (DOM 직접 추출)
2. 캡션에서 `📍` · 해시태그 파싱
3. Claude Vision으로 이미지 분석
4. 수동 입력 UI

**실패 시 공통 처리:** 파싱 실패 또는 불확실한 경우 유저에게 장소명·주소 직접 입력 UI 표시.

---

## 7. AI 코스 생성 흐름

```
사용자 입력
  지역, 요일, 시작~종료시간, 이동수단
  분위기(선택): 로맨틱 | 액티브 | 문화·예술 | 맛집 위주 | 야외
       ↓
Supabase: 해당 지역 places 조회 (category·is_active 필터)
       ↓
Claude API 프롬프트:
  "아래 장소 목록에서 [조건]에 맞는 데이트 코스를 짜줘.
   이동시간 포함 시간표, 코스 제목, 각 장소 방문 이유 포함."
       ↓
Tmap Routing API: 실제 이동시간 보정
       ↓
응답: { title, places: [{id, visit_time, duration, travel_to_next}], description }
       ↓
지도에 핀·경로 렌더링 + 우측 패널에 장소 리스트
```

---

## 8. 외부 데이터 갱신

| 데이터 | 출처 | 갱신 주기 |
|--------|------|-----------|
| 현재 상영 영화 | KOBIS API | 매일 오전 6시 (Vercel Cron) |
| 전시·공연 | 문화공공데이터 API | 매일 오전 6시 |
| 만료 장소 숨김 | expires_at 기준 | 쿼리 시 자동 필터 |

---

## 9. 인증 구조

- **Supabase Auth:** Google 로그인 + 카카오 로그인 (OAuth)
- **비로그인:** 지도·코스 조회만 가능
- **로그인:** 장소 제보, 북마크, 코스 저장 가능
- **RLS (Row Level Security):** bookmarks·courses는 본인 데이터만 접근

---

## 10. 주요 페이지 & API

| 경로 | 설명 |
|------|------|
| `/` | 메인 지도 + 플래너 |
| `/places` | 커뮤니티 장소 저장소 (지역·카테고리 필터) |
| `/courses/[id]` | 저장된 코스 상세 |
| `POST /api/scrape` | URL → 장소 정보 추출 |
| `POST /api/course` | AI 코스 생성 |
| `GET /api/search` | Kakao Local 장소 검색 |
| `GET /api/events` | 현재 영화·전시 목록 |

---

## 11. 미포함 (v1 범위 외)

- 모바일 앱 (v2에서 React Native로 확장)
- 실시간 예약 연동
- 유저 간 코스 공유/팔로우
- 다국어 지원
