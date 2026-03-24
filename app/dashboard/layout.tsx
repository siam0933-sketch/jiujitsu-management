
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPendingAttendanceCount } from './attendance/actions'
import MobileMenuCloser from './components/MobileMenuCloser'
import AppModeInit from './components/AppModeInit'
import AppModeLogoutButton from './components/AppModeLogoutButton'

import { headers } from 'next/headers'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        const headersList = await headers()
        const pathname = headersList.get('x-pathname') || '/dashboard'
        
        if (pathname === '/dashboard/attendance/kiosk') {
            return redirect('/kiosk/login')
        }
        
        return redirect(`/admin/login?next=${encodeURIComponent(pathname)}`)
    }

    // Verify the logged-in user is a gym_master
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'gym_master' && profile?.role !== 'super_admin') {
        const headersList = await headers()
        const pathname = headersList.get('x-pathname') || '/dashboard'
        return redirect(`/admin/login?next=${encodeURIComponent(pathname)}`)
    }

    // Fetch additional info for Sidebar
    const { data: gym } = await supabase
        .from('gyms')
        .select('name')
        .eq('owner_id', user.id)
        .single()

    const adminProfile = profile

    const pendingCount = await getPendingAttendanceCount()

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-black overflow-hidden">
            {/* Persist app mode to localStorage */}
            <AppModeInit />
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-gray-200 dark:border-zinc-800 shadow-sm shrink-0 z-40">
                <div className="flex items-center gap-2">
                    <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={32} height={32} className="rounded-md" />
                    <h1 className="text-xl font-extrabold text-gray-800 dark:text-zinc-100 tracking-tight">My jiu-jitsu</h1>
                </div>
                <label htmlFor="mobile-menu" className="p-2 -mr-2 text-gray-600 dark:text-zinc-400 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors active:bg-gray-200 dark:active:bg-zinc-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </label>
            </div>

            {/* Sidebar Responsive Wrapper */}
            <div className="group fixed inset-y-0 left-0 z-50 flex h-full pointer-events-none md:static md:z-auto md:pointer-events-auto">
                {/* Mobile Menu Toggle Checkbox (Invisible) */}
                <input type="checkbox" id="mobile-menu" className="peer hidden" />

                {/* Mobile Backdrop Overlay */}
                <label
                    htmlFor="mobile-menu"
                    className="fixed inset-0 bg-black/40 opacity-0 pointer-events-none transition-opacity duration-300 peer-checked:opacity-100 peer-checked:pointer-events-auto md:hidden"
                />

                {/* Invisible trigger area for mobile/small screens (keep for mouse edge-cases) */}
                <div className="w-6 h-full bg-transparent pointer-events-auto md:hidden" />

                {/* Mobile Menu Closer (Client Component) */}
                <MobileMenuCloser />

                {/* Sidebar */}
                <aside className="pointer-events-auto absolute left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 -translate-x-full peer-checked:translate-x-0 group-hover:translate-x-0 md:static md:translate-x-0 md:shadow-md dark:border-r dark:border-zinc-800 pb-[env(safe-area-inset-bottom)]">
                    <div className="p-6 md:block flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={40} height={40} className="rounded-xl shadow-sm" />
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 tracking-tight">My jiu-jitsu</h1>
                        </div>
                        <label htmlFor="mobile-menu" className="md:hidden p-2 -mr-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-300 cursor-pointer">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </label>
                    </div>
                    <nav className="mt-6 px-4 space-y-2 flex-1">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            대시보드
                        </Link>
                        <Link
                            href="/dashboard/members"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            회원 관리
                        </Link>
                        <Link
                            href="/dashboard/attendance"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>

                            출석 관리
                            {pendingCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/dashboard/shuttle"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M5 13a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4zM3 13V8a3 3 0 013-3h12a3 3 0 013 3v5" />
                            </svg>
                            차량 운행
                        </Link>
                        <Link
                            href="/dashboard/notice"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            공지사항
                        </Link>
                        <Link
                            href="/dashboard/team"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            마이 팀
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            설정
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                        {/* Gym & Admin Info */}
                        <Link href="/dashboard/account" className="block mb-4 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors group">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-white dark:bg-zinc-800 p-1.5 rounded-full border border-gray-200 dark:border-zinc-800 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{gym?.name || '도장 이름 없음'}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 dark:text-zinc-500 group-hover:text-gray-700 dark:text-zinc-300 dark:group-hover:text-zinc-300">{adminProfile?.full_name || '관리자'}</p>
                                </div>
                            </div>
                        </Link>

                        <AppModeLogoutButton />
                    </div>
                </aside>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 sm:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gray-100 dark:bg-black">
                <div className="w-full mx-auto h-full">
                    {children}
                </div>
            </main>
        </div >
    )
}
