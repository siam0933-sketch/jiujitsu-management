import { LogOut, AlertCircle } from 'lucide-react';
import { PORTAL_STYLES } from '../styles';
import ChangePasswordForm from './ChangePasswordForm';
import { getMemberProfileData } from './actions';
import { displayBeltName } from '@/app/dashboard/members/constants';
import { getPaymentStatus } from '@/utils/payment';

export default async function ProfilePage() {
    const data = await getMemberProfileData();
    if (!data || !data.member) return <div>정보를 불러올 수 없습니다.</div>;

    const { member, payments } = data;
    const paymentInfo = getPaymentStatus(member);
    const isUnpaid = paymentInfo.status === 'unpaid';

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>내 정보</h1>

            <div className={`${PORTAL_STYLES.CARD} mb-6`}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>기본 정보</h2>
                    <ul className="mt-4 space-y-4 text-sm text-gray-700">
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">이름</span>
                            <span className="font-semibold text-gray-900">{member.name}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">현재 등급</span>
                            <span className="font-semibold text-gray-900">{member.belt ? displayBeltName(member.belt) : '-'}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">전화번호</span>
                            <span className="font-medium">{member.phone || '-'}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">최초 등록일</span>
                            <span className="font-medium">{member.joined_at ? new Date(member.joined_at).toLocaleDateString('ko-KR') : '-'}</span>
                        </li>
                        <li className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">다음 결제 예정일 (참고용)</span>
                            <span className="font-medium">
                                {member.payment_end_date
                                    ? new Date(member.payment_end_date).toLocaleDateString('ko-KR')
                                    : (member.payment_due_day ? `매월 ${member.payment_due_day}일` : '-')}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className={`${PORTAL_STYLES.CARD} mb-6`}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>결제 내역</h2>

                    {isUnpaid && (
                        <div className="mt-3 mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="font-medium leading-relaxed">
                                결제 예정일을 <strong className="text-red-700">{Math.abs(paymentInfo.diffDays)}일</strong> 지났습니다.<br />
                                관장님께 회비 납부를 문의해 주세요.
                            </p>
                        </div>
                    )}

                    {payments.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            결제 내역이 없습니다.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {payments.map(payment => (
                                <li key={payment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {payment.plan_snapshot?.plan_name || '일반 결제'}
                                            </p>
                                            {payment.plan_snapshot?.options_summary && (
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                    <span className="font-medium text-gray-400">옵션:</span> {payment.plan_snapshot.options_summary}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 shrink-0 ml-2">
                                            {payment.payment_method === 'card' ? '카드' : payment.payment_method === 'cash' ? '현금' : '계좌이체'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mt-1 border-t border-gray-200/60 pt-2">
                                        <span className="text-[14px] font-bold text-gray-900">
                                            {payment.amount.toLocaleString()}원
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{new Date(payment.payment_date).toLocaleDateString('ko-KR')}</span>
                                            {payment.memo && (
                                                <>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="truncate max-w-[100px] text-right" title={payment.memo}>{payment.memo}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <ChangePasswordForm />

            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>계정 로그아웃</h2>
                    <form action="/auth/sign-out" method="post">
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl border border-red-100 hover:bg-red-100 transition-colors active:scale-95 flex items-center justify-center gap-2"
                        >
                            <LogOut size={20} />
                            로그아웃
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
