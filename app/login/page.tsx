
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams
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
                <form
                    className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
                    action="/auth/login"
                    method="post"
                >
                    {searchParams?.message && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                            {searchParams.message}
                        </div>
                    )}
                    <label className="text-md" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="rounded-md px-4 py-2 bg-inherit border mb-6"
                        name="email"
                        placeholder="you@example.com"
                        required
                    />
                    <label className="text-md" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="rounded-md px-4 py-2 bg-inherit border mb-6"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                    />
                    <button className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2">
                        Sign In
                    </button>
                    <div className="text-center text-sm mt-4">
                        <span className="text-gray-500">계정이 없으신가요? </span>
                        <a href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                            회원가입하기
                        </a>
                    </div>

                </form>
            </div>
        </div>
    )
}
