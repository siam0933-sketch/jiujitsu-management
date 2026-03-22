'use client'

import { useState, useEffect } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment } from '../actions_payment'
import { approvePendingMember } from '../actions'
import { BELT_OPTIONS_DATA } from '../constants'
import { useRouter } from 'next/navigation'

interface PendingMember {
    id: string
    name: string
    phone: string
    belt: string
    gender: string
    pending_stripe: number | null
    pending_promotion_date: string | null
    birth_date?: string | null
    address?: string | null
    school?: string | null
    school_type?: string | null
    grade_number?: number | null
    guardian_phone?: string | null
    access_code?: string | null
    start_date?: string | null
    joined_at?: string | null
}

interface Props {
    member: PendingMember
    onClose: () => void
    onSuccess: () => void
}

export default function PendingMemberApprovalModal({ member, onClose, onSuccess }: Props) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Profile Edit State
    const [formBelt, setFormBelt] = useState(member.belt || 'White')
    const [formStripe, setFormStripe] = useState(member.pending_stripe ?? 0)
    const [formPromotionDate, setFormPromotionDate] = useState(member.pending_promotion_date || new Date().toISOString().split('T')[0])

    const maxStripes = 4

    // Payment Form State
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
    const [plans, setPlans] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [durationMonths, setDurationMonths] = useState(1)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [newExpiryDate, setNewExpiryDate] = useState('')
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set())
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
    const [paymentMethod, setPaymentMethod] = useState<string>('card')
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
    const [manualAmount, setManualAmount] = useState<number | null>(null)

    // Load Pricing Data
    useEffect(() => {
        const loadPricing = async () => {
            try {
                const pricing = await getPricingData()
                setPlans(pricing.plans || [])
                if (pricing.plans && pricing.plans.length > 0) {
                    setSelectedPlanId(pricing.plans[0].id)
                }
                setOptions(pricing.options)
                setProducts(pricing.products)
            } catch (err) {
                console.error('Failed to load pricing:', err)
            }
        }
        loadPricing()
    }, [])

    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    // Calculate Payment Expiry & Amount Dynamically
    useEffect(() => {
        if (!selectedPlan) return

        if (selectedPlan.type === 'period') {
            const start = new Date(paymentDate)
            const end = new Date(start)
            end.setMonth(end.getMonth() + durationMonths)
            setNewExpiryDate(end.toISOString().split('T')[0])
        }

        let total = selectedPlan.type === 'period' ? selectedPlan.price * durationMonths : selectedPlan.price
        
        options.forEach(opt => {
            if (selectedOptionIds.has(opt.id)) {
                total += selectedPlan.type === 'period' ? opt.price * durationMonths : opt.price
            }
        })

        products.forEach(prod => {
            if (selectedProductIds.has(prod.id)) {
                total += prod.price
            }
        })

        setPaymentAmount(total)

    }, [selectedPlanId, durationMonths, paymentDate, selectedOptionIds, selectedProductIds, plans, options, products])

    const handleToggleOption = (id: string) => {
        const next = new Set(selectedOptionIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedOptionIds(next)
        setManualAmount(null)
    }

    const handleToggleProduct = (id: string) => {
        const next = new Set(selectedProductIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedProductIds(next)
        setManualAmount(null)
    }

    const handleSubmit = async () => {
        if (!confirm('이 내용으로 승인 및 결제 등록하시겠습니까?')) return

        setIsSubmitting(true)
        try {
            // 1. Approve Profile
            const res = await approvePendingMember(member.id, formBelt, formStripe, formPromotionDate)
            if (res.error) {
                alert(res.error)
                setIsSubmitting(false)
                return
            }

            // 2. Insert Payment (If Enabled)
            if (isPaymentFormOpen && selectedPlanId) {
                const formData = new FormData()
                formData.append('member_id', member.id)
                formData.append('plan_id', selectedPlanId)
                formData.append('plan_name', selectedPlan?.name || '')
                formData.append('type', selectedPlan?.type || 'period')
                formData.append('duration_months', durationMonths.toString())
                formData.append('session_count', (selectedPlan?.sessions || 0).toString())
                formData.append('duration_days', (selectedPlan?.duration_days || 0).toString())
                formData.append('option_ids', JSON.stringify(Array.from(selectedOptionIds)))
                formData.append('product_ids', JSON.stringify(Array.from(selectedProductIds)))
                formData.append('amount', (manualAmount !== null ? manualAmount : paymentAmount).toString())
                formData.append('payment_method', paymentMethod)
                formData.append('payment_date', paymentDate)
                formData.append('start_date', paymentDate)
                formData.append('new_payment_end_date', newExpiryDate)

                const optionsArr = options.filter(o => selectedOptionIds.has(o.id)).map(o => o.name)
                const productsArr = products.filter(p => selectedProductIds.has(p.id)).map(p => p.name)
                formData.append('options_summary', [...optionsArr, ...productsArr].join(', '))

                const payRes = await createPayment(formData)
                if (payRes?.error) {
                    alert('회원 가입은 승인되었으나 결제 기록에 에러가 발생했습니다: ' + payRes.error)
                }
            }

            onSuccess()
        } catch (e: any) {
            alert('오류가 발생했습니다: ' + e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-start sm:p-6 sm:overflow-y-auto hidden-scrollbar">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col sm:my-8 max-h-full sm:max-h-[min(calc(100vh-4rem),800px)] animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">새 회원 가입 승인</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-zinc-100 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                        <span className="sr-only">닫기</span>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8 min-h-0 hidden-scrollbar">
                    
                    {/* Section 0: 회원 가입 제출 정보 (읽기 전용) */}
                    <section className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                            <span>📝 회원이 제출한 가입 정보 (비밀번호 제외)</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm mt-3">
                            <div><span className="text-gray-500 block text-xs mb-0.5">이름/성별</span><span className="font-bold text-gray-900 dark:text-zinc-100">{member.name} <span className="text-gray-400 font-normal">({member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : member.gender || '미입력'})</span></span></div>
                            <div><span className="text-gray-500 block text-xs mb-0.5">연락처</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.phone || '미입력'}</span></div>
                            <div><span className="text-gray-500 block text-xs mb-0.5">생년월일</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.birth_date || '미입력'}</span></div>
                            
                            <div><span className="text-gray-500 block text-xs mb-0.5">출석체크 번호</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.access_code || '미입력'}</span></div>
                            <div><span className="text-gray-500 block text-xs mb-0.5">보호자 연락처</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.guardian_phone || '미입력'}</span></div>
                            <div><span className="text-gray-500 block text-xs mb-0.5">학교/학년</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.school_type !== '일반' ? `${member.school || ''} ${member.school_type} ${member.grade_number ? member.grade_number+'학년' : ''}`.trim() : (member.school || '미입력')}</span></div>
                            
                            <div className="col-span-2 sm:col-span-3"><span className="text-gray-500 block text-xs mb-0.5">거주지 주소</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.address || '미입력'}</span></div>
                            
                            <div><span className="text-gray-500 block text-xs mb-0.5">주짓수 입문일</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.start_date ? member.start_date.split('T')[0] : '미입력'}</span></div>
                            <div className="col-span-2"><span className="text-gray-500 block text-xs mb-0.5">가입 신청일</span><span className="font-medium text-gray-900 dark:text-zinc-100">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '미입력'}</span></div>
                        </div>
                    </section>

                    {/* Section 1: Profile Info Edit */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 tracking-wider mb-4">현재 등급(벨트) 정보 설정</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">벨트 등급</label>
                                <select 
                                    value={formBelt} 
                                    onChange={e => {
                                        setFormBelt(e.target.value)
                                        setFormStripe(0)
                                    }} 
                                    className="w-full border-gray-300 dark:border-zinc-700 rounded-md shadow-sm dark:bg-zinc-900"
                                >
                                    {BELT_OPTIONS_DATA.map(b => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">그랄 수</label>
                                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden p-1 shadow-inner">
                                    {[...Array(maxStripes + 1)].map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormStripe(i)}
                                            className={`flex-1 py-1 text-sm font-medium rounded transition-all ${formStripe === i ? 'bg-white dark:bg-zinc-600 outline outline-1 outline-gray-200 dark:outline-zinc-500 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                                        >
                                            {i === 0 ? '없음' : i}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">현 벨트/그랄 승급일 <span className="text-gray-400 text-xs ml-1">(이 날짜 기록부터 출석일이 계산됩니다)</span></label>
                                <input type="date" value={formPromotionDate} onChange={e => setFormPromotionDate(e.target.value)} className="w-full border-gray-300 dark:border-zinc-700 rounded-md shadow-sm dark:bg-zinc-900 max-w-sm" />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Initial Payment Plan */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 tracking-wider mb-2">초기 결제 및 이용권 등록</h3>
                        <div className="border border-gray-200 dark:border-zinc-800 rounded-xl mb-4 overflow-hidden shadow-sm">
                            <button onClick={() => setIsPaymentFormOpen(!isPaymentFormOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 text-base font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                <span className={isPaymentFormOpen ? 'text-blue-600 dark:text-blue-400' : ''}>이용권 및 결제 등록 {isPaymentFormOpen ? '' : '(선택)'}</span>
                                <span className={`transform transition-transform ${isPaymentFormOpen ? 'rotate-180 text-blue-600' : ''}`}>▼</span>
                            </button>
                            {isPaymentFormOpen && (
                                <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 relative z-[110]">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1.5 font-bold">이용권 선택</label>
                                            <select
                                                value={selectedPlanId}
                                                onChange={e => setSelectedPlanId(e.target.value)}
                                                className="w-full text-base border-2 border-gray-300 dark:border-zinc-700 rounded-lg p-3 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                            >
                                                <option value="" disabled>이용권을 선택하세요</option>
                                                {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>)}
                                            </select>
                                        </div>

                                        {selectedPlan?.type === 'period' && (
                                            <div className="flex flex-wrap gap-3 sm:gap-4 items-start bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                <div className="w-16 sm:w-auto sm:flex-1">
                                                    <label className="block text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-bold mb-1.5 whitespace-nowrap">결제 개월 수</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={durationMonths}
                                                        onChange={e => setDurationMonths(Number(e.target.value))}
                                                        className="w-full text-base border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-bold mb-1.5 whitespace-nowrap">등록 시작일 (결제일)</label>
                                                    <input
                                                        type="date"
                                                        value={paymentDate}
                                                        onChange={e => setPaymentDate(e.target.value)}
                                                        className="w-full text-base border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="w-full sm:flex-1 sm:min-w-[120px]">
                                                    <label className="block text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-bold mb-1.5 whitespace-nowrap flex justify-between">
                                                        <span>만료 예상일</span>
                                                        <span className="text-blue-500 font-normal">자동 계산</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={newExpiryDate}
                                                        onChange={e => setNewExpiryDate(e.target.value)}
                                                        className="w-full text-base font-medium text-blue-800 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {options.length > 0 && (
                                            <div className="space-y-3 pt-3">
                                                <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-100 dark:border-zinc-800 pb-2">추가 옵션 (매월 부과)</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {options.map((opt: any) => (
                                                    <label key={opt.id} className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedOptionIds.has(opt.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedOptionIds.has(opt.id)}
                                                                onChange={() => handleToggleOption(opt.id)}
                                                                className="rounded-full border-2 border-gray-300 dark:border-zinc-600 text-blue-600 w-5 h-5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                            />
                                                            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{opt.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                                            {(() => {
                                                                const price = selectedPlan?.type === 'period' ? opt.price * durationMonths : opt.price
                                                                const isNegative = price < 0
                                                                return `${isNegative ? '' : '+'}${price.toLocaleString()}원`
                                                            })()}
                                                        </span>
                                                    </label>
                                                ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Products list implementation */}
                                        {products.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                                <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-100 dark:border-zinc-800 pb-2">초기 부가 상품 (일회성 구매)</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {products.map((prod: any) => (
                                                    <label key={prod.id} className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedProductIds.has(prod.id) ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-zinc-800 hover:border-rose-300'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedProductIds.has(prod.id)}
                                                                onChange={() => handleToggleProduct(prod.id)}
                                                                className="rounded-full border-2 border-gray-300 dark:border-zinc-600 text-rose-600 w-5 h-5 focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                                                            />
                                                            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{prod.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                                                            {prod.price < 0 ? '' : '+'}{prod.price.toLocaleString()}원
                                                        </span>
                                                    </label>
                                                ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Summary */}
                                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700">
                                            <div className="bg-gray-50 dark:bg-zinc-800/80 rounded-2xl p-5 border border-gray-200 dark:border-zinc-700 shadow-inner">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                                    <div className="flex-1">
                                                        <label className="block text-sm text-gray-500 dark:text-zinc-400 font-bold mb-2">결제방법</label>
                                                        <div className="flex gap-2">
                                                            {['card', 'cash', 'transfer'].map(method => (
                                                                <button
                                                                    key={method}
                                                                    onClick={() => setPaymentMethod(method)}
                                                                    className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold border-2 transition-all shadow-sm ${paymentMethod === method ? 'bg-white dark:bg-zinc-900 border-gray-900 dark:border-zinc-400 text-gray-900 dark:text-white shadow-md transform -translate-y-0.5' : 'bg-transparent border-gray-200 dark:border-zinc-700 text-gray-500 hover:border-gray-300'}`}
                                                                >
                                                                    {method === 'card' ? '카드' : method === 'cash' ? '현금' : '계좌이체'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 sm:text-right">
                                                        <label className="block text-sm text-gray-500 dark:text-zinc-400 font-bold mb-2">최종 결제 금액 (수정 가능)</label>
                                                        <div className="flex items-center sm:justify-end gap-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                                                            <input
                                                                type="number"
                                                                value={manualAmount !== null ? manualAmount : paymentAmount}
                                                                onChange={e => setManualAmount(Number(e.target.value))}
                                                                className="w-36 text-right border-none bg-transparent p-0 text-3xl focus:ring-0 focus:outline-none underline decoration-blue-200 dark:decoration-blue-800 decoration-4 underline-offset-4"
                                                            />
                                                            <span>원</span>
                                                        </div>
                                                        {manualAmount !== null && manualAmount !== paymentAmount && (
                                                            <button 
                                                                onClick={() => setManualAmount(null)} 
                                                                className="text-xs text-gray-500 mt-1 hover:text-gray-700 flex items-center gap-1 sm:justify-end w-full"
                                                            >
                                                                <span className="bg-gray-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-bold">↻ 원래금액 복원</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 shrink-0 flex justify-end gap-3 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition shadow-sm"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || (isPaymentFormOpen && !selectedPlanId)}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                처리 중...
                            </>
                        ) : '✅ 가입 승인 및 저장'}
                    </button>
                </div>

            </div>
        </div>
    )
}
