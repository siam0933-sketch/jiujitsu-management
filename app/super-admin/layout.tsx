import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify 'super_admin' role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                        Super Admin Portal
                    </h1>
                    <nav className="hidden sm:flex items-center space-x-6">
                        <Link href="/super-admin" className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            도장 관리 (Gyms)
                        </Link>
                        <Link href="/super-admin/notices" className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            시스템 공지사항 (Notices)
                        </Link>
                        <Link href="/super-admin/manual" className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            사용설명서 (Manual)
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <form action="/auth/sign-out" method="post">
                        <button className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-red-600 transition-colors">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-12">
                {children}
            </main>
        </div>
    );
}
