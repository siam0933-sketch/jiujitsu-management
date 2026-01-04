'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---
export type PromotionLog = {
    id: string
    belt_name: string
    stripe_level: number
    promoted_at: string
    training_days: number
    attendance_count: number
    awarded_by: string
    memo: string | null
}

export type PauseRecord = {
    id: string
    start_date: string
    end_date: string | null
}

// --- 1. Member Basic Updates ---

export async function updateMemberStartDate(memberId: string, startDate: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_members')
        .update({ start_date: startDate })
        .eq('id', memberId)

    if (error) return { error: '입문일 수정 실패: ' + error.message }

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function updateMemberJoinedDate(memberId: string, joinedAt: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_members')
        .update({ joined_at: joinedAt })
        .eq('id', memberId)

    if (error) return { error: '가입일 수정 실패: ' + error.message }

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}



// --- 3. Promotion Logic ---

export async function getPromotionLogs(memberId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

    if (error) {
        console.error('getPromotionLogs Error:', error)
    }
    console.log(`getPromotionLogs for ${memberId}:`, data?.length, 'records found')

    return data as PromotionLog[] || []
}

export async function logPromotion(memberId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Admin Name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const adminName = profile?.full_name || 'Admin'

    // Get Member (for gym_id)
    const { data: member } = await supabase.from('gym_members').select('gym_id').eq('id', memberId).single()
    if (!member) return { error: 'Member not found' }

    // 1. Insert Log
    console.log(`Inserting Promotion Log for Member ${memberId}, Gym ${member.gym_id}`)
    const { error: logError } = await supabase
        .from('gym_promotion_logs')
        .insert({
            gym_id: member.gym_id,
            member_id: memberId,
            belt_name: data.belt,
            stripe_level: data.stripe,
            promoted_at: data.date,
            training_days: data.trainingDays, // Calculated on Client or Recalculated here? Let's take Client's value for now
            attendance_count: data.attendanceCount,
            awarded_by: adminName,
            memo: data.memo
        })

    if (logError) {
        console.error('Promotion Log Insert Error:', logError)
        return { error: '승급 기록 저장 실패: ' + logError.message }
    }

    // 2. Update Member's Current Level
    const { error: updateError } = await supabase
        .from('gym_members')
        .update({
            belt: data.belt, // Store belt name
            last_promotion_date: data.date
        })
        .eq('id', memberId)

    if (updateError) {
        console.error('Member Update Error:', updateError)
        return { error: '회원 정보(벨트) 업데이트 실패: ' + updateError.message }
    }

    revalidatePath(`/dashboard/members/${memberId}`)

    // Return updated logs
    const { data: updatedLogs } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

    return { success: true, logs: updatedLogs as PromotionLog[] }
}

export async function deletePromotionLog(logId: string, memberId: string) {
    const supabase = await createClient()

    // 1. Delete Log
    const { error } = await supabase
        .from('gym_promotion_logs')
        .delete()
        .eq('id', logId)

    if (error) {
        console.error('Delete Log Error:', error)
        return { error: '삭제 실패: ' + error.message }
    }

    // 2. Re-calculate Member Level (optional but good practice)
    // For now, we trust the user to fix the level manually if needed, or we just leave it.
    // Ideally, we should find the *latest* log remaining and update the member's belt.
    const { data: latestLog } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })
        .limit(1)
        .single()

    if (latestLog) {
        // Update member to this latest log's belt
        await supabase.from('gym_members').update({
            belt: latestLog.belt_name,
            last_promotion_date: latestLog.promoted_at
        }).eq('id', memberId)
    }

    revalidatePath(`/dashboard/members/${memberId}`)

    // Return updated logs
    const { data: updatedLogs } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

    return { success: true, logs: updatedLogs as PromotionLog[] }
}

export async function updatePromotionLog(logId: string, memberId: string, data: any) {
    const supabase = await createClient()

    // 1. Update Log
    const { error } = await supabase
        .from('gym_promotion_logs')
        .update({
            belt_name: data.belt,
            stripe_level: data.stripe,
            promoted_at: data.date,
            training_days: data.trainingDays,
            attendance_count: data.attendanceCount,
            memo: data.memo
        })
        .eq('id', logId)

    if (error) {
        console.error('Update Log Error:', error)
        return { error: '수정 실패: ' + error.message }
    }

    // 2. Update Member Level if this was the latest log
    // Simplest approach: Just update member to match this log if it IS the latest by date/time.
    // Or just always update member to match the *actual* latest log after this edit.
    const { data: latestLog } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })
        .limit(1)
        .single()

    if (latestLog) {
        await supabase.from('gym_members').update({
            belt: latestLog.belt_name,
            last_promotion_date: latestLog.promoted_at
        }).eq('id', memberId)
    }

    revalidatePath(`/dashboard/members/${memberId}`)

    // Return updated logs
    const { data: updatedLogs } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

    return { success: true, logs: updatedLogs as PromotionLog[] }
}

// --- 4. Helper: Calculate Stats ---
export async function calculatePromotionStats(memberId: string, targetDateStr: string) {
    const supabase = await createClient()
    const targetDate = new Date(targetDateStr)

    // 1. Get Start Date & Pauses
    const { data: member } = await supabase
        .from('gym_members')
        .select('start_date, joined_at')
        .eq('id', memberId)
        .single()

    if (!member) return { trainingDays: 0, attendanceCount: 0 }

    const startDate = new Date(member.start_date || member.joined_at) // Fallback to join date

    // 2. Fetch Pauses
    const { data: pauses } = await supabase
        .from('gym_membership_pauses')
        .select('*')
        .eq('member_id', memberId)

    // 3. Calculate Training Days (Start -> Target) - Pauses
    // Total Days
    const totalDurationMs = targetDate.getTime() - startDate.getTime()
    let totalDays = Math.floor(totalDurationMs / (1000 * 60 * 60 * 24))
    if (totalDays < 0) totalDays = 0

    // Subtract Pauses
    let pauseDays = 0
    if (pauses) {
        pauses.forEach((p: any) => {
            const pStart = new Date(p.start_date)
            const pEnd = p.end_date ? new Date(p.end_date) : new Date() // If ongoing, calc until today(or target?)

            // Intersection Logic: Only subtract pause days that fall within [StartDate, TargetDate]
            const effectiveStart = pStart < startDate ? startDate : pStart
            const effectiveEnd = pEnd > targetDate ? targetDate : pEnd

            if (effectiveStart < effectiveEnd) {
                const pDuration = effectiveEnd.getTime() - effectiveStart.getTime()
                pauseDays += Math.floor(pDuration / (1000 * 60 * 60 * 24))
            }
        })
    }

    const netTrainingDays = Math.max(0, totalDays - pauseDays)

    // 4. Calculate Attendance
    // Count logs where date <= targetDate and date >= startDate (conceptually)
    // Assuming we count all attendance for simplicity? Or only since start_date?
    // User said "Training Days ... excludes holidays".
    // Attendance count is usually total attendance.
    const { count } = await supabase
        .from('gym_attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId) // Note: gym_attendance_logs uses member_id, not user_id
        .lte('date', targetDateStr) // gym_attendance_logs uses date (string YYYY-MM-DD) or created_at? 
    // Let's use date column for consistency with check-ins.
    // If we want exact time comparison, we might need created_at, but date is safer for "days".
    // BUT, targetDateStr is passed as YYYY-MM-DD from the form typically.
    // Let's ensure we compare dates correctly.
    // usage: .lte('date', targetDateStr) works if date is YYYY-MM-DD string column.

    // Wait, looking at getMemberAttendanceLogs, 'date' is the column used.
    // And it is YYYY-MM-DD string.
    // targetDateStr passed from PromotionHistory is also YYYY-MM-DD (e.g. 2024-01-01).

    if (count === null) return { trainingDays: netTrainingDays, attendanceCount: 0 }

    return { trainingDays: netTrainingDays, attendanceCount: count }

    return { trainingDays: netTrainingDays, attendanceCount: count || 0 }
}

export async function getMemberAttendanceLogs(memberId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_attendance_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false })

    if (error) {
        console.error('getMemberAttendanceLogs Error:', error)
        return []
    }

    return data
}
