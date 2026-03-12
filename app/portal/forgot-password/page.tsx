'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { searchGymsForReset, verifyAndResetPassword } from './actions'
import { AlertCircle, CheckCircle2, Search } from 'lucide-react'

export default function ForgotPasswordPage() {
    const router = useRouter()

    const [step, setStep] = useState<'SEARCH' | 'VERIFY' | 'SUCCESS'>('SEARCH')
    const [gymInfo, setGymInfo] = useState<{ id: string, name: string } | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // SEARCH step state
    const [gymQuery, setGymQuery] = useState('')
    const [gymResults, setGymResults] = useState<{ id: string, name: string }[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // VERIFY step state
    const [name, setName] = useState('')
    const [authType, setAuthType] = useState<'phone' | 'birth'>('phone')
    const [authValue, setAuthValue] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')

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
        setGymInfo(gym)
        setGymResults([])
        setGymQuery('')
        setErrorMsg('')
        setStep('VERIFY')
    }

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!gymInfo) return

        if (password !== passwordConfirm) {
            setErrorMsg('새 비밀번호가 서로 일치하지 않습니다.')
            return
        }

        setIsLoading(true)
        setErrorMsg('')

        const res = await verifyAndResetPassword({
            gymId: gymInfo.id,
            name,
            authType,
            authValue,
            newPassword: password
        })

        setIsLoading(false)

        if (res.error) {
            setErrorMsg(res.error)
        } else {
            setStep('SUCCESS')
            setTimeout(() => router.push('/login'), 3000)
        }
    }

    const inputCls = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">비밀번호 찾기</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 'SEARCH' && '소속된 도장의 이름을 검색해주세요.'}
                    {step === 'VERIFY' && `${gymInfo?.name} - 본인 인증 및 새 비밀번호 설정`}
                    {step === 'SUCCESS' && '비밀번호가 성공적으로 변경되었습니다.'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    {errorMsg && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                                    <p className="mt-2 text-sm text-red-700">{errorMsg}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 1: RESTAURANT SEARCH ─── */}
                    {step === 'SEARCH' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">도장 이름 검색</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={gymQuery}
                                        onChange={(e) => handleGymQueryChange(e.target.value)}
                                        className="block w-full pl-9 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="예: 트라이스톤"
                                        autoFocus
                                    />
                                </div>

                                {/* Search results */}
                                {(searchLoading || gymResults.length > 0) && (
                                    <div className="mt-1 border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden">
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
                                                disabled={isLoading}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors font-medium"
                                            >
                                                {gym.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="text-center pt-4">
                                <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">이전 화면으로 돌아가기</button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 2: VERIFICATION & NEW PASSWORD ─── */}
                    {step === 'VERIFY' && gymInfo && (
                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">이름 *</label>
                                <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className={inputCls} placeholder="가입 시 기재한 이름" />
                            </div>

                            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">인증 수단 선택</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" value="phone" checked={authType === 'phone'} onChange={() => { setAuthType('phone'); setAuthValue('') }} className="mr-2 text-blue-600" /> 연락처
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" value="birth" checked={authType === 'birth'} onChange={() => { setAuthType('birth'); setAuthValue('') }} className="mr-2 text-blue-600" /> 생년월일
                                        </label>
                                    </div>
                                </div>

                                {authType === 'phone' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">연락처 뒷 4자리 *</label>
                                        <input required type="tel" value={authValue} onChange={(e) => setAuthValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                            className={inputCls} placeholder="예: 1234" maxLength={4} />
                                        <p className="mt-1 text-xs text-gray-500">도장에 등록된 본인 연락처(휴대폰) 마지막 4자리 숫자</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">생년월일 (8자리) *</label>
                                        <input required type="tel" value={authValue} onChange={(e) => setAuthValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                                            className={inputCls} placeholder="예: 19900101" maxLength={8} />
                                        <p className="mt-1 text-xs text-gray-500">YYYYMMDD 형식의 8자리 숫자</p>
                                    </div>
                                )}
                            </div>

                            <hr className="my-4 border-gray-100" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700">새 비밀번호 *</label>
                                <input required type="password" value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputCls} placeholder="영문+숫자 혼합 6자리 이상" minLength={6} />
                                <p className="mt-1 text-xs text-gray-500">영문과 숫자를 반드시 포함하여 설정해주세요.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인 *</label>
                                <input required type="password" value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${passwordConfirm && password !== passwordConfirm ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="새 비밀번호 다시 입력" minLength={6} />
                            </div>

                            <div className="pt-2">
                                <button type="submit" disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                                    {isLoading ? '확인 및 변경 설정 중...' : '비밀번호 변경하기'}
                                </button>
                                <button type="button" onClick={() => { setStep('SEARCH'); setGymInfo(null); setErrorMsg('') }}
                                    className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    도장 다시 선택
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ─── SUCCESS ─── */}
                    {step === 'SUCCESS' && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">변경 완료!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                비밀번호가 안전하게 교체되었습니다.<br />새로운 비밀번호로 로그인해주세요.
                            </p>
                            <button onClick={() => router.push('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                                로그인 화면으로
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
