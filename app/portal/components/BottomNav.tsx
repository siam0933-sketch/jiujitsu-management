'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, TrendingUp, User, Bell, Settings } from 'lucide-react';
import { PORTAL_STYLES } from '../styles';
import { cn } from '@/utils/cn'; // Assuming utils/cn exists, if not I'll use template literals but cn is safer for existing project

const NAV_ITEMS = [
    {
        label: '출석',
        href: '/portal/attendance',
        icon: CalendarCheck,
    },
    {
        label: '승급',
        href: '/portal/promotion',
        icon: TrendingUp,
    },
    {
        label: '내 정보',
        href: '/portal/profile',
        icon: User,
    },
    {
        label: '공지사항',
        href: '/portal/notice',
        icon: Bell,
    },
    {
        label: '설정',
        href: '/portal/settings',
        icon: Settings,
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className={PORTAL_STYLES.NAV_BAR}>
            <div className="flex w-full max-w-md mx-auto justify-between items-center">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                PORTAL_STYLES.NAV_ITEM,
                                isActive ? PORTAL_STYLES.NAV_ITEM_ACTIVE : PORTAL_STYLES.NAV_ITEM_INACTIVE
                            )}
                        >
                            <Icon size={PORTAL_STYLES.NAV_ICON_SIZE} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={PORTAL_STYLES.NAV_LABEL}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
