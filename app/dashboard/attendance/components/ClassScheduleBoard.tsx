'use client'

import { useState } from 'react'
import { Schedule } from '../actions_schedule'
import CreateClassModal from './CreateClassModal'
import AttendanceCheck from './AttendanceCheck'

type Member = {
    id: string
    name: string
    belt: string
    attendance_count: number
}

const DAYS = [
    { id: 'Mon', label: '월요일' },
    { id: 'Tue', label: '화요일' },
    { id: 'Wed', label: '수요일' },
    { id: 'Thu', label: '목요일' },
    { id: 'Fri', label: '금요일' },
    { id: 'Sat', label: '토요일' },
    { id: 'Sun', label: '일요일' },
]

export default function ClassScheduleBoard({
    initialSchedules,
    activeMembers
}: {
    initialSchedules: Schedule[],
    activeMembers: Member[]
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="h-full flex flex-col">
            {/* Header Actions */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">주간 출석부</h2>
                    <p className="text-sm text-gray-500">수업 시간을 설정하고 출석을 관리하세요.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    + 클래스 만들기
                </button>
            </div>

            {/* Weekly Grid */}
            <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-7 gap-4 min-k-full h-full">
                    {DAYS.map(day => (
                        <div key={day.id} className="flex flex-col h-full">
                            <div className="text-center font-bold text-gray-700 mb-3 pb-2 border-b-2 border-gray-200">
                                {day.label}
                            </div>
                            <div className="flex-1 bg-gray-100/50 rounded-lg p-2 overflow-y-auto custom-scrollbar">
                                {initialSchedules
                                    .filter(s => s.day_of_week === day.id)
                                    .map(schedule => (
                                        <AttendanceCheck
                                            key={schedule.id}
                                            schedule={schedule}
                                            allMembers={activeMembers}
                                        />
                                    ))
                                }
                                {initialSchedules.filter(s => s.day_of_week === day.id).length === 0 && (
                                    <div className="text-center py-10 text-xs text-gray-400">
                                        수업 없음
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && <CreateClassModal onClose={() => setIsModalOpen(false)} />}
        </div>
    )
}
