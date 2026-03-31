'use client'

import { useState } from 'react'
import { saveShuttleRouteMaster, deleteShuttleRouteMaster, ShuttleRoute } from '../actions'

interface RouteEditModalProps {
    gymId: string
    initialData: ShuttleRoute | null
    onClose: () => void
}

const DAYS = [
    { name: '일', id: 0 },
    { name: '월', id: 1 },
    { name: '화', id: 2 },
    { name: '수', id: 3 },
    { name: '목', id: 4 },
    { name: '금', id: 5 },
    { name: '토', id: 6 }
]

export default function RouteEditModal({ gymId, initialData, onClose }: RouteEditModalProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.days || [1, 2, 3, 4, 5]) // Default M-F (1-5)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const toggleDay = (dayId: number) => {
        if (selectedDays.includes(dayId)) {
            setSelectedDays(selectedDays.filter(d => d !== dayId))
        } else {
            setSelectedDays([...selectedDays, dayId].sort())
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            alert('노선 이름을 입력해주세요.')
            return
        }
        if (selectedDays.length === 0) {
            alert('운행할 요일을 최소 하루 이상 선택해주세요.')
            return
        }

        setIsSaving(true)
        try {
            await saveShuttleRouteMaster(
                gymId,
                name.trim(),
                selectedDays,
                initialData ? initialData.id : undefined
            )
            onClose()
        } catch (e: any) {
            console.error(e)
            alert('저장에 실패했습니다: ' + e.message)
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!initialData) return
        if (confirm(`'${initialData.name}' 노선을 정말 삭제하시겠습니까?\n하위에 등록된 정류장과 탑승객 정보도 모두 함께 삭제됩니다!`)) {
            setIsDeleting(true)
            try {
                await deleteShuttleRouteMaster(initialData.id)
                onClose()
            } catch (e: any) {
                console.error(e)
                alert('삭제에 실패했습니다.')
                setIsDeleting(false)
            }
        }
    }

    // Sort DAYS array to show Mon-Sun in UI even if internal IDs are 0-6
    const renderDays = [...DAYS].sort((a,b) => (a.id === 0 ? 7 : a.id) - (b.id === 0 ? 7 : b.id))

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                        {initialData ? '노선 관리' : '새 노선 만들기'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">노선명</label>
                        <input
                            type="text"
                            placeholder="예: 3시부 1호차"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">운행 요일</label>
                        <div className="flex flex-wrap gap-2">
                            {renderDays.map(day => {
                                const isSelected = selectedDays.includes(day.id)
                                return (
                                    <button
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition ${
                                            isSelected 
                                                ? 'bg-blue-600 text-white shadow shadow-blue-500/30' 
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {day.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0 bg-gray-50 dark:bg-zinc-800/50">
                    {initialData && (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving || isDeleting}
                            className="px-4 py-2 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium transition disabled:opacity-50 mr-auto"
                        >
                            {isDeleting ? '삭제 중...' : '삭제'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        disabled={isSaving || isDeleting}
                        className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isDeleting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    )
}
