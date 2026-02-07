import { getAttendanceStats } from '../actions_stats'
import AttendanceRankingSection from './AttendanceRankingSection'
import MonthSelector from './MonthSelector'

interface AttendanceStatsWidgetProps {
    monthStr?: string // YYYY-MM
}

export default async function AttendanceStatsWidget({ monthStr }: AttendanceStatsWidgetProps) {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1

    // Default to current month if not provided
    const targetMonthStr = monthStr || `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    const [year, month] = targetMonthStr.split('-').map(Number)

    const stats = await getAttendanceStats(targetMonthStr)

    if (!stats) return null

    const title = `${month}월 출석 순위`

    return (
        <div className="space-y-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    출석 통계
                </h3>
                <MonthSelector currentMonthStr={targetMonthStr} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Monthly Rate */}
                <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                        {month}월 출석률 (일평균 참여율)
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {stats.month.rate}%
                    </dd>
                    <p className="mt-2 text-sm text-gray-600">
                        일평균 {stats.month.avgDaily}명 출석
                    </p>
                </div>

                {/* Yearly Rate */}
                <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                        {year}년 전체 출석률 (일평균 참여율)
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {stats.year.rate}%
                    </dd>
                    <p className="mt-2 text-sm text-gray-600">
                        일평균 {stats.year.avgDaily}명 출석
                    </p>
                </div>
            </div>

            {/* Rankings (Client Component with Filtering) */}
            <AttendanceRankingSection
                monthRanking={stats.month.ranking}
                yearRanking={stats.year.ranking}
                monthTitle={`${month}월 출석 랭킹`}
                yearTitle={`${year}년 전체 출석 랭킹`}
            />
        </div>
    )
}
