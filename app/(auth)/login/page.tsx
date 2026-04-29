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
          DATESPOT
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
