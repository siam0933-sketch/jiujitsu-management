import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ShuttlePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Get gym_id for this owner
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) {
        return <div className="p-4 text-red-500">체육관 정보가 등록되지 않았습니다. 설정에서 먼저 체육관을 등록해주세요.</div>
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-6 px-4 md:px-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-6">차량운행 관리</h1>
            <div className="p-8 text-center text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <p className="text-lg">차량운행 서비스는 현재 리뉴얼 중입니다.</p>
                <p className="mt-2 text-sm">더 나은 서비스로 곧 찾아뵙겠습니다.</p>
            </div>
        </div>
    )
}
