'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getGymId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: gym } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single()
    return gym?.id ?? null
}

export async function getPointSettings() {
    const gymId = await getGymId()
    if (!gymId) return []
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('gym_point_settings')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: true })
    return data ?? []
}

export async function ensureDefaultPointSettings() {
    const gymId = await getGymId()
    if (!gymId) return
    const supabase = await createAdminClient()

    const defaults = [
        { name: '회원앱 셀프 출석', type: 'auto_portal', points: 1 },
        { name: '키오스크·관장 출석', type: 'auto_kiosk', points: 1 },
        { name: '결제 완료', type: 'auto_payment', points: 5 },
    ]

    for (const d of defaults) {
        const { data: existing } = await supabase
            .from('gym_point_settings')
            .select('id')
            .eq('gym_id', gymId)
            .eq('type', d.type)
            .maybeSingle()
        if (!existing) {
            await supabase.from('gym_point_settings').insert({ gym_id: gymId, ...d })
        }
    }
}

export async function updatePointSetting(id: string, data: { name?: string; points?: number; is_active?: boolean; icon?: string | null }) {
    const gymId = await getGymId()
    if (!gymId) return { error: 'Unauthorized' }
    const supabase = await createAdminClient()
    const { error } = await supabase.from('gym_point_settings').update(data).eq('id', id).eq('gym_id', gymId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/points')
    return { success: true }
}

export async function createManualPointSetting(name: string, points: number, icon?: string) {
    const gymId = await getGymId()
    if (!gymId) return { error: 'Unauthorized' }
    if (!name.trim()) return { error: '항목 이름을 입력해주세요.' }
    if (points <= 0) return { error: '점수는 1 이상이어야 합니다.' }
    const supabase = await createAdminClient()
    const { error } = await supabase.from('gym_point_settings').insert({
        gym_id: gymId, name: name.trim(), type: 'manual', points, is_active: true, icon
    })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/points')
    return { success: true }
}

export async function deletePointSetting(id: string) {
    const gymId = await getGymId()
    if (!gymId) return { error: 'Unauthorized' }
    const supabase = await createAdminClient()
    // Only allow deleting manual items
    const { data: setting } = await supabase.from('gym_point_settings').select('type').eq('id', id).single()
    if (!setting || setting.type !== 'manual') return { error: '시스템 항목은 삭제할 수 없습니다.' }
    const { error } = await supabase.from('gym_point_settings').delete().eq('id', id).eq('gym_id', gymId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/points')
    return { success: true }
}
