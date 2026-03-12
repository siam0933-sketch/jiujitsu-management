import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const gymId = json.gymId ? String(json.gymId).trim() : ''
        const name = json.name ? String(json.name).trim() : ''
        const password = json.password ? String(json.password).trim().toLowerCase() : ''

        console.log(`[Member Login Attempt] GymID: '${gymId}', Name: '${name}', Password Length: ${password.length}`)

        if (!gymId || !name || !password) {
            return NextResponse.json({ success: false, message: '도장, 이름, 비밀번호를 모두 입력해주세요.' }, { status: 400 })
        }

        const supabaseAdmin = await createAdminClient()

        // 1. Fetch member directly securely bypassing RLS
        const { data: members, error } = await supabaseAdmin
            .from('gym_members')
            .select('id, gym_id, name, status, login_password')
            .eq('gym_id', gymId)
            .eq('name', name)

        if (error) {
            console.error('Member lookup error:', error)
            return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
        }

        if (!members || members.length === 0) {
            console.log(`[Member Login Failure] No member found for name: '${name}'`)
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        // 2. Hash/Plain verification for all matching members (since names can be duplicated across gyms)
        let matchedMember = null
        let isBcryptMatch = false

        for (const member of members) {
            if (member.status !== 'active' && member.status !== 'paused') {
                continue // Skip inactive accounts
            }

            const storedPassword = member.login_password || ''
            const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')

            if (isBcrypt) {
                if (bcrypt.compareSync(password, storedPassword)) {
                    matchedMember = member
                    isBcryptMatch = true
                    break
                }
            } else {
                // Legacy plaintext comparison
                if (password === storedPassword) {
                    matchedMember = member
                    isBcryptMatch = false
                    break
                }
            }
        }

        if (!matchedMember) {
            console.log(`[Member Login Failure] Password mismatch or no active member for name: '${name}'`)
            return NextResponse.json({ success: false, message: '정보가 일치하지 않거나 존재하지 않는 회원입니다.' }, { status: 401 })
        }

        // MIGRATION: Auto-hash the plaintext password on successful first login
        if (!isBcryptMatch) {
            const newHash = bcrypt.hashSync(password, 10)
            await supabaseAdmin
                .from('gym_members')
                .update({ login_password: newHash })
                .eq('id', matchedMember.id)
            console.log(`[Migration] User '${name}' (${matchedMember.id}) password hashed successfully.`)
        }

        // (The password mismatch check was already handled by the `if (!matchedMember)` block above)

        // 3. Check if current password meets the new policy
        let weakPassword = false
        // Notice we check against the raw 'password' input since storedPassword might be hashed!
        if (!PASSWORD_POLICY.test(password)) {
            weakPassword = true
        }

        // 3. Create Session
        const cookieStore = await cookies()
        const sessionData = JSON.stringify({ memberId: matchedMember.id, gymId: matchedMember.gym_id, name: matchedMember.name, role: 'member' })

        cookieStore.set('member_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        console.log(`[Member Login Success] Logged in as ${matchedMember.name} (${matchedMember.id}), weakPassword: ${weakPassword}`)
        return NextResponse.json({ success: true, message: 'Login successful', weakPassword, memberId: matchedMember.id })
    } catch (e: any) {
        console.error('Member Login API Error:', e)
        return NextResponse.json({ success: false, message: 'Server Error: ' + e.message }, { status: 500 })
    }
}
