'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { lookupGymByCode, registerPortalMember } from './actions'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function MemberSignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const codeParam = searchParams?.get('code') || ''

    const [step, setStep] = useState<'CODE' | 'FORM' | 'SUCCESS'>('CODE')
    const [invitationCode, setInvitationCode] = useState(codeParam)
    const [gymInfo, setGymInfo] = useState<{ id: string, name: string } | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Form fields
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [gender, setGender] = useState('M')
    const [belt, setBelt] = useState('White')
    const [accessCode, setAccessCode] = useState('')

    // Additional fields (accessCode removed from state)
    const [guardianPhone, setGuardianPhone] = useState('')
    const [address, setAddress] = useState('')
    const [school, setSchool] = useState('')
    const [grade, setGrade] = useState('')

    useEffect(() => {
        if (codeParam) {
            handleCheckCode(codeParam)
        }
    }, [codeParam])

    const handleCheckCode = async (codeToCheck: string) => {
        setIsLoading(true)
        setErrorMsg('')
        const res = await lookupGymByCode(codeToCheck)
        setIsLoading(false)

        if (res.error) {
            setErrorMsg(res.error)
            setStep('CODE') // Stay on code step
        } else if (res.gym) {
            setGymInfo(res.gym)
            setStep('FORM')
        }
    }

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!gymInfo) return

        if (password !== passwordConfirm) {
            setErrorMsg('비밀번호가 일치하지 않습니다.')
            return
        }

        setIsLoading(true)
        setErrorMsg('')

        const res = await registerPortalMember({
            gymId: gymInfo.id,
            name,
            phone,
            password,
            birthDate: birthDate || null,
            gender,
            belt, // Send the selected belt
            accessCode, // Send user's chosen PIN
            guardianPhone,
            address,
            school,
            grade
        })

        setIsLoading(false)

        if (res.error) {
            setErrorMsg(res.error)
        } else {
            setStep('SUCCESS')
            // Delay and redirect to login
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {gymInfo?.name ? `${gymInfo.name} 회원 가입` : '체육관 회원 가입'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 'CODE' && '관장님께 받은 초대 코드를 입력해주세요.'}
                    {step === 'FORM' && '가입 정보 입력'}
                    {step === 'SUCCESS' && '가입이 완료되었습니다!'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    {errorMsg && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 relative overflow-hidden">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{errorMsg}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'CODE' && (
                        <form onSubmit={(e) => { e.preventDefault(); handleCheckCode(invitationCode); }} className="space-y-6">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                    체육관 초대 코드
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        required
                                        value={invitationCode}
                                        onChange={(e) => setInvitationCode(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                                        placeholder="예: GYM12A"
                                    />
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !invitationCode}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isLoading ? '확인 중...' : '확인'}
                                </button>
                            </div>

                            <div className="mt-4 text-center">
                                <span className="text-sm text-gray-500">이미 가입하셨나요? </span>
                                <a href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                    수강생 로그인
                                </a>
                            </div>
                        </form>
                    )}

                    {step === 'FORM' && gymInfo && (
                        <form onSubmit={handleSubmitForm} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">이름 *</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="홍길동"
                                />
                                <p className="mt-1 text-xs text-gray-500">기존 회원인 경우 예약했던 이름과 동일하게 적어주세요.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
                                <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        const newPhone = e.target.value.replace(/[^0-9]/g, '')
                                        setPhone(newPhone)
                                    }}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="01012345678 (숫자만 입력)"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">로그인 비밀번호 (4자리 이상) *</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="로그인 시 사용할 비밀번호"
                                    minLength={4}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">로그인 비밀번호 확인 *</label>
                                <input
                                    required
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${passwordConfirm && password !== passwordConfirm ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="비밀번호를 다시 한 번 입력해주세요"
                                    minLength={4}
                                />
                                {passwordConfirm && password !== passwordConfirm && (
                                    <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">출석체크 비밀번호 (숫자 4자리) *</label>
                                <input
                                    required
                                    type="tel"
                                    value={accessCode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                        setAccessCode(val)
                                    }}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="출석 시 사용할 4자리 숫자 (예: 통화용 뒷자리)"
                                    maxLength={4}
                                    minLength={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">성별 *</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="M">남성</option>
                                        <option value="F">여성</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">현재 벨트 *</label>
                                    <select
                                        value={belt}
                                        onChange={(e) => setBelt(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    >
                                        <optgroup label="성인">
                                            <option value="White">화이트 (성인)</option>
                                            <option value="Blue">블루</option>
                                            <option value="Purple">퍼플</option>
                                            <option value="Brown">브라운</option>
                                            <option value="Black">블랙</option>
                                        </optgroup>
                                        <optgroup label="유소년">
                                            <option value="화이트 (유소년)">화이트 (유소년)</option>
                                            <option value="그레이-화이트">그레이-화이트</option>
                                            <option value="그레이">그레이</option>
                                            <option value="그레이-블랙">그레이-블랙</option>
                                            <option value="옐로우-화이트">옐로우-화이트</option>
                                            <option value="옐로우">옐로우</option>
                                            <option value="옐로우-블랙">옐로우-블랙</option>
                                            <option value="오렌지-화이트">오렌지-화이트</option>
                                            <option value="오렌지">오렌지</option>
                                            <option value="오렌지-블랙">오렌지-블랙</option>
                                            <option value="그린-화이트">그린-화이트</option>
                                            <option value="그린">그린</option>
                                            <option value="그린-블랙">그린-블랙</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-hidden">
                                <label className="block text-sm font-medium text-gray-700">생년월일 (선택)</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="mt-1 block w-full max-w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm box-border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">보호자 연락처 (선택)</label>
                                <input
                                    type="tel"
                                    value={guardianPhone}
                                    onChange={(e) => setGuardianPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="01012345678"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">주소 (선택)</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="주소를 입력해주세요"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">학교 (선택)</label>
                                    <input
                                        type="text"
                                        value={school}
                                        onChange={(e) => setSchool(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="예: 서울초"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">학년 (선택)</label>
                                    <input
                                        type="text"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="예: 3학년"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isLoading ? '가입 처리 중...' : '가입하기'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('CODE')}
                                    className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    초대 코드 다시 입력
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">가입 완료!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                성공적으로 가입(또는 연동)되었습니다.<br />잠시 후 로그인 페이지로 이동합니다.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                                로그인 화면으로
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
