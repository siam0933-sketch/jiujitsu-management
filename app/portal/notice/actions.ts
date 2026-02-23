'use server'

import { createClient } from '@/utils/supabase/server'

export async function getPortalNotices(page = 1, limit = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notices: [], total: 0 }

    // Get member's gym_id
    const { data: member } = await supabase
        .from('gym_members')
        .select('gym_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)
        .single()

    if (!member) return { notices: [], total: 0 }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: notices, count } = await supabase
        .from('gym_notices')
        .select('*, profiles(full_name)', { count: 'exact' })
        .eq('gym_id', member.gym_id)
        .order('created_at', { ascending: false })
        .range(from, to)

    return { notices: notices || [], total: count || 0 }
}

export async function getPortalNoticeById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notice: null }

    const { data: notice } = await supabase
        .from('gym_notices')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

    return { notice }
}

export async function getPortalRanking() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ranking: [], currentMemberId: null, error: 'Unauthorized' }

    // 1. Get member's gym_id and member_id
    const { data: member } = await supabase
        .from('gym_members')
        .select('id, gym_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)
        .single()

    if (!member) return { ranking: [], currentMemberId: null, error: 'Member not found' }

    // 2. Define Date Range (This month)
    const now = new Date()
    const targetYear = now.getFullYear()
    const targetMonth = now.getMonth() + 1
    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`

    // 3. Fetch this month's logs for the gym
    const { data: logs, error: fetchError } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, member:gym_members(name)')
        .eq('gym_id', member.gym_id)
        .eq('status', 'present')
        .gte('date', startOfMonth)

    if (fetchError) {
        return { ranking: [], currentMemberId: null, error: fetchError.message }
    }

    if (!logs || logs.length === 0) {
        return { ranking: [], currentMemberId: member.id, year: targetYear, month: targetMonth }
    }

    // 4. Calculate ranking
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
        currentMemberId: member.id,
        year: targetYear,
        month: targetMonth
    }
}
