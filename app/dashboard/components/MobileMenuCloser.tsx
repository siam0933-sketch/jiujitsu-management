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

    // 클릭 시 무조건 닫기 (메뉴 밖이든 안이든 아무데나)
    useEffect(() => {
        const handleInteraction = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target) return

            // 헤더의 메뉴 열기 버튼을 누른 경우는 예외 (클릭 시 열려야 하므로 닫으면 무효화됨)
            if (target.closest('#header-menu-toggle')) {
                return
            }

            const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
            if (checkbox && checkbox.checked) {
                // 클릭 이벤트가 다른 작업을 방해하지 않도록 약간의 딜레이 후 닫기
                setTimeout(() => {
                    checkbox.checked = false
                }, 10)
            }
        }

        // 터치 기기에서도 click 이벤트가 가장 빠르고 부작용(스크롤 중 닫힘 등)이 없음
        document.addEventListener('click', handleInteraction, { capture: true })

        return () => {
            document.removeEventListener('click', handleInteraction, { capture: true })
        }
    }, [])

    return null
}
