'use client'

import { useState, useEffect, useTransition } from 'react'
import { getTerms, saveTerm, deleteTerm } from './actions'
import { PlusCircle, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'

interface Term {
    id: string
    title: string
    content: string
    is_active: boolean
    sort_order: number
}

export default function TermsSettingsPage() {
    const [terms, setTerms] = useState<Term[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [statusMsg, setStatusMsg] = useState('')
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        getTerms().then((res) => {
            if (res.terms) setTerms(res.terms)
        })
    }, [])

    const handleAdd = () => {
        if (terms.length >= 10) {
            setStatusMsg('약관은 최대 10개까지 생성할 수 있습니다.')
            return
        }
        const newTerm: Term = {
            id: `new_${Date.now()}`,
            title: '',
            content: '',
            is_active: true,
            sort_order: terms.length,
        }
        setTerms([...terms, newTerm])
        setExpandedId(newTerm.id)
    }

    const handleChange = (id: string, field: keyof Term, value: any) => {
        setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t))
    }

    const handleSave = (term: Term) => {
        startTransition(async () => {
            setStatusMsg('')
            const isNew = term.id.startsWith('new_')
            const res = await saveTerm({
                id: isNew ? undefined : term.id,
                title: term.title,
                content: term.content,
                is_active: term.is_active,
                sort_order: term.sort_order,
            })
            if (res.error) {
                setStatusMsg(res.error)
            } else {
                setStatusMsg('저장되었습니다.')
                // Reload
                const fresh = await getTerms()
                if (fresh.terms) setTerms(fresh.terms)
                setTimeout(() => setStatusMsg(''), 2000)
            }
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm('이 약관을 삭제하시겠습니까?')) return
        startTransition(async () => {
            if (id.startsWith('new_')) {
                setTerms(terms.filter(t => t.id !== id))
                return
            }
            const res = await deleteTerm(id)
            if (res.error) {
                setStatusMsg(res.error)
            } else {
                setTerms(terms.filter(t => t.id !== id))
                setStatusMsg('삭제되었습니다.')
                setTimeout(() => setStatusMsg(''), 2000)
            }
        })
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">약관 설정</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        활성화된 약관은 회원 초대 가입 시 동의 항목으로 표시됩니다. (최대 10개)
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    disabled={terms.length >= 10 || isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    <PlusCircle size={16} />
                    약관 추가
                </button>
            </div>

            {statusMsg && (
                <div className={`text-sm px-4 py-2 rounded-lg ${statusMsg.includes('오류') || statusMsg.includes('최대') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {statusMsg}
                </div>
            )}

            {terms.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-500 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                    <p className="text-sm">등록된 약관이 없습니다.</p>
                    <p className="text-xs mt-1"><strong>약관 추가</strong> 버튼을 눌러 시작하세요.</p>
                </div>
            )}

            <div className="space-y-3">
                {terms.map((term, idx) => (
                    <div
                        key={term.id}
                        className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* Active toggle */}
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={term.is_active}
                                    onChange={(e) => handleChange(term.id, 'is_active', e.target.checked)}
                                    className="w-4 h-4 rounded accent-indigo-600"
                                />
                                <span className={`text-xs font-medium ${term.is_active ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {term.is_active ? '활성' : '비활성'}
                                </span>
                            </label>

                            {/* Title input */}
                            <input
                                type="text"
                                value={term.title}
                                onChange={(e) => handleChange(term.id, 'title', e.target.value)}
                                placeholder={`약관 제목 ${idx + 1}`}
                                className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-gray-800 dark:text-zinc-100 placeholder-gray-400"
                            />

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleSave(term)}
                                    disabled={isPending || !term.title || !term.content}
                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-40 transition-colors"
                                    title="저장"
                                >
                                    <Save size={15} />
                                </button>
                                <button
                                    onClick={() => handleDelete(term.id)}
                                    disabled={isPending}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-40 transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 size={15} />
                                </button>
                                <button
                                    onClick={() => setExpandedId(expandedId === term.id ? null : term.id)}
                                    className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    {expandedId === term.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Content editor */}
                        {expandedId === term.id && (
                            <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5">약관 내용</label>
                                <textarea
                                    value={term.content}
                                    onChange={(e) => handleChange(term.id, 'content', e.target.value)}
                                    rows={8}
                                    placeholder="약관 내용을 입력하세요..."
                                    className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-lg p-3 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => handleSave(term)}
                                        disabled={isPending || !term.title || !term.content}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Save size={14} />
                                        저장
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
