'use client'

import { CalendarDays, Trophy } from 'lucide-react'

interface AttendanceStatsProps {
    attendanceDates: string[];
    currentDate: Date;
}

export default function AttendanceStats({ attendanceDates, currentDate }: AttendanceStatsProps) {
    if (!attendanceDates) return null

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    const monthlyCount = attendanceDates.filter(d => d.startsWith(currentMonthStr)).length
    const yearlyCount = attendanceDates.filter(d => d.startsWith(`${currentYear}-`)).length

    return (
        <div className={`grid grid-cols-2 gap-4 mb-6`}>
            {/* Monthly Stats */}
            <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-1`}>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span className="text-xs font-medium">{currentMonth}월 출석</span>
                </div>
                <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900">{monthlyCount}</span>
                    <span className="text-sm font-medium text-gray-500 mb-0.5">회</span>
                </div>
            </div>

            {/* Yearly Stats */}
            <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-1`}>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="text-xs font-medium">{currentYear}년 출석</span>
                </div>
                <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900">{yearlyCount}</span>
                    <span className="text-sm font-medium text-gray-500 mb-0.5">회</span>
                </div>
            </div>
        </div>
    )
}
