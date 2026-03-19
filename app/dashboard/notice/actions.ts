'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/utils/notifications'

export async function getNotices(page = 1, limit = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notices: [], total: 0 }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { notices: [], total: 0 }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: notices, count } = await supabase
        .from('gym_notices')
        .select('*, profiles(full_name)', { count: 'exact' })
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false })
        .range(from, to)

    return { notices: notices || [], total: count || 0 }
}

export async function getNoticeById(id: string) {
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

export async function createNotice(data: { title: string, content: string, images: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const { data: notice, error } = await supabase
        .from('gym_notices')
        .insert({
            gym_id: gym.id,
            title: data.title,
            content: data.content,
            images: data.images,
            created_by: user.id
        })
        .select('id')
        .single()

    if (error) return { error: error.message }

    // 도장 전체 활성 회원에게 알림 전송 (비동기, 오류가 나도 공지 등록은 성공)
    try {
        const adminSupabase = await createAdminClient()
        const { data: members } = await adminSupabase
            .from('gym_members')
            .select('id')
            .eq('gym_id', gym.id)
            .eq('status', 'active')

        if (members && members.length > 0) {
            const memberIds = members.map((m: any) => m.id)
            await sendNotification({
                gymId: gym.id,
                memberIds,
                type: 'notice',
                title: `📢 새 공지: ${data.title}`,
                body: data.content.slice(0, 80),
                link: notice?.id ? `/portal/notice/${notice.id}` : '/portal/notice',
            })
        }
    } catch (notifErr) {
        console.error('[createNotice] Notification error:', notifErr)
    }

    revalidatePath('/dashboard/notice')
    revalidatePath('/portal/notice')
    return { success: true }
}

export async function updateNotice(id: string, data: { title: string, content: string, images: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Gym Ownership for the current user
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    // 2. Verify the notice belongs to this gym
    const { data: existingNotice } = await supabase
        .from('gym_notices')
        .select('gym_id')
        .eq('id', id)
        .single()

    if (!existingNotice || existingNotice.gym_id !== gym.id) {
        return { error: 'Unauthorized to edit this notice' }
    }

    // 3. Update using Admin Client to bypass RLS issues
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
        .from('gym_notices')
        .update({
            title: data.title,
            content: data.content,
            images: data.images,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('updateNotice Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/notice')
    revalidatePath(`/dashboard/notice/${id}`)
    revalidatePath('/portal/notice')
    revalidatePath(`/portal/notice/${id}`)
    return { success: true }
}

export async function deleteNotice(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Gym Ownership
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    // 2. Verify the notice belongs to this gym
    const { data: existingNotice } = await supabase
        .from('gym_notices')
        .select('gym_id')
        .eq('id', id)
        .single()

    if (!existingNotice || existingNotice.gym_id !== gym.id) {
        return { error: 'Unauthorized to delete this notice' }
    }

    // 3. Delete using Admin Client
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
        .from('gym_notices')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('deleteNotice Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/notice')
    revalidatePath('/portal/notice')
    return { success: true }
}
