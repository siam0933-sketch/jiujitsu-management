'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getPortalPromotionLogs() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')

    if (!sessionCookie) return []

    let memberId = ''
    try {
        const session = JSON.parse(sessionCookie.value)
        memberId = session.memberId
    } catch (e) {
        memberId = sessionCookie.value
    }

    if (!memberId) return []

    // Use Admin Client to bypass RLS
    // Safe because we verified the memberId from the HTTPOnly cookie
    const supabase = await createAdminClient()

    const { data: logs, error } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

    if (error) {
        console.error('Portal Promotion Logs Error:', error)
        return []
    }

    return logs
}
