'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveGym(formData: FormData) {
    const gymId = formData.get('gymId')
    if (!gymId) return

    const supabase = await createAdminClient()

    // Update the gym status to active
    const { error } = await supabase
        .from('gyms')
        .update({ status: 'active' })
        .eq('id', gymId)

    if (error) {
        console.error('Failed to approve gym:', error)
        throw new Error('Failed to approve gym')
    }

    revalidatePath('/super-admin')
}

export async function rejectGym(formData: FormData) {
    const gymId = formData.get('gymId')
    if (!gymId) return

    const supabase = await createAdminClient()

    // Actually delete the gym or set it to 'rejected'. For now, let's set it to 'rejected' for record keeping.
    const { error } = await supabase
        .from('gyms')
        .update({ status: 'rejected' })
        .eq('id', gymId)

    if (error) {
        console.error('Failed to reject gym:', error)
        throw new Error('Failed to reject gym')
    }

    revalidatePath('/super-admin')
}
