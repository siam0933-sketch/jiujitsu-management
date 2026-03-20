'use client'

import { useState, useRef, useTransition } from 'react'
import { searchTeams, createTeam, submitJoinRequest } from '../actions'
import { Search, Users, Plus } from 'lucide-react'

export default function NoTeamView() {
    const [mode, setMode] = useState<'none' | 'create' | 'join'>('none')
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    // For join search
    const [teamQuery, setTeamQuery] = useState('')
    const [teamResults, setTeamResults] = useState<{ id: string, name: string, representative_name: string }[]>([])
    const [selectedTeam, setSelectedTeam] = useState<{ id: string, name: string } | null>(null)
    const [searching, setSearching] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleTeamSearch = (val: string) => {
        setTeamQuery(val)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        if (!val.trim()) { setTeamResults([]); return }
        setSearching(true)
        searchTimeout.current = setTimeout(async () => {
            const res = await searchTeams(val)
            setTeamResults(res)
            setSearching(false)
        }, 300)
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await createTeam(formData)
            if (result.error) setMessage({ type: 'error', text: result.error })
            else setMessage({ type: 'success', text: '팀이 생성되었습니다! 새로고침 합니다...' })
        })
    }

    const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTeam) { setMessage({ type: 'error', text: '팀을 선택해주세요.' }); return }
        setMessage(null)
        const formData = new FormData(e.currentTarget)
        formData.set('team_id', selectedTeam.id)
        startTransition(async () => {
            const result = await submitJoinRequest(formData)
            if (result.error) setMessage({ type: 'error', text: result.error })
            else setMessage({ type: 'success', text: '가입 신청이 완료되었습니다! 대표님의 승인을 기다려주세요.' })
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    마이 팀
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    현재 소속된 팀이 없습니다. 팀을 생성하거나 기존 팀에 가입하세요.
                </p>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => { setMode('create'); setMessage(null) }}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${mode === 'create' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-300'}`}
                >
                    <div className={`p-2 rounded-full ${mode === 'create' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                        <Plus className={`w-5 h-5 ${mode === 'create' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-center">
                        <div className={`font-bold text-sm ${mode === 'create' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-zinc-300'}`}>팀 생성하기</div>
                        <div className="text-xs text-gray-400 mt-0.5">새 연합을 만들고 대표가 됩니다</div>
                    </div>
                </button>
                <button
                    onClick={() => { setMode('join'); setMessage(null) }}
                    className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${mode === 'join' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-300'}`}
                >
                    <div className={`p-2 rounded-full ${mode === 'join' ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                        <Search className={`w-5 h-5 ${mode === 'join' ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-center">
                        <div className={`font-bold text-sm ${mode === 'join' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}>팀 가입하기</div>
                        <div className="text-xs text-gray-400 mt-0.5">기존 연합에 가입 신청합니다</div>
                    </div>
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Create Team Form */}
            {mode === 'create' && (
                <form onSubmit={handleCreate} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h2 className="font-bold text-gray-900 dark:text-zinc-100">새 팀 생성</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                            팀 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="team_name"
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="예: 트라이스톤 네트워크"
                        />
                    </div>
                    <p className="text-xs text-gray-400">회원가입 시 입력한 관장님 정보(이름, 도장명 등)가 자동으로 등록됩니다.</p>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? '생성 중...' : '팀 생성하기'}
                    </button>
                </form>
            )}

            {/* Join Team Form */}
            {mode === 'join' && (
                <form onSubmit={handleJoin} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h2 className="font-bold text-gray-900 dark:text-zinc-100">팀 검색 및 가입 신청</h2>

                    {!selectedTeam ? (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                팀 검색 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={teamQuery}
                                    onChange={e => handleTeamSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="팀 이름을 입력하세요"
                                />
                            </div>
                            {teamQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-100 dark:border-zinc-700 max-h-48 overflow-y-auto">
                                    {searching ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">검색 중...</div>
                                    ) : teamResults.length > 0 ? (
                                        teamResults.map(t => (
                                            <button key={t.id} type="button"
                                                onClick={() => { setSelectedTeam(t); setTeamQuery(''); setTeamResults([]) }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-sm border-b border-gray-50 dark:border-zinc-700/50 last:border-0"
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                                                <div className="text-xs text-gray-500">대표: {t.representative_name}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">결과 없음</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <div>
                                    <div className="text-xs text-emerald-600 font-bold mb-0.5">선택된 팀</div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{selectedTeam.name}</div>
                                </div>
                                <button type="button" onClick={() => setSelectedTeam(null)}
                                    className="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-sm hover:bg-gray-50">
                                    다시 선택
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                    팀 이름 (지부명) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="branch_name"
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder={`예: ${selectedTeam.name} 강남`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                        현재 벨트 <span className="text-red-500">*</span>
                                    </label>
                                    <select name="current_belt" required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white">
                                        <option value="">선택</option>
                                        <option value="white">화이트</option>
                                        <option value="blue">블루</option>
                                        <option value="purple">퍼플</option>
                                        <option value="brown">브라운</option>
                                        <option value="black">블랙</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                        최근 승급일 <span className="text-red-500">*</span>
                                    </label>
                                    <input name="last_promotion_date" type="date" required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                            </div>

                            <p className="text-xs text-gray-400">이름, 연락처, 도장명, 주소 정보는 자동으로 전송됩니다.</p>

                            <button type="submit" disabled={isPending}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                                {isPending ? '신청 중...' : '가입 신청하기'}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </div>
    )
}
