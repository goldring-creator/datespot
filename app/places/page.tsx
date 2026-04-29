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

  const { data: places, error } = await query
  if (error) console.error('places query error:', error.message)

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
