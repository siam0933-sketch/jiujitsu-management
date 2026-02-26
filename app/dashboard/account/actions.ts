'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAccountInfo() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    return {
        email: user.email || '',
        fullName: profile?.full_name || '',
        createdAt: user.created_at || '',
    }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const newPassword = String(formData.get('new_password'))
    const confirmPassword = String(formData.get('confirm_password'))

    if (!newPassword || newPassword.length < 6) {
        return { error: '비밀번호는 최소 6자 이상이어야 합니다.' }
    }
    if (newPassword !== confirmPassword) {
        return { error: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: '비밀번호 변경 실패: ' + error.message }

    revalidatePath('/dashboard/account')
    return { success: true }
}
