'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface PortalHeaderProps {
    dojoName?: string
    unreadCount?: number
}

export default function PortalHeader({ dojoName, unreadCount = 0 }: PortalHeaderProps) {
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
            className={`fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] bg-white border-b border-gray-100 transition-transform duration-300 z-40 max-w-md mx-auto ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="h-14 flex items-center justify-between px-4">
                {/* Left Placeholder for balance */}
                <div className="w-8" />

                {/* Center: Dojo Name */}
                <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">
                    {dojoName || '무짐(MUGYM)'}
                </h1>

                {/* Right: Message Icon with unread badge */}
                <Link href="/portal/messages" className="relative text-gray-600 hover:text-indigo-600 transition-colors p-1">
                    <MessageCircle size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    )
}
