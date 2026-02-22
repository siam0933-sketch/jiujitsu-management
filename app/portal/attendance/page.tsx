import { PORTAL_STYLES } from '../styles';
import { getTodayAttendanceStatus, getAttendanceHistory } from './actions';
import AttendanceRequestButton from './AttendanceRequestButton';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceStats from './AttendanceStats';

export default async function AttendancePage() {
    const status = await getTodayAttendanceStatus();

    const attendanceResult = await getAttendanceHistory();

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>출석 현황</h1>

            {/* Calendar Section */}
            {attendanceResult.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    <p className="font-bold">데이터 로딩 오류</p>
                    <p>{attendanceResult.error}</p>
                </div>
            )}

            <AttendanceStats attendanceDates={attendanceResult.data} />
            <AttendanceCalendar attendanceDates={attendanceResult.data} />

            <div className="mb-6">
                <AttendanceRequestButton initialStatus={status} />
            </div>

            <div className={PORTAL_STYLES.CARD}>
                <div className={PORTAL_STYLES.CARD_PADDING}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>
                        * 출석 버튼을 누르면 관리자에게 요청이 전송됩니다.<br />
                        * 5분 후 하원 처리가 가능합니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
