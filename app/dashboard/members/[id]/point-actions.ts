'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getGymIdForMember(memberId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('gym_members').select('gym_id').eq('id', memberId).single()
    return data?.gym_id ?? null
}

async function assertGymMaster(gymId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: gym } = await supabase.from('gyms').select('id').eq('id', gymId).eq('owner_id', user.id).single()
    return !!gym
}

export async function getPointLogs(memberId: string) {
    const gymId = await getGymIdForMember(memberId)
    if (!gymId) return []
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('gym_point_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
    return data ?? []
}

export async function getManualPointSettings(gymId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('gym_point_settings')
        .select('id, name, points, icon')
        .eq('gym_id', gymId)
        .eq('type', 'manual')
        .eq('is_active', true)
    return data ?? []
}

export async function addManualPoint(memberId: string, settingId: string) {
    const gymId = await getGymIdForMember(memberId)
    if (!gymId) return { error: '회원 정보를 찾을 수 없습니다.' }
    if (!(await assertGymMaster(gymId))) return { error: 'Unauthorized' }

    const supabase = await createAdminClient()
    const { data: setting } = await supabase
        .from('gym_point_settings')
        .select('name, points')
        .eq('id', settingId)
        .single()
    if (!setting) return { error: '포인트 항목을 찾을 수 없습니다.' }

    const { error } = await supabase.from('gym_point_logs').insert({
        gym_id: gymId,
        member_id: memberId,
        setting_id: settingId,
        name: setting.name,
        points: setting.points,
    })
    if (error) return { error: error.message }
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function deductPoint(memberId: string, points: number, reason: string) {
    if (points <= 0) return { error: '차감 점수는 1 이상이어야 합니다.' }
    const gymId = await getGymIdForMember(memberId)
    if (!gymId) return { error: '회원 정보를 찾을 수 없습니다.' }
    if (!(await assertGymMaster(gymId))) return { error: 'Unauthorized' }

    const supabase = await createAdminClient()
    const { error } = await supabase.from('gym_point_logs').insert({
        gym_id: gymId,
        member_id: memberId,
        setting_id: null,
        name: reason || '관장 차감',
        points: -points,
    })
    if (error) return { error: error.message }
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function addCustomPoint(memberId: string, name: string, points: number) {
    if (!name.trim()) return { error: '항목 이름을 입력해주세요.' }
    if (!points || points <= 0) return { error: '점수는 1 이상이어야 합니다.' }
    const gymId = await getGymIdForMember(memberId)
    if (!gymId) return { error: '회원 정보를 찾을 수 없습니다.' }
    if (!(await assertGymMaster(gymId))) return { error: 'Unauthorized' }

    const supabase = await createAdminClient()
    const { error } = await supabase.from('gym_point_logs').insert({
        gym_id: gymId,
        member_id: memberId,
        setting_id: null,
        name: name.trim(),
        points,
    })
    if (error) return { error: error.message }
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

