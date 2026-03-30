import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ShuttleClient from './components/ShuttleClient'
import { getShuttleData } from './actions'

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

    const routes = await getShuttleData(gym.id)

    return (
        <ShuttleClient gymId={gym.id} initialRoutes={routes} />
    )
}
