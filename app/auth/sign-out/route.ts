
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
    }

    // 2. Handle master/admin session logout
    if (user) {
        await supabase.auth.signOut()
    }

    const redirectTo = requestUrl.searchParams.get('redirect_to')
    const finalRedirectPath = redirectTo || '/'

    // Unify redirect path to the main gateway '/' or a requested path
    return NextResponse.redirect(`${requestUrl.origin}${finalRedirectPath}`, {
        status: 301,
    })
}
