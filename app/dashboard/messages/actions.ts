'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/utils/notifications'

export type GymMessage = {
    id: string
    sender: 'admin' | 'member'
    body: string
    created_at: string
    is_read_by_admin: boolean
    is_read_by_member: boolean
}

/** 메시지 목록 조회 + 관장 읽음 처리 */
export async function getMessages(memberId: string): Promise<GymMessage[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return []

    const supabaseAdmin = await createAdminClient()

    // Mark admin-side as read
    await supabaseAdmin
        .from('gym_messages')
        .update({ is_read_by_admin: true })
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('is_read_by_admin', false)

    const { data } = await supabaseAdmin
        .from('gym_messages')
        .select('id, sender, body, created_at, is_read_by_admin, is_read_by_member')
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .order('created_at', { ascending: true })

    return (data as GymMessage[]) ?? []
}

/** 관장이 회원에게 메시지 전송 */
export async function sendAdminMessage(memberId: string, body: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: 'Gym not found' }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin.from('gym_messages').insert({
        gym_id: gym.id,
        member_id: memberId,
        sender: 'admin',
        body,
        is_read_by_admin: true,  // 관장이 보낸 메시지 = 관장 쪽은 즉시 읽음
        is_read_by_member: false,
    })
    if (error) return { error: error.message }

    // 회원에게 푸시 알림
    try {
        const { data: member } = await supabaseAdmin
            .from('gym_members').select('name').eq('id', memberId).single()
        await sendNotification({
            gymId: gym.id,
            memberIds: [memberId],
            type: 'notice',
            title: '💬 새 쪽지가 도착했습니다',
            body: body.length > 50 ? body.slice(0, 50) + '…' : body,
            link: '/portal/messages',
        })
    } catch (e) { console.error('Message push error:', e) }

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

/** 특정 회원과의 미읽음 메시지 수 (관장 기준) */
export async function getUnreadCountForMember(memberId: string): Promise<number> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return 0

    const supabaseAdmin = await createAdminClient()
    const { count } = await supabaseAdmin
        .from('gym_messages')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('sender', 'member')
        .eq('is_read_by_admin', false)

    return count ?? 0
}

/** 전체 미읽음 회원 발신 메시지 수 (대시보드 뱃지용) */
export async function getTotalUnreadAdminMessages(): Promise<number> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return 0

    const supabaseAdmin = await createAdminClient()
    const { count } = await supabaseAdmin
        .from('gym_messages')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('sender', 'member')
        .eq('is_read_by_admin', false)

    return count ?? 0
}

export type InboxConversation = {
    memberId: string
    memberName: string
    lastMessageDate: string
    lastMessageBody: string
    unreadCount: number
}

export async function getInboxConversations(): Promise<InboxConversation[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return []

    const supabaseAdmin = await createAdminClient()

    const { data: messages } = await supabaseAdmin
        .from('gym_messages')
        .select('id, member_id, body, created_at, sender, is_read_by_admin, gym_members(name)')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false })
        .limit(5000)

    if (!messages) return []

    const convoMap = new Map<string, InboxConversation>()

    for (const msg of messages) {
        const mId = msg.member_id
        const isUnread = msg.sender === 'member' && !msg.is_read_by_admin
        
        if (!convoMap.has(mId)) {
            convoMap.set(mId, {
                memberId: mId,
                memberName: (msg.gym_members as any)?.name || '알 수 없음',
                lastMessageDate: msg.created_at,
                lastMessageBody: msg.body,
                unreadCount: isUnread ? 1 : 0
            })
        } else {
            const existing = convoMap.get(mId)!
            if (isUnread) {
                existing.unreadCount += 1
            }
        }
    }

    return Array.from(convoMap.values())
}
