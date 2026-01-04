'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkInMember(memberId: string, className?: string, date?: string) {
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

    // KST Correct Date
    const today = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    // Check if checks exist for today
    const { data: existing } = await supabase
        .from('gym_attendance_logs')
        .select('id, checked_out_at')
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', today)
        .single()

    if (existing) {
        return { error: '이미 금일 출석 처리되었습니다.' }
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
    const { data: member } = await supabase
        .from('gym_members')
        .select('attendance_count, remaining_sessions')
        .eq('id', memberId)
        .single()

    const newCount = (member?.attendance_count || 0) + 1
    let updateData: any = { attendance_count: newCount }

    if (member && member.remaining_sessions > 0) {
        updateData.remaining_sessions = member.remaining_sessions - 1
    }

    const { error: updateError } = await supabase
        .from('gym_members')
        .update(updateData)
        .eq('id', memberId)

    if (updateError) console.error('Failed to update member stats:', updateError)

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/members')
    return { success: true }
}

export async function checkOutMember(memberId: string, date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Gym ID
    const { data: gym } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: 'Gym not found' }

    const { error } = await supabase
        .from('gym_attendance_logs')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', date)
        .is('checked_out_at', null)

    if (error) return { error: '하원 처리 실패: ' + error.message }

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/members')
    return { success: true }
}

export async function cancelAttendance(memberId: string, date: string, className?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: 'Gym not found' }

    // 1. Find the log to delete
    let query = supabase
        .from('gym_attendance_logs')
        .delete()
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', date)

    if (className) {
        query = query.eq('class_name', className)
    }

    const { error } = await query

    if (error) return { error: '출석 취소 실패: ' + error.message }

    // 2. Decrement Member Attendance Count
    const { data: member } = await supabase
        .from('gym_members')
        .select('attendance_count, remaining_sessions')
        .eq('id', memberId)
        .single()

    const newCount = Math.max(0, (member?.attendance_count || 0) - 1)
    let updateData: any = { attendance_count: newCount }

    if (member && member.remaining_sessions !== undefined && member.remaining_sessions !== null) {
        updateData.remaining_sessions = member.remaining_sessions + 1
    }

    await supabase.from('gym_members').update(updateData).eq('id', memberId)

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/members')
    return { success: true }
}

export async function getMemberAttendanceDates(memberId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_attendance_logs')
        .select('date')
        .eq('member_id', memberId)
        .order('date', { ascending: false })

    if (error) return []

    const dates = Array.from(new Set(data.map(d => d.date)))
    return dates
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

    // KST Correct Date
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
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

    const { data, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('gym_id', gym.id)
        .neq('status', 'paused')
        .order('name', { ascending: true })

    if (error) {
        console.error('[getActiveMembers] Error details:', JSON.stringify(error, null, 2))
        return []
    }

    const members = data.map((m: any) => ({
        id: m.id,
        name: m.name || '이름 없음',
        belt: m.belt,
        attendance_count: m.attendance_count,
        remaining_sessions: m.remaining_sessions,
        birth_date: m.birth_date,
        phone: m.phone
    }))

    members.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ko'))

    return members
}
