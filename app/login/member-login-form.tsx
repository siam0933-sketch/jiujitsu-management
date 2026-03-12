'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Search, Store } from 'lucide-react'
import Link from 'next/link'
import { changeMemberPassword } from './change-password-action'
// Let's import the search action from forgot-password actions to reuse it!
import { searchGymsForReset } from '../portal/forgot-password/actions'

const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export default function MemberLoginForm() {
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'SEARCH' | 'LOGIN'>('SEARCH')

    // Step 1: Search Gym State
    const [gymQuery, setGymQuery] = useState('')
    const [gymResults, setGymResults] = useState<{ id: string, name: string }[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedGym, setSelectedGym] = useState<{ id: string, name: string } | null>(null)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Weak-password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [weakMemberId, setWeakMemberId] = useState('')
    const [newPw, setNewPw] = useState('')
    const [newPwConfirm, setNewPwConfirm] = useState('')
    const [pwChangeMsg, setPwChangeMsg] = useState('')
    const [pwChanging, setPwChanging] = useState(false)

    // Debounced gym search
    const handleGymQueryChange = (val: string) => {
        setGymQuery(val)
        setGymResults([])
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        if (!val.trim()) return
        setSearchLoading(true)
        searchTimeout.current = setTimeout(async () => {
            const res = await searchGymsForReset(val)
            setGymResults(res.gyms || [])
            setSearchLoading(false)
        }, 350)
    }

    const handleSelectGym = (gym: { id: string, name: string }) => {
        setSelectedGym(gym)
        setGymResults([])
        setGymQuery('')
        setMessage('')
        setStep('LOGIN')
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedGym) return
        setLoading(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name')
        const password = String(formData.get('password')).toLowerCase()

        try {
            const res = await fetch('/api/login/member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, gymId: selectedGym.id }),
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
                {step === 'SEARCH' ? (
                    <Store size={48} strokeWidth={1.5} className="text-blue-600 mb-4" />
                ) : (
                    <User size={48} strokeWidth={1.5} className="text-blue-600 mb-4" />
                )}

                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                    수강생 로그인
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {step === 'SEARCH'
                        ? '먼저, 접속하실 도장 이름을 검색해주세요.'
                        : `${selectedGym?.name} - 등록하신 이름과 비밀번호를 입력하세요.`}
                </p>
            </div>

            {message && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg animate-in fade-in" role="alert">
                    {message}
                </div>
            )}

            {/* STEP 1: RESTAURANT (GYM) SEARCH */}
            {step === 'SEARCH' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col w-full gap-4">
                    <div className="relative">
                        <label className="block text-md font-medium text-gray-800 dark:text-zinc-200 mb-2">도장 이름 검색</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={gymQuery}
                                onChange={(e) => handleGymQueryChange(e.target.value)}
                                className="w-full rounded-md pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                                placeholder="예: 트라이스톤"
                                autoFocus
                            />
                        </div>

                        {/* Search results */}
                        {(searchLoading || gymResults.length > 0) && (
                            <div className="absolute z-10 w-full mt-2 border border-gray-200 rounded-lg shadow-xl bg-white overflow-hidden max-h-60 overflow-y-auto">
                                {searchLoading && (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">검색 중...</div>
                                )}
                                {!searchLoading && gymResults.length === 0 && gymQuery.trim() && (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">검색 결과가 없습니다.</div>
                                )}
                                {gymResults.map((gym) => (
                                    <button
                                        key={gym.id}
                                        type="button"
                                        onClick={() => handleSelectGym(gym)}
                                        className="w-full text-left px-5 py-3 text-base text-gray-800 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors font-medium"
                                    >
                                        {gym.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold rounded-xl px-4 py-4 mt-4 transition-all text-lg"
                    >
                        첫 화면으로
                    </Link>
                </div>
            )}

            {/* STEP 2: CREDENTIALS */}
            {step === 'LOGIN' && selectedGym && (
                <form
                    className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col w-full justify-center gap-2 text-foreground relative"
                    onSubmit={handleSubmit}
                >
                    <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="name">이름</label>
                    <input
                        className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                        name="name" placeholder="본인 이름" required autoFocus
                    />

                    <label className="text-md font-medium text-gray-800 dark:text-zinc-200" htmlFor="password">비밀번호</label>
                    <input
                        className="rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 mb-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                        type="password" name="password" placeholder="비밀번호 입력" required
                    />

                    <div className="flex items-center justify-end">
                        <div className="text-sm">
                            <Link href="/portal/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </div>

                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-4 mb-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 text-lg mt-2"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인 하기'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStep('SEARCH');
                            setSelectedGym(null);
                        }}
                        className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold rounded-xl px-4 py-4 mb-2 transition-all text-lg"
                    >
                        도장 다시 선택하기
                    </button>

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
            )}

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
