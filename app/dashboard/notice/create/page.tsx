'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createNotice } from '../actions'
import { ArrowLeftIcon, Loader2, ImageIcon, XIcon } from 'lucide-react'
import Link from 'next/link'

export default function CreateNoticePage() {
    const router = useRouter()
    const supabase = createClient()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...selectedFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.')
            return
        }

        setIsSubmitting(true)

        try {
            const uploadedImageUrls: string[] = []

            // Upload files to Supabase Storage
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${crypto.randomUUID()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('notices')
                    .upload(filePath, file)

                if (uploadError) {
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
                }

                const { data } = supabase.storage
                    .from('notices')
                    .getPublicUrl(filePath)

                uploadedImageUrls.push(data.publicUrl)
            }

            // Save to Database
            const res = await createNotice({
                title,
                content,
                images: uploadedImageUrls
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
                <h2 className="text-2xl font-bold tracking-tight">새 공지사항 작성</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">제목</label>
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
                    <label htmlFor="content" className="text-sm font-medium">내용</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="공지사항 내용을 입력하세요"
                        rows={10}
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-y"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">이미지 첨부 (선택)</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center justify-center px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            <span className="text-sm">사진 선택</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                        <span className="text-xs text-zinc-500">
                            여러 이미지를 추가할 수 있습니다.
                        </span>
                    </div>

                    {files.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {files.map((file, idx) => (
                                <div key={idx} className="relative group rounded-md border border-zinc-200 dark:border-zinc-800 aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${idx + 1}`}
                                        className="object-cover w-full h-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
