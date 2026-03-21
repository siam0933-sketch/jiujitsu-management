import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ManualsListPage() {
    const supabase = await createClient()
    const { data: manuals } = await supabase
        .from('system_manuals')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

    return (
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-4">
                <div className="border-b border-gray-200 dark:border-zinc-800 px-6 py-5 flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/50">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                        <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={32} height={32} className="rounded-lg" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">My jiu-jitsu 사용설명서</h1>
                </div>
                
                <div className="p-0">
                    <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {!manuals || manuals.length === 0 ? (
                            <li className="p-10 text-center text-gray-500 dark:text-zinc-400">
                                등록된 사용설명서가 없습니다.
                            </li>
                        ) : (
                            manuals.map(manual => (
                                <li key={manual.id}>
                                    <Link href={`/dashboard/manual/${manual.id}`} className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors p-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100 truncate pr-4">{manual.title}</p>
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                <span className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{new Date(manual.created_at).toLocaleDateString()}</span>
                                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
