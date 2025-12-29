
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Fetch additional info for Sidebar
    const { data: gym } = await supabase
        .from('gyms')
        .select('name')
        .eq('owner_id', user.id)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800">Gym Manager</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2 flex-1">
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
                </nav>

                <div className="p-4 border-t border-gray-200">
                    {/* Gym & Admin Info */}
                    <Link href="/dashboard/settings/gym" className="block mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-white p-1.5 rounded-full border border-gray-200 text-gray-500 group-hover:text-blue-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{gym?.name || '도장 이름 없음'}</p>
                                <p className="text-xs text-gray-500 group-hover:text-gray-700">{profile?.full_name || '관리자'}</p>
                            </div>
                        </div>
                    </Link>

                    <form action="/auth/sign-out" method="post">
                        <button className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            로그아웃
                        </button>
                    </form>
                </div>
            </aside >

            {/* Main Content */}
            < main className="flex-1 overflow-y-auto p-8" >
                {children}
            </main >
        </div >
    )
}
