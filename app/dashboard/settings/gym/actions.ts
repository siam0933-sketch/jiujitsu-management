'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGymSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Profile (for name)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    // Get Gym (for name)
    const { data: gym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

    return {
        gymName: gym?.name || '',
        adminName: profile?.full_name || '',
        gymId: gym?.id
    }
}

export async function updateGymSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const gymId = String(formData.get('gym_id'))
    const gymName = String(formData.get('gym_name'))
    const adminName = String(formData.get('admin_name'))

    // Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: adminName })
        .eq('id', user.id)

    if (profileError) return { error: '관리자 이름 수정 실패: ' + profileError.message }

    // Update Gym
    const { error: gymError } = await supabase
        .from('gyms')
        .update({ name: gymName })
        .eq('id', gymId)
        .eq('owner_id', user.id) // Security check

    if (gymError) return { error: '도장 이름 수정 실패: ' + gymError.message }

    revalidatePath('/dashboard', 'layout') // Revalidate layout to update sidebar
    revalidatePath('/dashboard/settings/gym')
    return { success: true }
}
