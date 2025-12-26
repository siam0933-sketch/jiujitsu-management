
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    let origin = requestUrl.origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) {
        origin = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
        origin = origin.replace(/\/$/, '')
    }

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}`)
}
