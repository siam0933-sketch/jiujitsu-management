'use client'

import { useState, useTransition } from 'react'
import { addManualPoint, deductPoint } from './point-actions'
import { Plus, Minus, Star } from 'lucide-react'

type PointLog = {
    id: string
    name: string
    points: number
    created_at: string
}

type ManualSetting = {
    id: string
    name: string
    points: number
    icon?: string | null
}

type Props = {
    memberId: string
    initialLogs: PointLog[]
    manualSettings: ManualSetting[]
}

export default function PointsPanel({ memberId, initialLogs, manualSettings }: Props) {
    const [logs, setLogs] = useState(initialLogs)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDeductModal, setShowDeductModal] = useState(false)
    const [deductAmount, setDeductAmount] = useState('')
    const [deductReason, setDeductReason] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    const totalPoints = logs.reduce((sum, l) => sum + l.points, 0)

    const handleAdd = (settingId: string, settingName: string, settingPoints: number) => {
        setShowAddModal(false)
        setError('')
        const optimistic: PointLog = {
            id: `temp-${Date.now()}`,
            name: settingName,
            points: settingPoints,
            created_at: new Date().toISOString(),
        }
        setLogs(prev => [optimistic, ...prev])
        startTransition(async () => {
            const res = await addManualPoint(memberId, settingId)
            if (res?.error) {
                setLogs(prev => prev.filter(l => l.id !== optimistic.id))
                setError(res.error)
            }
        })
    }

    const handleDeduct = () => {
        const amt = parseInt(deductAmount)
        if (!amt || amt <= 0) { setError('차감 점수를 올바르게 입력해주세요.'); return }
        setShowDeductModal(false)
        setError('')
        const label = deductReason.trim() || '관장 차감'
        const optimistic: PointLog = {
            id: `temp-${Date.now()}`,
            name: label,
            points: -amt,
            created_at: new Date().toISOString(),
        }
        setLogs(prev => [optimistic, ...prev])
        startTransition(async () => {
            const res = await deductPoint(memberId, amt, label)
            if (res?.error) {
                setLogs(prev => prev.filter(l => l.id !== optimistic.id))
                setError(res.error)
            }
        })
        setDeductAmount('')
        setDeductReason('')
    }

    return (
        <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        <Star size={16} className="text-yellow-400" /> 포인트
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">누적 포인트: <span className="font-bold text-indigo-600">{totalPoints.toLocaleString()}점</span></p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowAddModal(true); setError('') }}
                        disabled={manualSettings.length === 0}
                        title={manualSettings.length === 0 ? '설정 > 포인트에서 수동 항목을 먼저 추가하세요' : '포인트 추가'}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <Plus size={14} /> 포인트 추가
                    </button>
                    <button
                        onClick={() => { setShowDeductModal(true); setError('') }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <Minus size={14} /> 포인트 차감
                    </button>
                </div>
            </div>

            {error && <p className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20">{error}</p>}

            {/* Log list */}
            <div>
                {logs.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-center text-gray-400 dark:text-zinc-500">포인트 내역이 없습니다.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {logs.map(log => (
                            <li key={log.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-1">
                                        {manualSettings.find(s => s.name === log.name)?.icon && (
                                            <span>{manualSettings.find(s => s.name === log.name)?.icon}</span>
                                        )}
                                        {log.name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                                        {new Date(log.created_at).toLocaleDateString('ko-KR')}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold ${log.points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                    {log.points >= 0 ? `+${log.points}` : log.points}점
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">포인트 항목 선택</h3>
                        <ul className="space-y-2">
                            {manualSettings.map(s => (
                                <li key={s.id}>
                                    <button
                                        onClick={() => handleAdd(s.id, s.name, s.points)}
                                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-1">
                                            {s.icon && <span>{s.icon}</span>}
                                            {s.name}
                                        </span>
                                        <span className="ml-2 text-indigo-600 font-bold">+{s.points}점</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowAddModal(false)} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
                    </div>
                </div>
            )}

            {/* Deduct Modal */}
            {showDeductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeductModal(false)} />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">포인트 차감</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">사유 (선택)</label>
                                <input
                                    type="text"
                                    value={deductReason}
                                    onChange={e => setDeductReason(e.target.value)}
                                    placeholder="예: 상품 교환"
                                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">차감 점수</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={deductAmount}
                                    onChange={e => setDeductAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowDeductModal(false)} className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50">취소</button>
                            <button
                                onClick={handleDeduct}
                                disabled={isPending}
                                className="flex-1 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                차감하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
