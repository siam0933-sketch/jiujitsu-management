'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from './actions'

const initialState = {
    message: '',
    success: false,
}

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            router.push('/dashboard')
        }
    }, [state?.success, router])

    return (
        <form
            className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            action={formAction}
        >
            {state?.message && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    {state.message}
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
            <button
                className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2 disabled:opacity-50"
                disabled={isPending}
            >
                {isPending ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="text-center text-sm mt-4">
                <span className="text-gray-500">계정이 없으신가요? </span>
                <a href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                    회원가입하기
                </a>
            </div>
        </form>
    )
}
