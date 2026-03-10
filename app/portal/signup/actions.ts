'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

// 1. Verify invitation code
export async function lookupGymByCode(code: string) {
    const supabase = await createClient()

    if (!code) return { error: '초대 코드를 입력해주세요.' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('invitation_code', code.toUpperCase())
        .single()

    if (!gym) {
        return { error: '유효하지 않은 초대 코드입니다. 다시 확인해주세요.' }
    }

    return { success: true, gym }
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
    accessCode: string,
    guardianPhone?: string,
    address?: string,
    school?: string,
    grade?: string
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

            // Just update their password and missing profile data
            const { error: updateError } = await supabaseAdmin
                .from('gym_members')
                .update({
                    login_password: data.password,
                    gender: data.gender,
                    belt: data.belt,
                    birth_date: data.birthDate || null,
                    access_code: finalAccessCode,
                    guardian_phone: data.guardianPhone || null,
                    address: data.address || null,
                    school: data.school || null,
                    grade: data.grade || null
                })
                .eq('id', existingMember.id)

            if (updateError) throw new Error('계정 연동 중 오류가 발생했습니다.')

        } else {
            // Member does NOT exist - Complete new registration

            // Note: Since we don't have Supabase Auth 'users' for normal members yet,
            // we are entirely relying on the `gym_members` table for auth credentials.

            const { data: newMember, error: insertError } = await supabaseAdmin
                .from('gym_members')
                .insert({
                    gym_id: data.gymId,
                    name: data.name,
                    phone: data.phone,
                    login_password: data.password,
                    gender: data.gender,
                    birth_date: data.birthDate || null,
                    access_code: finalAccessCode,
                    guardian_phone: data.guardianPhone || null,
                    address: data.address || null,
                    school: data.school || null,
                    grade: data.grade || null,
                    joined_at: new Date().toISOString(),
                    start_date: new Date().toISOString(),
                    status: 'pending', // Awaiting Gym Master approval
                    belt: data.belt
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

        return { success: true }

    } catch (err: any) {
        console.error('Portal Registration Error:', err)
        return { error: err.message || '처리 중 알 수 없는 서버 오류가 발생했습니다.' }
    }
}

