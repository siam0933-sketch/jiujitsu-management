'use client'

import { useState } from 'react'

type AttendanceLog = {
    id: string
    date: string
    class_name: string | null
    method: string
    created_at: string
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">출석 기록</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        총 {totalAttendance}회 출석 (건)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        이번 달 {thisMonthAttendance}회
                    </span>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {showCalendar ? '달력 닫기' : '달력 보기'}
                    </button>
                </div>
            </div>

            {showCalendar && (
                <div className="p-6 border-b border-gray-100 transition-all">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-gray-900">
                            {year}년 {month + 1}월
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={prevMonth}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                            <div key={d} className={`text-xs font-medium ${i === 0 ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>
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
                                            : 'text-gray-700 hover:bg-gray-100'}
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

            {/* Recent Logs List (Optional: Show last 5) */}
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50 sm:px-6">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">최근 활동</h5>
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {logs.slice(0, 3).map((log, idx) => (
                            <li key={log.id}>
                                <div className="relative pb-8">
                                    {idx !== logs.slice(0, 3).length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium text-gray-900">{log.class_name || '일반 출석'}</span>
                                                </p>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                <time dateTime={log.date}>{log.date}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {logs.length === 0 && <p className="text-sm text-gray-500 text-center py-2">출석 기록이 없습니다.</p>}
            </div>
        </div>
    )
}
