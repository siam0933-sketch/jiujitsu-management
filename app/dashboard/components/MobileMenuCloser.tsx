'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function MobileMenuCloser() {
    const pathname = usePathname()

    // pathname 변경 시 닫힘 (페이지 전환 완료 후 보장)
    useEffect(() => {
        const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
        if (checkbox && checkbox.checked) {
            checkbox.checked = false
        }
    }, [pathname])

    // nav 링크 클릭 즉시 닫힘
    useEffect(() => {
        const closeMenu = () => {
            const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
            if (checkbox && checkbox.checked) {
                checkbox.checked = false
            }
        }

        // aside 내 모든 a 태그 클릭 시 닫기
        const aside = document.querySelector('aside')
        if (!aside) return

        aside.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            // 링크(a 태그) 또는 그 자식 요소 클릭 시
            if (target.closest('a')) {
                closeMenu()
            }
        })

        return () => {
            aside.removeEventListener('click', closeMenu)
        }
    }, [])

    return null
}
