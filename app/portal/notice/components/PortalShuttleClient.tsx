'use client'

import { useState, useMemo } from 'react'
import { PortalShuttleRoute } from '../../shuttle/actions'
import { ChevronLeft, ChevronRight, Bus } from 'lucide-react'

export default function PortalShuttleClient({
    initialRoutes
}: {
    initialRoutes: PortalShuttleRoute[]
}) {
    // Current day of the week (0 = Sunday, 1 = Monday ...)
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

    const handlePrevDay = () => setSelectedDay(prev => (prev === 0 ? 6 : prev - 1))
    const handleNextDay = () => setSelectedDay(prev => (prev === 6 ? 0 : prev + 1))

    return (
        <div className="flex flex-col w-full">
            {/* Day Switcher */}
            <div className="flex items-center justify-between mb-6 bg-white dark:bg-zinc-800/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <button onClick={handlePrevDay} className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                        {dayNames[selectedDay]}
                    </h2>
                </div>
                <button onClick={handleNextDay} className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Schedule List */}
            <div className="flex-1">
                {(() => {
                    const dailyRoutes = initialRoutes.filter(r => r.days.includes(selectedDay))

                    if (dailyRoutes.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                                <Bus className="w-12 h-12 mb-3 text-gray-300 dark:text-zinc-600 opacity-50" />
                                <p className="text-sm font-medium">오늘은 운행 일정이 없습니다.</p>
                            </div>
                        )
                    }

                    return (
                        <div className="space-y-4">
                            {dailyRoutes.map(route => {
                                const stopsForDay = route.stops
                                    .filter(s => s.day_of_week === selectedDay)
                                    .sort((a, b) => a.time.localeCompare(b.time))

                                return (
                                    <div key={route.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                                        {/* Route Header */}
                                        <div className="bg-blue-50/50 dark:bg-zinc-800/80 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                                            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                                <Bus className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                                {route.name}
                                            </h3>
                                        </div>
                                        
                                        {/* Stops */}
                                        {stopsForDay.length === 0 ? (
                                            <div className="p-5 text-sm text-center text-gray-400 dark:text-zinc-500">
                                                이 요일에는 등록된 탑승 정류장이 없습니다.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50 dark:divide-zinc-800/30">
                                                {stopsForDay.map(s => (
                                                    <div key={s.id} className="p-4 px-5 flex items-start gap-4">
                                                        <div className="text-blue-600 dark:text-blue-400 font-bold tracking-tight whitespace-nowrap pt-0.5 w-14">
                                                            {s.time}
                                                        </div>
                                                        <div className="flex-1 text-gray-800 dark:text-zinc-200 font-medium">
                                                            {s.stop_name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
