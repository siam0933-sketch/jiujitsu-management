'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, ImageIcon, ChevronRightIcon, Bus, CalendarDays } from 'lucide-react'
import { PORTAL_STYLES } from '../../styles'
import PortalShuttleClient from './PortalShuttleClient'
import { PortalShuttleRoute } from '../../shuttle/actions'

interface PortalHomeClientProps {
    notices: any[]
    totalNotices: number
    shuttleData: PortalShuttleRoute[]
}

export default function PortalHomeClient({ notices, totalNotices, shuttleData }: PortalHomeClientProps) {
    const [activeTab, setActiveTab] = useState<'notice' | 'schedule' | 'shuttle'>('notice')

    return (
        <div className="w-full">
            {/* TABS */}
            <div className="flex p-1 bg-gray-100/80 dark:bg-zinc-800/50 rounded-xl mb-6 shadow-inner">
                <button
                    onClick={() => setActiveTab('notice')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'notice'
                            ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                >
                    공지사항
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'schedule'
                            ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                >
                    스케줄
                </button>
                <button
                    onClick={() => setActiveTab('shuttle')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === 'shuttle'
                            ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                >
                    운행시간표
                </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="min-h-[300px]">
                
                {/* 1. Notice Tab */}
                {activeTab === 'notice' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-500" />
                                공지사항
                            </h2>
                            {totalNotices > 5 && (
                                <Link href="/portal/notice/all" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                                    더 보기 <ChevronRightIcon className="w-4 h-4 ml-0.5" />
                                </Link>
                            )}
                        </div>

                        <div className="space-y-3">
                            {notices && notices.length > 0 ? (
                                notices.map((notice: any) => (
                                    <Link
                                        href={`/portal/notice/${notice.id}`}
                                        key={notice.id}
                                        className={`${PORTAL_STYLES.CARD} hover:border-black dark:hover:border-white transition-colors flex items-center justify-between p-4 ${
                                            notice.is_read === false
                                                ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/80 dark:bg-yellow-900/20'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1 flex-1 pr-4">
                                            <h3 className={`font-medium line-clamp-1 flex items-center gap-2 ${notice.is_read === false ? 'font-bold text-gray-900 dark:text-zinc-100' : 'text-gray-900 dark:text-zinc-100'}`}>
                                                {notice.is_read === false && (
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                                                )}
                                                <span>{notice.title}</span>
                                                {notice.images && notice.images.length > 0 && (
                                                    <ImageIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                )}
                                            </h3>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className={`${PORTAL_STYLES.CARD} p-8 py-12 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 gap-3 border-dashed`}>
                                    <Bell className="w-8 h-8 opacity-20" />
                                    <span className="text-sm font-medium">아직 올라온 소식이 없습니다.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Schedule Tab (Placeholder) */}
                {activeTab === 'schedule' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                        <CalendarDays className="w-12 h-12 mb-4 text-gray-300 dark:text-zinc-600 opacity-50" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1">도장 스케줄 및 수업 계획</h3>
                        <p className="text-sm font-medium text-center px-6">수련 시간표 기능은 준비 중입니다.</p>
                    </div>
                )}

                {/* 3. Shuttle Tab */}
                {activeTab === 'shuttle' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <PortalShuttleClient initialRoutes={shuttleData} />
                    </div>
                )}
            </div>
        </div>
    )
}
