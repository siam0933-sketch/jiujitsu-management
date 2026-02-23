import { getNotices } from './actions'
import Link from 'next/link'
import { PlusIcon, FileTextIcon, Image as ImageIcon } from 'lucide-react'

export default async function NoticeListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const limit = 10
    const { notices, total } = await getNotices(page, limit)

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">공지사항 관리</h2>
                <div className="flex items-center space-x-2">
                    <Link
                        href="/dashboard/notice/create"
                        className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        새 공지 작성
                    </Link>
                </div>
            </div>

            <div className="grid gap-4">
                {notices && notices.length > 0 ? (
                    <div className="border rounded-lg bg-card dark:border-zinc-800">
                        <div className="divide-y dark:divide-zinc-800">
                            {notices.map((notice: any) => (
                                <Link
                                    key={notice.id}
                                    href={`/dashboard/notice/${notice.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">{notice.title}</span>
                                            {notice.images && notice.images.length > 0 && (
                                                <ImageIcon className="w-4 h-4 text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>{notice.profiles?.full_name || '관리자'}</span>
                                            <span>•</span>
                                            <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    </div>
                                    <FileTextIcon className="w-5 h-5 text-zinc-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-zinc-800 text-center">
                        <FileTextIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">등록된 공지사항이 없습니다</h3>
                        <p className="text-sm text-zinc-500 mt-2">새로운 공지사항을 등록하여 회원들에게 소식을 알려주세요.</p>
                        <Link
                            href="/dashboard/notice/create"
                            className="mt-4 px-4 py-2 bg-black text-white outline-none rounded-md hover:bg-zinc-800 dark:bg-white dark:text-black transition-colors"
                        >
                            첫 공지사항 작성하기
                        </Link>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="flex items-center space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <Link
                                key={p}
                                href={`/dashboard/notice?page=${p}`}
                                className={`px-4 py-2 border rounded-md ${page === p ? 'bg-black text-white dark:bg-white dark:text-black font-medium' : 'hover:bg-muted'}`}
                            >
                                {p}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    )
}
