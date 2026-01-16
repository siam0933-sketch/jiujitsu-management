import { PORTAL_STYLES } from '../styles';

export default function PromotionPage() {
    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>승급 심사</h1>
            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        다음 승급까지 남은 기간과 심사 내용을 확인할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
