import { getManualById } from '../actions'
import ManualEditorClient from '../ManualEditorClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuperAdminManualEditPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const manual = await getManualById(params.id)

    if (!manual) return notFound()

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-1">사용설명서 수정</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">기존에 작성된 사용설명서를 수정하거나 삭제합니다.</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden p-6">
                <ManualEditorClient manualId={manual.id} initialData={manual as any} />
            </div>
        </div>
    )
}
