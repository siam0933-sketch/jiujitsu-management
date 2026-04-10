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

    // 사이드바 또는 바탕화면 클릭 시 닫기
    useEffect(() => {
        const handleClose = () => {
             const checkbox = document.getElementById('mobile-menu') as HTMLInputElement
             // 약간의 딜레이를 주어 Link 네비게이션 동작을 방해하지 않게 함
             if (checkbox && checkbox.checked) {
                 setTimeout(() => {
                     checkbox.checked = false
                 }, 10)
             }
        }
        
        const aside = document.getElementById('sidebar-menu')
        const backdrop = document.getElementById('sidebar-backdrop')
        
        if (aside) aside.addEventListener('click', handleClose)
        if (backdrop) backdrop.addEventListener('click', handleClose)
        
        return () => {
            if (aside) aside.removeEventListener('click', handleClose)
            if (backdrop) backdrop.removeEventListener('click', handleClose)
        }
    }, [])

    return null
}
