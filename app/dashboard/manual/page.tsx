import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function ManualViewerPage() {
    const supabase = await createClient()
    const { data: manual } = await supabase
        .from('system_manuals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return (
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-4">
                <div className="border-b border-gray-200 dark:border-zinc-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-zinc-800/50 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                            <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={32} height={32} className="rounded-lg" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">My jiu-jitsu 사용방법</h1>
                    </div>
                    {manual && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 font-medium">
                            최종 업데이트: {new Date(manual.created_at).toLocaleDateString()}
                        </p>
                    )}
                </div>
                
                <div className="p-6 sm:p-10 min-h-[500px]">
                    {manual ? (
                        <div 
                            className="prose prose-indigo dark:prose-invert max-w-none 
                                     prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-gray-200 dark:prose-img:border-zinc-800
                                     prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
                            dangerouslySetInnerHTML={{ __html: manual.content }} 
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-32 text-gray-500 dark:text-zinc-400">
                            <svg className="w-16 h-16 text-gray-300 dark:text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 dark:text-zinc-100">현재 등록된 사용설명서가 없습니다.</p>
                            <p className="text-sm mt-2">시스템 관리자가 업데이트할 예정입니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
