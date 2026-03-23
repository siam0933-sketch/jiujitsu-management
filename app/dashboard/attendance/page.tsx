
import { getSchedules } from './actions_schedule'
import { getActiveMembers, getPendingAttendanceCount } from './actions'
import ClassScheduleBoard from './components/ClassScheduleBoard'
import DownloadKioskApkButton from './components/DownloadKioskApkButton'

export const dynamic = 'force-dynamic' // Ensure no caching

export default async function AttendancePage() {
    // ... inside component ...
    const [schedules, members, pendingCount] = await Promise.all([
        getSchedules(),
        getActiveMembers(),
        getPendingAttendanceCount()
    ])

    const todayKST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

    return (
        <div className="min-h-[calc(100vh-100px)] p-2 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-200">출석부</h1>
                    {pendingCount > 0 && (
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DownloadKioskApkButton supabaseUrl={supabaseUrl} />
                </div>
            </div>
            <ClassScheduleBoard
                initialSchedules={schedules}
                activeMembers={members}
                todayKST={todayKST}
            />
        </div>
    )
}
