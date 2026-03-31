'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/server'
import { sendAdminNotification } from '@/utils/notifications'
import { revalidatePath } from 'next/cache'

export type GymMessage = {
    id: string
    sender: 'admin' | 'member'
    body: string
    created_at: string
    is_read_by_admin: boolean
    is_read_by_member: boolean
}

async function getMemberSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    if (!sessionCookie) return null
    try { return JSON.parse(sessionCookie.value) } catch { return null }
}

/** 메시지 목록 조회 + 회원 읽음 처리 */
export async function getMemberMessages(): Promise<{ data: GymMessage[], error: string | null }> {
    const session = await getMemberSession()
    if (!session?.memberId || !session?.gymId) return { data: [], error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()

    // Mark member-side as read
    await supabase
        .from('gym_messages')
        .update({ is_read_by_member: true })
        .eq('gym_id', session.gymId)
        .eq('member_id', session.memberId)
        .eq('is_read_by_member', false)

    const { data, error } = await supabase
        .from('gym_messages')
        .select('id, sender, body, created_at, is_read_by_admin, is_read_by_member')
        .eq('gym_id', session.gymId)
        .eq('member_id', session.memberId)
        .order('created_at', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: (data as GymMessage[]) ?? [], error: null }
}

/** 회원이 관장에게 메시지 전송 */
export async function sendMemberMessage(body: string) {
    const session = await getMemberSession()
    if (!session?.memberId || !session?.gymId) return { error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()

    const { error } = await supabase.from('gym_messages').insert({
        gym_id: session.gymId,
        member_id: session.memberId,
        sender: 'member',
        body,
        is_read_by_admin: false,
        is_read_by_member: true, // 회원이 보낸 메시지 = 회원 쪽은 즉시 읽음
    })
    if (error) return { error: error.message }

    // 관장에게 푸시 알림
    try {
        const { data: member } = await supabase
            .from('gym_members').select('name, gym_id').eq('id', session.memberId).single()
        const { data: gym } = await supabase
            .from('gyms').select('owner_id').eq('id', session.gymId).single()

        if (gym?.owner_id) {
            await sendAdminNotification({
                adminId: gym.owner_id,
                title: `💬 ${member?.name || '회원'}님의 쪽지`,
                body: body.length > 50 ? body.slice(0, 50) + '…' : body,
                link: `/dashboard/members/${session.memberId}`,
            })
        }
    } catch (e) { console.error('Message push error:', e) }

    revalidatePath('/portal/messages')
    return { success: true }
}

/** 미읽음 쪽지 수 (회원 기준 - 헤더 뱃지용) */
export async function getUnreadMessageCount(): Promise<number> {
    const session = await getMemberSession()
    if (!session?.memberId || !session?.gymId) return 0

    const supabase = await createAdminClient()
    const { count } = await supabase
        .from('gym_messages')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', session.gymId)
        .eq('member_id', session.memberId)
        .eq('sender', 'admin')
        .eq('is_read_by_member', false)

    return count ?? 0
}
