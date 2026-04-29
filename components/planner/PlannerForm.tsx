'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
    <button key={label} type="button" onClick={onClick}
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
