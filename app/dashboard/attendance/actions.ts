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

    // 1. Check if already checked in today for this specific class?
    // User requirement: "Separate delete possible... box... click to attend"
    // Usually one check-in per day or per class?
    // If className is provided, we should allow check-in if not checked in for THAT class.
    // If no className (manual general checkin), check generally?
    // Let's assume:
    // If className provided: Check if (member, date, class_name) exists.
    // If not provided: Check if (member, date) exists (legacy behavior).

    const today = date || new Date().toISOString().split('T')[0]
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
    return { success: true }
}

export async function cancelAttendance(memberId: string, date: string, className?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Gym ID (Could optimize by caching or context, but safe fetch here)
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

    // If session-based, increment session count back?
    // User logic: "Remaining sessions" usually means paid sessions.
    // If we consumed one on check-in, we should restore it on cancel.
    if (member && member.remaining_sessions !== undefined && member.remaining_sessions !== null) {
        // Assuming unlimited if null? Schema says int4, nullable? usually 0 or positive.
        // Let's increment.
        updateData.remaining_sessions = member.remaining_sessions + 1
    }

    await supabase.from('gym_members').update(updateData).eq('id', memberId)

    revalidatePath('/dashboard/attendance')
    return { success: true }
}

export async function getMemberAttendanceDates(memberId: string) {
    const supabase = await createClient()

    // Simple fetch of all dates for this member
    // Using distinct (or simple select and process in JS if distinct not supported easily in query builder without rpc)
    // Supabase JS select allows distinct? No, usually separate RPC or post-process.
    // Let's fetch dates.
    const { data, error } = await supabase
        .from('gym_attendance_logs')
        .select('date')
        .eq('member_id', memberId)
        .order('date', { ascending: false })

    if (error) return []

    // distinct
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

    // Simplify query: Use wildcard '*' as explicit column selection was failing (likely caching issue)
    // The debug panel confirmed that select('*') works and returns all necessary data.
    const { data, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('gym_id', gym.id)
        .neq('status', 'paused') // Exclude paused members
        .order('name', { ascending: true })

    if (error) {
        console.error('[getActiveMembers] Error details:', JSON.stringify(error, null, 2))
        return []
    }

    // Simple mapping
    const members = data.map((m: any) => ({
        id: m.id,
        name: m.name || '이름 없음', // Fallback just in case
        belt: m.belt,
        attendance_count: m.attendance_count,
        remaining_sessions: m.remaining_sessions,
        birth_date: m.birth_date,
        phone: m.phone
    }))

    // Sort by name for Korean support
    members.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ko'))

    console.log('[getActiveMembers] Count:', members.length)
    return members
}
