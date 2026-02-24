'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotice } from '../actions'
import { ArrowLeftIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import NoticeEditor from '../../components/NoticeEditor'

export default function CreateNoticePage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim() || content === '<p></p>') {
            alert('제목과 내용을 입력해주세요.')
            return
        }

        setIsSubmitting(true)

        try {
            // Save to Database
            const res = await createNotice({
                title,
                content,
                images: [] // Images are embedded directly into HTML via Storage in NoticeEditor
            })

            if (res.error) {
                throw new Error(res.error)
            }

            router.push('/dashboard/notice')
        } catch (error: any) {
            console.error('Error creating notice:', error)
            alert(error.message || '공지사항 작성 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center space-x-4 mb-6">
                <Link
                    href="/dashboard/notice"
                    className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">새 공지사항 작성</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium border-l-2 border-black dark:border-white pl-2">제목</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="공지사항 제목을 입력하세요"
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium border-l-2 border-black dark:border-white pl-2">내용</label>
                    <NoticeEditor content={content} onChange={setContent} />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                등록 중...
                            </>
                        ) : (
                            '공지 등록'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
