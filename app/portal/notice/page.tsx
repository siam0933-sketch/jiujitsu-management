import { PORTAL_STYLES } from '../styles';

export default function NoticePage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>공지사항</h1>
            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        도장의 새로운 소식을 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
