'use client'

import { useState, useEffect } from 'react'
import { getPricingData, createPlan, deletePlan, createOption, deleteOption } from './actions'

export default function PricingSettingsPage() {
    const [activeTab, setActiveTab] = useState<'period' | 'session'>('period')
    const [plans, setPlans] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form States
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const { plans, options } = await getPricingData()
        setPlans(plans)
        setOptions(options)
        setIsLoading(false)
    }

    const handleCreatePlan = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createPlan(formData)
        if (res.error) alert(res.error)
        else {
            (e.target as HTMLFormElement).reset()
            loadData()
        }
        setIsSubmitting(false)
    }

    const handleCreateOption = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createOption(formData)
        if (res.error) alert(res.error)
        else {
            (e.target as HTMLFormElement).reset()
            loadData()
        }
        setIsSubmitting(false)
    }

    const handleDeletePlan = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await deletePlan(id)
        loadData()
    }

    const handleDeleteOption = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await deleteOption(id)
        loadData()
    }

    const filteredPlans = plans.filter(p => p.type === activeTab)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">가격 및 결제 설정</h1>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('period')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'period'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        기간권 (옵션 포함)
                    </button>
                    <button
                        onClick={() => setActiveTab('session')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'session'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        횟수권 (쿠폰)
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6">

                {/* 1. Period Plans Tab */}
                {activeTab === 'period' && (
                    <div className="space-y-12">
                        {/* Period Plans Section */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                📅 기간권 관리
                                <span className="text-xs font-normal text-gray-500">(기본 1개월 단위)</span>
                            </h2>
                            <form onSubmit={handleCreatePlan} className="flex gap-4 items-end mb-6 bg-gray-50 p-4 rounded-md">
                                <input type="hidden" name="type" value="period" />
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">이용권 이름</label>
                                    <input name="name" required placeholder="예: 주짓수 1개월" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">기본 금액 (원)</label>
                                    <input name="price" type="number" required placeholder="150000" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 h-[38px]">
                                    추가
                                </button>
                            </form>

                            {/* Plans List with Border */}
                            <div className="border rounded-md p-4 bg-white">
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">등록된 기간권 목록</h3>
                                <ul className="space-y-3">
                                    {filteredPlans.map(plan => (
                                        <li key={plan.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <span className="font-medium text-gray-900 mr-2">{plan.name}</span>
                                                <span className="text-gray-500 text-xs">/ 1개월</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-900 font-medium">{plan.price.toLocaleString()}원</span>
                                                <button onClick={() => handleDeletePlan(plan.id)} className="text-gray-400 hover:text-red-600 text-xs">삭제</button>
                                            </div>
                                        </li>
                                    ))}
                                    {filteredPlans.length === 0 && <p className="text-gray-500 text-sm">등록된 기간권이 없습니다.</p>}
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-200 my-8" />

                        {/* Options Section */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                ➕ 옵션 관리
                                <span className="text-xs font-normal text-gray-500">(기간권에만 적용)</span>
                            </h2>
                            <form onSubmit={handleCreateOption} className="flex gap-4 items-end mb-6 bg-gray-50 p-4 rounded-md">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">그룹 이름</label>
                                    <input name="group_name" required placeholder="예: 차량 운행" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">옵션 이름</label>
                                    <input name="name" required placeholder="예: 이용함" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">금액 (원)</label>
                                    <input name="price" type="number" required placeholder="10000" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 h-[38px]">
                                    추가
                                </button>
                            </form>

                            <div className="space-y-4">
                                {Object.entries(options.reduce((acc: any, opt: any) => {
                                    (acc[opt.group_name] = acc[opt.group_name] || []).push(opt);
                                    return acc;
                                }, {})).map(([group, opts]: [string, any]) => (
                                    <div key={group} className="border rounded-md p-4 bg-white">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2 flex items-center justify-between">
                                            {group}
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">옵션 그룹</span>
                                        </h3>
                                        <ul className="space-y-3">
                                            {opts.map((opt: any) => (
                                                <li key={opt.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                    <span className="text-gray-700">{opt.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className={opt.price > 0 ? 'text-blue-600' : 'text-red-600'}>
                                                            {opt.price > 0 ? '+' : ''}{opt.price.toLocaleString()}원
                                                        </span>
                                                        <button onClick={() => handleDeleteOption(opt.id)} className="text-gray-400 hover:text-red-600 text-xs">삭제</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                {options.length === 0 && <p className="text-gray-500 text-sm">등록된 옵션이 없습니다.</p>}
                            </div>
                        </section>
                    </div>
                )}

                {/* 2. Session Plans Tab */}
                {activeTab === 'session' && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">횟수권 관리</h2>
                        <form onSubmit={handleCreatePlan} className="flex gap-4 items-end mb-8 bg-gray-50 p-4 rounded-md">
                            <input type="hidden" name="type" value="session" />
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">이용권 이름</label>
                                <input name="name" required placeholder="예: 10회 이용권" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-medium text-gray-700 mb-1">기본 금액</label>
                                <input name="price" type="number" required placeholder="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-medium text-gray-700 mb-1">횟수</label>
                                <input name="session_count" type="number" required placeholder="10" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-medium text-gray-700 mb-1">유효(일)</label>
                                <input name="duration_days" type="number" defaultValue="90" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 h-[38px]">
                                추가
                            </button>
                        </form>

                        {/* Session Plans List with Border */}
                        <div className="border rounded-md p-4 bg-white">
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">등록된 횟수권 목록</h3>
                            <ul className="space-y-3">
                                {filteredPlans.map(plan => (
                                    <li key={plan.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <span className="font-medium text-gray-900 mr-2">{plan.name}</span>
                                            <span className="text-gray-500 text-xs">({plan.session_count}회 / {plan.duration_days}일 유효)</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-900 font-medium">{plan.price.toLocaleString()}원</span>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="text-gray-400 hover:text-red-600 text-xs">삭제</button>
                                        </div>
                                    </li>
                                ))}
                                {filteredPlans.length === 0 && <p className="text-gray-500 text-sm">등록된 횟수권이 없습니다.</p>}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
