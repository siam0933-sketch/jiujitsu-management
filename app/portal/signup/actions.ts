'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { sendAdminNotification } from '@/utils/notifications'

// 0a. Search gyms by partial name (for signup search UI)
export async function searchGyms(query: string) {
    if (!query || query.trim().length < 1) return { gyms: [] }
    const supabaseAdmin = await createAdminClient()
    const { data, error } = await supabaseAdmin
        .from('gyms')
        .select('id, name')
        .eq('status', 'active')
        .ilike('name', `%${query.trim()}%`)
        .order('name', { ascending: true })
        .limit(10)
    if (error) return { gyms: [] }
    return { gyms: data || [] }
}

// 0b. Look up gym by id and return stripe map + active terms (for signup form)
export async function lookupGymById(gymId: string) {
    const supabaseAdmin = await createAdminClient()

    const { data: gym } = await supabaseAdmin
        .from('gyms')
        .select('id, name')
        .eq('id', gymId)
        .eq('status', 'active')
        .single()

    if (!gym) return { error: '도장을 찾을 수 없습니다.' }

    const { data: criteriaRows } = await supabaseAdmin
        .from('gym_promotion_criteria')
        .select('belt_name, type, total_stripes_count, stripe_level')
        .eq('gym_id', gym.id)

    const stripeMap: Record<string, number> = {}
    criteriaRows?.forEach((row: any) => {
        const existing = stripeMap[row.belt_name]
        if (existing === undefined || row.total_stripes_count > existing) {
            stripeMap[row.belt_name] = row.total_stripes_count
        }
    })

    let activeTerms: any[] = []
    try {
        const { data: termsRows } = await supabaseAdmin
            .from('gym_terms')
            .select('id, title, content')
            .eq('gym_id', gym.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
        activeTerms = termsRows || []
    } catch (e) {
        activeTerms = []
    }

    return { success: true, gym, stripeMap, activeTerms }
}

// 1. Verify invitation code (kept for backward compatibility with existing invite links)
export async function lookupGymByCode(code: string) {

    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    if (!code) return { error: '초대 코드를 입력해주세요.' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('invitation_code', code.toUpperCase())
        .eq('status', 'active')
        .single()

    if (!gym) {
        return { error: '유효하지 않은 초대 코드입니다. 다시 확인해주세요.' }
    }

    // Use Admin client to bypass RLS - unsigned users (signing up) can't read criteria otherwise
    const { data: criteriaRows } = await supabaseAdmin
        .from('gym_promotion_criteria')
        .select('belt_name, type, total_stripes_count, stripe_level')
        .eq('gym_id', gym.id)

    // Build a map: belt_name -> max stripe count
    const stripeMap: Record<string, number> = {}
    criteriaRows?.forEach((row: any) => {
        const existing = stripeMap[row.belt_name]
        if (existing === undefined || row.total_stripes_count > existing) {
            stripeMap[row.belt_name] = row.total_stripes_count
        }
    })

    // Fetch active terms for this gym (shown during signup)
    // Wrapped in try-catch in case the gym_terms table hasn't been created yet
    let activeTerms: any[] = []
    try {
        const { data: termsRows } = await supabaseAdmin
            .from('gym_terms')
            .select('id, title, content')
            .eq('gym_id', gym.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
        activeTerms = termsRows || []
    } catch (e) {
        // Table may not exist yet — gracefully skip
        activeTerms = []
    }

    return { success: true, gym, stripeMap, activeTerms }
}

// 2. Handle actual registration
export async function registerPortalMember(data: {
    gymId: string,
    name: string,
    phone: string,
    password: string,
    birthDate: string | null,
    gender: string,
    belt: string,
    stripe: number | null,
    promotionDate: string | null,
    accessCode: string,
    guardianPhone?: string,
    address?: string,
    school?: string,
    schoolType?: string,
    gradeNumber?: number | null,
    gradeUpdatedYear?: number | null,
    startDate?: string | null,
}) {
    // [CRITICAL] We must use the Admin Service Key to bypass RLS and create/update members
    // before they actually log in.
    const supabaseAdmin = await createAdminClient()

    try {
        // 출석번호 자동 생성 로직: 본인 전화번호 뒤 4자리 -> 없으면 보호자 번호 뒤 4자리 -> 없으면 랜덤 4자리
        let finalAccessCode = data.accessCode;
        if (!finalAccessCode) {
            if (data.phone && data.phone.length >= 4) {
                finalAccessCode = data.phone.slice(-4);
            } else if (data.guardianPhone && data.guardianPhone.length >= 4) {
                finalAccessCode = data.guardianPhone.slice(-4);
            } else {
                finalAccessCode = Math.floor(1000 + Math.random() * 9000).toString();
            }
        }

        // Step 1: Check if this member ALREADY exists in the gym based on name + phone
        const { data: existingMember } = await supabaseAdmin
            .from('gym_members')
            .select('id, login_password')
            .eq('gym_id', data.gymId)
            .eq('name', data.name)
            .eq('phone', data.phone)
            .single()

        let memberIdToUpdate = null

        if (existingMember) {
            // Member exists - they are linking their account!
            memberIdToUpdate = existingMember.id

            const hashedPassword = bcrypt.hashSync(data.password.toLowerCase(), 10)

            // Just update their password and missing profile data
            const { error: updateError } = await supabaseAdmin
                .from('gym_members')
                .update({
                    login_password: hashedPassword,
                    gender: data.gender,
                    belt: data.belt,
                    pending_stripe: data.stripe ?? null,
                    pending_promotion_date: data.promotionDate || null,
                    birth_date: data.birthDate || null,
                    access_code: finalAccessCode,
                    guardian_phone: data.guardianPhone || null,
                    address: data.address || null,
                    school: data.school || null,
                    school_type: data.schoolType || '일반',
                    grade_number: data.gradeNumber ?? null,
                    grade_updated_year: data.gradeUpdatedYear ?? null,
                    ...(data.startDate ? { start_date: new Date(data.startDate).toISOString() } : {})
                })
                .eq('id', existingMember.id)

            if (updateError) throw new Error('계정 연동 중 오류가 발생했습니다.')

        } else {
            // Member does NOT exist - Complete new registration

            // Note: Since we don't have Supabase Auth 'users' for normal members yet,
            // we are entirely relying on the `gym_members` table for auth credentials.

            const hashedPassword = bcrypt.hashSync(data.password.toLowerCase(), 10)

            const { data: newMember, error: insertError } = await supabaseAdmin
                .from('gym_members')
                .insert({
                    gym_id: data.gymId,
                    name: data.name,
                    phone: data.phone,
                    login_password: hashedPassword,
                    gender: data.gender,
                    birth_date: data.birthDate || null,
                    access_code: finalAccessCode,
                    guardian_phone: data.guardianPhone || null,
                    address: data.address || null,
                    school: data.school || null,
                    school_type: data.schoolType || '일반',
                    grade_number: data.gradeNumber ?? null,
                    grade_updated_year: data.gradeUpdatedYear ?? null,
                    joined_at: new Date().toISOString(),
                    start_date: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
                    status: 'pending', // Awaiting Gym Master approval
                    belt: data.belt,
                    pending_stripe: data.stripe ?? null,
                    pending_promotion_date: data.promotionDate || null,
                })
                .select('id')
                .single()

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation usually
                    throw new Error('이미 등록된 전화번호입니다.')
                }
                throw new Error('가입 중 오류가 발생했습니다: ' + insertError.message)
            }
        }

        try {
            const { data: gymDoc } = await supabaseAdmin.from('gyms').select('owner_id, name').eq('id', data.gymId).single()
            if (gymDoc) {
                await sendAdminNotification({
                    adminId: gymDoc.owner_id,
                    title: '📢 새로운 수련생 가입 신청',
                    body: `${data.name} 님이 체육관에 가입을 신청했습니다. 승인 대기 중입니다.`,
                    link: '/dashboard/members',
                })
            }
        } catch (pushErr) {
            console.error('Failed to notify Admin:', pushErr)
        }

        return { success: true }

    } catch (err: any) {
        console.error('Portal Registration Error:', err)
        return { error: err.message || '처리 중 알 수 없는 서버 오류가 발생했습니다.' }
    }
}

