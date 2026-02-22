'use client'

import { useState, useEffect } from 'react'
import AttendanceStats from './AttendanceStats'
import AttendanceCalendar from './AttendanceCalendar'

interface AttendanceDashboardProps {
    attendanceDates: string[];
}

export default function AttendanceDashboard({ attendanceDates }: AttendanceDashboardProps) {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    // Hydration fix: Set date on mount
    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    if (!currentDate) {
        return <div className="p-10 text-center animate-pulse bg-white rounded-2xl mb-6 shadow-sm border border-gray-100">달력 로딩 중...</div>;
    }

    return (
        <>
            <AttendanceStats
                attendanceDates={attendanceDates}
                currentDate={currentDate}
            />
            <AttendanceCalendar
                attendanceDates={attendanceDates}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
            />
        </>
    )
}
