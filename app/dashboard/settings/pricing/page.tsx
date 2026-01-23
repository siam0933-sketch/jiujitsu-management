'use client'

import { useState, useEffect } from 'react'
import { getPricingData, createPlan, deletePlan, createOption, deleteOption, reorderOption, reorderGroup, updateOption, updateOptionGroup, createProduct, updateProduct, deleteProduct, copyProduct, reorderProduct } from './actions'
import OptionReorderButton from './components/OptionReorderButton'

export default function PricingSettingsPage() {
    const [activeTab, setActiveTab] = useState<'period' | 'session' | 'product'>('period')
    const [plans, setPlans] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
    const [editingGroupName, setEditingGroupName] = useState<string | null>(null)
    const [editingProductId, setEditingProductId] = useState<string | null>(null)

    // Form States
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const { plans, options, products } = await getPricingData()
        setPlans(plans)
        setOptions(options)
        setProducts(products || [])
        setIsLoading(false)
    }

    const handleUpdateOption = async (optionId: string, e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = String(formData.get('name'))
        const price = Number(formData.get('price'))

        const res = await updateOption(optionId, { name, price })
        if (res?.error) alert(res.error)
        else {
            setEditingOptionId(null)
            loadData()
        }
    }

    const handleUpdateGroup = async (oldName: string, e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newName = String(formData.get('new_name'))

        if (oldName === newName) {
            setEditingGroupName(null)
            return
        }

        const res = await updateOptionGroup(oldName, newName)
        if (res?.error) alert(res.error)
        else {
            setEditingGroupName(null)
            loadData()
        }
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

    // transform options into sorted array of groups
    const groupedOptions = Object.values(options.reduce((acc: any, opt: any) => {
        if (!acc[opt.group_name]) {
            acc[opt.group_name] = {
                name: opt.group_name,
                order: opt.group_order ?? 9999, // fallback
                items: []
            };
        }
        acc[opt.group_name].items.push(opt);
        return acc;
    }, {})).sort((a: any, b: any) => a.order - b.order) as any[];


    const handleGroupReorder = async (groupName: string, direction: 'up' | 'down') => {
        // Optimistic Update can be added here if needed, but skipping for simplicity
        const res = await reorderGroup(groupName, direction);
        if (res?.error) {
            alert('그룹 순서 변경 실패: ' + res.error);
        }
        loadData();
    }

    const handleOptionReorder = async (optionId: string, direction: 'up' | 'down') => {
        const res = await reorderOption(optionId, direction);
        if (res?.error) {
            alert('옵션 순서 변경 실패');
        }
        loadData();
    }

    // --- Product Handlers ---

    const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createProduct(formData)
        if (res.error) alert(res.error)
        else {
            (e.target as HTMLFormElement).reset()
            loadData()
        }
        setIsSubmitting(false)
    }

    const handleUpdateProduct = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = String(formData.get('name'))
        const price = Number(formData.get('price'))

        const res = await updateProduct(id, { name, price })
        if (res?.error) alert(res.error)
        else {
            setEditingProductId(null)
            loadData()
        }
    }

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await deleteProduct(id)
        loadData()
    }

    const handleCopyProduct = async (id: string) => {
        if (!confirm('이 상품을 복사하시겠습니까?')) return
        const res = await copyProduct(id)
        if (res?.error) alert(res.error)
        else loadData()
    }

    const handleProductReorder = async (id: string, direction: 'up' | 'down') => {
        const res = await reorderProduct(id, direction)
        if (res?.error) alert('순서 변경 실패')
        else loadData()
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
                    <button
                        onClick={() => setActiveTab('product')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'product'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        상품 (도복 등)
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
                                <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                기간권 관리
                                <span className="text-xs font-normal text-gray-500">(기본 1개월 단위)</span>
                            </h2>
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">새 기간권 만들기</h3>
                                <form onSubmit={handleCreatePlan} className="flex gap-2 items-end">
                                    <input type="hidden" name="type" value="period" />
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">이용권 이름</label>
                                        <input name="name" required placeholder="예: 주짓수 1개월" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">기본 금액 (원)</label>
                                        <input name="price" type="number" required placeholder="150000" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-500 disabled:opacity-50 h-[38px] min-w-[60px]">
                                        추가
                                    </button>
                                </form>
                            </div>

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
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    옵션 관리
                                    <span className="text-xs font-normal text-gray-500">(기간권에만 적용)</span>
                                </div>
                            </h2>

                            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">새 옵션 그룹 만들기</h3>
                                <form onSubmit={handleCreateOption} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">그룹명</label>
                                        <input name="group_name" required placeholder="예: 차량 운행" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">첫번째 옵션명</label>
                                        <input name="name" required placeholder="예: 5km 이내" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">금액</label>
                                        <input name="price" type="number" required placeholder="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-500 disabled:opacity-50 h-[38px] min-w-[80px]">
                                        그룹 생성
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6">
                                {groupedOptions.map((group: any, gIdx: number) => (
                                    <div key={group.name} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="flex flex-col gap-0.5 mr-2">
                                                    <OptionReorderButton direction="up" disabled={gIdx === 0} onReorder={() => handleGroupReorder(group.name, 'up')} />
                                                    <OptionReorderButton direction="down" disabled={gIdx === groupedOptions.length - 1} onReorder={() => handleGroupReorder(group.name, 'down')} />
                                                </div>

                                                {editingGroupName === group.name ? (
                                                    <form onSubmit={(e) => handleUpdateGroup(group.name, e)} className="flex items-center gap-2 flex-1">
                                                        <input
                                                            name="new_name"
                                                            defaultValue={group.name}
                                                            autoFocus
                                                            className="text-sm border border-blue-300 rounded px-2 py-0.5 w-full max-w-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500">저장</button>
                                                        <button type="button" onClick={() => setEditingGroupName(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">취소</button>
                                                    </form>
                                                ) : (
                                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingGroupName(group.name)}>
                                                        <h3 className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors">{group.name}</h3>
                                                        <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-1.5 rounded ml-2 cursor-default" onClick={e => e.stopPropagation()}>{group.items.length}개 옵션</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <ul className="divide-y divide-gray-50">
                                            {group.items.map((opt: any, idx: number) => (
                                                <li key={opt.id} className="flex justify-between items-center text-sm px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    {editingOptionId === opt.id ? (
                                                        <form onSubmit={(e) => handleUpdateOption(opt.id, e)} className="flex items-center gap-2 w-full">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <input name="name" defaultValue={opt.name} className="flex-1 text-sm border border-blue-300 rounded px-2 py-1" autoFocus />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input name="price" type="number" defaultValue={opt.price} className="w-24 text-sm border border-blue-300 rounded px-2 py-1 text-right" />
                                                                <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
                                                                <button type="button" onClick={() => setEditingOptionId(null)} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded">취소</button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <OptionReorderButton direction="up" disabled={idx === 0} onReorder={() => handleOptionReorder(opt.id, 'up')} />
                                                                    <OptionReorderButton direction="down" disabled={idx === group.items.length - 1} onReorder={() => handleOptionReorder(opt.id, 'down')} />
                                                                </div>
                                                                <span className="text-gray-700 ml-2 cursor-pointer hover:text-blue-600 flex items-center gap-1 group" onClick={() => setEditingOptionId(opt.id)}>
                                                                    {opt.name}
                                                                    <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                    </svg>
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`font-medium cursor-pointer hover:text-blue-600 ${opt.price > 0 ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => setEditingOptionId(opt.id)}>
                                                                    {opt.price > 0 ? '+' : ''}{opt.price.toLocaleString()}원
                                                                </span>
                                                                <button onClick={() => handleDeleteOption(opt.id)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </li>
                                            ))}

                                            {/* Inline Add Option Form */}
                                            <li className="bg-gray-50/50 px-4 py-3 border-t border-dashed border-gray-200">
                                                <form onSubmit={handleCreateOption} className="flex gap-2 items-center">
                                                    <input type="hidden" name="group_name" value={group.name} />
                                                    <span className="text-xs text-gray-400 w-6 text-center flex justify-center">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </span>
                                                    <input name="name" required placeholder="옵션 추가..." className="flex-1 bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 text-xs py-1 px-0 placeholder-gray-400" />
                                                    <input name="price" type="number" required placeholder="금액" className="w-20 bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 text-xs py-1 px-0 text-right placeholder-gray-400" />
                                                    <button type="submit" disabled={isSubmitting} className="text-xs text-blue-600 font-bold hover:text-blue-800 px-2">
                                                        등록
                                                    </button>
                                                </form>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                                {groupedOptions.length === 0 && <p className="text-center text-gray-400 text-sm py-8">등록된 옵션 그룹이 없습니다. 위에서 그룹을 생성해주세요.</p>}
                            </div>
                        </section>
                    </div>
                )}

                {/* 2. Session Plans Tab */}
                {activeTab === 'session' && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">횟수권 관리</h2>
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">새 횟수권 만들기</h3>
                            <form onSubmit={handleCreatePlan} className="flex gap-2 items-end">
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
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-500 disabled:opacity-50 h-[38px] min-w-[60px]">
                                    추가
                                </button>
                            </form>
                        </div>

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

                {/* 3. Product Tab */}
                {activeTab === 'product' && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            상품 관리
                            <span className="text-xs font-normal text-gray-500">(도복, 벨트 등 물품)</span>
                        </h2>

                        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">새 상품 만들기</h3>
                            <form onSubmit={handleCreateProduct} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">상품 이름</label>
                                    <input name="name" required placeholder="예: 도복 (블랙)" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">판매 금액 (원)</label>
                                    <input name="price" type="number" required placeholder="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-500 disabled:opacity-50 h-[38px] min-w-[60px]">
                                    추가
                                </button>
                            </form>
                        </div>

                        <div className="border rounded-md p-4 bg-white">
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">등록된 상품 목록</h3>
                            <ul className="space-y-3">
                                {products.map((product, idx) => (
                                    <li key={product.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0 hover:bg-gray-50 transition-colors p-1">
                                        {editingProductId === product.id ? (
                                            <form onSubmit={(e) => handleUpdateProduct(product.id, e)} className="flex items-center gap-2 w-full">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input name="name" defaultValue={product.name} className="flex-1 text-sm border border-blue-300 rounded px-2 py-1" autoFocus />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input name="price" type="number" defaultValue={product.price} className="w-24 text-sm border border-blue-300 rounded px-2 py-1 text-right" />
                                                    <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
                                                    <button type="button" onClick={() => setEditingProductId(null)} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded">취소</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <OptionReorderButton direction="up" disabled={idx === 0} onReorder={() => handleProductReorder(product.id, 'up')} />
                                                        <OptionReorderButton direction="down" disabled={idx === products.length - 1} onReorder={() => handleProductReorder(product.id, 'down')} />
                                                    </div>
                                                    <span className="font-medium text-gray-900 mr-2 cursor-pointer hover:text-blue-600 flex items-center gap-2 group" onClick={() => setEditingProductId(product.id)}>
                                                        {product.name}
                                                        <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-900 font-medium cursor-pointer hover:text-blue-600" onClick={() => setEditingProductId(product.id)}>{product.price.toLocaleString()}원</span>

                                                    <button onClick={() => handleCopyProduct(product.id)} className="text-gray-400 hover:text-blue-600 text-xs p-1 rounded hover:bg-blue-50" title="복사">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 text-xs p-1 rounded hover:bg-red-50" title="삭제">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                                {products.length === 0 && <p className="text-gray-500 text-center text-sm py-8">등록된 상품이 없습니다.</p>}
                            </ul>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
