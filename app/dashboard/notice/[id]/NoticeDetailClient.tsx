'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateNotice, deleteNotice } from '../actions'
import { Loader2, TrashIcon, Edit2Icon, ImageIcon } from 'lucide-react'
import NoticeEditor from '../../components/NoticeEditor'

export default function NoticeDetailClient({ initialData }: { initialData: any }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [title, setTitle] = useState(initialData.title)
    const [content, setContent] = useState(initialData.content)
    // We keep existing images just in case this is a legacy post without HTML images
    const [existingImages, setExistingImages] = useState<string[]>(initialData.images || [])

    const handleDelete = async () => {
        if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) return
        setIsDeleting(true)
        try {
            const res = await deleteNotice(initialData.id)
            if (res.error) throw new Error(res.error)
            router.push('/dashboard/notice')
        } catch (error: any) {
            console.error('Error deleting notice:', error)
            alert('삭제 중 오류가 발생했습니다.')
            setIsDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await updateNotice(initialData.id, {
                title,
                content,
                images: existingImages // Keeping legacy images, new ones are in HTML
            })

            if (res.error) throw new Error(res.error)

            setIsEditing(false)
            router.refresh()
        } catch (error: any) {
            console.error('Error updating notice:', error)
            alert('수정 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isEditing) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">{title}</h3>
                        <div className="text-sm text-zinc-500 flex gap-3">
                            <span>작성자: {initialData.profiles?.full_name || '관리자'}</span>
                            <span>작성일: {new Date(initialData.created_at).toLocaleString('ko-KR')}</span>
                            {initialData.updated_at && initialData.updated_at !== initialData.created_at && (
                                <span>(수정됨: {new Date(initialData.updated_at).toLocaleString('ko-KR')})</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="수정"
                        >
                            <Edit2Icon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="삭제"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div
                    className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-8"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Legacy Images Support */}
                {existingImages.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> 첨부 이미지 (이전 버전)
                        </h4>
                        <div className="flex flex-col gap-6">
                            {existingImages.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`첨부 이미지 ${idx + 1}`}
                                    className="max-w-full rounded-md border border-zinc-200 dark:border-zinc-800 object-contain shadow-sm max-h-[600px] w-auto"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium border-l-2 border-black dark:border-white pl-2">제목</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium border-l-2 border-black dark:border-white pl-2">내용</label>
                <NoticeEditor content={content} onChange={setContent} />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => {
                        setTitle(initialData.title)
                        setContent(initialData.content)
                        setExistingImages(initialData.images || [])
                        setIsEditing(false)
                    }}
                    className="px-4 py-2 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                    disabled={isSubmitting}
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...</>
                    ) : (
                        '저장'
                    )}
                </button>
            </div>
        </form>
    )
}
