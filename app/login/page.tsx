
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import MemberLoginForm from './member-login-form'

import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'super_admin') {
            return redirect('/super-admin')
        } else if (profile?.role === 'gym_member') {
            return redirect('/portal')
        } else {
            return redirect('/dashboard')
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <div className="flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
                <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                    <MemberLoginForm />
                </Suspense>
            </div>
        </div>
    )
}
