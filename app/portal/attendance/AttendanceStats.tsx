'use client'

import { CalendarDays, Trophy, Award } from 'lucide-react'

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
    const totalCount = attendanceDates.length

    return (
        <div className={`grid grid-cols-3 gap-3 mb-6`}>
            {/* Monthly Stats */}
            <div className={`bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-1`}>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <CalendarDays size={14} className="text-blue-500" />
                    <span className="text-xs font-medium">{currentMonth}월 출석</span>
                </div>
                <div className="flex items-end gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{monthlyCount}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1">회</span>
                </div>
            </div>

            {/* Yearly Stats */}
            <div className={`bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-1`}>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-xs font-medium">{currentYear}년 출석</span>
                </div>
                <div className="flex items-end gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{yearlyCount}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1">회</span>
                </div>
            </div>

            {/* Total Stats */}
            <div className={`bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-1`}>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Award size={14} className="text-purple-500" />
                    <span className="text-xs font-medium">총 누적</span>
                </div>
                <div className="flex items-end gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{totalCount}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1">회</span>
                </div>
            </div>
        </div>
    )
}
