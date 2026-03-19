'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
                if (data.redirectUrl) {
                    router.push(data.redirectUrl)
                } else {
                    router.push('/dashboard')
                }
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
        <div className="w-full max-w-md mx-auto px-4">
            <div className="flex flex-col items-center justify-center mb-8">
                <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={48} height={48} className="mb-4 rounded-xl shadow-sm" />
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                    관장(관리자) 로그인
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    체육관을 관리하려면 로그인해주세요.
                </p>
            </div>

            <form
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col w-full justify-center gap-2 text-foreground"
                onSubmit={handleSubmit}
            >
                {message && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {message}
                    </div>
                )}

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="email">
                    이메일
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                />

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">
                    비밀번호
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />

                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-4 mb-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 text-lg"
                    disabled={loading}
                >
                    {loading ? '로그인 중...' : '로그인 하기'}
                </button>
                <Link
                    href="/"
                    className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold rounded-xl px-4 py-4 mb-2 transition-all text-lg"
                >
                    첫 화면으로
                </Link>

                <div className="text-center text-sm mt-5 flex flex-col gap-4">
                    <div className="text-sm md:text-base">
                        <span className="text-gray-500">계정이 없으신가요? </span>
                        <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                            신규 도장 가입하기
                        </Link>
                    </div>
                    <div>
                        <Link href="/login" className="text-sm md:text-base font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-4 transition-colors">
                            일반 관원(수강생) 로그인으로 이동 &rarr;
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    )
}
