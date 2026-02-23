'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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

export async function getPortalNotices(page = 1, limit = 10) {
    const session = await getMemberSession()
    if (!session || !session.gymId) return { notices: [], total: 0 }

    const supabase = await createAdminClient()

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: notices, count, error } = await supabase
        .from('gym_notices')
        .select('*, profiles(full_name)', { count: 'exact' })
        .eq('gym_id', session.gymId)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('getPortalNotices error:', error);
    }

    return { notices: notices || [], total: count || 0 }
}

export async function getPortalNoticeById(id: string) {
    const session = await getMemberSession()
    if (!session || !session.gymId) return { notice: null }

    const supabase = await createAdminClient()

    const { data: notice } = await supabase
        .from('gym_notices')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

    return { notice }
}

export async function getPortalRanking() {
    const session = await getMemberSession()
    if (!session || !session.memberId || !session.gymId) {
        return { ranking: [], currentMemberId: null, error: 'Unauthorized' }
    }

    const supabase = await createAdminClient()

    // 1. Define Date Range (This month)
    const now = new Date()
    const targetYear = now.getFullYear()
    const targetMonth = now.getMonth() + 1
    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`

    // 2. Fetch this month's logs for the gym
    const { data: logs, error: fetchError } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, member:gym_members(name)')
        .eq('gym_id', session.gymId)
        .eq('status', 'present')
        .gte('date', startOfMonth)

    if (fetchError) {
        return { ranking: [], currentMemberId: null, error: fetchError.message }
    }

    if (!logs || logs.length === 0) {
        return { ranking: [], currentMemberId: session.memberId, year: targetYear, month: targetMonth }
    }

    // 3. Calculate ranking
    const counts: Record<string, { count: number, name: string }> = {}

    logs.forEach(log => {
        const id = log.member_id
        if (!counts[id]) {
            // Since it's a one-to-one mapping in the query we can cast it if it comes as array
            const memberData: any = log.member
            const memberName = memberData?.name || (Array.isArray(memberData) ? memberData[0]?.name : '알 수 없음')
            counts[id] = { count: 0, name: memberName }
        }
        counts[id].count++
    })

    const ranking = Object.entries(counts)
        .map(([id, val]) => ({ memberId: id, name: val.name, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50) // Limit to top 50 

    return {
        ranking,
        currentMemberId: session.memberId,
        year: targetYear,
        month: targetMonth
    }
}
