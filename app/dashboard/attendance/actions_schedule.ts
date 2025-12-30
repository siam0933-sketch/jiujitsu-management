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
        .select('*')
        .eq('gym_id', gym.id)
        .order('start_time', { ascending: true })

    return (data as Schedule[]) || []
}

export async function createSchedule(data: { days: string[], time: string, name: string }) {
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

    const { error } = await supabase
        .from('gym_schedules')
        .insert(inserts)

    if (error) {
        console.error(error)
        return { error: '수업 생성 실패: ' + error.message }
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
