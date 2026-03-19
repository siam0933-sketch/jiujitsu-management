import { PORTAL_STYLES } from '../../styles';
import { getPortalNoticeById } from '../actions';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { notice } = await getPortalNoticeById(id);

    if (!notice) {
        return (
            <div className={PORTAL_STYLES.CONTAINER}>
                <div className="mb-6">
                    <Link href="/portal/notice" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors pb-1 border-b border-transparent hover:border-black dark:hover:border-white">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> 목록으로
                    </Link>
                </div>
                <div className={`${PORTAL_STYLES.CARD} p-8 text-center`}>
                    <p className={PORTAL_STYLES.TEXT_BODY}>공지사항을 찾을 수 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <div className="mb-6">
                <Link href="/portal/notice" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors pb-1 border-b border-transparent hover:border-black dark:hover:border-white">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> 목록으로
                </Link>
            </div>

            <article className={`${PORTAL_STYLES.CARD} overflow-hidden`}>
                <div className={`${PORTAL_STYLES.CARD_PADDING} border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3`}>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {notice.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 w-full">
                        <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-300">
                                {notice.profiles?.full_name?.charAt(0) || '관'}
                            </span>
                            {notice.profiles?.full_name || '관리자'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(notice.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                </div>

                <div className={`${PORTAL_STYLES.CARD_PADDING} space-y-8`}>
                    <div
                        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-8 prose-p:my-1 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                    />

                    {notice.images && notice.images.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            {notice.images.map((url: string, idx: number) => (
                                <div key={idx} className="flex justify-center">
                                    <img
                                        src={url}
                                        alt={`공지사항 이미지 ${idx + 1}`}
                                        className="max-w-full rounded-md border border-zinc-200 dark:border-zinc-800 object-contain shadow-sm"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
