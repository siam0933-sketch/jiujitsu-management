'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

interface RankingItem {
    memberId: string
    name: string
    count: number
    age?: number
}

interface AttendanceRankingSectionProps {
    monthRanking: RankingItem[]
    yearRanking: RankingItem[]
    monthTitle: string
    yearTitle: string
}

type FilterType = 'all' | 'under16' | 'over16'

export default function AttendanceRankingSection({ monthRanking, yearRanking, monthTitle, yearTitle }: AttendanceRankingSectionProps) {
    const [filter, setFilter] = useState<FilterType>('all')

    const filterList = (list: RankingItem[]) => {
        return list.filter(item => {
            if (filter === 'all') return true
            if (item.age === undefined) return false // Unknown age
            if (filter === 'under16') return item.age < 16
            if (filter === 'over16') return item.age >= 16
            return true
        }).slice(0, 10) // Top 10 after filter
    }

    const filteredMonth = filterList(monthRanking)
    const filteredYear = filterList(yearRanking)

    return (
        <div className="space-y-4">
            {/* Filter Dropdown */}
            <div className="flex justify-end">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                    <option value="all">전체 보기</option>
                    <option value="under16">16세 미만 (키즈)</option>
                    <option value="over16">16세 이상 (성인)</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Ranking */}
                <RankingCard title={`🏆 ${monthTitle}`} items={filteredMonth} />

                {/* Yearly Ranking */}
                <RankingCard title={`👑 ${yearTitle}`} items={filteredYear} />
            </div>
        </div>
    )
}

function RankingCard({ title, items }: { title: string, items: RankingItem[] }) {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                    {title}
                </h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {items.length === 0 ? (
                    <li className="px-4 py-4 text-sm text-gray-500 text-center">데이터 없음</li>
                ) : (
                    items.map((rank, idx) => (
                        <li key={rank.memberId} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex items-center">
                                <span className={cn(
                                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3",
                                    idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                                            idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                                )}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <span className="text-sm font-medium text-gray-900 mr-2">{rank.name}</span>
                                    {rank.age !== undefined && (
                                        <span className="text-xs text-gray-400">({rank.age}세)</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm text-gray-500">{rank.count}회</span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    )
}
