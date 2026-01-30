import { PORTAL_STYLES } from '../styles';
import ChangePasswordForm from './ChangePasswordForm';

export default function SettingsPage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>설정</h1>
            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        계정 비밀번호를 변경할 수 있습니다.
                    </p>
                    <div className="mt-6">
                        <ChangePasswordForm />
                    </div>
                </div>
            </div>

            <div className={`mt-4 ${PORTAL_STYLES.CARD}`}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className="text-xs text-gray-400">
                        * 비밀번호를 분실하신 경우 도장 관리자에게 문의해주세요.
                    </p>
                </div>
            </div>
        </div >
    );
}
