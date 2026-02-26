'use client'

import { useState } from 'react'
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPortalRanking } from './actions'
import { PORTAL_STYLES } from '../styles'
import { displayBeltName } from '@/app/dashboard/members/constants'

type FilterType = 'all' | 'under16' | 'over16' | 'custom';

interface RankingData {
    ranking: { memberId: string, name: string, count: number, belt?: string, stripe?: number, age?: number }[];
    currentMemberId: string | null;
    year: number;
    month: number | null;
    error?: string;
}

interface Props {
    initialRanking: RankingData;
}

export default function PortalRankingClient({ initialRanking }: Props) {
    const [mode, setMode] = useState<'month' | 'year'>('month')
    const [currentData, setCurrentData] = useState<RankingData>(initialRanking)
    const [isLoading, setIsLoading] = useState(false)

    // Filter states
    const [filter, setFilter] = useState<FilterType>('all')
    const [customAgeStart, setCustomAgeStart] = useState<string>('')
    const [customAgeEnd, setCustomAgeEnd] = useState<string>('')

    // Current viewing date
    const [viewYear, setViewYear] = useState(initialRanking.year)
    const [viewMonth, setViewMonth] = useState(initialRanking.month || new Date().getMonth() + 1)

    // Real current date to prevent future navigation
    const today = new Date()
    const currentYearNum = today.getFullYear()
    const currentMonthNum = today.getMonth() + 1

    const isFutureMonth = (y: number, m: number) => {
        if (y > currentYearNum) return true;
        if (y === currentYearNum && m > currentMonthNum) return true;
        return false;
    }

    const isFutureYear = (y: number) => {
        return y > currentYearNum;
    }

    const loadData = async (y: number, m: number | null) => {
        setIsLoading(true)
        try {
            const data = await getPortalRanking(y, m)
            setCurrentData(data as RankingData)
        } catch (error) {
            console.error('Failed to load ranking:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleModeChange = (newMode: 'month' | 'year') => {
        setMode(newMode)
        if (newMode === 'year') {
            loadData(viewYear, null)
        } else {
            loadData(viewYear, viewMonth)
        }
    }

    const handlePrev = () => {
        if (mode === 'month') {
            let nextM = viewMonth - 1
            let nextY = viewYear
            if (nextM < 1) {
                nextM = 12
                nextY -= 1
            }
            setViewMonth(nextM)
            setViewYear(nextY)
            loadData(nextY, nextM)
        } else {
            const nextY = viewYear - 1
            setViewYear(nextY)
            loadData(nextY, null)
        }
    }

    const handleNext = () => {
        if (mode === 'month') {
            let nextM = viewMonth + 1
            let nextY = viewYear
            if (nextM > 12) {
                nextM = 1
                nextY += 1
            }
            // Prevent future mapping
            if (isFutureMonth(nextY, nextM)) return;

            setViewMonth(nextM)
            setViewYear(nextY)
            loadData(nextY, nextM)
        } else {
            const nextY = viewYear + 1
            if (isFutureYear(nextY)) return;

            setViewYear(nextY)
            loadData(nextY, null)
        }
    }

    const canGoNext = mode === 'month' ? !isFutureMonth(viewMonth === 12 ? viewYear + 1 : viewYear, viewMonth === 12 ? 1 : viewMonth + 1) : !isFutureYear(viewYear + 1)

    const filteredRanking = currentData.ranking ? currentData.ranking.filter(item => {
        if (filter === 'all') return true;
        if (item.age === undefined) return false;

        if (filter === 'under16') return item.age < 16;
        if (filter === 'over16') return item.age >= 16;

        if (filter === 'custom') {
            const start = customAgeStart ? parseInt(customAgeStart, 10) : 0;
            const end = customAgeEnd ? parseInt(customAgeEnd, 10) : 200;
            return item.age >= start && item.age <= end;
        }
        return true;
    }) : [];

    return (
        <div>
            {/* Header & Tabs */}
            <div className="flex flex-col mb-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        출석 랭킹
                    </h2>
                </div>

                {/* Filter and Mode Control Row */}
                <div className="flex flex-row flex-wrap gap-2 sm:gap-3 items-center justify-between">
                    {/* Left: Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 rounded-lg px-3 py-1.5 border-none outline-none cursor-pointer appearance-none"
                        >
                            <option value="all">전체보기</option>
                            <option value="under16">16세 미만 (키즈)</option>
                            <option value="over16">16세 이상 (성인)</option>
                            <option value="custom">나이 지정</option>
                        </select>

                        {filter === 'custom' && (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="number"
                                    value={customAgeStart}
                                    onChange={(e) => setCustomAgeStart(e.target.value)}
                                    placeholder="0"
                                    className="w-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm px-2 py-1.5 rounded-md border-none text-center appearance-none"
                                />
                                <span className="text-zinc-500 text-sm">~</span>
                                <input
                                    type="number"
                                    value={customAgeEnd}
                                    onChange={(e) => setCustomAgeEnd(e.target.value)}
                                    placeholder="100"
                                    className="w-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm px-2 py-1.5 rounded-md border-none text-center appearance-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: Date Nav Mode */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 shrink-0">
                        <button
                            onClick={() => handleModeChange('month')}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${mode === 'month' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}
                        >
                            월간
                        </button>
                        <button
                            onClick={() => handleModeChange('year')}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${mode === 'year' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}
                        >
                            연간
                        </button>
                    </div>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 px-4 shadow-sm">
                    <button onClick={handlePrev} className="p-1 text-zinc-400 hover:text-orange-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {mode === 'month' ? `${viewYear}년 ${viewMonth}월` : `${viewYear}년 전체`}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={!canGoNext}
                        className={`p-1 transition-colors ${!canGoNext ? 'text-zinc-200 dark:text-zinc-800 cursor-not-allowed' : 'text-zinc-400 hover:text-orange-500'}`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Ranking List */}
            <div className={`${PORTAL_STYLES.CARD} relative min-h-[200px]`}>
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                )}

                {filteredRanking.length > 0 ? (
                    <div className="max-h-[700px] overflow-y-auto">
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {(() => {
                                let currentRank = 1;
                                return filteredRanking.map((member: any, index: number, arr: any[]) => {
                                    // Calculate tie rank (Dense Ranking)
                                    if (index > 0 && member.count < arr[index - 1].count) {
                                        currentRank++;
                                    }

                                    const isMe = member.memberId === currentData.currentMemberId;
                                    const isTop3 = currentRank <= 3;

                                    return (
                                        <li
                                            key={member.memberId}
                                            className={`flex items-center justify-between p-4 transition-colors ${isMe ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 text-center font-bold flex items-center justify-center ${currentRank === 1 ? 'text-yellow-500 text-lg' :
                                                    currentRank === 2 ? 'text-slate-400 text-lg' :
                                                        currentRank === 3 ? 'text-amber-600 text-lg' :
                                                            'text-zinc-400 text-base'
                                                    }`}>
                                                    {currentRank}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isMe ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                        {member.name}
                                                    </span>
                                                    {member.belt && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                            {displayBeltName(member.belt)}{member.stripe !== undefined ? member.stripe : ''}
                                                        </span>
                                                    )}
                                                    {isMe && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">나</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{member.count}</span>
                                                <span className="text-xs text-zinc-500 font-medium">회</span>
                                            </div>
                                        </li>
                                    );
                                })
                            })()}
                        </ul>
                    </div>
                ) : (
                    <div className="p-10 text-center text-zinc-500 text-sm">
                        <p>해당 기간의 기록이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
