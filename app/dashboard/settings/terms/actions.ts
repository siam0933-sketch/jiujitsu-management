'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTerms() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '인증되지 않은 사용자입니다.' }

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: '도장 정보를 찾을 수 없습니다.' }

    const { data: terms, error } = await supabase
        .from('gym_terms')
        .select('*')
        .eq('gym_id', gym.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) return { error: error.message }
    return { terms: terms || [] }
}

export async function saveTerm(data: {
    id?: string
    title: string
    content: string
    is_active: boolean
    sort_order: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '인증되지 않은 사용자입니다.' }

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: '도장 정보를 찾을 수 없습니다.' }

    if (data.id) {
        // Update existing
        const { error } = await supabase
            .from('gym_terms')
            .update({
                title: data.title,
                content: data.content,
                is_active: data.is_active,
                sort_order: data.sort_order,
            })
            .eq('id', data.id)
            .eq('gym_id', gym.id)
        if (error) return { error: error.message }
    } else {
        // Check limit (max 10)
        const { count } = await supabase
            .from('gym_terms')
            .select('*', { count: 'exact', head: true })
            .eq('gym_id', gym.id)
        if ((count ?? 0) >= 10) return { error: '약관은 최대 10개까지 생성할 수 있습니다.' }

        const { error } = await supabase
            .from('gym_terms')
            .insert({
                gym_id: gym.id,
                title: data.title,
                content: data.content,
                is_active: data.is_active,
                sort_order: data.sort_order,
            })
        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/settings/terms')
    return { success: true }
}

export async function deleteTerm(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '인증되지 않은 사용자입니다.' }

    const { data: gym } = await supabase
        .from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: '도장 정보를 찾을 수 없습니다.' }

    const { error } = await supabase
        .from('gym_terms')
        .delete()
        .eq('id', id)
        .eq('gym_id', gym.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/terms')
    return { success: true }
}
