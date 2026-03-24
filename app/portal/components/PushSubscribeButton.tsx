'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export default function PushSubscribeButton() {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            PushNotifications.checkPermissions().then(result => {
                let state = result.receive as string
                if (state === 'prompt' || state === 'prompt-with-rationale') state = 'default'
                setPermission(state as NotificationPermission)
                const savedFCM = localStorage.getItem('fcm_token')
                setIsSubscribed(!!savedFCM)
            })

            const regListener = PushNotifications.addListener('registration', async (token) => {
                localStorage.setItem('fcm_token', token.value)
                try {
                    await fetch('/api/push/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nativeToken: token.value }),
                    })
                    setIsSubscribed(true)
                } finally {
                    setIsLoading(false)
                }
            })

            const errListener = PushNotifications.addListener('registrationError', (error) => {
                console.error('FCM Registration Error:', error)
                setIsLoading(false)
            })

            return () => {
                regListener.then(l => l.remove())
                errListener.then(l => l.remove())
            }
        }

        // --- WEB PUSH ---
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported')
            return
        }
        setPermission(Notification.permission)
        
        navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
                setIsSubscribed(!!sub)
            })
        })
    }, [])

    const subscribe = async () => {
        if (isLoading) return
        setIsLoading(true)

        try {
            if (Capacitor.isNativePlatform()) {
                let permStatus = await PushNotifications.checkPermissions()
                
                if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
                    permStatus = await PushNotifications.requestPermissions()
                }
                
                let state = permStatus.receive as string
                if (state === 'prompt' || state === 'prompt-with-rationale') state = 'default'
                setPermission(state as NotificationPermission)
                
                if (state !== 'granted') {
                    setIsLoading(false)
                    return
                }
                
                await PushNotifications.register()
                return // isLoading will be set to false by the listener
            }

            // --- WEB PUSH ---
            const reg = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm !== 'granted') {
                setIsLoading(false)
                return
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                alert('Push 설정 오류: VAPID 키가 없습니다.')
                setIsLoading(false)
                return
            }

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
            })

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub }),
            })
            
            setIsSubscribed(true)
            setIsLoading(false)
        } catch (err) {
            console.error('[PushSubscribe] error:', err)
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            if (Capacitor.isNativePlatform()) {
                const token = localStorage.getItem('fcm_token')
                if (token) {
                    await fetch('/api/push/subscribe', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nativeToken: token }),
                    })
                    localStorage.removeItem('fcm_token')
                    setIsSubscribed(false)
                }
            } else {
                // --- WEB PUSH ---
                const reg = await navigator.serviceWorker.ready
                const sub = await reg.pushManager.getSubscription()
                if (sub) {
                    await sub.unsubscribe()
                    await fetch('/api/push/subscribe', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint: sub.endpoint }),
                    })
                }
                setIsSubscribed(false)
            }
        } catch (err) {
            console.error('[PushUnsubscribe] error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle = () => {
        if (isSubscribed) {
            unsubscribe()
        } else {
            subscribe()
        }
    }

    if (permission === 'unsupported') {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <BellOff className="w-5 h-5 opacity-50" />
                이 기기는 푸시 알림을 지원하지 않습니다.
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between p-1">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${isSubscribed ? 'text-blue-500' : 'text-gray-400'}`} />
                    푸시 알림 수신
                </span>
                {permission === 'denied' && (
                    <span className="text-xs text-red-500 tracking-tight">
                        브라우저 설정에서 알림이 차단되어 있습니다.
                    </span>
                )}
            </div>
            
            <button
                type="button"
                role="switch"
                aria-checked={isSubscribed}
                disabled={isLoading || permission === 'denied'}
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                    isSubscribed ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                } ${isLoading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="sr-only">푸시 알림 설정</span>
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isSubscribed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
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
