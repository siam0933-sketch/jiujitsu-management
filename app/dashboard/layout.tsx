
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
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        대시보드
                    </Link>
                    <Link
                        href="/dashboard/members"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        회원 관리
                    </Link>
                    <Link
                        href="/dashboard/attendance"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        출석 관리
                    </Link>
                    <Link
                        href="/dashboard/settings/pricing"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        설정
                    </Link>

                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <form action="/auth/sign-out" method="post">
                            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
                                로그아웃
                            </button>
                        </form>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
