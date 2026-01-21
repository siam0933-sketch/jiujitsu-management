import { PORTAL_STYLES } from '../styles';
import { getTodayAttendanceStatus } from './actions';
import AttendanceRequestButton from './AttendanceRequestButton';

export default async function AttendancePage() {
    const status = await getTodayAttendanceStatus();

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>출석 현황</h1>

            <div className="mb-6">
                <AttendanceRequestButton initialStatus={status} />
            </div>

            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        최근 출석 기록이 여기에 표시됩니다.
                    </p>
                    {/* List of recent attendance can be added here later */}
                </div>
            </div>
        </div>
    );
}
