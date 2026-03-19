'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, ChevronRight } from 'lucide-react'
import { PORTAL_STYLES } from '../styles'
import { markAsRead, markAllRead } from './actions'

type Notification = {
    id: string
    type: 'notice' | 'attendance' | 'payment'
    title: string
    body: string | null
    link: string | null
    is_read: boolean
    created_at: string
}

const TYPE_ICON: Record<string, string> = {
    notice: '📢',
    attendance: '✅',
    payment: '💳',
}

export default function NotificationsClient({
    initialNotifications,
}: {
    initialNotifications: Notification[]
}) {
    const router = useRouter()
    const [notifications, setNotifications] = useState(initialNotifications)
    const [isPending, startTransition] = useTransition()

    const unreadCount = notifications.filter((n) => !n.is_read).length

    const handleClick = async (notif: Notification) => {
        if (!notif.is_read) {
            // 낙관적 업데이트
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
            )
            await markAsRead(notif.id)
        }
        if (notif.link) {
            router.push(notif.link)
        }
    }

    const handleMarkAll = () => {
        startTransition(async () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            await markAllRead()
        })
    }

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    알림
                    {unreadCount > 0 && (
                        <span className="text-sm font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
                            {unreadCount}
                        </span>
                    )}
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        disabled={isPending}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50"
                    >
                        <CheckCheck className="w-4 h-4" />
                        모두 읽음
                    </button>
                )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
                <div className={`${PORTAL_STYLES.CARD} p-8 text-center text-zinc-500 text-sm`}>
                    아직 알림이 없습니다.
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => (
                        <button
                            key={notif.id}
                            onClick={() => handleClick(notif)}
                            className={`w-full text-left ${PORTAL_STYLES.CARD} p-4 flex items-start gap-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 ${
                                !notif.is_read
                                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/80 dark:bg-yellow-900/20'
                                    : ''
                            }`}
                        >
                            {/* Icon */}
                            <span className="text-xl flex-shrink-0 mt-0.5">
                                {TYPE_ICON[notif.type] || '🔔'}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 ${!notif.is_read ? 'font-bold' : ''}`}>
                                    {notif.title}
                                </p>
                                {notif.body && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                        {notif.body}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    {new Date(notif.created_at).toLocaleString('ko-KR', {
                                        month: 'long', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            {/* Unread dot + arrow */}
                            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                                {!notif.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                )}
                                {notif.link && (
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="h-4" />
        </div>
    )
}
