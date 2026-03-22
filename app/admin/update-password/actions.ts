'use server'

import { createClient } from '@/utils/supabase/server'

export async function updateAdminPassword(password: string) {
    if (!password || password.length < 6) {
        return { error: '비밀번호는 6자리 이상이어야 합니다.' }
    }

    try {
        const supabase = await createClient()
        
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return { error: '비밀번호 업데이트 실패: ' + error.message }
        }

        return { success: true }
    } catch (err: any) {
        return { error: '서버 오류: ' + err.message }
    }
}
