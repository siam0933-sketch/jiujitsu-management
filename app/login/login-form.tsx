'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ShieldCheck } from 'lucide-react'

export default function LoginForm() {
    const router = useRouter()
    const [loginType, setLoginType] = useState<'admin' | 'member'>('admin')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') // Admin only
        const name = formData.get('name')   // Member only
        const password = formData.get('password')

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
        <div className="w-full max-w-md mx-auto">
            {/* Login Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
                <button
                    type="button"
                    onClick={() => { setLoginType('admin'); setMessage(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'admin'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ShieldCheck size={18} />
                    관리자 (관장님)
                </button>
                <button
                    type="button"
                    onClick={() => { setLoginType('member'); setMessage(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'member'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <User size={18} />
                    회원 (수련생)
                </button>
            </div>

            <form
                className="animate-in flex flex-col w-full justify-center gap-2 text-foreground"
                onSubmit={handleSubmit}
            >
                {message && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {message}
                    </div>
                )}

                {loginType === 'admin' ? (
                    <>
                        <label className="text-md font-medium" htmlFor="email">
                            이메일
                        </label>
                        <input
                            className="rounded-md px-4 py-3 bg-gray-50 border border-gray-200 mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                            name="email"
                            placeholder="admin@example.com"
                            required
                        />
                    </>
                ) : (
                    <>
                        <label className="text-md font-medium" htmlFor="name">
                            이름
                        </label>
                        <input
                            className="rounded-md px-4 py-3 bg-gray-50 border border-gray-200 mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                            name="name"
                            placeholder="본인 성함"
                            required
                        />
                    </>
                )}

                <label className="text-md font-medium" htmlFor="password">
                    비밀번호
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-gray-50 border border-gray-200 mb-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                    type="password"
                    name="password"
                    placeholder={loginType === 'admin' ? "••••••••" : "6자리 비밀번호"}
                    required
                />

                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-4 py-3 mb-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
                    disabled={loading}
                >
                    {loading ? '로그인 중...' : (loginType === 'admin' ? '관리자 로그인' : '회원 로그인')}
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
        </div>
    )
}
