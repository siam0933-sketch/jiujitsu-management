import { getLatestManual } from './actions'
import ManualEditorClient from './ManualEditorClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminManualPage() {
    const manual = await getLatestManual()

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-1">시스템 사용설명서 편집기</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">관장 대시보드에서 조회될 최신 사용설명서를 작성하거나 수정합니다.</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden p-6">
                <ManualEditorClient initialData={manual} />
            </div>
        </div>
    )
}
