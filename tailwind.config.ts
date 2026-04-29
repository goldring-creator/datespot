// Tailwind v4: 이 파일은 무시됩니다.
// 브랜드 색상 토큰은 app/globals.css의 @theme 블록에서 관리하세요.
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
