'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Detects ?app=true in the URL and persists it to localStorage.
 * Also ensures the admin stays redirected to app-mode-aware URLs.
 */
export default function AppModeInit() {
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams.get('app') === 'true') {
            localStorage.setItem('admin_app_mode', 'true')
        }
    }, [searchParams])

    return null
}

export function isAdminAppMode(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('admin_app_mode') === 'true'
}
