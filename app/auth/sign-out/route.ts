
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let redirectPath = '/'

    // 1. Handle member session logout
    const cookieStore = await cookies()
    const memberSession = cookieStore.get('member_session')

    if (memberSession) {
        cookieStore.delete('member_session')
        redirectPath = '/login'
    }

    // 2. Handle master/admin session logout
    if (user) {
        // Fetch profile to determine role before signing out
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'gym_master' || profile?.role === 'super_admin') {
            redirectPath = '/admin/login'
        } else if (profile?.role === 'gym_member' && !memberSession) {
            // Keep fallback just in case
            redirectPath = '/login'
        }

        await supabase.auth.signOut()
    }

    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`, {
        status: 301,
    })
}
