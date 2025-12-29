'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import _ from 'lodash'

// --- Types (must match Client) ---
export type StripeReq = {
    months: number
    attendance: number
}

export type AdultBeltConfig = {
    name: string
    stripes: StripeReq[]
}

export type KidsBeltConfig = {
    name: string
    totalStripes: number
    reqPerStripe: StripeReq
}

const ADULT_BELTS = ['White', 'Blue', 'Purple', 'Brown', 'Black']
const KIDS_BELTS = [
    'White', 'Gray-White', 'Gray', 'Gray-Black',
    'Yellow-White', 'Yellow', 'Yellow-Black',
    'Orange-White', 'Orange', 'Orange-Black',
    'Green-White', 'Green', 'Green-Black'
]

export async function getPromotionCriteria() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    // 2. Fetch All Criteria
    const { data: rows } = await supabase
        .from('gym_promotion_criteria')
        .select('*')
        .eq('gym_id', gym.id)
        .order('belt_order', { ascending: true })
        .order('stripe_level', { ascending: true })

    // 3. Construct Adult Config
    const adultConfig: AdultBeltConfig[] = ADULT_BELTS.map((name, idx) => {
        const beltRows = rows?.filter(r => r.type === 'ADULT' && r.belt_name === name) || []
        // Default 4 stripes if not found
        const stripes: StripeReq[] = Array(4).fill(0).map((_, i) => {
            const found = beltRows.find(r => r.stripe_level === i)
            return found ? { months: found.required_tenure_months, attendance: found.required_attendance_count }
                : { months: 3, attendance: 40 } // Default defaults
        })
        return { name, stripes }
    })

    // 4. Construct Kids Config
    const kidsConfig: KidsBeltConfig[] = KIDS_BELTS.map((name, idx) => {
        const beltRows = rows?.filter(r => r.type === 'KIDS' && r.belt_name === name) || []
        // Determine total stripes from DB or default to 4
        // Logic: look at the 'total_stripes_count' of the first row, or fallback
        const totalStripes = beltRows.length > 0 && beltRows[0].total_stripes_count ? beltRows[0].total_stripes_count : 4

        // Use the requirement of the first stripe (0) as the representative for UI
        const firstRow = beltRows.find(r => r.stripe_level === 0)
        const reqPerStripe: StripeReq = firstRow
            ? { months: firstRow.required_tenure_months, attendance: firstRow.required_attendance_count }
            : { months: 1, attendance: 10 } // Default defaults

        return { name, totalStripes, reqPerStripe }
    })

    return { adultConfig, kidsConfig }
}

export async function savePromotionCriteria(
    type: 'ADULT' | 'KIDS',
    data: AdultBeltConfig[] | KidsBeltConfig[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    if (!gym) return { error: 'Gym not found' }

    // 2. Prepare Rows to Upsert
    let upsertData: any[] = []

    if (type === 'ADULT') {
        const config = data as AdultBeltConfig[]
        config.forEach((belt, bIdx) => {
            belt.stripes.forEach((req, sIdx) => {
                upsertData.push({
                    gym_id: gym.id,
                    type: 'ADULT',
                    belt_name: belt.name,
                    belt_order: bIdx + 1,
                    stripe_level: sIdx, // 0 to 3
                    total_stripes_count: 4,
                    required_tenure_months: req.months,
                    required_attendance_count: req.attendance,
                    current_belt: `${belt.name} ${sIdx}`, // Legacy/Fallback
                    next_belt: sIdx === 3 ? 'Next Belt' : `${belt.name} ${sIdx + 1}` // Legacy/Fallback
                })
            })
        })
    } else {
        const config = data as KidsBeltConfig[]
        config.forEach((belt, bIdx) => {
            // For kids, we generate rows for 0 to (totalStripes - 1)
            for (let sIdx = 0; sIdx < belt.totalStripes; sIdx++) {
                upsertData.push({
                    gym_id: gym.id,
                    type: 'KIDS',
                    belt_name: belt.name,
                    belt_order: bIdx + 1,
                    stripe_level: sIdx,
                    total_stripes_count: belt.totalStripes,
                    required_tenure_months: belt.reqPerStripe.months, // Uniform req
                    required_attendance_count: belt.reqPerStripe.attendance,
                    current_belt: `${belt.name} ${sIdx}`,
                    next_belt: sIdx === belt.totalStripes - 1 ? 'Next Belt' : `${belt.name} ${sIdx + 1}`
                })
            }
        })
    }

    // 3. Perform Upsert
    // We want to replace existing configurations for this type.
    // Ideally, we delete all for this type and gym first to handle reduction in stripes (e.g. 11 -> 4).

    // 3-1. Delete existing for safety (clean slate for this Type)
    const { error: deleteError } = await supabase
        .from('gym_promotion_criteria')
        .delete()
        .eq('gym_id', gym.id)
        .eq('type', type)

    if (deleteError) {
        console.error('Delete Error:', deleteError)
        return { error: '설정 초기화 실패' }
    }

    // 3-2. Insert new
    const { error: insertError } = await supabase
        .from('gym_promotion_criteria')
        .insert(upsertData)

    if (insertError) {
        console.error('Insert Error:', insertError)
        return { error: '설정 저장 실패: ' + insertError.message }
    }

    revalidatePath('/dashboard/settings/promotion')
    return { success: true }
}
