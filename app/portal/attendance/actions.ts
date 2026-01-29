'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

export async function requestAttendance() {
    const session = await getMemberSession()
    if (!session || !session.memberId || !session.gymId) {
        return { error: '로그인이 필요합니다.' }
    }

    const supabase = await createAdminClient()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    // Check existing
    const { data: existing } = await supabase
        .from('gym_attendance_logs')
        .select('*')
        .eq('gym_id', session.gymId)
        .eq('member_id', session.memberId)
        .eq('date', today)
        .single()

    if (existing) {
        return { error: '이미 금일 출석 기록이 존재합니다.' }
    }

    // Insert pending
    const { error } = await supabase.from('gym_attendance_logs').insert({
        gym_id: session.gymId,
        member_id: session.memberId,
        date: today,
        method: 'manual', // or 'request'
        status: 'pending'
    })

    if (error) return { error: error.message }

    revalidatePath('/portal/attendance')
    return { success: true }
}

export async function checkOutMemberSelf() {
    const session = await getMemberSession()
    if (!session || !session.memberId || !session.gymId) {
        return { error: '로그인이 필요합니다.' }
    }

    const supabase = await createAdminClient()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    // Get current log
    const { data: log } = await supabase
        .from('gym_attendance_logs')
        .select('*')
        .eq('gym_id', session.gymId)
        .eq('member_id', session.memberId)
        .eq('date', today)
        .single()

    if (!log) return { error: '금일 출석 기록이 없습니다.' }
    if (log.status !== 'present') return { error: '출석 승인이 필요합니다.' }
    if (log.checked_out_at) return { error: '이미 하원 처리되었습니다.' }

    // 5-minute rule
    const checkInTime = new Date(log.created_at).getTime() // created_at or check_in_at? Schema has check_in_at default now()
    // Wait, schema check_in_at default is now().
    // Use check_in_at.
    const checkInAt = new Date(log.check_in_at || log.created_at).getTime()
    const now = Date.now()
    const diffMin = (now - checkInAt) / 1000 / 60

    if (diffMin < 5) {
        return { error: `출석 후 5분이 지나야 하원할 수 있습니다. (현재 약 ${Math.floor(diffMin)}분 경과)` }
    }

    const { error } = await supabase
        .from('gym_attendance_logs')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', log.id)

    if (error) return { error: error.message }

    revalidatePath('/portal/attendance')
    return { success: true }
}

export async function getTodayAttendanceStatus() {
    try {
        const session = await getMemberSession()
        if (!session || !session.memberId || !session.gymId) {
            return null
        }

        const supabase = await createAdminClient()
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

        const { data: log, error } = await supabase
            .from('gym_attendance_logs')
            .select('*')
            .eq('gym_id', session.gymId)
            .eq('member_id', session.memberId)
            .eq('date', today)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('[getTodayAttendanceStatus] Error fetching log:', error)
            return null
        }

        if (log) {
            return {
                status: log.status, // 'pending' | 'present'
                checked_out_at: log.checked_out_at,
                check_in_at: log.check_in_at,
                id: log.id
            }
        }
        return null
    } catch (e) {
        console.error('[getTodayAttendanceStatus] Unexpected error:', e)
        return null
    }
}

export async function getAttendanceHistory() {
    try {
        const session = await getMemberSession()
        if (!session || !session.memberId || !session.gymId) {
            return { data: [], error: '로그인이 필요합니다.' }
        }

        // Debugging Env Vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return { data: [], error: 'Config Error: NEXT_PUBLIC_SUPABASE_URL is missing' }
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            // Debugging: List available keys (security safe)
            const availableKeys = Object.keys(process.env)
                .filter(key => key.startsWith('SUPABASE') || key.startsWith('NEXT_'))
                .join(', ');
            return { data: [], error: `Config Error: SUPABASE_SERVICE_ROLE_KEY is missing. Available: ${availableKeys}` }
        }

        const supabase = await createAdminClient()

        console.log('[getAttendanceHistory] Fetching for', session.memberId);

        const { data, error } = await supabase
            .from('gym_attendance_logs')
            .select('date, status')
            .eq('gym_id', session.gymId)
            .eq('member_id', session.memberId)
            .eq('status', 'present')
            .order('date', { ascending: false })

        if (error) {
            console.error('[getAttendanceHistory] Error:', error);
            // Return actual error message for debugging on UI
            return { data: [], error: `DB Error: ${error.message}` }
        }

        if (!data) return { data: [], error: null }

        return { data: data.map(log => log.date), error: null }
    } catch (e: any) {
        console.error('[getAttendanceHistory] Unexpected error:', e)
        return { data: [], error: `Server Error: ${e.message || 'Unknown error'}` }
    }
}
