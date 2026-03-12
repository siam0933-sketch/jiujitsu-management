'use server'

import { createAdminClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'

// 1. Search gyms for password reset (reusing the same logic)
export async function searchGymsForReset(query: string) {
    if (!query || query.trim().length < 1) return { gyms: [] }
    const supabaseAdmin = await createAdminClient()
    const { data, error } = await supabaseAdmin
        .from('gyms')
        .select('id, name')
        .ilike('name', `%${query.trim()}%`)
        .order('name', { ascending: true })
        .limit(10)
    if (error) return { gyms: [] }
    return { gyms: data || [] }
}

// 2. Verify identity and reset password
export async function verifyAndResetPassword(params: {
    gymId: string,
    name: string,
    authType: 'phone' | 'birth',
    authValue: string,
    newPassword: string
}) {
    const { gymId, name, authType, authValue, newPassword } = params

    if (!gymId || !name || !authValue || !newPassword) {
        return { error: '필수 정보를 모두 입력해주세요.' }
    }

    const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/
    if (!PASSWORD_POLICY.test(newPassword)) {
        return { error: '비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.' }
    }

    const supabaseAdmin = await createAdminClient()

    // Query members belonging to the specific gym and with the exact name
    let query = supabaseAdmin
        .from('gym_members')
        .select('id, phone, birth_date')
        .eq('gym_id', gymId)
        .eq('name', name)

    const { data: members, error } = await query

    if (error || !members || members.length === 0) {
        return { error: '입력하신 정보와 일치하는 회원을 찾을 수 없습니다.' }
    }

    let matchedMemberId: string | null = null

    // Filter by authType locally to handle variations (like phone dashes or only checking last 4 digits)
    const validMembers = members.filter(member => {
        if (authType === 'phone') {
            const storedPhoneOnlyNums = (member.phone || '').replace(/[^0-9]/g, '')
            const inputPhoneOnlyNums = authValue.replace(/[^0-9]/g, '')
            // Check if stored phone ends with the 4 digits they entered
            return storedPhoneOnlyNums.endsWith(inputPhoneOnlyNums) && storedPhoneOnlyNums.length >= 4
        } else if (authType === 'birth') {
            const storedBirthOnlyNums = (member.birth_date || '').replace(/[^0-9]/g, '')
            const inputBirthOnlyNums = authValue.replace(/[^0-9]/g, '')
            return storedBirthOnlyNums === inputBirthOnlyNums
        }
        return false
    })

    if (validMembers.length === 0) {
        return { error: '입력하신 인증 정보(연락처 또는 생년월일)가 일치하지 않습니다.' }
    } else if (validMembers.length > 1) {
        return { error: '중복된 회원 정보가 존재합니다. 관장님께 문의해주세요.' }
    }

    matchedMemberId = validMembers[0].id

    // Hash the new password and update
    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    const { error: updateError } = await supabaseAdmin
        .from('gym_members')
        .update({ login_password: hashedPassword })
        .eq('id', matchedMemberId)

    if (updateError) {
        return { error: '비밀번호 변경 중 시스템 오류가 발생했습니다.' }
    }

    return { success: true }
}
