import React from 'react';
import { AlertCircle, CalendarClock } from 'lucide-react';
import { getPaymentStatus } from '@/utils/payment';

interface PaymentAlertProps {
    member: {
        payment_end_date?: string | null;
        payment_due_day?: number | null;
    };
}

export default function PaymentAlert({ member }: PaymentAlertProps) {
    const status = getPaymentStatus(member);

    if (status.status === 'normal' || status.diffDays > 5) {
        return null;
    }

    let message = '';
    let bgColor = '';
    let textColor = '';
    let icon = null;

    if (status.status === 'unpaid') {
        message = "결제일이 지났습니다. 체육관에 문의해 주세요.";
        bgColor = "bg-red-50 dark:bg-red-900/20";
        textColor = "text-red-700 dark:text-red-400";
        icon = <AlertCircle className="w-5 h-5" />;
    } else if (status.diffDays === 0) {
        message = "오늘이 결제 예정일입니다.";
        bgColor = "bg-amber-50 dark:bg-amber-900/20";
        textColor = "text-amber-700 dark:text-amber-400";
        icon = <CalendarClock className="w-5 h-5" />;
    } else if (status.diffDays <= 5) {
        message = `결제 예정일이 D-${status.diffDays} 남았습니다.`;
        bgColor = "bg-amber-50 dark:bg-amber-900/20";
        textColor = "text-amber-700 dark:text-amber-400";
        icon = <CalendarClock className="w-5 h-5" />;
    }

    return (
        <div className={`mb-6 p-4 rounded-xl border ${bgColor} border-current/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500`}>
            <div className="flex-shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-semibold ${textColor}`}>
                    {message}
                </p>
                <p className="text-xs mt-1 opacity-70">
                    원활한 수련을 위해 정해진 날짜에 결제 부탁드립니다.
                </p>
            </div>
        </div>
    );
}
