'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { lookupGymByCode, lookupGymById, registerPortalMember, searchGyms } from './actions'
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react'

export default function MemberSignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const codeParam = searchParams?.get('code') || ''
    const gymIdParam = searchParams?.get('gym_id') || ''

    const [step, setStep] = useState<'SEARCH' | 'FORM' | 'SUCCESS'>('SEARCH')
    const [gymInfo, setGymInfo] = useState<{ id: string, name: string } | null>(null)
    const [stripeMap, setStripeMap] = useState<Record<string, number>>({})
    const [activeTerms, setActiveTerms] = useState<{ id: string, title: string, content: string }[]>([])
    const [agreedTerms, setAgreedTerms] = useState<Set<string>>(new Set())
    const [viewingTerm, setViewingTerm] = useState<{ id: string, title: string, content: string } | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Gym search state
    const [gymQuery, setGymQuery] = useState('')
    const [gymResults, setGymResults] = useState<{ id: string, name: string }[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Form fields
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [birthYear, setBirthYear] = useState('')
    const [birthMonth, setBirthMonth] = useState('')
    const [birthDay, setBirthDay] = useState('')
    const [gender, setGender] = useState('male')
    const [belt, setBelt] = useState('White')
    const [stripe, setStripe] = useState<number>(0)
    const [promotionDate, setPromotionDate] = useState('')
    const [startYear, setStartYear] = useState('')
    const [startMonth, setStartMonth] = useState('')
    const [startDay, setStartDay] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [guardianPhone, setGuardianPhone] = useState('')
    const [address, setAddress] = useState('')
    const [school, setSchool] = useState('')
    const [schoolType, setSchoolType] = useState('일반')
    const [gradeNumber, setGradeNumber] = useState<number | null>(null)

    // Auto-select belt based on age
    useEffect(() => {
        if (!birthYear || !birthMonth || !birthDay) return
        const today = new Date()
        const birth = new Date(
            Number(birthYear),
            Number(birthMonth) - 1,
            Number(birthDay)
        )
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        if (age < 16) {
            setBelt('화이트 (유소년)')
        } else {
            setBelt('White')
        }
        setStripe(0)
    }, [birthYear, birthMonth, birthDay])

    // Password validation state
    const passwordInputRef = useRef<HTMLInputElement>(null)
    const [passwordError, setPasswordError] = useState('')

    // If invitation code or gym_id is in URL, skip search and go directly to form
    useEffect(() => {
        if (codeParam) {
            handleCheckCode(codeParam)
        } else if (gymIdParam) {
            handleSelectGym({ id: gymIdParam, name: '' })
        }
    }, [codeParam, gymIdParam])

    const handleCheckCode = async (codeToCheck: string) => {
        setIsLoading(true)
        setErrorMsg('')
        try {
            const res = await lookupGymByCode(codeToCheck)
            if (res.error) {
                setErrorMsg(res.error)
            } else if (res.gym) {
                setGymInfo(res.gym)
                setStripeMap(res.stripeMap || {})
                setActiveTerms(res.activeTerms || [])
                setAgreedTerms(new Set())
                setStep('FORM')
            }
        } catch (e) {
            setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectGym = async (gym: { id: string, name: string }) => {
        setIsLoading(true)
        setErrorMsg('')
        try {
            const res = await lookupGymById(gym.id)
            if (res.error) {
                setErrorMsg(res.error)
            } else if (res.gym) {
                setGymInfo(res.gym)
                setStripeMap(res.stripeMap || {})
                setActiveTerms(res.activeTerms || [])
                setAgreedTerms(new Set())
                setGymResults([])
                setGymQuery('')
                setStep('FORM')
            }
        } catch (e) {
            setErrorMsg('서버 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Debounced gym search
    const handleGymQueryChange = (val: string) => {
        setGymQuery(val)
        setGymResults([])
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        if (!val.trim()) return
        setSearchLoading(true)
        searchTimeout.current = setTimeout(async () => {
            const res = await searchGyms(val)
            setGymResults(res.gyms || [])
            setSearchLoading(false)
        }, 350)
    }

    const allTermsAgreed = activeTerms.length === 0 || activeTerms.every(t => agreedTerms.has(t.id))
    const PASSWORD_POLICY = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}/

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!gymInfo) return

        setPasswordError('')
        if (!PASSWORD_POLICY.test(password)) {
            setPasswordError('비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.')
            passwordInputRef.current?.focus()
            return
        }
        if (password !== passwordConfirm) {
            setPasswordError('비밀번호가 일치하지 않습니다.')
            passwordInputRef.current?.focus()
            return
        }
        if (!birthYear || !birthMonth || !birthDay) {
            setErrorMsg('생년월일을 정확히 입력해주세요.')
            return
        }
        setIsLoading(true)
        setErrorMsg('')
        const res = await registerPortalMember({
            gymId: gymInfo.id, name, phone, password,
            birthDate: (birthYear && birthMonth && birthDay)
                ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` : null,
            gender, belt,
            stripe: stripe !== null ? stripe : null,
            promotionDate: promotionDate || null,
            accessCode, guardianPhone, address,
            school,
            schoolType,
            gradeNumber: schoolType !== '일반' ? gradeNumber : null,
            gradeUpdatedYear: (schoolType !== '일반' && gradeNumber) ? new Date().getFullYear() : null,
            startDate: (startYear && startMonth && startDay) ? `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}` : null,
        })
        setIsLoading(false)
        if (res.error) setErrorMsg(res.error)
        else { setStep('SUCCESS'); setTimeout(() => router.push('/login'), 5000) }
    }

    const inputCls = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            <button 
                onClick={() => router.back()} 
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow border border-gray-200 transition-all z-10 flex items-center justify-center"
                aria-label="닫기"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="sm:mx-auto sm:w-full sm:max-w-md mt-4">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {gymInfo?.name ? `${gymInfo.name} 회원 가입` : '체육관 회원 가입'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 'SEARCH' && '소속 도장을 검색하여 선택해주세요.'}
                    {step === 'FORM' && '가입 정보 입력'}
                    {step === 'SUCCESS' && '가입이 완료되었습니다!'}
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

                    {/* ─── SEARCH STEP ─── */}
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
                                        placeholder="예: 트라이스톤 (일부만 입력해도 됩니다)"
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

                                {!searchLoading && gymQuery.trim() && gymResults.length === 0 && (
                                    <p className="mt-2 text-xs text-gray-500">도장 이름의 일부를 입력해보세요. (예: "트라이" → 트라이스톤 주짓수 검색)</p>
                                )}
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-400">초대 링크를 받으셨나요? 링크를 직접 클릭하면 도장 검색 없이 바로 가입할 수 있습니다.</p>
                            </div>

                            <div className="text-center">
                                <a href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">이미 가입하셨나요? 로그인</a>
                            </div>
                        </div>
                    )}

                    {/* ─── FORM STEP ─── */}
                    {step === 'FORM' && gymInfo && (
                        <form onSubmit={handleSubmitForm} className="space-y-5">

                            {/* 1. 이름 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">이름 *</label>
                                <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className={inputCls} placeholder="홍길동" />
                                <p className="mt-1 text-xs text-gray-500">기존 회원인 경우 예약했던 이름과 동일하게 적어주세요.</p>
                            </div>

                            {/* 2. 생년월일 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">생년월일 *</label>
                                <div className="mt-1 grid grid-cols-3 gap-2">
                                    <select required value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        <option value="">년도</option>
                                        {Array.from({ length: 80 }, (_, i) => { const yr = new Date().getFullYear() - i; return <option key={yr} value={String(yr)}>{yr}</option> })}
                                    </select>
                                    <select required value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        <option value="">월</option>
                                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>)}
                                    </select>
                                    <select required value={birthDay} onChange={(e) => setBirthDay(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        <option value="">일</option>
                                        {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}일</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* 3. 성별 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">성별 *</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                                    <option value="male">남성</option>
                                    <option value="female">여성</option>
                                </select>
                            </div>

                            {/* 4. 회원 연락처 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">회원 연락처 (선택)</label>
                                <input type="tel" value={phone} autoComplete="off"
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9]/g, '')
                                        setPhone(v)
                                        if (v.length >= 4) setAccessCode(v.slice(-4))
                                        else if (guardianPhone.length >= 4) setAccessCode(guardianPhone.slice(-4))
                                        else setAccessCode('')
                                    }}
                                    className={inputCls} placeholder="01012345678 (숫자만)" maxLength={11} />
                            </div>

                            {/* 5. 보호자 연락처 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">보호자 연락처 (선택)</label>
                                <input type="tel" value={guardianPhone} autoComplete="off"
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9]/g, '')
                                        setGuardianPhone(v)
                                        if (!phone || phone.length < 4) {
                                            if (v.length >= 4) setAccessCode(v.slice(-4))
                                            else setAccessCode('')
                                        }
                                    }}
                                    className={inputCls} placeholder="01012345678 (숫자만)" maxLength={11} />
                            </div>

                            {/* 주소 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">거주지 주소 (선택)</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                    className={inputCls} placeholder="예: 서울시 강남구 테헤란로 123 (상세주소 포함)" />
                            </div>

                            {/* 6. 비밀번호 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">로그인 비밀번호 *</label>
                                <input required type="password" value={password} autoComplete="new-password"
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setPasswordError('')
                                    }}
                                    ref={passwordInputRef}
                                    className={`${inputCls} ${passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`} placeholder="영문+숫자 혼합 6자리 이상" minLength={6} />
                                {passwordError ? (
                                    <p className="mt-1 text-xs text-red-500">{passwordError}</p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-500">영문과 숫자를 반드시 포함하여 6자리 이상으로 설정해주세요.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">로그인 비밀번호 확인 *</label>
                                <input required type="password" value={passwordConfirm} autoComplete="new-password"
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${passwordConfirm && password !== passwordConfirm ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="비밀번호를 다시 입력해주세요" minLength={6} />
                                {passwordConfirm && password !== passwordConfirm && (
                                    <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </div>

                            {/* 7. 출석체크 번호 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">출석체크 번호 (숫자 4자리)</label>
                                <input type="tel" value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className={inputCls} placeholder="자동 입력됩니다 (수정 가능)" maxLength={4} />
                                <p className="mt-1 text-xs text-gray-500">연락처 뒷 4자리로 자동 입력됩니다.</p>
                            </div>

                            {/* 8. 학교/학년 */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">학교 구분 (선택)</label>
                                        <select
                                            value={schoolType}
                                            onChange={(e) => { setSchoolType(e.target.value); setGradeNumber(null) }}
                                            className={inputCls}
                                        >
                                            <option value="일반">일반</option>
                                            <option value="초등학교">초등학교</option>
                                            <option value="중학교">중학교</option>
                                            <option value="고등학교">고등학교</option>
                                        </select>
                                    </div>
                                    {schoolType !== '일반' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">학년 (선택)</label>
                                            <select
                                                value={gradeNumber ?? ''}
                                                onChange={(e) => setGradeNumber(e.target.value ? Number(e.target.value) : null)}
                                                className={inputCls}
                                            >
                                                <option value="">학년 선택</option>
                                                {(schoolType === '초등학교'
                                                    ? [1,2,3,4,5,6]
                                                    : [1,2,3]
                                                ).map(n => (
                                                    <option key={n} value={n}>{n}학년</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">학교 이름 (선택)</label>
                                    <input type="text" value={school} onChange={(e) => setSchool(e.target.value)}
                                        className={inputCls} placeholder="예: 서울초등학교" />
                                </div>
                            </div>

                            {/* 9. 벨트 정보 */}
                            <div className="border border-blue-200 rounded-lg p-4 space-y-4 bg-blue-50/40">
                                <p className="text-sm font-semibold text-blue-700">현재 벨트 정보 (선택)</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">벨트</label>
                                    <select value={belt} onChange={(e) => { setBelt(e.target.value); setStripe(0) }}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        <optgroup label="성인"><option value="White">화이트 (성인)</option><option value="Blue">블루</option><option value="Purple">퍼플</option><option value="Brown">브라운</option><option value="Black">블랙</option></optgroup>
                                        <optgroup label="유소년"><option value="화이트 (유소년)">화이트 (유소년)</option><option value="그레이-화이트">그레이-화이트</option><option value="그레이">그레이</option><option value="그레이-블랙">그레이-블랙</option><option value="옐로우-화이트">옐로우-화이트</option><option value="옐로우">옐로우</option><option value="옐로우-블랙">옐로우-블랙</option><option value="오렌지-화이트">오렌지-화이트</option><option value="오렌지">오렌지</option><option value="오렌지-블랙">오렌지-블랙</option><option value="그린-화이트">그린-화이트</option><option value="그린">그린</option><option value="그린-블랙">그린-블랙</option></optgroup>
                                    </select>
                                </div>
                                {(() => {
                                    const beltKorMap: Record<string, string> = { 'White': '화이트 (성인)', 'Blue': '블루', 'Purple': '퍼플', 'Brown': '브라운', 'Black': '블랙' }
                                    const korName = beltKorMap[belt] || belt
                                    const maxStripes = stripeMap[korName] ?? stripeMap[belt] ?? 4
                                    return (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">그랄 수</label>
                                            <select value={stripe} onChange={(e) => setStripe(Number(e.target.value))}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                {Array.from({ length: maxStripes + 1 }, (_, i) => <option key={i} value={i}>{i === 0 ? '0 (없음)' : `${i}그랄`}</option>)}
                                            </select>
                                        </div>
                                    )
                                })()}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">승급일</label>
                                    <div className="mt-1 grid grid-cols-3 gap-2">
                                        {(() => {
                                            const [pdYear, pdMonth, pdDay] = promotionDate ? promotionDate.split('-') : ['', '', '']
                                            return (<>
                                                <select value={pdYear || ''} onChange={(e) => { const [, m, d] = promotionDate ? promotionDate.split('-') : ['', '', '']; setPromotionDate(e.target.value ? `${e.target.value}-${m || '01'}-${d || '01'}` : '') }} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">년도</option>{Array.from({ length: 40 }, (_, i) => { const yr = new Date().getFullYear() - i; return <option key={yr} value={String(yr)}>{yr}</option> })}</select>
                                                <select value={pdMonth || ''} onChange={(e) => { const [y, , d] = promotionDate ? promotionDate.split('-') : ['', '', '']; setPromotionDate(y ? `${y}-${e.target.value.padStart(2, '0')}-${d || '01'}` : '') }} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
                                                <select value={pdDay || ''} onChange={(e) => { const [y, m] = promotionDate ? promotionDate.split('-') : ['', '']; setPromotionDate(y ? `${y}-${m || '01'}-${e.target.value.padStart(2, '0')}` : '') }} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
                                            </>)
                                        })()}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">주짓수 입문일</label>
                                    <div className="mt-1 grid grid-cols-3 gap-2">
                                        <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">년도</option>{Array.from({ length: 40 }, (_, i) => { const yr = new Date().getFullYear() - i; return <option key={yr} value={String(yr)}>{yr}</option> })}</select>
                                        <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
                                        <select value={startDay} onChange={(e) => setStartDay(e.target.value)} className="block w-full px-2 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
                                    </div>
                                </div>
                            </div>

                            {/* 10. 약관 */}
                            {activeTerms.length > 0 && (
                                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <p className="text-sm font-semibold text-gray-700">약관 동의</p>
                                    {activeTerms.map((term) => {
                                        const agreed = agreedTerms.has(term.id)
                                        return (
                                            <div key={term.id} className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs ${agreed ? 'text-green-600' : 'text-gray-500'}`}>{agreed ? '✓' : '○'}</span>
                                                    <span className="text-sm text-gray-700">{term.title}</span>
                                                </div>
                                                <button type="button" onClick={() => setViewingTerm(term)}
                                                    className="shrink-0 text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-full hover:bg-blue-50 transition-colors">약관 확인</button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* 버튼 */}
                            <div>
                                <button type="submit" disabled={isLoading || !allTermsAgreed}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                                    {isLoading ? '가입 처리 중...' : '가입하기'}
                                </button>
                                <button type="button" onClick={() => { setStep('SEARCH'); setGymInfo(null) }}
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">가입 신청 완료!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                관장님의 승인 후 로그인 할 수 있습니다.<br />5초 후 메인 페이지로 이동합니다.
                            </p>
                            <button onClick={() => router.push('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                                로그인 화면으로
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 약관 모달 */}
            {viewingTerm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setViewingTerm(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">{viewingTerm.title}</h3>
                            <button onClick={() => setViewingTerm(null)} className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none">✕</button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewingTerm.content}</pre>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100">
                            <button onClick={() => { setAgreedTerms(prev => new Set([...prev, viewingTerm.id])); setViewingTerm(null) }}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                                확인 및 동의
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
