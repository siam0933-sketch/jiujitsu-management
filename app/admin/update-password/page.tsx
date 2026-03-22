'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { updateAdminPassword } from './actions'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')
        setMessage('')
        
        if (password !== confirm) {
            setErrorMsg('비밀번호가 서로 일치하지 않습니다.')
            return
        }
        if (password.length < 6) {
            setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.')
            return
        }

        setLoading(true)
        const res = await updateAdminPassword(password)
        setLoading(false)

        if (res?.error) {
            setErrorMsg(res.error)
        } else {
            setMessage('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.')
            setTimeout(() => {
                router.push('/admin/login')
            }, 3000)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50 dark:bg-zinc-950">
            <div className="w-full max-w-md mx-auto px-4">
                <div className="flex flex-col items-center justify-center mb-8">
                    <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={48} height={48} className="mb-4 rounded-xl shadow-sm" />
                    <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                        새 비밀번호 설정
                    </h1>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-8">
                    {message ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">변경 완료</h2>
                            <p className="text-gray-500 mb-6">{message}</p>
                            <Link href="/admin/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                                로그인 화면으로
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {errorMsg && (
                                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">새 비밀번호</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="6자리 이상 입력"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="비밀번호 재입력"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? '처리 중...' : '비밀번호 변경하기'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
