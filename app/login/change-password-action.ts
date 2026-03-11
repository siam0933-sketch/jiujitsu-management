'use server'

import { createAdminClient } from '@/utils/supabase/server'

const passwordPolicy = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export async function changeMemberPassword(memberId: string, newPassword: string) {
    if (!passwordPolicy.test(newPassword)) {
        return { error: '비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.' }
    }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin
        .from('gym_members')
        .update({ password: newPassword.toLowerCase() })
        .eq('id', memberId)

    if (error) return { error: '비밀번호 변경 중 오류가 발생했습니다.' }
    return { success: true }
}
