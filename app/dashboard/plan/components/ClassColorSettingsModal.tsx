'use client'

import { useState } from 'react'
import { ColorSetting, saveColorSettings } from '../actions'

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

export default function ClassColorSettingsModal({
    initialSettings,
    onClose
}: {
    initialSettings: ColorSetting[]
    onClose: () => void
}) {
    // Map initial settings to our preset colors so we have a form state
    const [settings, setSettings] = useState(() => {
        return PRESET_COLORS.map(pc => {
            const existing = initialSettings.find(s => s.color_tag === pc.tag)
            return {
                color_tag: pc.tag,
                label_name: existing?.label_name || ''
            }
        })
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (tag: string, val: string) => {
        setSettings(prev => prev.map(s => s.color_tag === tag ? { ...s, label_name: val } : s))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        const res = await saveColorSettings(settings)
        if (res.error) {
            alert(res.error)
        } else {
            onClose() // Client will refresh or parent handles state update
        }
        setIsSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/75 dark:bg-zinc-900/75 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        컬러태그 설정
                    </h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
                            새 수업을 만들 때 사용할 각 색상의 이름표(예: 기초반, 스파링 등)를 지정해주세요. 이름을 지정한 색상만 수업 생성 시 나타납니다.
                        </p>
                        <div className="space-y-3">
                            {settings.map((item) => (
                                <div key={item.color_tag} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full shadow-sm shrink-0 ${item.color_tag}`} />
                                    <input
                                        type="text"
                                        placeholder="이름 입력 (비워두면 선택 불가)"
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-gray-900 dark:text-zinc-100 text-sm"
                                        value={item.label_name}
                                        onChange={(e) => handleChange(item.color_tag, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                        >
                            닫기
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSubmitting ? '저장 중...' : '설정 저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
