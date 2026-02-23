'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { updateNotice, deleteNotice } from '../actions'
import { Loader2, ImageIcon, XIcon, TrashIcon, Edit2Icon } from 'lucide-react'

export default function NoticeDetailClient({ initialData }: { initialData: any }) {
    const router = useRouter()
    const supabase = createClient()

    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [title, setTitle] = useState(initialData.title)
    const [content, setContent] = useState(initialData.content)
    const [existingImages, setExistingImages] = useState<string[]>(initialData.images || [])
    const [newFiles, setNewFiles] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            setNewFiles(prev => [...prev, ...selectedFiles])
        }
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

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
            let uploadedImageUrls = [...existingImages]

            if (newFiles.length > 0) {
                for (const file of newFiles) {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${crypto.randomUUID()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('notices')
                        .upload(fileName, file)

                    if (uploadError) {
                        throw new Error(`Failed to upload ${file.name}`)
                    }

                    const { data } = supabase.storage
                        .from('notices')
                        .getPublicUrl(fileName)

                    uploadedImageUrls.push(data.publicUrl)
                }
            }

            const res = await updateNotice(initialData.id, {
                title,
                content,
                images: uploadedImageUrls
            })

            if (res.error) throw new Error(res.error)

            setIsEditing(false)
            setNewFiles([])
            // Assuming Next.js revalidatePath updates the page data
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
                        <h3 className="text-2xl font-bold mb-2">{title}</h3>
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

                <div className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 mb-8">
                    {content}
                </div>

                {existingImages.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> 첨부 이미지
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
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-y"
                    required
                />
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium border-l-2 border-black dark:border-white pl-2">첨부 이미지 수정</label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                    <div className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs text-zinc-500">기존 이미지 (클릭하여 삭제)</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {existingImages.map((url, idx) => (
                                <div key={idx} className="relative group rounded-md border border-zinc-200 dark:border-zinc-800 aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <img src={url} alt={`Existing ${idx}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(idx)}
                                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Files */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center justify-center px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            <span className="text-sm">추가할 이미지 선택</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {newFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {newFiles.map((file, idx) => (
                                <div key={idx} className="relative group rounded-md border border-amber-200 dark:border-amber-900 aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewFile(idx)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                    <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded">새 이미지</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => {
                        // Reset form state to initial
                        setTitle(initialData.title)
                        setContent(initialData.content)
                        setExistingImages(initialData.images || [])
                        setNewFiles([])
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
                    className="flex items-center px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
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
