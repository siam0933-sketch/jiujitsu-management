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
    const [filter, setFilter] = useState<FilterType | 'custom'>('all')
    const [customAgeStart, setCustomAgeStart] = useState<string>('')
    const [customAgeEnd, setCustomAgeEnd] = useState<string>('')

    const filterList = (list: RankingItem[]) => {
        return list.filter(item => {
            if (filter === 'all') return true
            if (item.age === undefined) return false // Unknown age

            if (filter === 'under16') return item.age < 16
            if (filter === 'over16') return item.age >= 16

            if (filter === 'custom') {
                const start = customAgeStart ? parseInt(customAgeStart, 10) : 0
                const end = customAgeEnd ? parseInt(customAgeEnd, 10) : 200
                return item.age >= start && item.age <= end
            }
            return true
        })
    }

    const filteredMonth = filterList(monthRanking)
    const filteredYear = filterList(yearRanking)

    return (
        <div className="space-y-4">
            {/* Filter Dropdown & Inputs */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 items-center">
                {filter === 'custom' && (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                        <input
                            type="number"
                            value={customAgeStart}
                            onChange={(e) => setCustomAgeStart(e.target.value)}
                            placeholder="0"
                            className="w-16 rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border text-center appearance-none"
                        />
                        <span className="text-gray-500 text-sm">~</span>
                        <input
                            type="number"
                            value={customAgeEnd}
                            onChange={(e) => setCustomAgeEnd(e.target.value)}
                            placeholder="100"
                            className="w-16 rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border text-center appearance-none"
                        />
                        <span className="text-gray-500 text-sm">세</span>
                    </div>
                )}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="block w-40 rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border appearance-none"
                >
                    <option value="all">전체 보기</option>
                    <option value="under16">16세 미만 (키즈)</option>
                    <option value="over16">16세 이상 (성인)</option>
                    <option value="custom">나이 지정</option>
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
    // Group items by count for Dense Ranking
    const groupedItems: { count: number, members: RankingItem[] }[] = []
    items.forEach(item => {
        const lastGroup = groupedItems[groupedItems.length - 1]
        if (lastGroup && lastGroup.count === item.count) {
            lastGroup.members.push(item)
        } else {
            groupedItems.push({ count: item.count, members: [item] })
        }
    })

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                    {title}
                </h3>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {groupedItems.length === 0 ? (
                    <li className="px-4 py-4 text-sm text-gray-500 text-center">데이터 없음</li>
                ) : (
                    groupedItems.flatMap((group, groupIdx) => (
                        group.members.map((member, memberIdx) => (
                            <li key={member.memberId} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                                <div className="flex items-center">
                                    {/* Show Rank Badge only for the first member of the group */}
                                    <div className="w-9 flex justify-center mr-3">
                                        {memberIdx === 0 ? (
                                            <span className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                                                groupIdx === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    groupIdx === 1 ? 'bg-gray-100 text-gray-800' :
                                                        groupIdx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                                            )}>
                                                {groupIdx + 1}
                                            </span>
                                        ) : (
                                            <div className="w-6 h-6" /> // Placeholder to align names
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 mr-2">{member.name}</span>
                                        {member.age !== undefined && (
                                            <span className="text-xs text-gray-400">({member.age}세)</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">{member.count}회</span>
                            </li>
                        ))
                    ))
                )}
            </ul>
        </div>
    )
}
