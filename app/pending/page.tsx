import { createAdminClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

export default async function PendingApprovalPage() {
    const supabase = await createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if the gym is still pending
    const { data: gym } = await supabase
        .from('gyms')
        .select('status')
        .eq('owner_id', user.id)
        .single();

    // If active, redirect back to dashboard
    if (gym?.status === 'active') {
        redirect('/dashboard');
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">승인 대기 중</h2>
                    <p className="text-gray-600 dark:text-zinc-400">
                        현재 슈퍼 관리자의 가입 승인을 기다리고 있습니다. 승인이 완료되면 모든 기능을 정상적으로 이용하실 수 있습니다.
                    </p>
                </div>

                <div className="pt-4">
                    <form action="/auth/sign-out" method="post">
                        <button type="submit" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                            로그아웃
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
