'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

interface AttendanceCalendarProps {
    attendanceDates: string[] // 'YYYY-MM-DD'
}

export default function AttendanceCalendar({ attendanceDates }: AttendanceCalendarProps) {
    if (!attendanceDates) {
        console.error('AttendanceCalendar: attendanceDates is missing');
        return <div className="p-4 text-red-500 font-bold border border-red-200 rounded-lg">데이터 로딩 오류 (Dates missing)</div>;
    }

    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    // Hydration fix: Set date on mount
    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    if (!currentDate) return <div className="p-10 text-center animate-pulse bg-white rounded-2xl">달력 로딩 중...</div>;

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1)
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 (Sun) - 6 (Sat)

    // Last day of current month
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const totalDays = lastDayOfMonth.getDate()

    // Previous month navigation
    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    // Next month navigation
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const days = []
    // Add empty placeholders for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null)
    }
    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
        days.push(i)
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        )
    }

    const isAttended = (day: number) => {
        // Format current cell date as YYYY-MM-DD in 'en-CA' (local time zone consideration handled by relying on string match)
        // Note: JS Date month is 0-indexed.
        // We need padding.
        const y = year
        const m = String(month + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        const dateStr = `${y}-${m}-${d}`
        return attendanceDates.includes(dateStr)
    }

    const weekDays = ['일', '월', '화', '수', '목', '금', '토']

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95 text-gray-600"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="font-bold text-lg text-gray-800">
                    {year}년 {month + 1}월
                </div>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95 text-gray-600"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Grid */}
            <div className="p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn(
                                "text-center text-xs font-semibold py-1",
                                idx === 0 ? "text-red-500" : // Sunday
                                    idx === 6 ? "text-blue-500" : // Saturday
                                        "text-gray-400"
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-y-2">
                    {days.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} />
                        }

                        const attended = isAttended(day)
                        const today = isToday(day)

                        return (
                            <div key={day} className="flex flex-col items-center justify-center p-1 relative min-h-[40px]">
                                <div
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all shadow-sm",
                                        // Base Text Color
                                        !attended && !today && "text-gray-700 hover:bg-gray-100",

                                        // Attendance Style (Green Circle)
                                        attended && !today && "bg-green-500 text-white",

                                        // Today Style (Blue Text)
                                        !attended && today && "text-blue-600 font-bold",

                                        // Today AND Attended (Green BG + Blue Text/Underline effect via parent)
                                        attended && today && "bg-green-600 text-white font-bold"
                                    )}
                                >
                                    {day}
                                </div>
                                {today && (
                                    <div className="absolute bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="px-4 pb-4 flex justify-end gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>오늘</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>출석</span>
                </div>
            </div>
        </div>
    )
}
