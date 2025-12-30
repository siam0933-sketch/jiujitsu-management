'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkInMember(memberId: string, className?: string) {
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

    // 1. Check if already checked in today for this specific class?
    // User requirement: "Separate delete possible... box... click to attend"
    // Usually one check-in per day or per class?
    // If className is provided, we should allow check-in if not checked in for THAT class.
    // If no className (manual general checkin), check generally?
    // Let's assume:
    // If className provided: Check if (member, date, class_name) exists.
    // If not provided: Check if (member, date) exists (legacy behavior).

    const today = new Date().toISOString().split('T')[0]
    let query = supabase
        .from('gym_attendance_logs')
        .select('id')
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', today)

    if (className) {
        query = query.eq('class_name', className)
    } else {
        // Legacy: Check if any check-in exists? Or check if specific manual check-in exists?
        // Let's prevent double check-in generally if no class specified.
    }

    const { data: existing } = await query.single()

    if (existing) {
        return { error: '이미 해당 수업(또는 오늘)에 출석 체크가 완료되었습니다.' }
    }

    // 2. Log Attendance
    const { error: logError } = await supabase.from('gym_attendance_logs').insert({
        gym_id: gym.id,
        member_id: memberId,
        date: today,
        method: className ? 'class' : 'manual',
        class_name: className || null
    })

    if (logError) return { error: logError.message }

    // 3. Increment Member Attendance Count
    // (Using rpc or simple update. Simple update for now is fine, minimal concurrency risk for small gyms)
    // First get current count
    const { data: member } = await supabase
        .from('gym_members')
        .select('attendance_count, remaining_sessions')
        .eq('id', memberId)
        .single()

    const newCount = (member?.attendance_count || 0) + 1
    let updateData: any = { attendance_count: newCount }

    // If session-based, decrement session count?
    // User requirement: "횟수권은 사용기간과... 정할수있고"
    // Usually attendance consumes a session.
    if (member && member.remaining_sessions > 0) {
        updateData.remaining_sessions = member.remaining_sessions - 1
    }

    const { error: updateError } = await supabase
        .from('gym_members')
        .update(updateData)
        .eq('id', memberId)

    if (updateError) console.error('Failed to update member stats:', updateError)

    revalidatePath('/dashboard/attendance')
    return { success: true }
}

export async function getTodayAttendanceLogs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
        .from('gym_attendance_logs')
        .select(`
            *,
            gym_members (
                name,
                belt
            )
        `)
        .eq('gym_id', gym.id)
        .eq('date', today)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function getActiveMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    const { data } = await supabase
        .from('gym_members')
        .select('id, name, belt, attendance_count, remaining_sessions')
        .eq('gym_id', gym.id)
        .eq('status', 'active')
        .order('name', { ascending: true })

    return data || []
}
