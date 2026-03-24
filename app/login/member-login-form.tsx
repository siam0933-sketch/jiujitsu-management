'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Search, Store } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { changeMemberPassword } from './change-password-action'
import { searchGymsForLogin } from './actions'
import { lookupGymByCode, lookupGymById } from '../portal/signup/actions'

const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

export default function MemberLoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const codeParam = searchParams?.get('code') || ''
    const gymIdParam = searchParams?.get('gym_id') || ''
    const appParam = searchParams?.get('app') === 'true'

    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'SEARCH' | 'LOGIN'>('SEARCH')
    const [isAppMode, setIsAppMode] = useState(false)

    // Step 1: Search Gym State
    const [gymQuery, setGymQuery] = useState('')
    const [gymResults, setGymResults] = useState<{ id: string, name: string }[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedGym, setSelectedGym] = useState<{ id: string, name: string } | null>(null)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Check localStorage and searchParams on mount
    useEffect(() => {
        const initGymFromParams = async () => {
            if (codeParam) {
                const res = await lookupGymByCode(codeParam)
                if (res.gym) {
                    handleSelectGym({ id: res.gym.id, name: res.gym.name })
                    return
                }
            } else if (gymIdParam) {
                const res = await lookupGymById(gymIdParam)
                if (res.gym) {
                    handleSelectGym({ id: res.gym.id, name: res.gym.name })
                    return
                }
            }
            
            // Fallback to local storage if no params or invalid params
            const cachedId = localStorage.getItem('preferred_gym_id')
            const cachedName = localStorage.getItem('preferred_gym_name')
            if (cachedId && cachedName) {
                setSelectedGym({ id: cachedId, name: cachedName })
                setStep('LOGIN')
            }
        }
        initGymFromParams()

        // Check app mode
        if (appParam) {
            setIsAppMode(true)
            localStorage.setItem('is_app_mode', 'true')
        } else if (localStorage.getItem('is_app_mode') === 'true') {
            setIsAppMode(true)
        }
    }, [codeParam, gymIdParam, appParam])

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
            const res = await searchGymsForLogin(val)
            setGymResults(res.gyms || [])
            setSearchLoading(false)
        }, 350)
    }

    const handleSelectGym = (gym: { id: string, name: string }) => {
        // Save to localStorage
        localStorage.setItem('preferred_gym_id', gym.id)
        localStorage.setItem('preferred_gym_name', gym.name)

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
        try {
            const result = await changeMemberPassword(weakMemberId, newPw)
            
            if (result.error) {
                setPwChangeMsg(result.error)
            } else {
                setShowPasswordModal(false)
                router.refresh()
                router.push('/portal')
            }
        } catch (err: any) {
            setPwChangeMsg('네트워크 또는 서버 오류가 발생했습니다.')
        } finally {
            setPwChanging(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto px-4">
            <div className="flex flex-col items-center justify-center mb-8">
                {isAppMode ? (
                    <div className="hover:opacity-80 transition-opacity select-none pointer-events-none">
                        <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={48} height={48} className="mb-4 rounded-xl shadow-sm" priority />
                    </div>
                ) : (
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={48} height={48} className="mb-4 rounded-xl shadow-sm hover:scale-105 transition-transform" priority />
                    </Link>
                )}

                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-2">
                    수강생 로그인
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    접속하실 도장을 선택하고 로그인 정보를 입력해주세요.
                </p>
            </div>

            {message && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg animate-in fade-in" role="alert">
                    {message}
                </div>
            )}

            <form
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col w-full gap-4 text-foreground relative"
                onSubmit={handleSubmit}
            >
                {/* 1. 도장 선택 */}
                <div>
                    <label className="block text-md font-medium text-gray-800 dark:text-zinc-200 mb-2">도장 선택</label>
                    {!selectedGym ? (
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
                    ) : (
                        <div className="flex items-center justify-between p-4 border border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">{selectedGym.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem('preferred_gym_id')
                                    localStorage.removeItem('preferred_gym_name')
                                    setSelectedGym(null)
                                    setGymQuery('')     
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 bg-white dark:bg-zinc-800 rounded-md shadow-sm border border-blue-200 dark:border-blue-800"
                            >
                                검색 변경
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. 로그인 정보 */}
                <div>
                    <label className="text-md font-medium text-gray-800 dark:text-zinc-200 block mb-2" htmlFor="name">이름</label>
                    <input
                        className="w-full rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                        name="name" placeholder="본인 이름" required
                    />
                </div>

                <div>
                    <label className="text-md font-medium text-gray-800 dark:text-zinc-200 block mb-2" htmlFor="password">비밀번호</label>
                    <input
                        className="w-full rounded-md px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-lg appearance-none"
                        type="password" name="password" placeholder="비밀번호 입력" required
                    />
                </div>

                <div className="flex flex-col gap-4 mt-2">
                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-4 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 text-lg"
                        disabled={loading || !selectedGym}
                    >
                        {loading ? '로그인 중...' : '로그인 하기'}
                    </button>
                </div>

                <div className="flex items-center justify-center mt-2">
                    <button 
                        type="button" 
                        onClick={() => alert('비밀번호를 분실하신 경우, 소속 체육관 관장님(관리자)께 비밀번호 초기화를 문의해 주세요.')}
                        className="text-sm font-medium text-gray-500 hover:text-blue-600 pt-2"
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                </div>

                <div className="text-center text-sm mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
                    <Link
                        href={codeParam ? `/portal/signup?code=${codeParam}` : (gymIdParam ? `/portal/signup?gym_id=${gymIdParam}` : '/portal/signup')}
                        className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold rounded-xl px-4 py-4 transition-all text-lg border border-blue-100 dark:border-blue-900/30"
                    >
                        신규 회원(관원) 가입하기
                    </Link>
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
