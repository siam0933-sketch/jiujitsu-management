'use client'

import { useState } from 'react'
import { createSystemNotice, updateSystemNotice, deleteSystemNotice } from '../../actions'
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react'

export default function NoticesTable({ notices }: { notices: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [editId, setEditId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isActive, setIsActive] = useState(true)

    const openCreateModal = () => {
        setEditId(null)
        setTitle('')
        setContent('')
        setIsActive(true)
        setIsModalOpen(true)
    }

    const openEditModal = (notice: any) => {
        setEditId(notice.id)
        setTitle(notice.title)
        setContent(notice.content)
        setIsActive(notice.is_active)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) return
        const res = await deleteSystemNotice(id)
        if (res?.error) {
            alert(res.error)
        } else {
            alert('삭제되었습니다.')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.')
            return
        }

        setIsSaving(true)
        let res
        if (editId) {
            res = await updateSystemNotice(editId, title, content, isActive)
        } else {
            res = await createSystemNotice(title, content, isActive)
        }
        setIsSaving(false)

        if (res?.error) {
            alert(res.error)
        } else {
            alert(editId ? '수정되었습니다.' : '공지사항이 등록되었습니다.')
            setIsModalOpen(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">시스템 공지사항</h2>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1 text-sm">
                        플랫폼을 사용하는 전체 관장님들이 볼 수 있는 공지사항을 관리합니다.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                    <Plus size={16} /> 공지 작성
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {(!notices || notices.length === 0) ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-4 opacity-75" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">등록된 공지가 없습니다.</h3>
                        <p className="mt-1 text-sm">새로운 공지사항을 작성하여 관장님들에게 중요한 소식을 알려보세요.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
                            <thead className="bg-gray-50 dark:bg-zinc-950/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">상태</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs w-1/2">제목</th>
                                    <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">작성일</th>
                                    <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {notices.map((notice) => (
                                    <tr key={notice.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {notice.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <Check size={12} /> 게시됨
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                    <X size={12} /> 숨김
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-zinc-100 max-w-sm truncate" title={notice.title}>{notice.title}</div>
                                            <div className="text-gray-500 text-xs mt-1 max-w-md truncate" title={notice.content}>{notice.content}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                            {new Date(notice.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(notice)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                                                    title="수정"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(notice.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                                {editId ? '공지사항 수정' : '새 공지사항 작성'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-zinc-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500 dark:text-zinc-100 shadow-sm"
                                        placeholder="공지사항 제목을 입력하세요"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">내용</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={8}
                                        className="w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500 dark:text-zinc-100 shadow-sm resize-y"
                                        placeholder="공지사항 내용을 상세히 작성해주세요. 마크다운도 지원할 수 있습니다."
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-600 h-4 w-4"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                                        관장님 뷰에 노출(게시)하기
                                    </label>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/50 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-zinc-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? '저장 중...' : (editId ? '수정 완료' : '등록 완료')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
