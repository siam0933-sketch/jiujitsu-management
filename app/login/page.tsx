
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import LoginForm from './login-form'

export default async function LoginPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        return redirect('/')
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <div className="flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
                <LoginForm />
            </div>
        </div>
    )
}
