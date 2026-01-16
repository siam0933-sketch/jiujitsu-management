import { PORTAL_STYLES } from '../styles';

export default function SettingsPage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>설정</h1>
            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        앱 설정을 변경할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
