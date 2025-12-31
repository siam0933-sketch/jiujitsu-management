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

// Define minimal member type needed here if not imported
type Member = {
    id: string
    name: string
    belt: string
    attendance_count: number
    phone?: string
    birth_date?: string
}

export default function CreateClassModal({ onClose, allMembers }: { onClose: () => void, allMembers: Member[] }) {
    const [name, setName] = useState('')
    const [time, setTime] = useState('19:00')
    const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter members for search
    const filteredMembers = allMembers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleDay = (day: string) => {
        const next = new Set(selectedDays)
        if (next.has(day)) next.delete(day)
        else next.add(day)
        setSelectedDays(next)
    }

    const toggleMember = (id: string) => {
        const next = new Set(selectedMemberIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedMemberIds(next)
    }

    const toggleAll = () => {
        if (selectedMemberIds.size === allMembers.length) {
            setSelectedMemberIds(new Set())
        } else {
            setSelectedMemberIds(new Set(allMembers.map(m => m.id)))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedDays.size === 0) return alert('요일을 선택해주세요.')

        setIsSubmitting(true)
        const res = await createSchedule({
            days: Array.from(selectedDays),
            time,
            name,
            initialEnrollments: Array.from(selectedMemberIds)
        })

        if (res?.error) {
            alert(res.error)
        } else {
            alert(`수업이 생성되고, ${selectedMemberIds.size}명의 회원이 등록되었습니다.`)
            onClose() // Success
        }
        setIsSubmitting(false)
    }

    // Sort members by name
    // Assuming allMembers are already sorted by caller, but good to be safe if searching
    // Let's just use filteredMembers map

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/75 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">새 수업 만들기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {/* Section 1: Class Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">요일 선택</label>
                            <div className="flex gap-2 flex-wrap">
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

                        {/* Section 2: Enroll Members */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-800">초기 등록 회원 선택 ({selectedMemberIds.size}명)</label>
                                <div className="space-x-2">
                                    <button type="button" onClick={toggleAll} className="text-xs text-blue-600 font-medium hover:underline">
                                        전체 선택/해제
                                    </button>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="이름 검색..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:border-blue-500 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div className="border border-gray-200 rounded-lg h-48 overflow-y-auto p-2 bg-gray-50/50">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {filteredMembers.map(member => (
                                        <label
                                            key={member.id}
                                            className={`
                                                flex items-center gap-2 p-2 rounded border text-sm cursor-pointer select-none transition-colors
                                                ${selectedMemberIds.has(member.id)
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-white border-gray-100 hover:border-gray-300'}
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                                checked={selectedMemberIds.has(member.id)}
                                                onChange={() => toggleMember(member.id)}
                                            />
                                            <span className="font-medium truncate">{member.name}</span>
                                            <span className="text-xs text-gray-400 shrink-0">{member.belt}</span>
                                        </label>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <div className="col-span-full text-center text-gray-400 py-4 text-xs">
                                            검색 결과가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
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
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 shadow-sm"
                        >
                            {isSubmitting ? '생성 중...' : `수업 만들기 (${selectedDays.size}개 요일)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
