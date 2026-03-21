import { getManuals } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuperAdminManualListPage() {
    const manuals = await getManuals()

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-1">시스템 사용설명서 관리</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">관장 대시보드에 노출될 여러 개의 사용설명서를 관리합니다.</p>
                </div>
                <Link 
                    href="/super-admin/manual/create"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                    새 설명서 작성
                </Link>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">제목</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider w-48">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {manuals.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-zinc-400">
                                    등록된 사용설명서가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            manuals.map(manual => (
                                <tr key={manual.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/super-admin/manual/${manual.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {manual.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-zinc-400">
                                        {new Date(manual.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
