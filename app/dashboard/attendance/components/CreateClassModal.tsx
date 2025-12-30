'use client'

import { useState } from 'react'
import { createSchedule } from '../actions_schedule'

const DAYS = [
    { id: 'Mon', label: '월' },
    { id: 'Tue', label: '화' },
    { id: 'Wed', label: '수' },
    { id: 'Thu', label: '목' },
    { id: 'Fri', label: '금' },
    { id: 'Sat', label: '토' },
    { id: 'Sun', label: '일' },
]

export default function CreateClassModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('')
    const [time, setTime] = useState('19:00')
    const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)

    const toggleDay = (day: string) => {
        const next = new Set(selectedDays)
        if (next.has(day)) next.delete(day)
        else next.add(day)
        setSelectedDays(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedDays.size === 0) return alert('요일을 선택해주세요.')

        setIsSubmitting(true)
        const res = await createSchedule({
            days: Array.from(selectedDays),
            time,
            name
        })

        if (res?.error) {
            alert(res.error)
        } else {
            onClose() // Success
        }
        setIsSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/75 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">새 수업 만들기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">수업 이름</label>
                        <input
                            type="text"
                            required
                            placeholder="예: 저녁 도복 클래스"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">수업 시간</label>
                        <input
                            type="time"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">요일 선택</label>
                        <div className="flex gap-2 justify-between">
                            {DAYS.map(day => (
                                <button
                                    type="button"
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`
                                        w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all
                                        ${selectedDays.has(day.id)
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? '생성 중...' : '만들기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
