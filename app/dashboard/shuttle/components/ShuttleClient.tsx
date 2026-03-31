'use client'

import { useState, useMemo } from 'react'
import { ShuttleRoute, ShuttleStop } from '../actions'
import ShuttleEditModal from './ShuttleEditModal'
import RouteEditModal from './RouteEditModal'

export default function ShuttleClient({
    gymId,
    initialRoutes
}: {
    gymId: string
    initialRoutes: ShuttleRoute[]
}) {
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
    const [isEditing, setIsEditing] = useState(false)
    
    // Stop Modal State
    const [isStopModalOpen, setIsStopModalOpen] = useState(false)
    const [editingStop, setEditingStop] = useState<ShuttleStop | null>(null)

    // Route Modal State
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false)
    const [editingRoute, setEditingRoute] = useState<ShuttleRoute | null>(null)

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

    const handlePrevDay = () => setSelectedDay(prev => (prev === 0 ? 6 : prev - 1))
    const handleNextDay = () => setSelectedDay(prev => (prev === 6 ? 0 : prev + 1))

    // Mobile: show only selected day. PC: show all days that have ANY routes active.
    const activeDays = useMemo(() => {
        const days = new Set<number>()
        initialRoutes.forEach(r => r.days.forEach(d => days.add(d)))
        const arr = Array.from(days).sort()
        return arr.length > 0 ? arr : [selectedDay]
    }, [initialRoutes, selectedDay])

    const openStopEdit = (stop: ShuttleStop | null) => {
        setEditingStop(stop)
        setIsStopModalOpen(true)
    }

    const openRouteEdit = (route: ShuttleRoute | null) => {
        setEditingRoute(route)
        setIsRouteModalOpen(true)
    }

    const renderDaySchedule = (dayIndex: number) => {
        // 날짜에 해당하는 노선만 필터링 (해당 노선이 이 요일에 운행하는지)
        const dailyRoutes = initialRoutes.filter(r => r.days.includes(dayIndex))

        if (dailyRoutes.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                    <p>운행 일정이 없습니다.</p>
                </div>
            )
        }

        return (
            <div className="flex-1 overflow-y-auto w-full space-y-4">
                {dailyRoutes.map(route => {
                    // 이 노선에 속한 '현재 요일'의 정류장 목록
                    const stopsForDay = route.stops
                        .filter(s => s.day_of_week === dayIndex)
                        .sort((a, b) => a.time.localeCompare(b.time))

                    return (
                        <div key={route.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shrink-0">
                            {/* Route Header */}
                            <div 
                                className={`bg-gray-50 dark:bg-zinc-800 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center ${isEditing ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition' : ''}`}
                                onClick={() => isEditing && openRouteEdit(route)}
                            >
                                <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                    </svg>
                                    {route.name}
                                </h3>
                                {isEditing && (
                                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">
                                        노선 편집
                                    </span>
                                )}
                            </div>
                            
                            {/* Stops Under this Route */}
                            {stopsForDay.length === 0 ? (
                                <div className="p-4 text-sm text-gray-400 dark:text-zinc-500 text-center bg-gray-50/50 dark:bg-zinc-900/50">
                                    등록된 정류장이 없습니다.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                    {stopsForDay.map(s => (
                                        <div 
                                            key={s.id} 
                                            className={`p-4 flex gap-4 ${isEditing ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition' : ''}`}
                                            onClick={() => isEditing && openStopEdit(s)}
                                        >
                                            <div className="text-gray-900 dark:text-zinc-100 font-medium whitespace-nowrap pt-0.5 mt-1">
                                                {s.time}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-zinc-100 truncate mt-1">
                                                    {s.stop_name}
                                                </div>
                                                {(s.passengers && s.passengers.length > 0) && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {s.passengers.map(p => (
                                                            <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-md text-lg font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                                                {p.passenger_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing && (
                                                <div className="text-gray-400 flex items-center justify-center">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col pt-4 sm:pt-6">
            <div className="flex justify-between items-center px-4 md:px-6 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 hidden md:block">차량운행</h1>
                
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4">
                    {/* Mobile Day Navigation */}
                    <div className="flex items-center justify-center md:hidden gap-4 flex-1">
                        <button onClick={handlePrevDay} className="p-2 text-gray-600 dark:text-zinc-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 w-24 text-center">{dayNames[selectedDay]}</h2>
                        <button onClick={handleNextDay} className="p-2 text-gray-600 dark:text-zinc-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                    >
                        {isEditing ? '완료' : '편집'}
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="flex gap-3 px-4 md:px-6 mb-4 shrink-0">
                    <button 
                        onClick={() => openRouteEdit(null)}
                        className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg border-dashed font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        새 노선 추가
                    </button>
                    <button 
                        onClick={() => openStopEdit(null)}
                        className="flex-1 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg border-dashed font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        새 정류장 추가
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pb-6">
                {/* Mobile View: Single Day */}
                <div className="h-full md:hidden flex flex-col">
                    {renderDaySchedule(selectedDay)}
                </div>

                {/* PC View: All active days (Grid) */}
                <div className="hidden md:flex overflow-x-auto pb-4">
                    {activeDays.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-gray-500 py-10">등록된 노선 및 일정이 없습니다. 편집을 눌러 새 노선을 추가하세요.</div>
                    ) : (
                        <div className="flex w-max border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-800/30 overflow-hidden shadow-sm">
                            {activeDays.map((dayIdx, idx) => (
                                <div 
                                    key={dayIdx} 
                                    className={`w-80 shrink-0 flex flex-col ${
                                        idx !== activeDays.length - 1 ? 'border-r border-gray-200 dark:border-zinc-800' : ''
                                    }`}
                                >
                                    <div className="p-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-center sticky top-0 z-10">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{dayNames[dayIdx]}</h2>
                                    </div>
                                    <div className="p-4 flex flex-col h-full">
                                        {renderDaySchedule(dayIdx)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isStopModalOpen && (
                <ShuttleEditModal 
                    availableRoutes={initialRoutes}
                    initialData={editingStop} 
                    currentDay={selectedDay}
                    onClose={() => setIsStopModalOpen(false)} 
                />
            )}

            {isRouteModalOpen && (
                <RouteEditModal
                    gymId={gymId}
                    initialData={editingRoute}
                    onClose={() => setIsRouteModalOpen(false)}
                />
            )}
        </div>
    )
}
