'use client'

import { useState, useEffect } from 'react'
import { ShuttleStop, ShuttleRoute, saveShuttleStopDetailed, deleteShuttleStop } from '../actions'

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export default function ShuttleEditModal({
    availableRoutes,
    initialData,
    currentDay,
    onClose
}: {
    availableRoutes: ShuttleRoute[]
    initialData: ShuttleStop | null
    currentDay: number
    onClose: () => void
}) {
    // Determine initial route
    const defaultRouteId = initialData ? initialData.route_id : (availableRoutes.length > 0 ? availableRoutes[0].id : '')
    const [routeId, setRouteId] = useState(defaultRouteId)
    
    // Day Selection
    const [selectedDays, setSelectedDays] = useState<number[]>([initialData ? initialData.day_of_week : currentDay])
    const [time, setTime] = useState(initialData ? initialData.time.slice(0, 5) : '15:00')
    const [stopName, setStopName] = useState(initialData ? initialData.stop_name : '')
    
    // Passengers
    const [passengers, setPassengers] = useState<string[]>(
        initialData ? initialData.passengers.map(p => p.passenger_name) : []
    )
    const [newPassenger, setNewPassenger] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Ensure selected days are always valid for the newly selected route
    useEffect(() => {
        const route = availableRoutes.find(r => r.id === routeId)
        if (route) {
            // Remove selection of days that the route doesn't run on
            const validSelectedDays = selectedDays.filter(day => route.days.includes(day))
            if (validSelectedDays.length !== selectedDays.length) {
                // If it becomes empty, try to select the first valid day
                if (validSelectedDays.length === 0 && route.days.length > 0) {
                    setSelectedDays([route.days[0]])
                } else {
                    setSelectedDays(validSelectedDays)
                }
            }
        }
    }, [routeId, availableRoutes])

    const selectedRoute = availableRoutes.find(r => r.id === routeId)

    const toggleDay = (dayIndex: number) => {
        if (!selectedRoute?.days.includes(dayIndex)) return // Cannot select unavailable day

        if (selectedDays.includes(dayIndex)) {
            if (selectedDays.length > 1) { // Prevent unchecking all
                setSelectedDays(selectedDays.filter(d => d !== dayIndex))
            }
        } else {
            setSelectedDays([...selectedDays, dayIndex])
        }
    }

    const addPassenger = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassenger.trim()) {
            setPassengers([...passengers, newPassenger.trim()])
            setNewPassenger('')
        }
    }

    const removePassenger = (indexToRemove: number) => {
        setPassengers(passengers.filter((_, idx) => idx !== indexToRemove))
    }

    const handleSave = async () => {
        if (!routeId) {
            alert('노선을 먼저 선택하거나 생성해주세요.')
            return
        }
        if (!stopName.trim() || !time) {
            alert('시간과 정류장 이름을 입력해주세요.')
            return
        }

        let finalPassengers = [...passengers]
        if (newPassenger.trim()) {
            finalPassengers.push(newPassenger.trim())
        }

        setIsSaving(true)
        try {
            await saveShuttleStopDetailed(
                routeId,
                selectedDays,
                time,
                stopName,
                finalPassengers,
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
        if (initialData && confirm('정말로 이 정류장을 삭제하시겠습니까?')) {
            setIsSaving(true)
            try {
                await deleteShuttleStop(initialData.id)
                onClose()
            } catch(e: any) {
                console.error(e)
                alert('삭제에 실패했습니다: ' + e.message)
                setIsSaving(false)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-full">
                
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100">
                        {initialData ? '정류장 편집' : '새 정류장 생성'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Route Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">소속 노선</label>
                        {availableRoutes.length === 0 ? (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                등록된 노선이 없습니다. 먼저 새 노선을 만들어주세요.
                            </div>
                        ) : (
                            <select
                                value={routeId}
                                onChange={e => setRouteId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {availableRoutes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Time & Stop Name */}
                    <div className="flex gap-3 sm:gap-4">
                        <div className="w-[140px] shrink-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">시간</label>
                            <input 
                                type="time" 
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">정류장 명</label>
                            <input 
                                type="text" 
                                placeholder="예: 무지개아파트"
                                value={stopName}
                                onChange={e => setStopName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Passengers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">탑승객 (회원 이름 직접 입력)</label>
                        <div className="space-y-2 mb-3">
                            {passengers.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                                    <span className="text-gray-900 dark:text-zinc-100 font-medium">{p}</span>
                                    <button 
                                        type="button"
                                        onClick={() => removePassenger(idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={addPassenger} className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="탑승객 이름 입력"
                                value={newPassenger}
                                onChange={e => setNewPassenger(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                type="submit"
                                disabled={!newPassenger.trim()}
                                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Day Selection (Disabled if route doesn't run on that day) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">요일 적용 (복사)</label>
                        <div className="flex flex-wrap gap-2">
                            {DAY_NAMES.map((dayName, idx) => {
                                const isSupported = selectedRoute?.days.includes(idx)
                                const isSelected = selectedDays.includes(idx)
                                
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!isSupported}
                                        onClick={() => toggleDay(idx)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                            isSelected 
                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                : isSupported 
                                                    ? 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                                    : 'bg-gray-100 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-600 border border-gray-200 dark:border-zinc-800 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        {dayName}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                            선택된 노선이 운행하지 않는 요일은 적용할 수 없습니다.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex gap-3">
                    {initialData && (
                        <button 
                            type="button"
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition whitespace-nowrap"
                        >
                            삭제
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || availableRoutes.length === 0}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>

            </div>
        </div>
    )
}
