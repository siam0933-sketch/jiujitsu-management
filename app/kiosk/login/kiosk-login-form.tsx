'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function KioskLoginForm() {
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
                // 키오스크 전용 로그인이므로, 로그인 성공 시 무조건 출석체크 화면으로 강제 이동
                router.push('/dashboard/attendance/kiosk')
            } else {
                setMessage(data.message)
            }
        } catch (err: any) {
            setMessage('네트워크 오류가 발생했습니다. (' + err.message + ')')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col items-center justify-center mb-8">
                <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={64} height={64} className="mb-4 rounded-xl shadow-sm" />
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                    도장 출석 키오스크
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
                    단말기 설정을 위해 관장님 계정으로 최초 1회 로그인해주세요.<br/>(이후 자동 로그인 유지)
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

                <label className="text-sm font-medium text-gray-800 dark:text-zinc-200" htmlFor="email">
                    이메일
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 appearance-none"
                    name="email"
                    placeholder="이메일 주소"
                    type="email"
                    required
                />

                <label className="text-sm font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">
                    비밀번호
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 appearance-none"
                    type="password"
                    name="password"
                    placeholder="비밀번호"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 rounded-md px-4 py-3 text-white font-bold mb-2 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center shadow-md w-full"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        '키오스크 단말기 등록 (로그인)'
                    )}
                </button>
            </form>
        </div>
    )
}
