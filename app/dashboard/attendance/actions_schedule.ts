'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Schedule = {
    id: string
    gym_id: string
    day_of_week: string
    start_time: string
    class_name: string
    created_at: string
    enrollment_count?: number
    enrolled_members?: { name: string }[]
}

export async function getSchedules() {
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

    const { data } = await supabase
        .from('gym_schedules')
        .select(`
            *,
            gym_class_enrollments (
                gym_members (name)
            )
        `)
        .eq('gym_id', gym.id)
        .order('start_time', { ascending: true })

    const schedules = (data || []).map((s: any) => {
        const enrollments = s.gym_class_enrollments || []
        return {
            ...s,
            enrollment_count: enrollments.length,
            enrolled_members: enrollments.map((e: any) => ({ name: e.gym_members?.name || 'Unknown' }))
        }
    })

    return schedules as Schedule[]
}

export async function createSchedule(data: { days: string[], time: string, name: string, initialEnrollments?: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    const inserts = data.days.map(day => ({
        gym_id: gym.id,
        day_of_week: day,
        start_time: data.time,
        class_name: data.name
    }))

    const { data: newSchedules, error } = await supabase
        .from('gym_schedules')
        .insert(inserts)
        .select('id')

    if (error) {
        console.error(error)
        return { error: '수업 생성 실패: ' + error.message }
    }

    // Handle Initial Enrollments
    if (data.initialEnrollments && data.initialEnrollments.length > 0 && newSchedules) {
        const enrollmentInserts: any[] = []

        newSchedules.forEach(schedule => {
            data.initialEnrollments!.forEach(memberId => {
                enrollmentInserts.push({
                    schedule_id: schedule.id,
                    member_id: memberId
                })
            })
        })

        if (enrollmentInserts.length > 0) {
            const { error: enrollError } = await supabase
                .from('gym_class_enrollments')
                .insert(enrollmentInserts)

            if (enrollError) console.error('Initial enrollment error:', enrollError)
        }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
}

export async function deleteSchedule(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('gym_schedules')
        .delete()
        .eq('id', id)

    if (error) return { error: '수업 삭제 실패' }

    revalidatePath('/dashboard/attendance')
    return { success: true }
}
