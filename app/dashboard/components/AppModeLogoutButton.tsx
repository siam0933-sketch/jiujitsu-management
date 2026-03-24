'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Renders a logout button that respects app-mode.
 * In app mode: signs out and redirects to /admin/login?app=true
 * In normal mode: uses the standard form POST to /auth/sign-out
 */
export default function AppModeLogoutButton() {
    const router = useRouter()
    const [isAppMode, setIsAppMode] = useState(false)

    useEffect(() => {
        setIsAppMode(localStorage.getItem('admin_app_mode') === 'true')
    }, [])

    if (isAppMode) {
        const handleLogout = async () => {
            await fetch('/auth/sign-out', { method: 'POST' })
            router.replace('/admin/login?app=true')
        }

        return (
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
            </button>
        )
    }

    return (
        <form action="/auth/sign-out" method="post">
            <button className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
            </button>
        </form>
    )
}
