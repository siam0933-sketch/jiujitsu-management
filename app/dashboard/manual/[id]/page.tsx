import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ManualViewerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: manual } = await supabase
        .from('system_manuals')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!manual) return notFound()

    return (
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="mb-4 mt-2">
                <Link href="/dashboard/manual" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    목록으로 가기
                </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-2">
                <div className="border-b border-gray-200 dark:border-zinc-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-zinc-800/50 gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-tight">
                        {manual.title}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 font-medium whitespace-nowrap">
                        작성일: {new Date(manual.created_at).toLocaleDateString()}
                    </p>
                </div>
                
                <div className="p-6 sm:p-10 min-h-[500px]">
                    <div 
                        className="prose prose-indigo dark:prose-invert max-w-none 
                                    prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-gray-200 dark:prose-img:border-zinc-800
                                    prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
                        dangerouslySetInnerHTML={{ __html: manual.content }} 
                    />
                </div>
            </div>
        </div>
    )
}
