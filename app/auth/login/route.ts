import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const requestUrl = new URL(request.url)
    const formData = await request.formData()
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    const supabase = await createClient()

    const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.log('Login Error Details:', error)
        return NextResponse.redirect(
            `${origin}/login?message=Could not authenticate user`,
            {
                status: 301,
            }
        )
    }

    return NextResponse.redirect(origin, {
        status: 301,
    })
}
