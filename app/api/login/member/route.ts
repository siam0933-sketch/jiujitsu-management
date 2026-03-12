import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const name = json.name ? String(json.name).trim() : ''
        const password = json.password ? String(json.password).trim().toLowerCase() : ''

        console.log(`[Member Login Attempt] Name: '${name}', Password Length: ${password.length}`)

        if (!name || !password) {
            return NextResponse.json({ success: false, message: '이름과 비밀번호를 입력해주세요.' }, { status: 400 })
        }

        const supabaseAdmin = await createAdminClient()

        // 1. Fetch member directly securely bypassing RLS
        const { data: members, error } = await supabaseAdmin
            .from('gym_members')
            .select('id, gym_id, name, status, login_password')
            .eq('name', name)

        if (error) {
            console.error('Member lookup error:', error)
            return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
        }

        const member = members && members.length > 0 ? members[0] : null
        if (!member) {
            console.log(`[Member Login Failure] No member found for name: '${name}'`)
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        if (member.status !== 'active' && member.status !== 'paused') {
            console.log(`[Member Login Failure] Member status inactive: ${member.status}`)
            return NextResponse.json({ success: false, message: '활성 상태인 회원만 로그인할 수 있습니다.' }, { status: 403 })
        }

        // 2. Hash/Plain verification & Migration
        const storedPassword = member.login_password || ''
        let isMatch = false
        const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')

        if (isBcrypt) {
            isMatch = bcrypt.compareSync(password, storedPassword)
        } else {
            // Legacy plaintext comparison
            isMatch = (password === storedPassword)

            if (isMatch) {
                // MIGRATION: Auto-hash the plaintext password on successful first login
                const newHash = bcrypt.hashSync(password, 10)
                await supabaseAdmin
                    .from('gym_members')
                    .update({ login_password: newHash })
                    .eq('id', member.id)
                console.log(`[Migration] User '${name}' password hashed successfully.`)
            }
        }

        if (!isMatch) {
            console.log(`[Member Login Failure] Password mismatch for name: '${name}'`)
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        // 3. Check if current password meets the new policy
        let weakPassword = false
        // Notice we check against the raw 'password' input since storedPassword might be hashed!
        if (!PASSWORD_POLICY.test(password)) {
            weakPassword = true
        }

        // 3. Create Session
        const cookieStore = await cookies()
        const sessionData = JSON.stringify({ memberId: member.id, gymId: member.gym_id, name: member.name, role: 'member' })

        cookieStore.set('member_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        console.log(`[Member Login Success] Logged in as ${member.name} (${member.id}), weakPassword: ${weakPassword}`)
        return NextResponse.json({ success: true, message: 'Login successful', weakPassword, memberId: member.id })
    } catch (e: any) {
        console.error('Member Login API Error:', e)
        return NextResponse.json({ success: false, message: 'Server Error: ' + e.message }, { status: 500 })
    }
}
