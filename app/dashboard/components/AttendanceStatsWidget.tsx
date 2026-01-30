import { getAttendanceStats } from '../actions_stats'
import AttendanceRankingSection from './AttendanceRankingSection'

export default async function AttendanceStatsWidget() {
    const stats = await getAttendanceStats()

    if (!stats) return null

    return (
        <div className="space-y-6 mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
                출석 통계
            </h3>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Monthly Rate */}
                <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                        이번 달 출석률 (일평균 참여율)
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
                        올해 출석률 (일평균 참여율)
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
            />
        </div>
    )
}
