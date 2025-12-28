'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type PromotionCriteria = {
    id: string
    current_belt: string
    next_belt: string
    type: string
    required_tenure_months: number
    required_attendance_count: number
}

export async function getPromotionCriteria() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return []

    const { data, error } = await supabase
        .from('gym_promotion_criteria')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Fetch Criteria Error:', error)
        return []
    }
    return data as PromotionCriteria[]
}

export async function createPromotionCriteria(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    const current_belt = String(formData.get('current_belt'))
    const next_belt = String(formData.get('next_belt'))
    const tenure = Number(formData.get('required_tenure_months') || 0)
    const attendance = Number(formData.get('required_attendance_count') || 0)

    const { error } = await supabase.from('gym_promotion_criteria').insert({
        gym_id: gym.id,
        current_belt,
        next_belt,
        required_tenure_months: tenure,
        required_attendance_count: attendance
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings/promotion')
    return { success: true }
}

export async function deletePromotionCriteria(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_promotion_criteria')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings/promotion')
    return { success: true }
}
