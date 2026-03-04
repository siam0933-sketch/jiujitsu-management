'use client'

import { useState } from 'react'
import { Bell, ChevronDown, ChevronRight } from 'lucide-react'

interface SystemNotice {
    id: string
    title: string
    content: string
    created_at: string
}

export default function SystemNoticeWidget({ notices }: { notices: SystemNotice[] }) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    if (!notices || notices.length === 0) return null

    const toggleNotice = (id: string) => {
        const next = new Set(expandedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedIds(next)
    }

    return (
        <div className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/20 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-900 dark:text-red-300">알려드립니다 (JiuJitsu Management System)</h3>
                </div>
                <div className="divide-y divide-red-100 dark:divide-red-900/20 bg-white/50 dark:bg-zinc-900/50">
                    {notices.map((notice) => {
                        const isExpanded = expandedIds.has(notice.id)
                        return (
                            <div key={notice.id} className="group">
                                <button
                                    onClick={() => toggleNotice(notice.id)}
                                    className="w-full px-5 py-3 flex items-start sm:items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors text-left"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 pr-4">
                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full whitespace-nowrap w-fit">
                                            {new Date(notice.created_at).toLocaleDateString()}
                                        </span>
                                        <span className={`text-sm font-medium ${isExpanded ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'} group-hover:text-gray-900 dark:group-hover:text-white transition-colors`}>
                                            {notice.title}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 mt-0.5 sm:mt-0">
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-zinc-900 border-t border-red-50 dark:border-red-900/10 whitespace-pre-wrap leading-relaxed">
                                        {notice.content}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
