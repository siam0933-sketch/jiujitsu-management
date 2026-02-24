'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ShieldCheck } from 'lucide-react'

export default function LoginForm() {
    const router = useRouter()
    const [loginType, setLoginType] = useState<'admin' | 'member' | null>(null)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!loginType) return

        setLoading(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') // Admin only
        const name = formData.get('name')   // Member only
        const password = loginType === 'member'
            ? String(formData.get('password')).toLowerCase()
            : formData.get('password')

        try {
            const endpoint = loginType === 'admin' ? '/api/login' : '/api/login/member'
            const body = loginType === 'admin'
                ? { email, password }
                : { name, password }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()

            if (data.success) {
                router.refresh()
                // Redirect based on role
                if (loginType === 'admin') {
                    router.push('/dashboard')
                } else {
                    router.push('/portal')
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
            <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-zinc-100">
                {loginType === 'admin' ? '관리자 로그인' : (loginType === 'member' ? '회원 로그인' : '로그인')}
            </h1>

            {/* Login Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    type="button"
                    onClick={() => { setLoginType('admin'); setMessage(''); }}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${loginType === 'admin'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                >
                    <ShieldCheck size={40} strokeWidth={1.5} />
                    <span className="text-lg font-bold">관리자</span>
                    <span className="text-xs font-normal opacity-70">관장님 / 사범님</span>
                </button>
                <button
                    type="button"
                    onClick={() => { setLoginType('member'); setMessage(''); }}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${loginType === 'member'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                >
                    <User size={40} strokeWidth={1.5} />
                    <span className="text-lg font-bold">회원</span>
                    <span className="text-xs font-normal opacity-70">수련생</span>
                </button>
            </div>

            {/* Login Form */}
            {loginType && (
                <form
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col w-full justify-center gap-2 text-foreground"
                    onSubmit={handleSubmit}
                >
                    {message && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            {message}
                        </div>
                    )}

                    {loginType === 'admin' ? (
                        <>
                            <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="email">
                                이메일
                            </label>
                            <input
                                className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                                name="email"
                                placeholder="admin@example.com"
                                required
                            />
                        </>
                    ) : (
                        <>
                            <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="name">
                                이름
                            </label>
                            <input
                                className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                                name="name"
                                placeholder="본인 성함"
                                required
                            />
                        </>
                    )}

                    <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">
                        비밀번호
                    </label>
                    <input
                        className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                        type="password"
                        name="password"
                        placeholder={loginType === 'admin' ? "••••••••" : "6자리 비밀번호"}
                        required
                    />

                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-4 mb-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 text-lg"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인 하기'}
                    </button>

                    <div className="text-center text-sm mt-4">
                        {loginType === 'admin' ? (
                            <>
                                <span className="text-gray-500">계정이 없으신가요? </span>
                                <a href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                                    관리자 회원가입
                                </a>
                            </>
                        ) : (
                            <p className="text-gray-400 text-xs">
                                * 초기 비밀번호는 관장님께 문의해주세요.
                            </p>
                        )}
                    </div>
                </form>
            )}
        </div>
    )
}
