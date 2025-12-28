'use client'

import { useState, useEffect } from 'react'
import { getPromotionCriteria, createPromotionCriteria, deletePromotionCriteria, PromotionCriteria } from './actions'

const BELT_ORDER = [
    'White', 'White 1 Stripe', 'White 2 Stripes', 'White 3 Stripes', 'White 4 Stripes',
    'Blue', 'Blue 1 Stripe', 'Blue 2 Stripes', 'Blue 3 Stripes', 'Blue 4 Stripes',
    'Purple', 'Purple 1 Stripe', 'Purple 2 Stripes', 'Purple 3 Stripes', 'Purple 4 Stripes',
    'Brown', 'Brown 1 Stripe', 'Brown 2 Stripes', 'Brown 3 Stripes', 'Brown 4 Stripes',
    'Black'
]

export default function PromotionSettingsPage() {
    const [criteriaList, setCriteriaList] = useState<PromotionCriteria[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const data = await getPromotionCriteria()
        setCriteriaList(data)
        setIsLoading(false)
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createPromotionCriteria(formData)
        if (res.error) alert(res.error)
        else {
            (e.target as HTMLFormElement).reset()
            loadData()
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await deletePromotionCriteria(id)
        loadData()
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">승급 기준 설정</h1>
            <p className="text-gray-500 text-sm mb-8">각 벨트 단계별 승급에 필요한 최소 기간 또는 출석 횟수를 설정합니다.</p>

            <div className="bg-white shadow rounded-lg p-6">
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        ➕ 승급 기준 추가
                    </h2>
                    <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-md mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">현재 벨트</label>
                                <select name="current_belt" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                                    <option value="">선택</option>
                                    {BELT_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-center pb-2">
                                <span className="text-gray-400 font-bold">➜</span>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">다음 벨트</label>
                                <select name="next_belt" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                                    <option value="">선택</option>
                                    {BELT_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="hidden md:block"></div> {/* Spacer */}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">필요 기간 (개월)</label>
                                <input name="required_tenure_months" type="number" min="0" defaultValue="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="text-center pb-2 text-sm text-gray-500 font-medium">OR</div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">필요 출석 (회)</label>
                                <input name="required_attendance_count" type="number" min="0" defaultValue="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 h-[38px] w-full">
                                추가
                            </button>
                        </div>
                    </form>

                    <div className="border rounded-md p-4 bg-white">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">등록된 승급 기준</h3>
                        <div className="space-y-3">
                            {criteriaList.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0 gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs">{item.current_belt}</span>
                                        <span className="text-gray-400">➜</span>
                                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">{item.next_belt}</span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-1 md:justify-end">
                                        <div className="text-gray-600 text-xs">
                                            {item.required_tenure_months > 0 && <span>⏳ {item.required_tenure_months}개월 이상</span>}
                                            {item.required_tenure_months > 0 && item.required_attendance_count > 0 && <span className="mx-2 text-gray-300">|</span>}
                                            {item.required_attendance_count > 0 && <span>🥋 {item.required_attendance_count}회 출석</span>}
                                            {item.required_tenure_months === 0 && item.required_attendance_count === 0 && <span className="text-gray-400">(조건 없음)</span>}
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 text-xs whitespace-nowrap">삭제</button>
                                    </div>
                                </div>
                            ))}
                            {criteriaList.length === 0 && <p className="text-center text-gray-500 text-sm py-4">등록된 승급 기준이 없습니다.</p>}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
