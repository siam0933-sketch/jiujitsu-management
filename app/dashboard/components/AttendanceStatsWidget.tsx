import { getAttendanceStats } from '../actions_stats'

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

            {/* Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Ranking */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            🏆 이번 달 출석 랭킹
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {stats.month.ranking.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500 text-center">데이터 없음</li>
                        ) : (
                            stats.month.ranking.map((rank, idx) => (
                                <li key={rank.memberId} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                idx === 1 ? 'bg-gray-100 text-gray-800' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{rank.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">{rank.count}회</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Yearly Ranking */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            👑 올해 출석 랭킹
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {stats.year.ranking.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500 text-center">데이터 없음</li>
                        ) : (
                            stats.year.ranking.map((rank, idx) => (
                                <li key={rank.memberId} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                idx === 1 ? 'bg-gray-100 text-gray-800' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{rank.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">{rank.count}회</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
