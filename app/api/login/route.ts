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

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error || !data?.user) {
            return NextResponse.json({ success: false, message: error?.message || 'Login failed' }, { status: 401 })
        }

        // Fetch User Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        let redirectUrl = '/dashboard'

        if (profile?.role === 'super_admin') {
            redirectUrl = '/super-admin'
        } else if (profile?.role === 'gym_master') {
            // Check Gym Status
            const { data: gym } = await supabase
                .from('gyms')
                .select('status')
                .eq('owner_id', data.user.id)
                .single()

            if (gym?.status === 'pending') {
                redirectUrl = '/pending'
            }
        }

        return NextResponse.json({ success: true, message: 'Login successful', redirectUrl })
    } catch (e: any) {
        console.error('API Error:', e)
        return NextResponse.json({ success: false, message: 'Server API Error: ' + e.message }, { status: 500 })
    }
}
