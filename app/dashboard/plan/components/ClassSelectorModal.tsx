'use client'

import { useState } from 'react'
import { ClassTemplate } from '../actions'

type Props = {
    selectedDate: string // YYYY-MM-DD
    templates: ClassTemplate[]
    onClose: () => void
    onSelect: (templateId: string) => Promise<void>
}

export default function ClassSelectorModal({ selectedDate, templates, onClose, onSelect }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSelect = async (id: string) => {
        setIsSubmitting(true)
        await onSelect(id)
        setIsSubmitting(false)
        onClose()
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/75 dark:bg-zinc-900/75 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100">수업 추가</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{formattedDate}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {templates.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 mb-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">생성된 수업이 없습니다</h4>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">먼저 우측 상단의 [수업 생성] 버튼을 통해 수업 템플릿을 만들어주세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">추가할 수업을 선택해주세요.</p>
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelect(template.id)}
                                    disabled={isSubmitting}
                                    className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`shrink-0 w-4 h-4 mt-1 rounded-full ${template.color_tag} shadow-sm ring-2 ring-white dark:ring-black`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {template.title}
                                                </h4>
                                                {template.color_name && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                                        {template.color_name}
                                                    </span>
                                                )}
                                            </div>
                                            {template.subtitle && (
                                                <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 mb-1">{template.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
