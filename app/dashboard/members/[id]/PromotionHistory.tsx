'use client'

import { useState, useEffect } from 'react'
import { PromotionLog, logPromotion, calculatePromotionStats } from './actions'

// Simple Belts Constant (Should ideally match DB or Global Config)
const BELT_OPTIONS = ['White', 'Gray-White', 'Gray', 'Gray-Black', 'Yellow-White', 'Yellow', 'Yellow-Black', 'Orange-White', 'Orange', 'Orange-Black', 'Green-White', 'Green', 'Green-Black', 'Blue', 'Purple', 'Brown', 'Black'];

type PromotionHistoryProps = {
    memberId: string
    initialLogs: PromotionLog[]
}

export default function PromotionHistory({ memberId, initialLogs }: PromotionHistoryProps) {
    const [logs, setLogs] = useState<PromotionLog[]>(initialLogs)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [belt, setBelt] = useState('White')
    const [stripe, setStripe] = useState('0')
    const [trainingDays, setTrainingDays] = useState(0)
    const [attendanceCount, setAttendanceCount] = useState(0)
    const [memo, setMemo] = useState('')

    // Effect: Recalculate stats when Date changes
    useEffect(() => {
        if (isModalOpen) {
            updateStats(date)
        }
    }, [date, isModalOpen])

    const updateStats = async (targetDate: string) => {
        const stats = await calculatePromotionStats(memberId, targetDate)
        setTrainingDays(stats.trainingDays)
        setAttendanceCount(stats.attendanceCount)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!confirm('승급 기록을 저장하시겠습니까?')) return

        setIsLoading(true)
        const res = await logPromotion(memberId, {
            belt,
            stripe: Number(stripe),
            date,
            trainingDays,
            attendanceCount,
            memo
        })

        if (res.error) {
            alert(res.error)
        } else {
            alert('저장되었습니다.')
            setIsModalOpen(false)
            // Ideally re-fetch logs or router.refresh(). 
            // Since we use revalidatePath in action, refreshing router is enough, 
            // but for instant feedback we might reload or rely on parent re-rendering if this was fully integrated.
            // For now, let's just reload to be safe or assuming parent re-renders.
            window.location.reload()
        }
        setIsLoading(false)
    }

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">승급 이력 (Promotion Logs)</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-500 shadow-sm"
                >
                    + 승급 기록 추가
                </button>
            </div>

            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-200">
                    {logs.length === 0 ? (
                        <li className="px-4 py-5 text-sm text-gray-500 text-center">기록이 없습니다.</li>
                    ) : (
                        logs.map((log) => (
                            <li key={log.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col items-center justify-center bg-gray-900 text-white w-12 h-12 rounded-full font-bold text-xs shadow-sm border-2 border-white ring-2 ring-gray-100">
                                            <span>{log.belt_name.split(' ')[0]}</span>
                                            {log.stripe_level > 0 && <span className="text-[10px] text-yellow-400">{log.stripe_level}그랄</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{log.belt_name} {log.stripe_level}그랄</p>
                                            <p className="text-xs text-gray-500">수여자: {log.awarded_by}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{new Date(log.promoted_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500">
                                            수련 {log.training_days}일 / 출석 {log.attendance_count}회
                                        </p>
                                    </div>
                                </div>
                                {log.memo && (
                                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        Memo: {log.memo}
                                    </p>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">승급 기록 추가</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">승급 날짜</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            {/* Belt & Stripe */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">벨트</label>
                                    <select
                                        value={belt}
                                        onChange={e => setBelt(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    >
                                        {BELT_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">그랄 (Stripe)</label>
                                    <select
                                        value={stripe}
                                        onChange={e => setStripe(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-gray-50 p-3 rounded-md grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">총 수련일 (휴관 제외)</p>
                                    <p className="text-lg font-bold text-indigo-600">{trainingDays}일</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">총 누적 출석</p>
                                    <p className="text-lg font-bold text-indigo-600">{attendanceCount}회</p>
                                </div>
                            </div>

                            {/* Memo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">메모</label>
                                <textarea
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    placeholder="특이사항 입력..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-500 shadow-sm"
                                >
                                    {isLoading ? '저장 중...' : '기록 저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
