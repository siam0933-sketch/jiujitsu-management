'use client'

import { useState, useEffect } from 'react'
import { PromotionLog, logPromotion, updatePromotionLog, deletePromotionLog, calculatePromotionStats } from './actions'
import { getPromotionCriteria } from '../../settings/promotion/actions'

import { BELT_OPTIONS_DATA, displayBeltName } from '../constants'

// Custom Select Component for Belts
const BeltSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectedOption = BELT_OPTIONS_DATA.find(b => b.name === value) || BELT_OPTIONS_DATA[0]

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full cursor-default rounded-md bg-white dark:bg-zinc-900 py-2 pl-3 pr-10 text-left text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 h-[38px]"
            >
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-block w-4 h-4 rounded-full border ${selectedOption.colorClass?.includes('border') ? '' : 'border-gray-200 dark:border-zinc-800'} ${selectedOption.colorClass}`}
                        style={selectedOption.style}
                    />
                    <span className="block truncate">{selectedOption.name}</span>
                </div>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400 dark:text-zinc-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-zinc-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {BELT_OPTIONS_DATA.map((belt) => (
                            <li
                                key={belt.name}
                                className={`relative cursor-default select-none py-2 pl-3 pr-9 ${belt.name === value ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-zinc-100 hover:bg-indigo-50'}`}
                                onClick={() => {
                                    onChange(belt.name)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-block w-4 h-4 rounded-full border ${belt.colorClass?.includes('border') ? '' : 'border-gray-200 dark:border-zinc-800'} ${belt.colorClass}`}
                                        style={belt.style}
                                    />
                                    <span className={`block truncate ${belt.name === value ? 'font-semibold' : 'font-normal'}`}>
                                        {belt.name}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}



type PromotionHistoryProps = {
    memberId: string
    memberName: string // New Prop
    memberBelt: string // New Prop
    initialLogs: PromotionLog[]
    joinedAt: string
    startDate?: string | null
}

export default function PromotionHistory({ memberId, memberName, memberBelt, initialLogs, joinedAt, startDate }: PromotionHistoryProps) {
    const [logs, setLogs] = useState<PromotionLog[]>(initialLogs)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [criteria, setCriteria] = useState<{ adultConfig: any[], kidsConfig: any[] } | null>(null)

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingLogId, setEditingLogId] = useState<string | null>(null)

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [belt, setBelt] = useState('화이트 (성인)') // Default to new name
    const [stripe, setStripe] = useState('0')
    const [trainingDays, setTrainingDays] = useState(0)
    const [attendanceCount, setAttendanceCount] = useState(0)
    const [memo, setMemo] = useState('')

    useEffect(() => {
        setLogs(initialLogs)
    }, [initialLogs])

    // Fetch Criteria on Mount
    useEffect(() => {
        const fetchCriteria = async () => {
            const res = await getPromotionCriteria()
            if (!('error' in res)) {
                setCriteria(res)
                console.log('Promotion Config Loaded:', res)
            }
        }
        fetchCriteria()
    }, [])

    // ... (rest of effects)

    // Effect: Recalculate stats when Date changes (Only in Create Mode)
    useEffect(() => {
        if (isModalOpen && !editingLogId) {
            updateStats(date)
        }
    }, [date, isModalOpen, editingLogId])

    // Detect if we should default to Kids belt based on member's current belt?
    // Not critical, but user might want default selection to be smart.
    // For now, let's just make sure "belt" state starts with something valid.

    // Open Modal for Create
    const openCreateModal = () => {
        setEditingLogId(null)
        setDate(new Date().toISOString().split('T')[0])
        // Default belt: Try to use member's current belt if possible, or fallback
        const currentDisplayName = displayBeltName(memberBelt) || '화이트 (성인)'
        setBelt(currentDisplayName)
        setStripe('0')
        setMemo('')
        // Stats will be auto-calculated by Effect
        setIsModalOpen(true)
    }

    // Open Modal for Edit
    const openEditModal = (log: PromotionLog) => {
        setEditingLogId(log.id)
        setDate(log.promoted_at)
        setBelt(displayBeltName(log.belt_name))
        setStripe(String(log.stripe_level))
        setTrainingDays(log.training_days)
        setAttendanceCount(log.attendance_count)
        setMemo(log.memo || '')
        setIsModalOpen(true)
    }

    const updateStats = async (targetDate: string) => {
        const stats = await calculatePromotionStats(memberId, targetDate)
        setTrainingDays(stats.trainingDays)
        setAttendanceCount(stats.attendanceCount)
    }

    // Helper to get max stripes for selected belt
    const getMaxStripes = (beltName: string) => {
        if (!criteria) {
            console.log('DEBUG: criteria is null')
            return 4
        }

        // Search in Adult
        const adultBelt = criteria.adultConfig.find(b => b.name === beltName)
        if (adultBelt) {
            // Adults usually 4 stripes max
            return 4
        }

        // Search in Kids
        const kidsBelt = criteria.kidsConfig.find(b => b.name === beltName)
        if (kidsBelt) {
            console.log(`DEBUG: Found Kids Belt [${beltName}] with totalStripes: ${kidsBelt.totalStripes}`)
            return kidsBelt.totalStripes || 4
        }

        console.log(`DEBUG: Belt [${beltName}] not found in criteria. Available keys:`, criteria.kidsConfig.map(k => k.name))
        return 4
    }

    const currentMaxStripes = getMaxStripes(belt)

    // Execute Delete Directly (No Confirm)
    const handleDelete = async (logId: string) => {
        setIsLoading(true)
        const res = await deletePromotionLog(logId, memberId)

        if (res.error) {
            alert(res.error)
        } else {
            // alert('삭제되었습니다.') // Optional feedback
            if (res.logs) setLogs(res.logs)
        }
        setIsLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const actionName = editingLogId ? '수정' : '저장'
        if (!confirm(`승급 기록을 ${actionName}하시겠습니까?`)) return

        setIsLoading(true)

        let res;
        const payload = {
            belt,
            stripe: Number(stripe),
            date,
            trainingDays,
            attendanceCount,
            memo
        }

        if (editingLogId) {
            res = await updatePromotionLog(editingLogId, memberId, payload)
        } else {
            res = await logPromotion(memberId, payload)
        }

        if (res.error) {
            alert(res.error)
        } else {
            alert(`${actionName}되었습니다.`)
            setIsModalOpen(false)
            if (res.logs) {
                setLogs(res.logs)
            }
        }
        setIsLoading(false)
    }

    // Helper for Belt Color of Current Belt Header
    const currentBeltMeta = BELT_OPTIONS_DATA.find(b => b.name === displayBeltName(memberBelt)) || { name: memberBelt, colorClass: 'bg-gray-100 dark:bg-zinc-800', style: undefined }


    return (
        <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-3 sm:px-6 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-100">승급 이력</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-md border ${isEditMode ? 'bg-gray-200 text-gray-800 dark:text-zinc-200 border-gray-300 dark:border-zinc-700' : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50'}`}
                    >
                        {isEditMode ? '완료' : '편집'}
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-500 shadow-sm"
                    >
                        승급
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {logs.length === 0 ? (
                        <li className="px-4 py-5 text-sm text-gray-500 dark:text-zinc-400 text-center">기록이 없습니다.</li>
                    ) : (
                        logs.map((log) => {
                            const displayName = displayBeltName(log.belt_name)
                            // Find color for display in list
                            const beltMeta = BELT_OPTIONS_DATA.find(b => b.name === displayName) || { name: displayName, colorClass: 'bg-gray-100 dark:bg-zinc-800', style: undefined }

                            return (
                                <li key={log.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 items-center flex-1">
                                            {/* Belt Icon in History List - Using color from config (Simple Style) */}
                                            <div
                                                className={`w-8 h-8 rounded shadow-sm flex-shrink-0 ${beltMeta.colorClass}`}
                                                style={beltMeta.style}
                                            ></div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1">
                                                    {displayName} {log.stripe_level}그랄
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-400">수여자: {log.awarded_by}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{new Date(log.promoted_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                    수련 {log.training_days}일 / 출석 {log.attendance_count}회
                                                </p>
                                            </div>

                                            {/* Edit/Delete Actions */}
                                            {isEditMode && (
                                                <div className="flex items-center gap-1 ml-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            openEditModal(log)
                                                        }}
                                                        className="p-1 text-gray-400 dark:text-zinc-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                                                        title="수정"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleDelete(log.id)
                                                        }}
                                                        className="p-1 text-gray-400 dark:text-zinc-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                                        title="삭제"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {log.memo && (
                                        <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded">
                                            Memo: {log.memo}
                                        </p>
                                    )}
                                </li>
                            )
                        })
                    )}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="relative z-50">
                    <div className="fixed inset-0 bg-gray-50 dark:bg-zinc-800/500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <form
                                onSubmit={handleSubmit}
                                className="relative transform overflow-hidden rounded-lg bg-white dark:bg-zinc-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-zinc-100">
                                            {memberName}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">
                                            현재: {displayBeltName(memberBelt)}
                                        </p>

                                        <div className="mt-4 border-t border-gray-100 dark:border-zinc-800/50 pt-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-zinc-400">
                                                <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 rounded">
                                                    <span className="block text-xs text-gray-400 dark:text-zinc-500">등록일</span>
                                                    <span className="font-semibold">{joinedAt ? new Date(joinedAt).toLocaleDateString() : '-'}</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 rounded">
                                                    <span className="block text-xs text-gray-400 dark:text-zinc-500">입학일</span>
                                                    <span className="font-semibold">{startDate ? new Date(startDate).toLocaleDateString() : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        {/* Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">승급일</label>
                                            <input
                                                type="date"
                                                required
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        {/* Belt Select */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">벨트 (Belt)</label>
                                            <BeltSelect
                                                value={belt}
                                                onChange={setBelt}
                                            />
                                        </div>

                                        {/* Stripe Select */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">그랄 (Stripe)</label>
                                            <select
                                                value={stripe}
                                                onChange={(e) => setStripe(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            >
                                                {Array.from({ length: currentMaxStripes + 1 }).map((_, i) => (
                                                    <option key={i} value={i}>{i} 그랄</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Stats (Auto-calc / Manual overwrite) */}
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-md">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400">누적 수련일 (자동계산)</label>
                                                <input
                                                    type="number"
                                                    value={trainingDays}
                                                    onChange={(e) => setTrainingDays(Number(e.target.value))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400">누적 출석수 (자동계산)</label>
                                                <input
                                                    type="number"
                                                    value={attendanceCount}
                                                    onChange={(e) => setAttendanceCount(Number(e.target.value))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 text-sm"
                                                />
                                            </div>
                                            <p className="col-span-2 text-[10px] text-gray-400 dark:text-zinc-500 text-center">
                                                * 승급일 기준, 이전 승급/가입일로부터 계산된 수치입니다.
                                            </p>
                                        </div>

                                        {/* Memo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">메모</label>
                                            <textarea
                                                rows={3}
                                                value={memo}
                                                onChange={(e) => setMemo(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="특이사항이나 승급 심사 내용 등"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                                    >
                                        {isLoading ? '처리 중...' : '저장'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 sm:col-start-1 sm:mt-0"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
