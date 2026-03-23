import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import KioskLoginForm from './kiosk-login-form'

export default async function KioskLoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 이미 로그인되어 있다면 별도의 탐색 없이 즉시 키오스크 화면으로 넘깁니다.
    if (user) {
        return redirect('/dashboard/attendance/kiosk')
    }

    return (
        <div className="flex-1 flex flex-col w-full h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950 sm:max-w-md mx-auto">
            <KioskLoginForm />
        </div>
    )
}
