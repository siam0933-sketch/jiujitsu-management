'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Mail, HeadphonesIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { sendAdminPasswordResetEmail } from './reset-action'

export default function LoginForm({ nextUrl }: { nextUrl?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isAppMode = searchParams.get('app') === 'true'
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    // Password Reset Modal State
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetMethod, setResetMethod] = useState<'email' | 'admin' | null>(null)
    const [resetEmail, setResetEmail] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [resetMsg, setResetMsg] = useState('')

    const handleSendResetEmail = async () => {
        if (!resetEmail) {
            setResetMsg('이메일을 입력해주세요.')
            return
        }
        setResetLoading(true)
        setResetMsg('')
        const res = await sendAdminPasswordResetEmail(resetEmail)
        setResetLoading(false)
        if (res?.error) {
            setResetMsg(res.error)
        } else {
            setResetMsg('✅ 비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해주세요.')
        }
    }

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
                    const dest = isAppMode ? `${data.redirectUrl}${data.redirectUrl.includes('?') ? '&' : '?'}app=true` : data.redirectUrl
                    router.push(dest)
                } else if (nextUrl && nextUrl.startsWith('/')) {
                    router.push(isAppMode ? `${nextUrl}${nextUrl.includes('?') ? '&' : '?'}app=true` : nextUrl)
                } else {
                    router.push(isAppMode ? '/dashboard?app=true' : '/dashboard')
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
                {!isAppMode && (
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold rounded-xl px-4 py-4 mb-2 transition-all text-lg"
                    >
                        첫 화면으로
                    </Link>
                )}

                <div className="flex items-center justify-center mt-2">
                    <button 
                        type="button" 
                        onClick={() => {
                            setShowResetModal(true)
                            setResetMethod(null)
                            setResetMsg('')
                            setResetEmail('')
                        }}
                        className="text-sm font-medium text-gray-500 hover:text-blue-600 pt-2"
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                </div>

                <div className="text-center text-sm mt-5 flex flex-col gap-4">
                    {!isAppMode && (
                        <div className="text-sm md:text-base">
                            <span className="text-gray-500">계정이 없으신가요? </span>
                            <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                                신규 도장 가입하기
                            </Link>
                        </div>
                    )}
                </div>
            </form>

            {/* ─── 비밀번호 찾기 모달 ─── */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowResetModal(false)} />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">비밀번호 찾기</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                원하시는 비밀번호 찾기 방식을 선택해주세요.
                            </p>
                        </div>

                        {!resetMethod && (
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => setResetMethod('email')} 
                                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-colors text-left"
                                >
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 mt-1 shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-base">이메일 인증으로 찾기</div>
                                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">가입하신 이메일로 비밀번호 재설정 링크를 받습니다. (권장)</div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setResetMethod('admin')} 
                                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 transition-colors text-left"
                                >
                                    <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg text-amber-600 dark:text-amber-400 mt-1 shrink-0">
                                        <HeadphonesIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-base">최고 관리자에게 초기화 요청</div>
                                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">시스템 최고 관리자에게 연락하여 임시 비밀번호 발급을 요청합니다.</div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {resetMethod === 'email' && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">가입 이메일 주소</label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:bg-zinc-800"
                                    />
                                </div>
                                {resetMsg && (
                                    <div className={`text-sm p-3 rounded-md ${resetMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        {resetMsg}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => { setResetMethod(null); setResetMsg(''); }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex-1 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                    >
                                        뒤로
                                    </button>
                                    <button
                                        onClick={handleSendResetEmail}
                                        disabled={resetLoading || resetMsg.includes('✅')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-blue-700 flex-1"
                                    >
                                        {resetLoading ? '전송 중...' : '재설정 링크 받기'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {resetMethod === 'admin' && (
                            <div className="flex flex-col gap-4">
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                        이메일 접근이 불가능하신 경우, 시스템 최고 관리자에게 직접 연락해 주세요. 확인 후 <strong>관장님의 연락처 뒤 4자리</strong> 등 임시 비밀번호로 강제 초기화 해드릴 수 있습니다.
                                    </p>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setResetMethod(null)}
                                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 flex-1 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                    >
                                        다른 방식으로 찾기
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
