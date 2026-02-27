import { createAdminClient } from '@/utils/supabase/server';
import { approveGym, rejectGym } from './actions';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default async function SuperAdminPage() {
    const supabase = await createAdminClient();

    // Fetch all pending gyms along with the owner details
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending gyms:', error);
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Pending Approvals</h2>
                <p className="text-gray-500 dark:text-zinc-400 mt-1 text-sm">Review newly registered gyms and decide whether to approve or reject their access.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {(!gyms || gyms.length === 0) ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-75" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All Caught Up!</h3>
                        <p className="mt-1">There are no pending gym approvals at this time.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
                            <thead className="bg-gray-50 dark:bg-zinc-950/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">Gym Info</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">Master Info</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">Registered</th>
                                    <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {gyms.map((gym: any) => (
                                    <tr key={gym.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-zinc-100">{gym.name}</div>
                                            <div className="text-gray-500 text-xs mt-1">BIZ No: {gym.business_registration_number || 'N/A'}</div>
                                            <div className="text-gray-500 text-xs truncate max-w-[200px]" title={gym.address}>Addr: {gym.address || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-zinc-100">{gym.owner?.full_name || 'Unknown'}</div>
                                            <div className="text-gray-500 text-xs mt-1">{gym.owner?.email}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{gym.owner?.phone || 'No phone'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded-md max-w-max border border-amber-200 dark:border-amber-800">
                                                <Clock size={14} />
                                                Pending
                                            </div>
                                            <div className="text-xs mt-2 opacity-70">
                                                {new Date(gym.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <form action={approveGym}>
                                                    <input type="hidden" name="gymId" value={gym.id} />
                                                    <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                </form>
                                                <form action={rejectGym}>
                                                    <input type="hidden" name="gymId" value={gym.id} />
                                                    <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </form>
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
