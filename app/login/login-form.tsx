'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email')
        const password = formData.get('password')

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()

            if (data.success) {
                router.refresh()
                router.push('/dashboard')
            } else {
                setMessage(data.message)
            }
        } catch (err: any) {
            setMessage('Network error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            onSubmit={handleSubmit}
        >
            {message && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    {message}
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
                disabled={loading}
            >
                {loading ? 'Signing In...' : 'Sign In'}
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
