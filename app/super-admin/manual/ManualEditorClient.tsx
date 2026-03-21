'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NoticeEditor from '@/app/dashboard/components/NoticeEditor'
import { createManual, updateManual, deleteManual, SystemManual } from './actions'

export default function ManualEditorClient({ manualId, initialData }: { manualId?: string, initialData?: SystemManual | null }) {
    const router = useRouter()
    const [title, setTitle] = useState(initialData?.title || '')
    const [content, setContent] = useState(initialData?.content || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!title.trim()) return alert('제목을 입력하세요.')
        if (!content.trim()) return alert('내용을 입력하세요.')
        
        setSaving(true)
        
        let res;
        if (manualId) {
            res = await updateManual(manualId, title, content)
        } else {
            res = await createManual(title, content)
        }
        
        if (res.error) {
            alert(res.error)
            setSaving(false)
        } else {
            alert('성공적으로 저장되었습니다.')
            router.push('/super-admin/manual')
            router.refresh()
        }
    }

    const handleDelete = async () => {
        if (!manualId) return
        if (!confirm('정말로 이 설명서를 삭제하시겠습니까? (관장 대시보드에서도 보이지 않게 됩니다)')) return
        
        setSaving(true)
        const res = await deleteManual(manualId)
        if (res.error) {
            alert(res.error)
            setSaving(false)
        } else {
            alert('삭제되었습니다.')
            router.push('/super-admin/manual')
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">설명서 제목</label>
                <input
                    type="text"
                    placeholder="예: 우리 도장 앱 활용 100% 가이드"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
            </div>
            
            <div className="border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <NoticeEditor content={content} onChange={setContent} />
            </div>
            
            <div className="flex justify-between items-center pt-4">
                <div>
                    {manualId && (
                        <button 
                            onClick={handleDelete}
                            disabled={saving}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            삭제하기
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => router.push('/super-admin/manual')} 
                        disabled={saving}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                        {saving ? '저장 중...' : (manualId ? '수정하여 배포하기' : '작성하여 배포하기')}
                    </button>
                </div>
            </div>
        </div>
    )
}
