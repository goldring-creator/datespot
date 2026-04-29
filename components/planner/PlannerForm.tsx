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

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function TransportChip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all"
      style={{
        background: active ? 'linear-gradient(90deg,#AA60CC,#DC6EA0)' : 'rgba(255,255,255,0.75)',
        color: active ? 'white' : '#7830A8',
        borderColor: active ? 'transparent' : 'rgba(170,96,204,0.28)',
      }}
    >
      {label}
    </button>
  )
}

export function PlannerForm({ onSubmit, loading }: PlannerFormProps) {
  const [opts, setOpts] = useState<PlannerOptions>({
    region: '성수·뚝섬',
    dayOfWeek: '토요일',
    startTime: '14:00',
    endTime: '20:00',
    transport: 'subway',
    mood: '선택 안 함',
  })
  const [timeError, setTimeError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (opts.endTime <= opts.startTime) {
      setTimeError('종료 시간은 시작 시간보다 늦어야 합니다')
      return
    }
    setTimeError(null)
    onSubmit(opts)
  }

  const inputStyle = { borderColor: 'rgba(170,96,204,0.28)', color: '#2D1B4E' }
  const inputClass = 'w-full rounded-xl border text-sm px-3 py-2 bg-white/75'

  return (
    <div className="p-4" style={{ background: 'linear-gradient(160deg,#EFE4FF,#F8E4F4)' }}>
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#9040B8' }}>✨ 코스 플래너</p>

      <div className="mb-2">
        <label htmlFor="planner-region" className="text-xs text-brand-muted mb-1 block">지역</label>
        <select id="planner-region" value={opts.region}
          onChange={e => setOpts(o => ({ ...o, region: e.target.value }))}
          className={inputClass} style={inputStyle}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label htmlFor="planner-day" className="text-xs text-brand-muted mb-1 block">요일</label>
          <select id="planner-day" value={opts.dayOfWeek}
            onChange={e => setOpts(o => ({ ...o, dayOfWeek: e.target.value }))}
            className="w-full rounded-xl border text-xs px-3 py-2 bg-white/75" style={inputStyle}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="planner-mood" className="text-xs text-brand-muted mb-1 block">분위기</label>
          <select id="planner-mood" value={opts.mood}
            onChange={e => setOpts(o => ({ ...o, mood: e.target.value }))}
            className="w-full rounded-xl border text-xs px-3 py-2 bg-white/75" style={inputStyle}>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label htmlFor="planner-start" className="text-xs text-brand-muted mb-1 block">시작</label>
          <input id="planner-start" type="time" value={opts.startTime}
            onChange={e => setOpts(o => ({ ...o, startTime: e.target.value }))}
            className={inputClass} style={inputStyle} />
        </div>
        <div className="flex-1">
          <label htmlFor="planner-end" className="text-xs text-brand-muted mb-1 block">종료</label>
          <input id="planner-end" type="time" value={opts.endTime}
            onChange={e => setOpts(o => ({ ...o, endTime: e.target.value }))}
            className={inputClass} style={inputStyle} />
        </div>
      </div>
      {timeError && <p className="text-xs text-red-500 mb-2">{timeError}</p>}

      <div className="flex gap-2 mb-3">
        <TransportChip label="🚇 대중교통" active={opts.transport === 'subway'}
          onClick={() => setOpts(o => ({ ...o, transport: 'subway' }))} />
        <TransportChip label="🚗 자동차" active={opts.transport === 'car'}
          onClick={() => setOpts(o => ({ ...o, transport: 'car' }))} />
      </div>

      <Button className="w-full py-3" onClick={handleSubmit} disabled={loading}>
        {loading ? '코스 생성 중...' : '✨ AI 코스 추천받기'}
      </Button>
    </div>
  )
}
