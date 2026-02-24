import SettingsTabs from './components/SettingsTabs'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-zinc-100 sm:truncate sm:text-3xl sm:tracking-tight">
                    설정
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    체육관 운영에 필요한 기준과 옵션을 설정합니다.
                </p>
            </div>

            <SettingsTabs />

            {/* Pages will provide their own wrappers */}
            <div className="mt-4">
                {children}
            </div>
        </div>
    )
}
