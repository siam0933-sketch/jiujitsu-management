'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Fetch payment history for a specific member.
 */
export async function getPaymentHistory(memberId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_payments')
        .select('*')
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching payments:', error)
        return []
    }
    return data
}

/**
 * Record a new payment and update member's status/validity.
 */
export async function createPayment(formData: FormData) {
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

    const memberId = String(formData.get('member_id'))
    const planId = String(formData.get('plan_id'))
    const amount = Number(formData.get('amount'))
    const paymentDate = String(formData.get('payment_date') || new Date().toISOString().split('T')[0])
    const paymentMethod = String(formData.get('payment_method') || 'card')
    const start_date = String(formData.get('start_date') || paymentDate) // Usually same as payment unless specified

    // Logic-specific fields
    const type = String(formData.get('type')) // 'period' | 'session'
    const durationMonths = Number(formData.get('duration_months') || 0)
    const sessionCount = Number(formData.get('session_count') || 0)

    // Store complete snapshot for re-use
    const planSnapshot = {
        plan_id: planId,
        plan_name: String(formData.get('plan_name')),
        type: type,
        amount: amount,
        duration_months: durationMonths,
        session_count: sessionCount,
        option_ids: JSON.parse(String(formData.get('option_ids') || '[]')),
        options_summary: String(formData.get('options_summary') || '')
    }

    try {
        // 1. Insert Payment Record
        const { error: payError } = await supabase.from('gym_payments').insert({
            gym_id: gym.id,
            member_id: memberId,
            amount,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            plan_snapshot: planSnapshot,
            note: ''
        })

        if (payError) throw payError

        // 2. Update Member Status
        const { data: member } = await supabase
            .from('gym_members')
            .select('payment_end_date, remaining_sessions')
            .eq('id', memberId)
            .single()

        let updateData: any = {
            current_plan_id: planId,
            payment_start_date: start_date, // Last payment start
        }

        if (type === 'period') {
            // Calculate New End Date
            // If current end date is in future, add to it. Else start from today(startDate).
            const currentEnd = member?.payment_end_date ? new Date(member.payment_end_date) : null
            const start = new Date(start_date)

            let baseDate = start
            if (currentEnd && currentEnd > new Date()) {
                baseDate = currentEnd
            }

            // Add Months
            const newEnd = new Date(baseDate)
            newEnd.setMonth(newEnd.getMonth() + durationMonths)

            updateData.payment_end_date = newEnd.toISOString().split('T')[0]
        } else if (type === 'session') {
            // Add Sessions
            const currentSessions = member?.remaining_sessions || 0
            updateData.remaining_sessions = currentSessions + sessionCount

            // Optional: Update end date if session has validity? 
            // For now, let's assume period updates end date, session updates count.
            // If session also has duration (e.g. 10 sessions 3 months), we might want to extend validity too?
            // User requirement: "횟수권은 사용기간과... 정할수있고" -> Yes.
            const durationDays = Number(formData.get('duration_days') || 0)
            if (durationDays > 0) {
                const currentEnd = member?.payment_end_date ? new Date(member.payment_end_date) : null
                const start = new Date(start_date)
                let baseDate = start
                if (currentEnd && currentEnd > new Date()) baseDate = currentEnd

                const newEnd = new Date(baseDate)
                newEnd.setDate(newEnd.getDate() + durationDays)
                updateData.payment_end_date = newEnd.toISOString().split('T')[0]
            }
        }

        const { error: memberError } = await supabase
            .from('gym_members')
            .update(updateData)
            .eq('id', memberId)

        if (memberError) throw memberError

        revalidatePath('/dashboard/members')
        return { success: true }

    } catch (e: any) {
        console.error('Payment Error:', e)
        return { error: e.message }
    }
}

/**
 * Update logic for manual admin override.
 */
export async function updatePayment(paymentId: string, data: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_payments')
        .update(data)
        .eq('id', paymentId)

    if (error) return { error: error.message }

    // Note: We do NOT auto-recalculate member end-date on manual payment edit
    // because it gets complicated. Admin should manually edit member details if needed, 
    // or we assume this is just for record keeping correction.

    revalidatePath('/dashboard/members')
    return { success: true }
}
