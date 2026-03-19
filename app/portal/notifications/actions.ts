'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getMemberSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    if (!sessionCookie) return null
    try {
        const session = JSON.parse(sessionCookie.value)
        if (!session.memberId) return null
        return session
    } catch {
        return null
    }
}

export async function getMyNotifications(page = 1, limit = 20) {
    const session = await getMemberSession()
    if (!session) return { notifications: [], total: 0 }

    const supabase = await createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count } = await supabase
        .from('member_notifications')
        .select('*', { count: 'exact' })
        .eq('member_id', session.memberId)
        .order('created_at', { ascending: false })
        .range(from, to)

    return { notifications: data || [], total: count || 0 }
}

export async function getUnreadCount(): Promise<number> {
    const session = await getMemberSession()
    if (!session) return 0

    const supabase = await createAdminClient()
    const { count } = await supabase
        .from('member_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', session.memberId)
        .eq('is_read', false)

    return count || 0
}

export async function markAsRead(id: string) {
    const session = await getMemberSession()
    if (!session) return

    const supabase = await createAdminClient()
    await supabase
        .from('member_notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('member_id', session.memberId)   // 보안: 자신의 알림만

    revalidatePath('/portal/notifications')
}

export async function markAllRead() {
    const session = await getMemberSession()
    if (!session) return

    const supabase = await createAdminClient()
    await supabase
        .from('member_notifications')
        .update({ is_read: true })
        .eq('member_id', session.memberId)
        .eq('is_read', false)

    revalidatePath('/portal/notifications')
}
