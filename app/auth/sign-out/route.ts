
import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let redirectPath = '/'

    if (user) {
        // Fetch profile to determine role before signing out
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'gym_member') {
            redirectPath = '/login'
        } else if (profile?.role === 'gym_master' || profile?.role === 'super_admin') {
            redirectPath = '/admin/login'
        }

        await supabase.auth.signOut()
    }

    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`, {
        status: 301,
    })
}
