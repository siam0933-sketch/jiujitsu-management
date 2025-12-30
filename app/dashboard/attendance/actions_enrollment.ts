'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Enrollment = {
    id: string
    schedule_id: string
    member_id: string
    created_at: string
}

export type EnrolledClassInfo = {
    class_name: string
    day_of_week: string
    start_time: string
}

export async function getEnrollments(scheduleId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_class_enrollments')
        .select('member_id')
        .eq('schedule_id', scheduleId)

    if (error) {
        console.error('Error fetching enrollments:', error)
        return []
    }

    return data.map(row => row.member_id)
}

export async function updateEnrollments(scheduleId: string, memberIds: string[]) {
    const supabase = await createClient()

    // 1. Get current enrollments
    const { data: currentData, error: fetchError } = await supabase
        .from('gym_class_enrollments')
        .select('member_id')
        .eq('schedule_id', scheduleId)

    if (fetchError) return { error: fetchError.message }

    const currentIds = new Set(currentData.map(r => r.member_id))
    const newIds = new Set(memberIds)

    // 2. Identify additions and deletions
    const toAdd = memberIds.filter(id => !currentIds.has(id))
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id))

    // 3. Delete removed members
    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('gym_class_enrollments')
            .delete()
            .eq('schedule_id', scheduleId)
            .in('member_id', toDelete)

        if (deleteError) return { error: deleteError.message }
    }

    // 4. Insert new members
    if (toAdd.length > 0) {
        const { error: insertError } = await supabase
            .from('gym_class_enrollments')
            .insert(toAdd.map(id => ({
                schedule_id: scheduleId,
                member_id: id
            })))

        if (insertError) return { error: insertError.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
}

export async function getMemberEnrollments(memberId: string): Promise<EnrolledClassInfo[]> {
    const supabase = await createClient()

    // Join enrollments with schedules to get class info
    const { data, error } = await supabase
        .from('gym_class_enrollments')
        .select(`
            schedule_id,
            gym_schedules (
                class_name,
                day_of_week,
                start_time
            )
        `)
        .eq('member_id', memberId)

    if (error) {
        console.error('Error fetching member enrollments:', error)
        return []
    }

    // Flatten logic because Supabase returns nested object
    return data.map((item: any) => ({
        class_name: item.gym_schedules?.class_name || 'Unknown Class',
        day_of_week: item.gym_schedules?.day_of_week || '',
        start_time: item.gym_schedules?.start_time || ''
    }))
}
