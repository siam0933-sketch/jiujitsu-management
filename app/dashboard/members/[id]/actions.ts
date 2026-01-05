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

    // 1. Get Member Start/Join Date
    const { data: member } = await supabase
        .from('gym_members')
        .select('start_date, joined_at')
        .eq('id', memberId)
        .single()

    if (!member) return { trainingDays: 0, attendanceCount: 0 }

    // 2. Find Last Promotion Date (before targetDate)
    const { data: lastPromo } = await supabase
        .from('gym_promotion_logs')
        .select('promoted_at')
        .eq('member_id', memberId)
        .lt('promoted_at', targetDateStr) // strictly less than current promotion date
        .order('promoted_at', { ascending: false })
        .limit(1)
        .single()

    // Determine Start Date for Calculation
    // If there is a previous promotion, start from there. Otherwise start from member start/join.
    let startDateStr = member.start_date || member.joined_at
    if (lastPromo && lastPromo.promoted_at) {
        startDateStr = lastPromo.promoted_at
    }

    // Verify valid date
    if (!startDateStr) return { trainingDays: 0, attendanceCount: 0 }

    const startDate = new Date(startDateStr)

    // Safety check if dates are inverted
    if (startDate > targetDate) {
        return { trainingDays: 0, attendanceCount: 0 }
    }

    // 3. Fetch Pauses
    const { data: pauses } = await supabase
        .from('gym_membership_pauses')
        .select('*')
        .eq('member_id', memberId)

    // 4. Calculate Training Days (Start -> Target) - Pauses
    const totalDurationMs = targetDate.getTime() - startDate.getTime()
    let totalDays = Math.floor(totalDurationMs / (1000 * 60 * 60 * 24))
    if (totalDays < 0) totalDays = 0

    // Subtract Pauses
    let pauseDays = 0
    if (pauses) {
        pauses.forEach((p: any) => {
            const pStart = new Date(p.start_date)
            const pEnd = p.end_date ? new Date(p.end_date) : new Date()

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

    // 5. Calculate Attendance
    // Count logs where date <= targetDate AND date > startDate
    // Technically, if promoted on Jan 1, training for next belt starts Jan 2? 
    // Usually inclusive or exclusive? Let's say > startDate to avoid double counting the promotion day itself if they trained?
    // Or >=? If they trained on the day of last promotion, that likely counted for the *last* belt.
    // So strictly > startDate is safer.

    const { count } = await supabase
        .from('gym_attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .lte('date', targetDateStr)
        .gt('date', startDateStr)

    return { trainingDays: netTrainingDays, attendanceCount: count || 0 }
}

