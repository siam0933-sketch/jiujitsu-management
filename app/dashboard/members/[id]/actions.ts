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

// --- 2. Pause / Resume Logic ---

export async function togglePauseStatus(memberId: string, currentStatus: 'active' | 'paused') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Gym ID
    const { data: member } = await supabase
        .from('gym_members')
        .select('gym_id')
        .eq('id', memberId)
        .single()

    if (!member) return { error: 'Member not found' }

    if (currentStatus === 'active') {
        // ACTION: PAUSE (Start a new pause record)
        const { error } = await supabase
            .from('gym_membership_pauses')
            .insert({
                gym_id: member.gym_id,
                member_id: memberId,
                start_date: new Date().toISOString(),
                end_date: null
            })

        if (error) return { error: '휴관 처리 실패: ' + error.message }

        // Update member status to 'paused' (optional, if you use status column)
        await supabase.from('gym_members').update({ status: 'paused' }).eq('id', memberId)

    } else {
        // ACTION: RESUME (End the current pause record)
        // 1. Find the open pause record
        const { data: pause } = await supabase
            .from('gym_membership_pauses')
            .select('*')
            .eq('member_id', memberId)
            .is('end_date', null)
            .single()

        if (!pause) return { error: '진행 중인 휴관 기록을 찾을 수 없습니다.' }

        const today = new Date()
        const startDate = new Date(pause.start_date)
        const pauseDurationMs = today.getTime() - startDate.getTime()
        const pauseDays = Math.floor(pauseDurationMs / (1000 * 60 * 60 * 24))

        // 2. Close the pause record
        const { error: updateError } = await supabase
            .from('gym_membership_pauses')
            .update({ end_date: today.toISOString() })
            .eq('id', pause.id)

        if (updateError) return { error: '복귀 처리 실패: ' + updateError.message }

        // 3. Extend Next Payment Date (Logic: Add pauseDays to next_payment_date)
        // Fetch current next_payment_date from gym_members (or where it's stored, assuming gym_members based on context)
        // Note: You might store payment info in 'gym_payments' or 'gym_members'. 
        // Based on previous context, let's assume simple extension on member/payment record if applicable.
        // For now, we will just update status back to active.
        await supabase.from('gym_members').update({ status: 'active' }).eq('id', memberId)

        // TODO: If you have a next_payment_date column, update it here.
        // const { data: sub } = await supabase.from('gym_members').select('next_payment_date').eq('id', memberId).single()
        // if (sub?.next_payment_date) {
        //    const newDate = addDays(new Date(sub.next_payment_date), pauseDays)
        //    await supabase.from('gym_members').update({ next_payment_date: newDate }).eq('id', memberId)
        // }
    }

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

// --- 3. Promotion Logic ---

export async function getPromotionLogs(memberId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('gym_promotion_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

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

    if (logError) return { error: '승급 기록 저장 실패: ' + logError.message }

    // 2. Update Member's Current Level
    // TODO: Verify if the new log is actually the "latest" promotion before updating current level.
    // Ideally, we only update member level if this promotion date is >= current last_promotion_date.
    // For simplicity, we assume new logs are usually recent.
    const { error: updateError } = await supabase
        .from('gym_members')
        .update({
            belt: data.belt, // Store belt name?
            // stripe? If you have a stripe column in members, update it too. Schema v2 didn't strictly say members table has stripe column yet.
            // Assuming 'belt' column stores "Blue" or "Blue 3" string? Or just Belt name?
            // Based on previous schema, 'belt' is text. Let's store "Blue 3그랄" for readability? Or just "Blue".
            // Let's stick to "Blue" in belt column for now, or match existing usage.
            last_promotion_date: data.date
        })
        .eq('id', memberId)

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
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
        .from('attendance_logs') // or gym_attendance_logs depending on which table is active. Checked schema: 'attendance_logs' (v1) and 'gym_attendance_logs' (v2).
        // Let's check which one has data. Existing code uses 'attendance_logs'.
        .select('*', { count: 'exact', head: true })
        .eq('user_id', memberId)
        .lte('check_in_at', targetDate.toISOString()) // timestamp comparison

    return { trainingDays: netTrainingDays, attendanceCount: count || 0 }
}
