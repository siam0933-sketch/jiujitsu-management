import { getNoticeById } from '../actions'
import NoticeDetailClient from './NoticeDetailClient'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { notice } = await getNoticeById(id)

    if (!notice) {
        return (
            <div className="flex-1 p-8 pt-6">
                <div className="mb-6">
                    <Link href="/dashboard/notice" className="flex items-center text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" /> 목록으로
                    </Link>
                </div>
                <div>공지사항을 찾을 수 없습니다.</div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-4 md:p-8 pt-6 w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link
                    href="/dashboard/notice"
                    className="p-2 -ml-2 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold tracking-tight">공지사항 관리</h2>
            </div>
            <NoticeDetailClient initialData={notice} />
        </div>
    )
}
