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

        // 1. Authenticate using RPC (Secure Bypassing of RLS)
        // We use an RPC function 'authenticate_member' with SECURITY DEFINER
        // to find the member even if RLS normally blocks access.
        const { data: members, error } = await supabase.rpc('authenticate_member', {
            p_name: name,
            p_password: password
        })

        if (error) {
            console.error('Member Login RPC Error:', error)
            // Fallback for clearer error message if function is missing
            if (error.code === '42883') { // undefined_function
                return NextResponse.json({ success: false, message: 'System Error: Authentication function missing. Please ask admin to run db_member_login_rpc.sql' }, { status: 500 })
            }
            return NextResponse.json({ success: false, message: '인증 중 오류가 발생했습니다.' }, { status: 500 })
        }

        // RPC returns an array (SETOF)
        const member = members && members.length > 0 ? members[0] : null

        if (!member) {
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        if (member.status !== 'active' && member.status !== 'paused') {
            return NextResponse.json({ success: false, message: '활성 상태인 회원만 로그인할 수 있습니다.' }, { status: 403 })
        }

        // 2. Create Session
        const cookieStore = await cookies()

        const sessionData = JSON.stringify({ memberId: member.id, gymId: member.gym_id, name: member.name, role: 'member' })

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
