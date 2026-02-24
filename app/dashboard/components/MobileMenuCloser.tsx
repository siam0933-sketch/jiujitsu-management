'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function MobileMenuCloser() {
    const pathname = usePathname()

    useEffect(() => {
        const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
        if (checkbox && checkbox.checked) {
            checkbox.checked = false
        }
    }, [pathname])

    return null
}
