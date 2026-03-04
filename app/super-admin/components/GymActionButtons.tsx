'use client';

import { useTransition } from 'react';
import { approveGym, rejectGym } from '../actions';
import { CheckCircle, XCircle, Ban } from 'lucide-react';

export function GymActionButtons({ gymId, status }: { gymId: string, status: string }) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        startTransition(() => {
            const formData = new FormData();
            formData.append('gymId', gymId);
            approveGym(formData);
        });
    }

    const handleReject = () => {
        startTransition(() => {
            const formData = new FormData();
            formData.append('gymId', gymId);
            rejectGym(formData);
        });
    }

    if (status === 'pending') {
        return (
            <>
                <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                >
                    <CheckCircle size={16} /> 승인(Approve)
                </button>
                <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                >
                    <XCircle size={16} /> 거절(Reject)
                </button>
            </>
        )
    }

    if (status === 'active') {
        return (
            <button
                onClick={handleReject}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
                <Ban size={16} /> 강제 정지
            </button>
        )
    }

    // rejected status
    return (
        <button
            onClick={handleApprove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 dark:border-emerald-900/50 text-sm leading-4 font-medium rounded-md text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
        >
            <CheckCircle size={16} /> 다시 승인
        </button>
    )
}
