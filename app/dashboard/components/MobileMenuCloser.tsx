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

    // nav 링크 클릭 또는 바탕화면 클릭 시 즉시 닫힘
    useEffect(() => {
        const closeMenu = () => {
            const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
            if (checkbox && checkbox.checked) {
                checkbox.checked = false
            }
        }

        const handleInteraction = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement
            if (!target) return

            // 1. 링크(a 태그) 클릭 시 닫기 (메뉴 안에서)
            if (target.closest('a')) {
                closeMenu()
            }
            
            // 2. 바탕화면(오버레이 라벨) 클릭 시 명시적으로 닫기
            // label의 htmlFor 기본 동작이 모바일에서 불완전할 수 있으므로 보완
            if (target.tagName.toLowerCase() === 'label' && target.getAttribute('for') === 'mobile-menu') {
                closeMenu()
            }
        }

        document.addEventListener('click', handleInteraction)
        // 모바일에서의 더 빠른 반응을 위해 touchend 이벤트도 감지 (touchstart는 스크롤과 겹칠 수 있음)
        document.addEventListener('touchend', handleInteraction, { passive: true })

        return () => {
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('touchend', handleInteraction)
        }
    }, [])

    return null
}
