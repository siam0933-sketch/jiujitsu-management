'use client'

import { useState } from 'react'
import { updateMemberStartDate, updateMemberJoinedDate, pauseMember, resumeMember } from '../actions'
import { useRouter } from 'next/navigation'

// --- 1. Status Badge ---
export function MemberStatusBadge({ isPaused }: { isPaused: boolean }) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isPaused
            ? 'bg-gray-50 text-gray-600 ring-gray-500/10'
            : 'bg-green-50 text-green-700 ring-green-600/20'
            }`}>
            {isPaused ? '휴관 중 (Paused)' : '수련 중 (Active)'}
        </span>
    )
}

export function MemberStatusBadgeSimple({ isPaused }: { isPaused: boolean }) {
    return (
        <span className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${isPaused
            ? 'bg-gray-100 text-gray-500 border-gray-200'
            : 'bg-white text-gray-600 border-gray-300'
            }`}>
            {isPaused ? '휴관' : '활동'}
        </span>
    )
}

// --- 2. Generic Date Editor Component ---
type MemberDateEditorProps = {
    memberId: string
    label: string
    dateValue: string | null
    onSave: (id: string, date: string) => Promise<{ error?: string, success?: boolean }>
}

function MemberDateEditor({ memberId, label, dateValue, onSave }: MemberDateEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [currentDate, setCurrentDate] = useState(dateValue ? dateValue.split('T')[0] : '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await onSave(memberId, currentDate)
        if ('error' in res && res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
        }
        setIsLoading(false)
    }

    return (
        <div>
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <div className="flex items-center gap-2 h-5">
                {isEditing ? (
                    <>
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="p-0 text-sm border-gray-300 rounded focus:ring-0 border-b w-32"
                        />
                        <button onClick={handleSave} disabled={isLoading} className="text-xs text-blue-600 hover:text-blue-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <p className="font-medium text-gray-900 text-sm">
                            {currentDate ? new Date(currentDate).toLocaleDateString() : '-'}
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title={`${label} 수정`}
                        >
                            {/* Calendar Icon */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export function MemberStartDate({ memberId, startDate, joinedAt }: { memberId: string, startDate: string | null, joinedAt: string }) {
    return <MemberDateEditor memberId={memberId} label="입문일" dateValue={startDate || joinedAt} onSave={updateMemberStartDate} />
}

export function MemberJoinedDate({ memberId, joinedAt }: { memberId: string, joinedAt: string }) {
    return <MemberDateEditor memberId={memberId} label="등록일" dateValue={joinedAt} onSave={updateMemberJoinedDate} />
}

// --- 3. Pause Controller (Badge + Button + Modal) ---

type MemberPauseControllerProps = {
    memberId: string
    isPaused: boolean
    paymentEndDate: string | null
}

export function MemberPauseController({ memberId, isPaused, paymentEndDate }: MemberPauseControllerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
    const [pauseStartDate, setPauseStartDate] = useState(new Date().toISOString().split('T')[0])
    const [pauseEndDate, setPauseEndDate] = useState('')
    const [isIndefinitePause, setIsIndefinitePause] = useState(true)
    const router = useRouter()

    const handleResume = async () => {
        if (!confirm('복귀 처리하시겠습니까?')) return
        setIsLoading(true)
        const res = await resumeMember(memberId)
        if ('error' in res && res.error) {
            alert(res.error)
        } else {
            alert('복귀 처리되었습니다.')
            router.refresh()
        }
        setIsLoading(false)
    }

    const handlePauseSubmit = async () => {
        if (!confirm('휴관 처리하시겠습니까?')) return
        setIsLoading(true)
        const res = await pauseMember(memberId, pauseStartDate, isIndefinitePause ? undefined : pauseEndDate)
        setIsLoading(false)
        if ('error' in res && res.error) {
            alert(res.error)
        } else {
            alert('휴관 처리되었습니다.')
            setIsPauseModalOpen(false)
            router.refresh()
        }
    }

    const calculateNewExpiry = () => {
        if (!paymentEndDate || isIndefinitePause || !pauseEndDate) return null
        const start = new Date(pauseStartDate)
        const end = new Date(pauseEndDate)
        const durationMs = end.getTime() - start.getTime()
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1
        if (days <= 0) return null

        const currentExpiry = new Date(paymentEndDate)
        const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
        return newExpiry.toLocaleDateString()
    }

    return (
        <div className="flex items-center gap-2">
            <MemberStatusBadge isPaused={isPaused} />

            {isPaused ? (
                <button
                    onClick={handleResume}
                    disabled={isLoading}
                    className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500 whitespace-nowrap"
                >
                    ▶ 복귀 (Resume)
                </button>
            ) : (
                <button
                    onClick={() => setIsPauseModalOpen(true)}
                    disabled={isLoading}
                    className="ml-auto text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-400 whitespace-nowrap"
                >
                    ⏸ 휴관 (Pause)
                </button>
            )}

            {/* Modal Overlay */}
            {isPauseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setIsPauseModalOpen(false); }}>
                    <div className="bg-white rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-gray-900 mb-4">휴관 설정 (Pause)</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">시작일</label>
                                <input
                                    type="date"
                                    value={pauseStartDate}
                                    onChange={e => setPauseStartDate(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs text-gray-500">종료일</label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 w-3 h-3"
                                            checked={isIndefinitePause}
                                            onChange={e => setIsIndefinitePause(e.target.checked)}
                                        />
                                        <span className="text-xs text-gray-500">무기한</span>
                                    </label>
                                </div>
                                <input
                                    type="date"
                                    value={pauseEndDate}
                                    onChange={e => {
                                        setPauseEndDate(e.target.value)
                                        setIsIndefinitePause(false)
                                    }}
                                    disabled={isIndefinitePause}
                                    className="w-full text-sm border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>

                            {!isIndefinitePause && pauseEndDate && paymentEndDate && (
                                <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                                    <p>예상 만료일 연장:</p>
                                    <p className="font-bold">기존 만료일: {new Date(paymentEndDate).toLocaleDateString()}</p>
                                    <p className="font-bold text-blue-600">변경 만료일: {calculateNewExpiry()}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setIsPauseModalOpen(false)}
                                    className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handlePauseSubmit}
                                    disabled={isLoading}
                                    className="flex-1 py-2 text-sm text-white bg-orange-600 rounded hover:bg-orange-500 disabled:opacity-50"
                                >
                                    휴관 적용
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
