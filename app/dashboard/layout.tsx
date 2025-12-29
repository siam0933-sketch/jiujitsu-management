
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
        return redirect('/login')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800">Gym Manager</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        대시보드
                    </Link>
                    <Link
                        href="/dashboard/members"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        회원 관리
                    </Link>
                    <Link
                        href="/dashboard/attendance"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        출석 관리
                    </Link>
                    <Link
                        href="/dashboard/settings/pricing"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        이용권/결제 설정
                    </Link>
                    <Link
                        href="/dashboard/settings/promotion"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        승급 기준 설정
                    </Link>

                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <form action="/auth/sign-out" method="post">
                            <button className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                로그아웃
                            </button>
                        </form>
                    </div>
                </nav>
            </aside >

            {/* Main Content */}
            < main className="flex-1 overflow-y-auto p-8" >
                {children}
            </main >
        </div >
    )
}
