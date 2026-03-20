'use client'

import { useState, useEffect } from 'react'
import { Schedule } from '../actions_schedule'
import CreateClassModal from './CreateClassModal'
import AttendanceCheck from './AttendanceCheck'
import PendingApprovalList from './PendingApprovalList'

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

    const activeDays = DAYS.filter(day => initialSchedules.some(s => s.day_of_week === day.id))

    useEffect(() => {
        setIsMounted(true)
        const todayIndex = new Date(todayKST).getDay()
        const todayId = todayIndex === 0 ? 'Sun' : DAYS[todayIndex - 1].id
        
        if (activeDays.some(d => d.id === todayId)) {
            setSelectedDay(todayId)
        } else if (activeDays.length > 0) {
            setSelectedDay(activeDays[0].id)
        } else {
            setSelectedDay(todayId)
        }
    }, [todayKST, initialSchedules])

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
            <div className="mb-6 flex justify-end items-center">
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`text-sm font-medium transition-colors ${viewMode === 'daily'
                            ? 'text-gray-900 dark:text-zinc-100 font-bold'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100'
                            }`}
                    >
                        오늘 수업 보기
                    </button>
                    <span className="text-gray-300 dark:text-zinc-600">|</span>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`text-sm font-medium transition-colors ${viewMode === 'weekly'
                            ? 'text-gray-900 dark:text-zinc-100 font-bold'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100'
                            }`}
                    >
                        전체 수업 보기
                    </button>
                    <span className="text-gray-300 dark:text-zinc-600">|</span>
                    <button
                        onClick={handleCreateClassClick}
                        className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 transition-colors"
                    >
                        + 클래스 만들기
                    </button>
                </div>
            </div>

            {/* Daily View: Unified Box */}
            {viewMode === 'daily' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)]">
                    {/* Tabs Header */}
                    {activeDays.length > 0 && (
                        <div className="flex-none flex w-full bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
                            {activeDays.map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDay(day.id)}
                                    className={`
                                        flex-1 px-2 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap border-r border-gray-100 dark:border-zinc-800/50 last:border-0
                                        ${selectedDay === day.id
                                            ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-[inset_0_2px_0_0_rgba(37,99,235,1)]'
                                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800'}
                                    `}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar bg-gray-50/30 dark:bg-zinc-800/30">
                        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
                            {/* Always show pending list here */}
                            <PendingApprovalList todayKST={todayKST} />

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
                                <div className="text-center py-20">
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-10 inline-block">
                                        <p className="text-gray-400 dark:text-zinc-500 mb-2">예정된 수업이 없습니다.</p>
                                        <button onClick={handleCreateClassClick} className="text-blue-600 font-bold hover:underline">
                                            + 첫 수업 만들기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly View GRID */}
            {viewMode === 'weekly' && (
                <div className="flex-1 overflow-x-auto bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 custom-scrollbar">
                    {activeDays.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-10 inline-block">
                                <p className="text-gray-400 dark:text-zinc-500 mb-2">예정된 수업이 없습니다.</p>
                                <button onClick={handleCreateClassClick} className="text-blue-600 font-bold hover:underline">
                                    + 첫 수업 만들기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="grid gap-3 h-full" 
                            style={{ 
                                gridTemplateColumns: `repeat(${activeDays.length}, minmax(150px, 1fr))`,
                                minWidth: `${Math.max(activeDays.length * 150, 400)}px` 
                            }}
                        >
                            {activeDays.map(day => (
                                <div key={day.id} className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <div className={`text-center font-bold py-2 text-sm whitespace-nowrap ${day.id === 'Sun' ? 'text-red-500 bg-red-50' : 'text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/50'} border-b border-gray-100 dark:border-zinc-800/50`}>
                                        {day.label}
                                    </div>
                                    <div className="flex-1 p-2 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-zinc-800/50">
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
            )}

            {isModalOpen && <CreateClassModal onClose={() => { setIsModalOpen(false); }} allMembers={activeMembers} />}
        </div>
    )
}
