
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        if (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
            // Unauthenticated users are allowed only on login/auth routes (for now)
            // Ideally redirect here.
        }
    } else {
        // Authenticated users restrictions
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const isSuperAdmin = profile?.role === 'super_admin'
        const isGymMaster = profile?.role === 'gym_master'
        const isMember = profile?.role === 'gym_member'

        // 1. Protect /super-admin
        if (request.nextUrl.pathname.startsWith('/super-admin') && !isSuperAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = isGymMaster ? '/dashboard' : '/portal'
            return NextResponse.redirect(url)
        }

        // 2. Protect /dashboard
        if (request.nextUrl.pathname.startsWith('/dashboard') && isGymMaster) {
            // Gym masters can only access dashboard if their gym is active
            const { data: gym } = await supabase.from('gyms').select('status').eq('owner_id', user.id).single()
            if (gym?.status === 'pending') {
                const url = request.nextUrl.clone()
                url.pathname = '/pending'
                return NextResponse.redirect(url)
            }
        }

        // 3. Protect /pending
        if (request.nextUrl.pathname === '/pending') {
            if (!isGymMaster) {
                const url = request.nextUrl.clone()
                url.pathname = isSuperAdmin ? '/super-admin' : '/portal'
                return NextResponse.redirect(url)
            }
            const { data: gym } = await supabase.from('gyms').select('status').eq('owner_id', user.id).single()
            if (gym?.status === 'active') {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}
