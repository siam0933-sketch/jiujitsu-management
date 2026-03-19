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

    // Fetch unread notice IDs for this member
    let unreadNoticeIds = new Set<string>()
    if (session.memberId && notices && notices.length > 0) {
        const { data: unreadNotifs } = await supabase
            .from('member_notifications')
            .select('link')
            .eq('member_id', session.memberId)
            .eq('type', 'notice')
            .eq('is_read', false)

        if (unreadNotifs) {
            unreadNotifs.forEach(n => {
                if (n.link && n.link.startsWith('/portal/notice/')) {
                    const id = n.link.replace('/portal/notice/', '')
                    unreadNoticeIds.add(id)
                }
            })
        }
    }

    const noticesWithReadStatus = notices?.map(n => ({
        ...n,
        is_read: !unreadNoticeIds.has(n.id)
    })) || []

    return { notices: noticesWithReadStatus, total: count || 0 }
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

export async function getPortalRanking(year?: number, month?: number | null) {
    const session = await getMemberSession()

    // Always calculate targetYear and Month so we can return them safely in error states
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const isYearly = month === null;
    const targetMonth = month !== undefined && month !== null ? month : now.getMonth() + 1;

    if (!session || !session.memberId || !session.gymId) {
        return { ranking: [], currentMemberId: null, error: 'Unauthorized', year: targetYear, month: isYearly ? null : targetMonth }
    }

    const supabase = await createAdminClient()

    // 1. Define Date Range

    let startDateStr = '';
    let endDateStr = '';

    if (isYearly) {
        // Full year from Jan 1 to Dec 31
        startDateStr = `${targetYear}-01-01`
        endDateStr = `${targetYear}-12-31`
    } else {
        // Specific month
        startDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        // Calculate the last day of the month by getting the 0th day of the NEXT month
        const nextMonthDate = new Date(targetYear, targetMonth, 0);
        endDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`
    }

    // 2. Fetch logs for the gym within the date range
    const { data: logs, error: fetchError } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, member:gym_members(name, belt, birth_date)')
        .eq('gym_id', session.gymId)
        .eq('status', 'present')
        .gte('date', startDateStr)
        .lte('date', endDateStr)

    if (fetchError) {
        return { ranking: [], currentMemberId: null, error: fetchError.message, year: targetYear, month: isYearly ? null : targetMonth }
    }

    if (!logs || logs.length === 0) {
        return { ranking: [], currentMemberId: session.memberId, year: targetYear, month: isYearly ? null : targetMonth }
    }

    // 2-1. Fetch latest stripes for these members
    const memberIds = Array.from(new Set(logs.map(log => log.member_id)))
    const stripeMap: Record<string, number> = {}

    if (memberIds.length > 0) {
        const { data: latestLogs } = await supabase
            .from('gym_promotion_logs')
            .select('member_id, stripe_level, promoted_at')
            .in('member_id', memberIds)
            .order('promoted_at', { ascending: false })

        if (latestLogs) {
            latestLogs.forEach((log: any) => {
                if (stripeMap[log.member_id] === undefined) {
                    stripeMap[log.member_id] = log.stripe_level
                }
            })
        }
    }

    // 3. Calculate ranking
    const counts: Record<string, { count: number, name: string, belt: string, stripe?: number, age?: number }> = {}

    logs.forEach(log => {
        const id = log.member_id
        if (!counts[id]) {
            const memberData: any = log.member
            const memberName = memberData?.name || (Array.isArray(memberData) ? memberData[0]?.name : '알 수 없음')
            const memberBelt = memberData?.belt || (Array.isArray(memberData) ? memberData[0]?.belt : 'white')

            // Get stripe from map
            const memberStripe = stripeMap[id] ?? 0

            let age: number | undefined;
            const birthDateStr = memberData?.birth_date || (Array.isArray(memberData) ? memberData[0]?.birth_date : null)
            if (birthDateStr) {
                const birthDate = new Date(birthDateStr);
                const today = new Date();
                let calcAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calcAge--;
                }
                age = calcAge;
            }

            counts[id] = { count: 0, name: memberName, belt: memberBelt, stripe: memberStripe, age }
        }
        counts[id].count++
    })

    const ranking = Object.entries(counts)
        .map(([id, val]) => ({ memberId: id, name: val.name, belt: val.belt, stripe: val.stripe, count: val.count, age: val.age }))
        .sort((a, b) => b.count - a.count)

    return {
        ranking,
        currentMemberId: session.memberId,
        year: targetYear,
        month: isYearly ? null : targetMonth
    }
}
