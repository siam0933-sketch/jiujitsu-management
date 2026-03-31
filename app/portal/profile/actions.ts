'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validatePassword } from '@/utils/password'

async function getMemberSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    if (!sessionCookie) return null
    try {
        return JSON.parse(sessionCookie.value)
    } catch (e) {
        return null
    }
}

export async function changePassword(current: string, newPw: string) {
    const session = await getMemberSession()

    if (!session || !session.memberId || !session.gymId) {
        return { error: '로그인이 필요합니다.' }
    }

    // 1. Validate New Password
    const validation = validatePassword(newPw)
    if (!validation.isValid) {
        return { error: validation.message || '비밀번호 형식이 올바르지 않습니다.' }
    }

    const supabase = await createAdminClient()

    // 2. Fetch Current Details to Verify Password
    const { data: member, error: fetchError } = await supabase
        .from('gym_members')
        .select('login_password')
        .eq('id', session.memberId)
        .single()

    if (fetchError || !member) {
        return { error: '회원 정보를 불러올 수 없습니다.' }
    }

    // 3. Check Current Password (Case-insensitive to match login logic)
    if (member.login_password?.toLowerCase() !== current.toLowerCase()) {
        return { error: '현재 비밀번호가 일치하지 않습니다.' }
    }

    // 4. Update Password
    const { error: updateError } = await supabase
        .from('gym_members')
        .update({ login_password: newPw })
        .eq('id', session.memberId)

    if (updateError) {
        return { error: '비밀번호 변경 중 오류가 발생했습니다.' }
    }

    revalidatePath('/portal/profile') // Revalidate where info is shown
    revalidatePath('/dashboard/members') // Revalidate admin view so they see new pw immediately

    return { success: true }
}

export async function getMemberProfileData() {
    const session = await getMemberSession()
    if (!session || !session.memberId) return null

    const supabase = await createAdminClient()

    // 1. Fetch Member Basic Info
    const { data: member } = await supabase
        .from('gym_members')
        .select('*')
        .eq('id', session.memberId)
        .single()

    // 2. Fetch Payment History
    const { data: payments } = await supabase
        .from('gym_payments')
        .select('*')
        .eq('member_id', session.memberId)
        .order('payment_date', { ascending: false })

    return {
        member,
        payments: payments || []
    }
}
export async function getMemberPointLogs() {
    const session = await getMemberSession()
    if (!session || !session.memberId) return []

    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('gym_point_logs')
        .select('id, name, points, created_at')
        .eq('member_id', session.memberId)
        .order('created_at', { ascending: false })
    return data ?? []
}

export async function getMemberPointSettings() {
    const session = await getMemberSession()
    if (!session || !session.gymId) return []

    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('gym_point_settings')
        .select('name, icon')
        .eq('gym_id', session.gymId)
    return data ?? []
}
