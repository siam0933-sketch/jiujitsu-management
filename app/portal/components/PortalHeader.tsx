'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function PortalHeader() {
    const [isVisible, setIsVisible] = useState(true)
    const lastScrollY = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Show if scrolling up or at the very top
            if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
                setIsVisible(true)
            } else if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
                // Hide if scrolling down and not at top
                setIsVisible(false)
            }

            lastScrollY.current = currentScrollY
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 transition-transform duration-300 z-40 max-w-md mx-auto ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            {/* Left Placeholder for balance (width of icon) */}
            <div className="w-6"></div>

            {/* Center: Dojo Name */}
            <h1 className="text-lg font-bold text-gray-900">
                무짐(MUGYM)
            </h1>

            {/* Right: Message Icon */}
            <Link href="/portal/messages" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Mail size={24} />
            </Link>
        </header>
    )
}
