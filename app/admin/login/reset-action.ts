'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function sendAdminPasswordResetEmail(email: string) {
    if (!email) return { error: '이메일을 입력해주세요.' }
    
    try {
        const supabase = await createClient()
        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        
        // Use Supabase auth reset mechanism
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${protocol}://${host}/admin/update-password`,
        })

        if (error) {
            console.error('Password reset email error:', error)
            return { error: '비밀번호 재설정 이메일 발송에 실패했습니다. 가입된 이메일인지 확인해주세요.' }
        }

        return { success: true }
    } catch (err: any) {
        return { error: '서버 오류: ' + err.message }
    }
}
