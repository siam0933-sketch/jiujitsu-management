import { PORTAL_STYLES } from '../styles';

export default function ProfilePage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>내 정보</h1>
            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <h2 className={PORTAL_STYLES.HEADING_MD}>기본 정보</h2>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        회원님의 개인 정보를 확인하고 수정할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
