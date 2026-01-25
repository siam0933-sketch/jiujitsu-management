'use client'

import { useState, useEffect } from 'react'
import { Schedule } from '../actions_schedule'
import CreateClassModal from './CreateClassModal'
import AttendanceCheck from './AttendanceCheck'

type Member = {
    id: string
    name: string
    belt: string
    attendance_count: number
    phone?: string
    birth_date?: string
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

// Helper to get date for specific day of THIS week (assuming Mon start or just relative to today)
// User requirement seems to imply "Active Week".
// Simplest approach: Get today, find difference to target day index.


export default function ClassScheduleBoard({
    initialSchedules,
    activeMembers,
    todayKST
}: {
    initialSchedules: Schedule[],
    activeMembers: Member[],
    todayKST: string
}) {
    const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
    const [selectedDay, setSelectedDay] = useState<string>('Mon') // Default
    const [isMounted, setIsMounted] = useState(false)

    // Helper to get date for specific day relative to passed todayKST
    const getDateForDay = (dayId: string) => {
        const dayMap: { [key: string]: number } = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        const targetIndex = dayMap[dayId];

        const todayDate = new Date(todayKST)
        const todayIndex = todayDate.getDay();

        const diff = targetIndex - todayIndex;
        const targetDate = new Date(todayDate);
        targetDate.setDate(todayDate.getDate() + diff);

        // Format manually to avoid timezone shifts back to UTC
        // Since we created Date from YYYY-MM-DD string, it might be UTC 00:00.
        // setDate works on that. 
        // toISOString().split('T')[0] will return YYYY-MM-DD correctly IF it doesn't cross boundary.
        // But local Date construction from string "YYYY-MM-DD" is UTC usually.
        // Let's ensure string output is correct.
        return targetDate.toISOString().split('T')[0];
    }

    useEffect(() => {
        setIsMounted(true)
        // Use todayKST to determine initial selected Day
        const todayIndex = new Date(todayKST).getDay()
        const todayId = todayIndex === 0 ? 'Sun' : DAYS[todayIndex - 1].id
        setSelectedDay(todayId)
    }, [todayKST])

    const [isModalOpen, setIsModalOpen] = useState(false)

    // Filter schedules based on View Mode
    // Show nothing until mounted to prevent mismatch? Or show default 'Mon'?
    // Better to show 'Mon' (server content) matches client default 'Mon'.
    // Then useEffect updates it to real today.

    const displayedSchedules = initialSchedules.filter(s => {
        if (viewMode === 'weekly') return true
        return s.day_of_week === selectedDay
    })

    const handleCreateClassClick = () => {
        setViewMode('weekly') // Switch to weekly view to see context
        setIsModalOpen(true)
    }

    // Prevent hydration mismatch for date-dependent content
    if (!isMounted) {
        return <div className="p-6">Loading schedule...</div>
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header Actions */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {viewMode === 'daily'
                            ? `${DAYS.find(d => d.id === selectedDay)?.label} 수업`
                            : '주간 시간표 관리'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {viewMode === 'daily'
                            ? `${DAYS.find(d => d.id === selectedDay)?.label} 수업 내역입니다.`
                            : '전체 시간표를 확인하고 새 수업을 등록하세요.'}
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                            총 회원: {activeMembers.length}명
                        </span>
                        <span className="ml-2 text-xs bg-yellow-100 px-2 py-1 rounded-full text-yellow-600">
                            총 수업: {initialSchedules.length}개
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-4 py-2 rounded-lg font-bold transition border ${viewMode === 'daily'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        오늘 수업 보기
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`px-4 py-2 rounded-lg font-bold transition border ${viewMode === 'weekly'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        전체 수업 보기
                    </button>
                    <button
                        onClick={handleCreateClassClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                    >
                        <span>+ 클래스 만들기</span>
                    </button>
                </div>
            </div>

            {/* Daily View Tabs */}
            {viewMode === 'daily' && (
                <div className="flex-none w-full bg-white border-b border-gray-200 mb-6 space-x-1 overflow-x-auto pb-1 z-10 relative">
                    {DAYS.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDay(day.id)}
                            className={`
                                px-6 py-3 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap
                                ${selectedDay === day.id
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-visible ${viewMode === 'weekly' ? 'bg-gray-50 rounded-xl border border-gray-200 p-4' : ''}`}>

                {/* DAILY VIEW LIST */}
                {viewMode === 'daily' && (
                    <div className="space-y-4 max-w-2xl pb-[70vh]">
                        {displayedSchedules.length > 0 ? (
                            displayedSchedules.map(schedule => (
                                <AttendanceCheck
                                    key={schedule.id}
                                    schedule={schedule}
                                    allMembers={activeMembers}
                                    mode="daily"
                                    targetDate={getDateForDay(selectedDay)}
                                    todayKST={todayKST}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400 mb-2">예정된 수업이 없습니다.</p>
                                <button onClick={handleCreateClassClick} className="text-blue-600 font-bold hover:underline">
                                    + 첫 수업 만들기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* WEEKLY VIEW GRID */}
                {viewMode === 'weekly' && (
                    <div className="grid grid-cols-7 gap-3 min-w-[800px] h-full">
                        {DAYS.map(day => (
                            <div key={day.id} className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className={`text-center font-bold py-2 text-sm ${day.id === 'Sun' ? 'text-red-500 bg-red-50' : 'text-gray-700 bg-gray-50'} border-b border-gray-100`}>
                                    {day.label}
                                </div>
                                <div className="flex-1 p-2 overflow-y-auto custom-scrollbar bg-gray-50/50">
                                    {initialSchedules
                                        .filter(s => s.day_of_week === day.id)
                                        .map(schedule => (
                                            <AttendanceCheck
                                                key={schedule.id}
                                                schedule={schedule}
                                                allMembers={activeMembers}
                                                mode="weekly"
                                                targetDate={getDateForDay(day.id)}
                                                todayKST={todayKST}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && <CreateClassModal onClose={() => { setIsModalOpen(false); }} allMembers={activeMembers} />}
        </div>
    )
}
