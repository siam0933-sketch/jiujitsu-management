import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const email = json.email
        const password = json.password

        const supabase = await createClient()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 401 })
        }

        return NextResponse.json({ success: true, message: 'Login successful' })
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 })
    }
}
