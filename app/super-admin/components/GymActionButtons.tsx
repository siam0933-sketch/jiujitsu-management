'use client';

import { useTransition } from 'react';
import { approveGym, rejectGym, resetGymOwnerPassword } from '../actions';
import { CheckCircle, XCircle, Ban, KeyRound } from 'lucide-react';

export function GymActionButtons({ gymId, status }: { gymId: string, status: string }) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('gymId', gymId);
            const res = await approveGym(formData);
            if (res?.error) {
                alert(res.error);
            } else if (res?.success) {
                alert('승인되었습니다.');
            }
        });
    }

    const handleReject = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('gymId', gymId);
            const res = await rejectGym(formData);
            if (res?.error) {
                alert(res.error);
            } else if (res?.success) {
                alert('거절(정지)되었습니다.');
            }
        });
    }

    const handleResetPassword = () => {
        if (!process.browser) return;
        const confirmed = window.confirm("관장님의 비밀번호를 임시 비밀번호로 초기화 하시겠습니까?");
        if (!confirmed) return;

        startTransition(async () => {
            const res = await resetGymOwnerPassword(gymId);
            if (res?.error) {
                alert(res.error);
            } else if (res?.success) {
                alert(`비밀번호가 성공적으로 초기화되었습니다.\n초기화된 임시 비밀번호: ${res.tempPassword}`);
            }
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
            <div className="flex gap-2">
                <button
                    onClick={handleResetPassword}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 dark:border-blue-900/50 text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-400 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                    <KeyRound size={16} /> 비밀번호 초기화
                </button>
                <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                    <Ban size={16} /> 강제 정지
                </button>
            </div>
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
