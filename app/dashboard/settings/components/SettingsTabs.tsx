'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsTabs() {
    const pathname = usePathname()

    const tabs = [
        { name: '도장/관리자 정보', href: '/dashboard/settings/gym' },
        { name: '이용권/결제 설정', href: '/dashboard/settings/pricing' },
        { name: '승급 기준 설정', href: '/dashboard/settings/promotion' },
        { name: '약관 설정', href: '/dashboard/settings/terms' },
    ]

    return (
        <div className="border-b border-gray-200 dark:border-zinc-800 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${isActive
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:border-zinc-700'
                                }
                            `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {tab.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
