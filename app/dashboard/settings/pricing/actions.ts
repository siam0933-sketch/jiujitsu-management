'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPricingData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { plans: [], options: [] }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { plans: [], options: [] }

    const { data: plans } = await supabase
        .from('gym_price_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    const { data: options } = await supabase
        .from('gym_price_options')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .order('group_name', { ascending: true })

    return { plans: plans || [], options: options || [] }
}

export async function createPlan(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const name = String(formData.get('name'))
    const price = Number(formData.get('price'))
    const type = String(formData.get('type')) // 'period' | 'session'
    const duration_days = Number(formData.get('duration_days') || 30)
    const session_count = formData.get('session_count') ? Number(formData.get('session_count')) : null

    const { error } = await supabase
        .from('gym_price_plans')
        .insert({
            gym_id: gym.id,
            name,
            price,
            type,
            duration_days,
            session_count,
            is_active: true
        })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function deletePlan(planId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_price_plans')
        .update({ is_active: false })
        .eq('id', planId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function createOption(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const group_name = String(formData.get('group_name'))
    const name = String(formData.get('name'))
    const price = Number(formData.get('price'))

    const { error } = await supabase
        .from('gym_price_options')
        .insert({
            gym_id: gym.id,
            group_name,
            name,
            price,
            is_active: true
        })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}

export async function deleteOption(optionId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_price_options')
        .update({ is_active: false })
        .eq('id', optionId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/pricing')
    return { success: true }
}
