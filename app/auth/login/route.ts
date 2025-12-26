import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const requestUrl = new URL(request.url)
    const formData = await request.formData()
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.log('Login Error Details:', error)
        return NextResponse.redirect(
            `${requestUrl.origin}/login?message=Could not authenticate user`,
            {
                status: 301,
            }
        )
    }

    return NextResponse.redirect(requestUrl.origin, {
        status: 301,
    })
}
