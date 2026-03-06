'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import Link from 'next/link'

export default function MemberLoginForm() {
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name')
        const password = String(formData.get('password')).toLowerCase()

        try {
            const res = await fetch('/api/login/member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            })
            const data = await res.json()

            if (data.success) {
                router.refresh()
                router.push('/portal')
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
                <User size={48} strokeWidth={1.5} className="text-blue-600 mb-4" />
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                    수강생 로그인
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    등록하신 이름과 비밀번호로 로그인하세요.
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

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="name">
                    이름
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    name="name"
                    placeholder="본인 이름"
                    required
                />

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">
                    비밀번호
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    type="password"
                    name="password"
                    placeholder="6자리 비밀번호"
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
                    <div>
                        <p className="text-gray-400 text-xs md:text-sm">
                            * 회원가입은 관장님이 보내주신 <b>초대 링크</b>를 통해서만 가능합니다.<br />
                            비밀번호를 분실하신 경우 관장님께 문의해주세요.
                        </p>
                    </div>
                    <div>
                        <Link href="/admin/login" className="text-sm md:text-base font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-4 transition-colors">
                            관리자/관장 지도진 로그인으로 이동 &rarr;
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    )
}
