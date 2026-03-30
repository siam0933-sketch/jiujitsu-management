'use client'

import { useState, useMemo } from 'react'
import { ShuttleRoute, saveShuttleRoute, deleteShuttleRoute } from '../actions'
import ShuttleEditModal from './ShuttleEditModal'

export default function ShuttleClient({
    gymId,
    initialRoutes
}: {
    gymId: string
    initialRoutes: ShuttleRoute[]
}) {
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
    const [isEditing, setIsEditing] = useState(false)
    const [editingRoute, setEditingRoute] = useState<ShuttleRoute | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

    const handlePrevDay = () => setSelectedDay(prev => (prev === 0 ? 6 : prev - 1))
    const handleNextDay = () => setSelectedDay(prev => (prev === 6 ? 0 : prev + 1))

    // Mobile: show only selected day. PC: show all days that have routes, OR just show a 7-day grid.
    // The requirement: "모바일에선 요일이 한개만 보이고, PC에서는 운행이 있는 모든 요일을 표시해줘"
    const activeDays = useMemo(() => {
        const days = new Set<number>()
        initialRoutes.forEach(r => days.add(r.day_of_week))
        const arr = Array.from(days).sort()
        
        // Ensure at least the currently selected day is present in the list of days we map over,
        // or just let PC view show explicitly active days + current day if needed.
        // Actually, if a day has no routes, should we still show it on PC? Request says "운행이 있는 모든 요일을 표시해줘".
        return arr.length > 0 ? arr : [selectedDay]
    }, [initialRoutes, selectedDay])

    const openEditModal = (route: ShuttleRoute | null) => {
        setEditingRoute(route)
        setIsModalOpen(true)
    }

    // A helper to group routes by their "hour" (e.g. 15:xx -> 3시부)
    const groupRoutesByHour = (routes: ShuttleRoute[]) => {
        const map = new Map<number, ShuttleRoute[]>()
        routes.forEach(r => {
            const hour = parseInt(r.time.split(':')[0], 10)
            if (!map.has(hour)) map.set(hour, [])
            map.get(hour)!.push(r)
        })
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
    }

    const renderDaySchedule = (dayIndex: number) => {
        const daysRoutes = initialRoutes.filter(r => r.day_of_week === dayIndex).sort((a, b) => a.time.localeCompare(b.time))
        const grouped = groupRoutesByHour(daysRoutes)

        if (grouped.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                    <p>운행 일정이 없습니다.</p>
                </div>
            )
        }

        return (
            <div className="flex-1 overflow-y-auto w-full space-y-4">
                {grouped.map(([hour, routes]) => {
                    // Convert 24h to 12h for label
                    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
                    return (
                        <div key={hour} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shrink-0">
                            {/* Header */}
                            <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100">{displayHour}시부</h3>
                            </div>
                            
                            {/* Routes */}
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {routes.map(r => (
                                    <div 
                                        key={r.id} 
                                        className={`p-4 flex gap-4 ${isEditing ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition' : ''}`}
                                        onClick={() => isEditing && openEditModal(r)}
                                    >
                                        <div className="text-gray-900 dark:text-zinc-100 font-medium whitespace-nowrap pt-0.5">
                                            {r.time.slice(0, 5)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                                                {r.stop_name}
                                            </div>
                                            {(r.passengers && r.passengers.length > 0) && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {r.passengers.map(p => (
                                                        <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-md text-lg font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                                            {p.passenger_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <div className="text-gray-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                <div className="px-4 md:px-6 mb-4 shrink-0">
                    <button 
                        onClick={() => openEditModal(null)}
                        className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg border-dashed font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        새 정류장
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
                {/* Mobile View: Single Day */}
                <div className="h-full md:hidden flex flex-col">
                    {renderDaySchedule(selectedDay)}
                </div>

                {/* PC View: All active days (Grid) */}
                <div className="hidden md:flex h-full gap-6 overflow-x-auto pb-4 snap-x">
                    {activeDays.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-gray-500">운행 일정이 없습니다.</div>
                    ) : (
                        activeDays.map(dayIdx => (
                            <div key={dayIdx} className="w-80 shrink-0 flex flex-col bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden snap-start">
                                <div className="p-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-center sticky top-0 z-10">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{dayNames[dayIdx]}</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                                    {renderDaySchedule(dayIdx)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <ShuttleEditModal 
                    gymId={gymId}
                    initialData={editingRoute} 
                    currentDay={selectedDay}
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    )
}
