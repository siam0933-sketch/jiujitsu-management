'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import Link from 'next/link'
import { changeMemberPassword } from './change-password-action'

const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export default function MemberLoginForm() {
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    // Weak-password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [weakMemberId, setWeakMemberId] = useState('')
    const [newPw, setNewPw] = useState('')
    const [newPwConfirm, setNewPwConfirm] = useState('')
    const [pwChangeMsg, setPwChangeMsg] = useState('')
    const [pwChanging, setPwChanging] = useState(false)

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
                if (data.weakPassword && data.memberId) {
                    // Show password change modal before redirecting
                    setWeakMemberId(data.memberId)
                    setShowPasswordModal(true)
                } else {
                    router.refresh()
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

    const handlePasswordChange = async () => {
        setPwChangeMsg('')
        if (!newPw) { setPwChangeMsg('새 비밀번호를 입력해주세요.'); return }
        if (!PASSWORD_POLICY.test(newPw)) {
            setPwChangeMsg('비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.')
            return
        }
        if (newPw !== newPwConfirm) { setPwChangeMsg('비밀번호가 일치하지 않습니다.'); return }

        setPwChanging(true)
        const result = await changeMemberPassword(weakMemberId, newPw)
        setPwChanging(false)

        if (result.error) {
            setPwChangeMsg(result.error)
        } else {
            setShowPasswordModal(false)
            router.refresh()
            router.push('/portal')
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

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="name">이름</label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    name="name" placeholder="본인 이름" required
                />

                <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">비밀번호</label>
                <input
                    className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                    type="password" name="password" placeholder="비밀번호 입력" required
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

            {/* ─── 비밀번호 변경 모달 ─── */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="text-center">
                            <div className="text-4xl mb-2">🔐</div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">비밀번호 변경 필요</h2>
                            <p className="text-sm text-gray-600">
                                보안 강화를 위해 비밀번호를 <br />
                                <span className="font-semibold">영문 + 숫자 혼합 6자리 이상</span>으로 변경해주세요.
                            </p>
                        </div>

                        {/* 빨간 경고 */}
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <p className="text-xs text-red-600 font-medium leading-relaxed">
                                ⚠️ 비밀번호는 관장/관리자가 확인할 수 있습니다.<br />
                                평소 사용하지 않는 비밀번호로 설정해주세요.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                                <input
                                    type="password"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="영문+숫자 혼합 6자리 이상"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={newPwConfirm}
                                    onChange={(e) => setNewPwConfirm(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm ${newPwConfirm && newPw !== newPwConfirm ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="비밀번호 재입력"
                                />
                                {newPwConfirm && newPw !== newPwConfirm && (
                                    <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </div>
                        </div>

                        {pwChangeMsg && (
                            <p className="text-sm text-red-600 text-center">{pwChangeMsg}</p>
                        )}

                        <button
                            onClick={handlePasswordChange}
                            disabled={pwChanging}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
                        >
                            {pwChanging ? '변경 중...' : '비밀번호 변경 후 입장'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
