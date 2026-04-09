'use client'

import { useState } from 'react'

type AttendanceLog = {
    id: string
    date: string
    class_name: string | null
    method: string
    created_at: string
    checked_out_at?: string | null
}

import { checkInMember, cancelAttendance } from '../../attendance/actions'

interface Props {
    logs: AttendanceLog[]
    memberId: string
    onUpdate: () => void
}

export default function AttendanceHistory({ logs, memberId, onUpdate }: Props) {
    const [viewDate, setViewDate] = useState(new Date())
    const [showCalendar, setShowCalendar] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Group logs by date for easy lookup
    const datesSet = new Set(logs.map(log => log.date))

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    // Calculate stats
    const totalAttendance = logs.length
    const thisMonthAttendance = logs.filter(l => l.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length

    const handleDayClick = async (dateStr: string, isAttended: boolean) => {
        if (isLoading) return

        // Prevent future dates? Optional, but good practice.
        if (new Date(dateStr) > new Date()) {
            return alert('미래의 날짜에는 출석할 수 없습니다.')
        }

        const actionName = isAttended ? '취소' : '출석'
        if (!confirm(`${dateStr} 출석을 ${actionName}하시겠습니까?`)) return

        setIsLoading(true)
        try {
            let res
            if (isAttended) {
                res = await cancelAttendance(memberId, dateStr)
            } else {
                res = await checkInMember(memberId, undefined, dateStr)
            }

            if (res.error) {
                alert(res.error)
            } else {
                // Success
                onUpdate()
            }
        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-zinc-800">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-100">출석 기록</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-zinc-400">
                        총 {totalAttendance}회 출석 (건)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        이번 달 {thisMonthAttendance}회
                    </span>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {showCalendar ? '달력 닫기' : '달력 보기'}
                    </button>
                </div>
            </div>

            {showCalendar && (
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 transition-all">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                            {year}년 {month + 1}월
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={prevMonth}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                            <div key={d} className={`text-xs font-medium ${i === 0 ? 'text-red-500' : 'text-gray-500 dark:text-zinc-400'}`}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const isAttended = datesSet.has(dateStr)
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(dateStr, isAttended)}
                                    className={`
                                    aspect-square rounded-full flex items-center justify-center text-sm relative group cursor-pointer transition-all
                                    ${isAttended
                                            ? 'bg-green-500 text-white font-bold shadow-sm hover:bg-green-600'
                                            : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800'}
                                    ${isToday && !isAttended ? 'ring-1 ring-blue-500 text-blue-600' : ''}
                                    ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                                `}
                                >
                                    {day}
                                    {isAttended && (
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none">
                                            {logs.find(l => l.date === dateStr)?.class_name || '출석'} (클릭하여 취소)
                                        </div>
                                    )}
                                    {!isAttended && (
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none">
                                            클릭하여 출석
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Recent Logs List */}
            <div className="border-t border-gray-200 dark:border-zinc-800 px-4 py-4 bg-gray-50 dark:bg-zinc-800/50 sm:px-6">
                <h5 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">최근 활동</h5>
                {logs.length > 0 ? (
                    <div className="max-h-[220px] overflow-y-auto pr-2">
                        <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-800">
                            {logs.map((log) => {
                                const checkInTime = new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                                const checkOutTime = log.checked_out_at ? new Date(log.checked_out_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
                                const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토']
                                const dayName = daysOfWeek[new Date(log.date).getDay()]

                                return (
                                    <li key={log.id} className="py-2.5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="text-gray-500 dark:text-zinc-400 shrink-0 whitespace-nowrap text-xs sm:text-sm">
                                                {log.date} ({dayName})
                                            </div>
                                            <div className="text-gray-600 dark:text-zinc-400 font-mono text-xs shrink-0 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                {checkInTime}
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-zinc-100 truncate flex-1">
                                                {log.class_name || '자율수련'}
                                            </div>
                                            {checkOutTime && (
                                                <div className="text-[11px] text-red-500 shrink-0 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                                                    {checkOutTime} 하원
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-2">출석 기록이 없습니다.</p>
                )}
            </div>
        </div>
    )
}
