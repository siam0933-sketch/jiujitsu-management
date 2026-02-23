'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

    const { error } = await supabase
        .from('gym_notices')
        .insert({
            gym_id: gym.id,
            title: data.title,
            content: data.content,
            images: data.images,
            created_by: user.id
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/notice')
    revalidatePath('/portal/notice')
    return { success: true }
}

export async function updateNotice(id: string, data: { title: string, content: string, images: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('gym_notices')
        .update({
            title: data.title,
            content: data.content,
            images: data.images,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

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

    const { error } = await supabase
        .from('gym_notices')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/notice')
    revalidatePath('/portal/notice')
    return { success: true }
}
