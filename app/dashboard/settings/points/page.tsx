import { getPointSettings, ensureDefaultPointSettings } from './actions'
import PointSettingsClient from './PointSettingsClient'

export default async function PointsSettingsPage() {
    await ensureDefaultPointSettings()
    const settings = await getPointSettings()

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">포인트 적립 설정</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    자동 적립 조건과 수동 적립 항목을 관리합니다. 비활성화된 항목은 포인트가 쌓이지 않습니다.
                </p>
            </div>
            <PointSettingsClient settings={settings} />
        </div>
    )
}
