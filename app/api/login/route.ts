import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase Environment Variables')
            return NextResponse.json({
                success: false,
                message: 'Configuration Error: Missing Supabase Credentials on Server'
            }, { status: 500 })
        }

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
        console.error('API Error:', e)
        return NextResponse.json({ success: false, message: 'Server API Error: ' + e.message }, { status: 500 })
    }
}
