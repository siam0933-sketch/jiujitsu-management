'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
    const name = String(formData.get('name'))
    // Remove all whitespace from password input for better UX, and convert to uppercase if we generated uppercase passwords
    const password = String(formData.get('password')).trim().toUpperCase()

    if (!name || !password) {
        return { error: '이름과 비밀번호를 입력해주세요.' }
    }

    const supabase = await createClient()

    // Query member
    // Note: This matches exactly. In a real app we might want case-insensitive name match or similar.
    const { data: member, error } = await supabase
        .from('gym_members')
        .select('id, name, login_password')
        .eq('name', name)
        .eq('login_password', password) // Basic comparison for this iteration
        .single()

    if (error || !member) {
        return { error: '정보가 일치하지 않습니다. 이름과 비밀번호를 확인해주세요.' }
    }

    // Set session cookie
    // In a production app, use use a signed/encrypted cookie or a proper session token.
    // For this prototype, we'll store the member ID in a httpOnly cookie.
    const cookieStore = await cookies()
    cookieStore.set('member_session', member.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    })

    redirect('/portal/dashboard')
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('member_session')
    redirect('/login')
}
