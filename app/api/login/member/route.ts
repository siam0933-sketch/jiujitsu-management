import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const name = json.name
        const password = json.password

        if (!name || !password) {
            return NextResponse.json({ success: false, message: '이름과 비밀번호를 입력해주세요.' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Find Member by Name and Password
        // Note: In production, password hashing is recommended.
        // For this MVP, we are comparing plain text as stored.
        const { data: member, error } = await supabase
            .from('gym_members')
            .select('id, gym_id, name, status')
            .eq('name', name)
            .eq('login_password', password)
            .single()

        if (error || !member) {
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        if (member.status !== 'active' && member.status !== 'paused') {
            return NextResponse.json({ success: false, message: '활성 상태인 회원만 로그인할 수 있습니다.' }, { status: 403 })
        }

        // 2. Create a Session manually or use a custom cookie
        // Since Supabase Auth is for Users (checking against auth.users), and members are in public.gym_members,
        // we cannot use supabase.auth.signInWithPassword.
        // We will set a secure HttpOnly cookie with the member ID.

        const cookieStore = await cookies()

        // Simple session cookie. In production, use a JWT or signed token.
        // For MVP, we store member_id and gym_id.
        const sessionData = JSON.stringify({ memberId: member.id, gymId: member.gym_id, name: member.name, role: 'member' })

        // Set cookie
        cookieStore.set('member_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return NextResponse.json({ success: true, message: 'Login successful' })
    } catch (e: any) {
        console.error('Member Login API Error:', e)
        return NextResponse.json({ success: false, message: 'Server Error: ' + e.message }, { status: 500 })
    }
}
