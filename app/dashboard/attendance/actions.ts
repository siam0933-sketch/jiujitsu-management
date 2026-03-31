'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/utils/notifications'
import { grantAutoPoints, revokeAutoPoints } from '@/utils/grantAutoPoints'

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
        .select('id, checked_out_at, status, point_log_id')
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', today)
        .single()

    if (existing) {
        // If pending, approve it (change to present)
        if (existing.status === 'pending') {
            const { error: updateError } = await supabase
                .from('gym_attendance_logs')
                .update({ status: 'present', method: className ? 'class' : 'manual', class_name: className || null })
                .eq('id', existing.id)

            if (updateError) return { error: updateError.message }

            // Increment count logic (Same as new check-in)
            const { data: member } = await supabase
                .from('gym_members')
                .select('remaining_sessions, name')
                .eq('id', memberId)
                .single()

            let updateData: any = {}
            let shouldUpdate = false;

            if (member && member.remaining_sessions > 0) {
                updateData.remaining_sessions = member.remaining_sessions - 1
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                const { error: memberUpdateError } = await supabase
                    .from('gym_members')
                    .update(updateData)
                    .eq('id', memberId)

                if (memberUpdateError) console.error('Failed to update member stats:', memberUpdateError)
            }

            revalidatePath('/dashboard/attendance')
            revalidatePath('/dashboard/members')

            // 포인트 자동 적립: pending은 회원앱 요청이므로 auto_portal 사용
            // point_log_id가 없을 때만 적립 (중복 방지)
            if (!existing.point_log_id) {
                const pointLogId = await grantAutoPoints(gym.id, memberId, 'auto_portal')
                if (pointLogId) {
                    await supabase
                        .from('gym_attendance_logs')
                        .update({ point_log_id: pointLogId })
                        .eq('id', existing.id)
                }
            }

            // 출석 승인 알림 전송
            try {
                await sendNotification({
                    gymId: gym.id,
                    memberIds: [memberId],
                    type: 'attendance',
                    title: '✅ 출석 승인 완료',
                    body: member ? `${member.name || '회원'}님의 출석 요청이 승인되었습니다.` : '출석 요청이 승인되었습니다.',
                    link: '/portal/attendance',
                })
            } catch (e) { console.error('Notification error:', e) }

            return { success: true }
        }
        return { error: '이미 금일 출석 처리되었습니다.' }
    }

    // 2. Log Attendance
    const { data: newLog, error: logError } = await supabase
        .from('gym_attendance_logs')
        .insert({
            gym_id: gym.id,
            member_id: memberId,
            date: today,
            method: className ? 'class' : 'manual',
            class_name: className || null,
            status: 'present'
        })
        .select('id')
        .single()

    if (logError) return { error: logError.message }

    // 3. Increment Member Attendance Count
    const { data: member } = await supabase
        .from('gym_members')
        .select('remaining_sessions, name')
        .eq('id', memberId)
        .single()

    let updateData: any = {}
    let shouldUpdate = false;

    if (member && member.remaining_sessions > 0) {
        updateData.remaining_sessions = member.remaining_sessions - 1
        shouldUpdate = true;
    }

    if (shouldUpdate) {
        const { error: updateError } = await supabase
            .from('gym_members')
            .update(updateData)
            .eq('id', memberId)

        if (updateError) console.error('Failed to update member stats:', updateError)
    }

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/members')

    // 포인트 자동 적립 (auto_kiosk) 후 point_log_id 저장
    if (newLog?.id) {
        const pointLogId = await grantAutoPoints(gym.id, memberId, 'auto_kiosk')
        if (pointLogId) {
            await supabase
                .from('gym_attendance_logs')
                .update({ point_log_id: pointLogId })
                .eq('id', newLog.id)
        }
    }

    // 수동 출석 완료 알림 전송
    try {
        await sendNotification({
            gymId: gym.id,
            memberIds: [memberId],
            type: 'attendance',
            title: '✅ 출석 완료',
            body: member ? `${member.name || '회원'}님의 출석이 완료되었습니다.` : '출석이 완료되었습니다.',
            link: '/portal/attendance',
        })
    } catch (e) { console.error('Notification error:', e) }

    return { success: true }
}

export async function getPendingAttendanceCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: gym } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return 0

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    const { count, error } = await supabase
        .from('gym_attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('date', today)
        .eq('status', 'pending')

    return count || 0
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

    // 하원 완료 알림 전송
    try {
        const { data: member } = await supabase.from('gym_members').select('name').eq('id', memberId).single()
        await sendNotification({
            gymId: gym.id,
            memberIds: [memberId],
            type: 'attendance',
            title: '👋 하원 완료',
            body: member ? `${member.name || '회원'}님의 하원이 완료되었습니다.` : '하원이 완료되었습니다.',
            link: '/portal/attendance',
        })
    } catch (e) { console.error('Notification error:', e) }

    return { success: true }
}

export async function cancelAttendance(memberId: string, date: string, className?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: gym } = await supabase.from('gyms').select('id').eq('owner_id', user.id).single()
    if (!gym) return { error: 'Gym not found' }

    // 1. 삭제 전 point_log_id 조회 (포인트 롤백용)
    let selectQuery = supabase
        .from('gym_attendance_logs')
        .select('id, point_log_id')
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', date)

    if (className) {
        selectQuery = selectQuery.eq('class_name', className)
    }

    const { data: logToDelete } = await selectQuery.maybeSingle()

    // 2. 출석 로그 삭제
    let deleteQuery = supabase
        .from('gym_attendance_logs')
        .delete()
        .eq('gym_id', gym.id)
        .eq('member_id', memberId)
        .eq('date', date)

    if (className) {
        deleteQuery = deleteQuery.eq('class_name', className)
    }

    const { error } = await deleteQuery

    if (error) return { error: '출석 취소 실패: ' + error.message }

    // 3. 포인트 롤백 (point_log_id가 있을 경우)
    if (logToDelete?.point_log_id) {
        await revokeAutoPoints(logToDelete.point_log_id)
    }

    // 4. Decrement Member Attendance Count
    const { data: member } = await supabase
        .from('gym_members')
        .select('remaining_sessions')
        .eq('id', memberId)
        .single()

    let updateData: any = {}
    let shouldUpdate = false;

    if (member && member.remaining_sessions !== undefined && member.remaining_sessions !== null) {
        updateData.remaining_sessions = member.remaining_sessions + 1
        shouldUpdate = true;
    }

    if (shouldUpdate) {
        await supabase.from('gym_members').update(updateData).eq('id', memberId)
    }

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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    return getAttendanceLogsForDate(today)
}

export async function getAttendanceLogsForDate(date: string) {
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
        .from('gym_attendance_logs')
        .select(`
            *,
            gym_members (
                name,
                belt
            )
        `)
        .eq('gym_id', gym.id)
        .eq('date', date)
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
