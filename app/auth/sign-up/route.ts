
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const requestUrl = new URL(request.url)
    const formData = await request.formData()
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    // Extra fields
    const full_name = String(formData.get('full_name'))
    const phone = String(formData.get('phone'))
    const role = String(formData.get('role') || 'gym_member')

    // Gym fields
    const gym_name = String(formData.get('gym_name') || '')
    const business_registration_number = String(formData.get('business_registration_number') || '')
    const gym_phone = String(formData.get('gym_phone') || '')
    const gym_address = String(formData.get('gym_address') || '')

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${requestUrl.origin}/auth/callback`,
            data: {
                full_name,
                phone,
                role,
                gym_name,
                business_registration_number,
                gym_phone,
                gym_address,
            },
        },
    })

    if (error) {
        return NextResponse.redirect(
            `${requestUrl.origin}/login?message=Could not authenticate user`,
            {
                status: 301,
            }
        )
    }

    return NextResponse.redirect(
        `${requestUrl.origin}/login?message=Check email to continue sign in process`,
        {
            status: 301,
        }
    )
}
