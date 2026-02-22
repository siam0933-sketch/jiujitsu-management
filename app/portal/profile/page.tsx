import { LogOut } from 'lucide-react';
import { PORTAL_STYLES } from '../styles';
import ChangePasswordForm from './ChangePasswordForm';

export default function ProfilePage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>내 정보</h1>
            <div className={`${PORTAL_STYLES.CARD} mb-6`}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>기본 정보</h2>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        회원님의 개인 정보를 확인하고 수정할 수 있습니다.
                    </p>
                </div>
            </div>

            <div className={`${PORTAL_STYLES.CARD} mb-6`}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>비밀번호 변경</h2>
                    <ChangePasswordForm />
                </div>
            </div>

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
