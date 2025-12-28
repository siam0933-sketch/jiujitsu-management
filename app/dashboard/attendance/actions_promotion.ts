'use server'

import { createClient } from '@/utils/supabase/server'
import { PromotionCriteria } from '../settings/promotion/actions'
import { revalidatePath } from 'next/cache'

export type PromotionCandidate = {
    member_id: string
    name: string
    current_belt: string
    next_belt: string
    reason: string[] // e.g. ["출석 충족 (32/30)", "기간 충족 (4/3개월)"]
    criteria: PromotionCriteria
}

export async function getPromotionCandidates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return []

    // 1. Fetch Criteria
    const { data: allCriteria } = await supabase
        .from('gym_promotion_criteria')
        .select('*')
        .eq('gym_id', gym.id)

    if (!allCriteria || allCriteria.length === 0) return []

    // 2. Fetch Active Members
    const { data: members } = await supabase
        .from('gym_members')
        .select('id, name, belt, attendance_count, last_promotion_date, joined_at')
        .eq('gym_id', gym.id)
        .eq('status', 'active')

    if (!members) return []

    // 3. Logic: Check candidates
    const candidates: PromotionCandidate[] = []

    for (const member of members) {
        // Find matching criteria for current belt
        const matchingCriteria = allCriteria.filter((c: any) => c.current_belt === member.belt)
        if (matchingCriteria.length === 0) continue

        for (const criteria of matchingCriteria) {
            const reasons: string[] = []
            let isEligible = false

            // Check Attendance
            if (criteria.required_attendance_count > 0) {
                if (member.attendance_count >= criteria.required_attendance_count) {
                    reasons.push(`출석 충족 (${member.attendance_count}/${criteria.required_attendance_count}회)`)
                }
            }

            // Check Tenure (Months)
            if (criteria.required_tenure_months > 0) {
                const baseDate = new Date(member.last_promotion_date || member.joined_at)
                const now = new Date()
                const diffMonths = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth())

                if (diffMonths >= criteria.required_tenure_months) {
                    reasons.push(`기간 충족 (${diffMonths}/${criteria.required_tenure_months}개월)`)
                }
            }

            // Decision Logic: OR vs AND? 
            // Implementation Plan said: "Criteria: OR or AND depending on user pref".
            // My UI has "OR" text in it visually, but let's look at the fields.
            // If both are > 0, usually it's AND for belt promotions in BJJ. 
            // BUT, the user prompt said "기준이 다르기 때문에...".
            // Let's assume AND if both are set. If one is 0, ignore that condition.
            // Wait, my UI has "OR" text between inputs in `page.tsx`!
            // "필요 기간 (개월) OR 필요 출석 (회)"
            // So if EITHER is met, they are a candidate?
            // "3개월 OR 30회" means either/or.

            // Let's implement OR logic based on the "OR" label I put in the UI.
            if (criteria.required_attendance_count > 0 && member.attendance_count >= criteria.required_attendance_count) {
                isEligible = true
            }
            if (criteria.required_tenure_months > 0) {
                const baseDate = new Date(member.last_promotion_date || member.joined_at)
                const now = new Date()
                const diffMonths = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth())
                if (diffMonths >= criteria.required_tenure_months) {
                    isEligible = true
                }
            }

            // If checking "AND" logic, we would need both. 
            // Use case: White -> Blue usually needs BOTH time on mat and skill (attendance).
            // But Stripes are often strictly attendance.
            // Let's stick to the UI label "OR" for now. If user wants AND, they'll say so.
            // Actually, let's allow "Partial" match to show progress? No, only "Candidates".

            if (isEligible) {
                candidates.push({
                    member_id: member.id,
                    name: member.name,
                    current_belt: member.belt,
                    next_belt: criteria.next_belt,
                    reason: reasons,
                    criteria: criteria as PromotionCriteria
                })
            }
        }
    }

    return candidates
}

export async function promoteMember(memberId: string, nextBelt: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Update Member
    const { error } = await supabase
        .from('gym_members')
        .update({
            belt: nextBelt,
            attendance_count: 0,
            last_promotion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', memberId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/members')
    return { success: true }
}
