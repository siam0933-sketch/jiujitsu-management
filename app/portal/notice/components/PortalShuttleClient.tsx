'use client'

import { useState, useMemo } from 'react'
import { PortalShuttleRoute } from '../../shuttle/actions'
import { ChevronLeft, ChevronRight, Bus, Search } from 'lucide-react'

export default function PortalShuttleClient({
    initialRoutes
}: {
    initialRoutes: PortalShuttleRoute[]
}) {
    // Current day of the week (0 = Sunday, 1 = Monday ...)
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
    const [searchQuery, setSearchQuery] = useState('')

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

    const handlePrevDay = () => setSelectedDay(prev => (prev === 0 ? 6 : prev - 1))
    const handleNextDay = () => setSelectedDay(prev => (prev === 6 ? 0 : prev + 1))

    // Determine if we are in search mode
    const isSearching = searchQuery.trim().length > 0

    // Compute search results across all days and routes
    const searchResults = useMemo(() => {
        if (!isSearching) return []
        
        const q = searchQuery.trim().toLowerCase()
        const results: {
            dayIndex: number
            dayName: string
            routeName: string
            time: string
            stopName: string
            passengerName: string
        }[] = []

        initialRoutes.forEach(route => {
            route.stops.forEach(stop => {
                if (!stop.passengers) return
                
                stop.passengers.forEach(p => {
                    if (p.passenger_name.toLowerCase().includes(q)) {
                        results.push({
                            dayIndex: stop.day_of_week,
                            dayName: dayNames[stop.day_of_week],
                            routeName: route.name,
                            time: stop.time,
                            stopName: stop.stop_name,
                            passengerName: p.passenger_name
                        })
                    }
                })
            })
        })

        // Sort by Day -> Time
        results.sort((a, b) => {
            if (a.dayIndex !== b.dayIndex) {
                // Adjust Sunday(0) to sort at the end if desired, but 0-6 is standard.
                // Let's standard sort by day index (Sun=0 to Sat=6)
                return a.dayIndex - b.dayIndex
            }
            return a.time.localeCompare(b.time)
        })

        return results
    }, [initialRoutes, searchQuery, isSearching]) // eslint-disable-line

    return (
        <div className="flex flex-col w-full pb-8">
            {/* Day Switcher - Hidden when searching */}
            {!isSearching && (
                <div className="flex items-center justify-between mb-4 bg-white dark:bg-zinc-800/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800 shadow-sm">
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
            )}

            {/* Search Input */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="탑승객 이름 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl leading-5 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-shadow text-gray-900 dark:text-zinc-100"
                />
                {isSearching && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                    >
                        취소
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {isSearching ? (
                    // ----------------
                    // SEARCH RESULTS MODE
                    // ----------------
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-2 px-1">
                            검색 결과 ({searchResults.length}건)
                        </h3>

                        {searchResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                                <Search className="w-10 h-10 mb-3 text-gray-300 dark:text-zinc-600 opacity-50" />
                                <p className="text-sm font-medium">'{searchQuery}' 탑승객을 찾을 수 없습니다.</p>
                            </div>
                        ) : (
                            searchResults.map((res, idx) => (
                                <div key={idx} className="bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold pl-2">
                                        <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                                            {res.dayName}
                                        </span>
                                        <span>•</span>
                                        <span>{res.routeName}</span>
                                    </div>
                                    <div className="flex items-end justify-between pl-2">
                                        <div>
                                            <div className="text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight leading-none mb-1">
                                                {res.time}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
                                                {res.stopName}
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-zinc-700">
                                            {res.passengerName}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // ----------------
                    // NORMAL DAY MODE
                    // ----------------
                    (() => {
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
                                            <div className="bg-gray-50 dark:bg-zinc-800/80 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                                    <Bus className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
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
                                                        <div key={s.id} className="p-4 px-5 flex flex-col gap-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="text-blue-600 dark:text-blue-400 font-bold tracking-tight whitespace-nowrap pt-0.5 w-12">
                                                                    {s.time}
                                                                </div>
                                                                <div className="flex-1 text-gray-800 dark:text-zinc-200 font-medium break-all mt-0.5">
                                                                    {s.stop_name}
                                                                </div>
                                                            </div>
                                                            {/* Passengers under the stop */}
                                                            {s.passengers && s.passengers.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 ml-[3.75rem]">
                                                                    {s.passengers.map(p => (
                                                                        <span key={p.id} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-zinc-700">
                                                                            {p.passenger_name}
                                                                        </span>
                                                                    ))}
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
                    })()
                )}
            </div>
        </div>
    )
}
