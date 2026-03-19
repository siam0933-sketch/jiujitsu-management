'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

export default function PushSubscribeButton() {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported')
            return
        }
        setPermission(Notification.permission)
    }, [])

    const subscribe = async () => {
        if (isLoading) return
        setIsLoading(true)

        try {
            // 1. Service Worker 등록
            const reg = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            // 2. 알림 권한 요청
            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm !== 'granted') return

            // 3. Push 구독 생성
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                alert('Push 설정 오류: VAPID 키가 없습니다.')
                return
            }

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
            })

            // 4. 서버에 구독 정보 전송
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub }),
            })
        } catch (err) {
            console.error('[PushSubscribe] error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    if (permission === 'unsupported') return null

    if (permission === 'granted') {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                <BellRing className="w-4 h-4" />
                알림 허용됨
            </div>
        )
    }

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
                <BellOff className="w-4 h-4" />
                알림이 차단됨 (브라우저 설정에서 변경)
            </div>
        )
    }

    return (
        <button
            onClick={subscribe}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
        >
            <Bell className="w-4 h-4" />
            {isLoading ? '처리 중...' : '알림 허용하기'}
        </button>
    )
}

// VAPID public key (base64url) → Uint8Array 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
