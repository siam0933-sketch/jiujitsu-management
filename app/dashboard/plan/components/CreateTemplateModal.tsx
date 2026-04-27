'use client'

import { useState, useEffect } from 'react'
import { createClassTemplate, updateClassTemplate, ColorSetting, ClassTemplate } from '../actions'

const PRESET_COLORS = [
    { tag: 'bg-blue-500', hex: '#3B82F6' },
    { tag: 'bg-red-500', hex: '#EF4444' },
    { tag: 'bg-green-500', hex: '#10B981' },
    { tag: 'bg-yellow-500', hex: '#F59E0B' },
    { tag: 'bg-purple-500', hex: '#8B5CF6' },
    { tag: 'bg-pink-500', hex: '#EC4899' },
    { tag: 'bg-gray-500', hex: '#6B7280' },
    { tag: 'bg-indigo-500', hex: '#6366F1' },
]

export default function CreateTemplateModal({ 
    onClose,
    colorSettings,
    editingTemplate
}: { 
    onClose: () => void
    colorSettings: ColorSetting[]
    editingTemplate?: ClassTemplate | null
}) {
    const isEditing = !!editingTemplate
    
    // Find settings that have a configured name (if any).
    const activeColors = PRESET_COLORS.map(pc => {
        const configured = colorSettings.find(s => s.color_tag === pc.tag)
        return {
            ...pc,
            name: configured?.label_name || '미지정 색상'
        }
    })
    
    const [title, setTitle] = useState(editingTemplate?.title || '')
    const [subtitle, setSubtitle] = useState(editingTemplate?.subtitle || '')
    const [details, setDetails] = useState(editingTemplate?.details || '')
    const [colorTag, setColorTag] = useState(editingTemplate?.color_tag || activeColors[0].tag)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle case where editingTemplate is passed later (if modal remains mounted, but we usually unmount)
    useEffect(() => {
        if (editingTemplate) {
            setTitle(editingTemplate.title)
            setSubtitle(editingTemplate.subtitle || '')
            setDetails(editingTemplate.details || '')
            setColorTag(editingTemplate.color_tag)
        }
    }, [editingTemplate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return alert('제목을 입력해주세요.')

        const selectedColor = activeColors.find(c => c.tag === colorTag)
        const payload = {
            title,
            subtitle,
            details,
            color_tag: colorTag,
            color_name: selectedColor?.name === '미지정 색상' ? null : selectedColor?.name
        }

        setIsSubmitting(true)
        
        let res
        if (isEditing) {
            res = await updateClassTemplate(editingTemplate.id, payload)
        } else {
            res = await createClassTemplate(payload)
        }

        if (res?.error) {
            alert(res.error)
        } else {
            onClose() // Success
        }
        setIsSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/75 dark:bg-zinc-900/75 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                수업 수정하기
                            </>
                        ) : '새 수업 만들기'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">제목 (필수)</label>
                            <input
                                type="text"
                                required
                                placeholder="예: 저녁 도복 클래스"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-gray-900 dark:text-zinc-100"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">부제목</label>
                            <input
                                type="text"
                                placeholder="예: 초보자 환영"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-gray-900 dark:text-zinc-100"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">세부내용</label>
                            <textarea
                                placeholder="수업 상세 내용을 적어주세요."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-gray-900 dark:text-zinc-100 resize-none"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">컬러 태그 선택</label>
                            <div className="grid grid-cols-2 gap-2">
                                {activeColors.map(color => (
                                    <button
                                        type="button"
                                        key={color.tag}
                                        onClick={() => setColorTag(color.tag)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                                            colorTag === color.tag 
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full shrink-0 ${color.tag}`} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">
                                            {color.name}
                                        </span>
                                        {colorTag === color.tag && (
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSubmitting ? '저장 중...' : (isEditing ? '수정 완료' : '생성 완료')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
