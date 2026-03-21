import { createAdminClient } from '@/utils/supabase/server';
import { Clock, Check, CheckCircle, Ban } from 'lucide-react';
import Link from 'next/link';
import { GymActionButtons } from './components/GymActionButtons';
import StorageOptimizer from './components/StorageOptimizer';

export default async function SuperAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const supabase = await createAdminClient();
    const resolvedParams = await searchParams;
    const currentTab = resolvedParams?.status || 'active'; // 'active', 'pending', 'rejected'

    // Fetch gyms based on current tab
    const { data: gyms, error } = await supabase
        .from('gyms')
        .select(`
            id,
            name,
            address,
            phone,
            business_registration_number,
            status,
            created_at,
            owner:profiles!gyms_owner_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .eq('status', currentTab)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gyms:', error);
    }

    const tabs = [
        { id: 'active', label: '운영 중 (Active)', icon: Check },
        { id: 'pending', label: '가입 대기 (Pending)', icon: Clock },
        { id: 'rejected', label: '거절됨 (Rejected)', icon: Ban },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">도장 전체 관리</h2>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1 text-sm">
                        플랫폼을 이용하는 전체 도장을 상태별로 조회하고 상태를 관리합니다.
                    </p>
                </div>
                <StorageOptimizer />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-zinc-800">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => {
                        const bgIcon = tab.id === 'active' ? 'text-emerald-500' : tab.id === 'pending' ? 'text-amber-500' : 'text-red-500';
                        const isActive = currentTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                href={`/super-admin?status=${tab.id}`}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                                    ${isActive
                                        ? 'border-red-500 text-red-600 dark:border-red-500 dark:text-red-400'
                                        : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700'
                                    }
                                `}
                            >
                                <tab.icon size={16} className={isActive ? 'text-red-500' : 'text-gray-400'} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {(!gyms || gyms.length === 0) ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        {currentTab === 'pending' ? (
                            <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-75" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded-full flex items-center justify-center mb-4"><span className="text-xl">!</span></div>
                        )}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {currentTab === 'pending' ? '대기 중인 도장이 없습니다!' : '해당 상태의 도장이 없습니다.'}
                        </h3>
                        <p className="mt-1 text-sm">항목이 추가되면 이곳에 표시됩니다.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
                            <thead className="bg-gray-50 dark:bg-zinc-950/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">도장 정보 (Gym)</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">관장 정보 (Master)</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">등록/가입일</th>
                                    <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">관리 (Actions)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {gyms.map((gym: any) => (
                                    <tr key={gym.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-zinc-100">{gym.name}</div>
                                            <div className="text-gray-500 text-xs mt-1">사업자번호: {gym.business_registration_number || '미기재'}</div>
                                            <div className="text-gray-500 text-xs truncate max-w-[200px]" title={gym.address}>주소: {gym.address || '미기재'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-zinc-100">{gym.owner?.full_name || 'Alian'}</div>
                                            <div className="text-gray-500 text-xs mt-1">{gym.owner?.email}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{gym.owner?.phone || '미기재'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {currentTab === 'pending' && (
                                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded-md max-w-max border border-amber-200 dark:border-amber-800 mb-2">
                                                    <Clock size={14} />
                                                    대기중
                                                </div>
                                            )}
                                            {currentTab === 'active' && (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-md max-w-max border border-emerald-200 dark:border-emerald-800 mb-2">
                                                    <Check size={14} />
                                                    운영중
                                                </div>
                                            )}
                                            {currentTab === 'rejected' && (
                                                <div className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-md max-w-max border border-red-200 dark:border-red-800 mb-2">
                                                    <Ban size={14} />
                                                    거절됨
                                                </div>
                                            )}
                                            <div className="text-xs opacity-70">
                                                {new Date(gym.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <div className="flex justify-end gap-2">
                                                    <GymActionButtons gymId={gym.id} status={currentTab} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
