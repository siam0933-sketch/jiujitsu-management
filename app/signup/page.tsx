
'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { searchTeamsForSignup } from './actions'
import { Search } from 'lucide-react'

export default function SignupPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    
    // Team State
    const [teamAction, setTeamAction] = useState<'none' | 'create' | 'join'>('none')
    const [teamQuery, setTeamQuery] = useState('')
    const [teamResults, setTeamResults] = useState<{ id: string, name: string, representative_name: string }[]>([])
    const [selectedTeam, setSelectedTeam] = useState<{ id: string, name: string } | null>(null)
    const [searchLoading, setSearchLoading] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleTeamSearch = (val: string) => {
        setTeamQuery(val)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        if (!val.trim()) {
            setTeamResults([])
            return
        }
        setSearchLoading(true)
        searchTimeout.current = setTimeout(async () => {
            const res = await searchTeamsForSignup(val)
            setTeamResults(res)
            setSearchLoading(false)
        }, 300)
    }

    const handleSelectTeam = (team: { id: string, name: string, representative_name: string }) => {
        setSelectedTeam(team)
        setTeamQuery('')
        setTeamResults([])
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (password !== confirmPassword) {
            e.preventDefault()
            setError('비밀번호가 일치하지 않습니다.')
            return
        }
        if (password.length < 6) {
            e.preventDefault()
            setError('비밀번호는 6자 이상이어야 합니다.')
            return
        }
        if (teamAction === 'join' && !selectedTeam) {
            e.preventDefault()
            setError('가입할 팀을 검색하여 정확히 선택해주세요.')
            return
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                        도장 등록 및 회원가입
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
                        관장님 전용 가입 페이지입니다. (* 표시는 필수입력)
                    </p>
                </div>

                <form className="mt-8 space-y-6" action="/auth/sign-up" method="POST" onSubmit={handleSubmit}>
                    <input type="hidden" name="role" value="gym_master" />

                    <div className="rounded-md shadow-sm space-y-4 bg-white dark:bg-zinc-900 p-6">
                        {/* 개인 정보 섹션 */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-zinc-100 mb-4">관리자 정보</h3>
                            <div className="grid grid-cols-1 gap-y-4">
                                <div>
                                    <label htmlFor="email" className="sr-only">Email address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="이메일 주소 *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">Password</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="비밀번호 (6자 이상) *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="비밀번호 확인 *"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div>
                                    <label htmlFor="full_name" className="sr-only">Name</label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="관장님 성함 *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="sr-only">Phone</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="휴대폰 번호 (010-0000-0000) *"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4"></div>

                        {/* 도장 정보 섹션 */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-zinc-100 mb-4">도장 정보</h3>
                            <div className="grid grid-cols-1 gap-y-4">
                                <div>
                                    <label htmlFor="gym_name" className="sr-only">Gym Name</label>
                                    <input
                                        id="gym_name"
                                        name="gym_name"
                                        type="text"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="도장 이름 (예: 강남 주짓수) *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="business_registration_number" className="sr-only">Business Number</label>
                                    <input
                                        id="business_registration_number"
                                        name="business_registration_number"
                                        type="text"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="사업자 등록번호 (선택)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gym_phone" className="sr-only">Gym Phone</label>
                                    <input
                                        id="gym_phone"
                                        name="gym_phone"
                                        type="tel"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="도장 전화번호 (선택)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gym_address" className="sr-only">Gym Address</label>
                                    <input
                                        id="gym_address"
                                        name="gym_address"
                                        type="text"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 appearance-none"
                                        placeholder="도장 주소 (선택)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" name="team_action" value={teamAction} />
                    {teamAction === 'join' && selectedTeam && (
                        <input type="hidden" name="join_team_id" value={selectedTeam.id} />
                    )}

                    {/* 도장 연합(마이 팀) 섹션 */}
                    <div className="rounded-md shadow-sm space-y-4 bg-white dark:bg-zinc-900 p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-zinc-100">마이 팀 (도장 연합) 가입 옵션</h3>
                        <p className="text-sm text-gray-500">
                            동료 관장님들과 연합(팀)을 만들어 관리하거나 기존 연합에 참여할 수 있습니다. 
                            선택하지 않고 나중에 설정할 수도 있습니다.
                        </p>

                        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1.5 gap-1 mb-4">
                            <button
                                type="button"
                                onClick={() => { setTeamAction('create'); setSelectedTeam(null); }}
                                className={`flex-1 text-sm font-semibold rounded-md py-2 px-3 transition-colors ${teamAction === 'create' ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-zinc-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                팀 생성하기
                            </button>
                            <button
                                type="button"
                                onClick={() => setTeamAction('join')}
                                className={`flex-1 text-sm font-semibold rounded-md py-2 px-3 transition-colors ${teamAction === 'join' ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-zinc-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                팀 가입하기
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTeamAction('none'); setSelectedTeam(null); }}
                                className={`flex-1 text-sm font-semibold rounded-md py-2 px-3 transition-colors ${teamAction === 'none' ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-zinc-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                선택 안 함
                            </button>
                        </div>

                        {teamAction === 'create' && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4 p-4 border border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10 rounded-xl">
                                <div>
                                    <label htmlFor="new_team_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        생성할 팀 이름 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="new_team_name"
                                        name="new_team_name"
                                        type="text"
                                        required={teamAction === 'create'}
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                                        placeholder="예: 트라이스톤 네트워크"
                                    />
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    팀을 생성하시면 관장님이 '팀 대표'로 자동 지정됩니다.
                                </p>
                            </div>
                        )}

                        {teamAction === 'join' && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4 p-4 border border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10 rounded-xl">
                                {!selectedTeam ? (
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            가입할 팀 검색 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={teamQuery}
                                                onChange={(e) => handleTeamSearch(e.target.value)}
                                                className="relative block w-full rounded-md border-0 py-1.5 pl-9 pr-3 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm"
                                                placeholder="팀 이름을 입력하세요"
                                            />
                                        </div>
                                        {teamQuery && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-100 dark:border-zinc-700 max-h-48 overflow-y-auto">
                                                {searchLoading ? (
                                                    <div className="px-4 py-2 text-sm text-gray-500">검색 중...</div>
                                                ) : teamResults.length > 0 ? (
                                                    teamResults.map(t => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => handleSelectTeam(t)}
                                                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-sm border-b border-gray-50 dark:border-zinc-700/50 last:border-0"
                                                        >
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                                                            <div className="text-xs text-gray-500">대표: {t.representative_name}</div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500 cursor-default">검색 결과가 없습니다.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-emerald-100/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                            <div>
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-0.5">선택된 팀</div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{selectedTeam.name}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTeam(null)}
                                                className="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-sm hover:bg-gray-50"
                                            >
                                                다시 검색
                                            </button>
                                        </div>

                                        <div className="border-t border-emerald-200/50 pt-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-3">상세 가입 양식</h4>
                                            <p className="text-xs text-gray-500 mb-3">관장님 이름, 휴대전화, 도장명, 주소 정보는 상단의 기본 등록 정보에서 자동으로 제출됩니다.</p>
                                            
                                            <div className="space-y-3">
                                                <div>
                                                    <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        팀 이름 (지부명) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id="branch_name"
                                                        name="branch_name"
                                                        type="text"
                                                        required={teamAction === 'join'}
                                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm px-3"
                                                        placeholder={`예: ${selectedTeam.name} 강남`}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label htmlFor="current_belt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            현재 벨트 <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            id="current_belt"
                                                            name="current_belt"
                                                            required={teamAction === 'join'}
                                                            className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm px-3 appearance-none bg-white"
                                                        >
                                                            <option value="">선택</option>
                                                            <option value="white">화이트</option>
                                                            <option value="blue">블루</option>
                                                            <option value="purple">퍼플</option>
                                                            <option value="brown">브라운</option>
                                                            <option value="black">블랙</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="stripe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            그랄 <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            id="stripe"
                                                            name="stripe"
                                                            required={teamAction === 'join'}
                                                            className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm px-3 appearance-none bg-white"
                                                        >
                                                            <option value="">선택</option>
                                                            <option value="0">0 (없음)</option>
                                                            <option value="1">1그랄</option>
                                                            <option value="2">2그랄</option>
                                                            <option value="3">3그랄</option>
                                                            <option value="4">4그랄</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="last_promotion_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            최근 승급일 <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            id="last_promotion_date"
                                                            name="last_promotion_date"
                                                            type="date"
                                                            required={teamAction === 'join'}
                                                            className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm px-3"
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            가입하고 도장 등록하기
                        </button>
                    </div>

                    <div className="text-sm text-center flex flex-col gap-3">
                        <div>
                            <Link href="/admin/login" className="font-medium text-blue-600 hover:text-blue-500">
                                이미 관리자 계정이 있으신가요? 로그인하기
                            </Link>
                        </div>
                        <div>
                            <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-4 transition-colors">
                                일반회원 로그인
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
