'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, TrendingUp, User, Home } from 'lucide-react';
import { PORTAL_STYLES } from '../styles';
import { cn } from '@/utils/cn'; // Assuming utils/cn exists, if not I'll use template literals but cn is safer for existing project

const NAV_ITEMS = [
    {
        label: '홈',
        href: '/portal/notice',
        icon: Home,
    },
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
];

export default function BottomNav({ hasUnpaidDues }: { hasUnpaidDues?: boolean }) {
    const pathname = usePathname();

    return (
        <nav className={PORTAL_STYLES.NAV_BAR}>
            <div className="flex w-full max-w-md mx-auto justify-between items-center relative">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const isProfile = item.href === '/portal/profile';
                    const showBadge = isProfile && hasUnpaidDues;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                PORTAL_STYLES.NAV_ITEM,
                                isActive ? PORTAL_STYLES.NAV_ITEM_ACTIVE : PORTAL_STYLES.NAV_ITEM_INACTIVE,
                                "relative"
                            )}
                        >
                            <div className="relative">
                                <Icon size={PORTAL_STYLES.NAV_ICON_SIZE} strokeWidth={isActive ? 2.5 : 2} />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full h-4 w-4 sm:h-4.5 sm:w-4.5 flex items-center justify-center border border-white">
                                        1
                                    </span>
                                )}
                            </div>
                            <span className={PORTAL_STYLES.NAV_LABEL}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
