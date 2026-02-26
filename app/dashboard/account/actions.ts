'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAccountInfo() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

    const { data: gym } = await supabase
        .from('gyms')
        .select('id, name, phone, address, business_registration_number')
        .eq('owner_id', user.id)
        .single()

    return {
        email: user.email || '',
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
        createdAt: user.created_at || '',
        gymId: gym?.id || '',
        gymName: gym?.name || '',
        gymPhone: gym?.phone || '',
        gymAddress: gym?.address || '',
        businessNumber: gym?.business_registration_number || '',
    }
}

export async function updateAccountInfo(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const fullName = String(formData.get('full_name') || '')
    const phone = String(formData.get('phone') || '')
    const gymId = String(formData.get('gym_id') || '')
    const gymName = String(formData.get('gym_name') || '')
    const gymPhone = String(formData.get('gym_phone') || '')
    const gymAddress = String(formData.get('gym_address') || '')
    const businessNumber = String(formData.get('business_registration_number') || '')

    // Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', user.id)

    if (profileError) return { error: '관리자 정보 수정 실패: ' + profileError.message }

    // Update Gym
    const { error: gymError } = await supabase
        .from('gyms')
        .update({
            name: gymName,
            phone: gymPhone,
            address: gymAddress,
            business_registration_number: businessNumber,
        })
        .eq('id', gymId)
        .eq('owner_id', user.id)

    if (gymError) return { error: '도장 정보 수정 실패: ' + gymError.message }

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/account')
    return { success: true }
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
