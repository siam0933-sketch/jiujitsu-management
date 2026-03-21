'use client'

import { useState } from 'react'
import NoticeEditor from '@/app/dashboard/components/NoticeEditor'
import { saveManual } from './actions'

export default function ManualEditorClient({ initialData }: { initialData?: any }) {
    const [title, setTitle] = useState(initialData?.title || '시스템 사용방법 (관장 대시보드 표시용)')
    const [content, setContent] = useState(initialData?.content || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!content.trim()) return alert('내용을 입력하세요.')
        setSaving(true)
        const res = await saveManual(title, content)
        if (res.error) {
            alert(res.error)
        } else {
            alert('성공적으로 저장 및 반영되었습니다.')
        }
        setSaving(false)
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">매뉴얼 제목 (참고용)</label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
            </div>
            
            <div className="border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <NoticeEditor content={content} onChange={setContent} />
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                    {saving ? '배포 중...' : '저장하여 사용할 관장 대시보드에 배포하기'}
                </button>
            </div>
        </div>
    )
}
