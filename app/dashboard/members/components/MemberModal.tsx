'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment } from '../actions_payment'

// Helper Types
type Plan = {
    id: string
    name: string
    price: number
    type: 'period' | 'session'
    session_count?: number
    duration_days: number
}

type Option = {
    id: string
    group_name: string
    name: string
    price: number
}

type Payment = {
    id: string
    amount: number
    payment_date: string
    note: string
    created_at: string
    plan_snapshot?: any
}

export default function MemberModal({ member }: { member: any }) {
    const router = useRouter()

    // Data State
    const [plans, setPlans] = useState<Plan[]>([])
    const [options, setOptions] = useState<Option[]>([])
    const [payments, setPayments] = useState<Payment[]>([])

    // UI State
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false) // Accordion Toggle
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null) // specific edit mode

    // Form State (New Payment)
    const [selectedPlanId, setSelectedPlanId] = useState<string>('')
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set())
    const [durationMonths, setDurationMonths] = useState(1) // Default 1 month

    // Form State (Manual/Edit)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [manualAmount, setManualAmount] = useState<number | null>(null) // If null, use auto-calc
    const [note, setNote] = useState('')

    const closeModal = () => {
        router.push('/dashboard/members')
    }

    // Load Data
    useEffect(() => {
        const load = async () => {
            const pricing = await getPricingData()
            setPlans(pricing.plans)
            setOptions(pricing.options)

            const history = await getPaymentHistory(member.id)
            setPayments(history)
        }
        load()

        // Key Handler
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [member.id])

    // Auto-fill logic when opening form
    const togglePaymentForm = () => {
        const willOpen = !isPaymentFormOpen
        setIsPaymentFormOpen(willOpen)

        if (willOpen && payments.length > 0) {
            // Auto-fill from latest payment
            const latest = payments[0]
            if (latest.plan_snapshot) {
                const snap = latest.plan_snapshot

                // Check if plan exists
                const planExists = plans.find(p => p.id === snap.plan_id)
                if (planExists) {
                    setSelectedPlanId(snap.plan_id)
                }
                if (snap.option_ids) {
                    setSelectedOptionIds(new Set(snap.option_ids))
                }
                if (snap.duration_months) {
                    setDurationMonths(snap.duration_months)
                }
            }
        }
    }

    // Calculation Logic
    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    const calculateTotal = () => {
        if (!selectedPlan) return 0

        let total = selectedPlan.price

        if (selectedPlan.type === 'period') {
            // Add Options
            const optionsTotal = Array.from(selectedOptionIds).reduce((sum, optId) => {
                const opt = options.find(o => o.id === optId)
                return sum + (opt?.price || 0)
            }, 0)

            total = (total + optionsTotal) * durationMonths
        }
        // Session plan typically fixed price

        return total
    }

    const currentTotal = calculateTotal()
    const finalAmount = manualAmount !== null ? manualAmount : currentTotal

    // Handlers
    const handleToggleOption = (id: string) => {
        const next = new Set(selectedOptionIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedOptionIds(next)
    }

    const handleSubmitPayment = async () => {
        if (!selectedPlan) return alert('이용권을 선택해주세요.')
        if (!confirm(`${finalAmount.toLocaleString()}원 결제하시겠습니까?`)) return

        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('member_id', member.id)
        formData.append('plan_id', selectedPlan.id)
        formData.append('plan_name', selectedPlan.name)
        formData.append('amount', String(finalAmount))
        formData.append('payment_date', paymentDate)
        formData.append('type', selectedPlan.type)
        formData.append('duration_months', String(durationMonths))
        formData.append('session_count', String(selectedPlan.session_count || 0))
        formData.append('duration_days', String(selectedPlan.duration_days || 0))

        // Pass IDs for re-use
        formData.append('option_ids', JSON.stringify(Array.from(selectedOptionIds)))

        // Summarize options
        const optionNames = Array.from(selectedOptionIds).map(id => options.find(o => o.id === id)?.name).join(', ')
        formData.append('options_summary', optionNames)

        const res = await createPayment(formData)
        if (res.error) {
            alert(res.error)
        } else {
            alert('결제되었습니다.')
            setIsPaymentFormOpen(false) // Close form
            setManualAmount(null)
            // Refresh history
            const history = await getPaymentHistory(member.id)
            setPayments(history)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    const calculateAge = (birthDateString: string | null) => {
        if (!birthDateString) return '-'
        const birthDate = new Date(birthDateString)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear() + 1
        return `${age}세`
    }

    return (
        <div className="relative z-50">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-semibold leading-6 text-gray-900">{member.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">회원 상세 정보</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="bg-gray-50 px-4 py-6 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                            {/* Section 1: Basic Info */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">기본 정보</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <p className="text-gray-400 text-xs mb-1">이름</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${member.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>{member.gender === 'male' ? '남' : '여'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-gray-400 text-xs mb-1">생년월일</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.birth_date} ({calculateAge(member.birth_date)})</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs mb-1">접속 코드</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.access_code}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-gray-400 text-xs mb-1">연락처</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.phone}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-gray-400 text-xs mb-1">보호자</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.guardian_phone || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs mb-1">학교/학년</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.school} {member.grade}</p>
                                    </div>
                                    <div className="col-span-4 border-t pt-2 mt-2">
                                        <p className="text-gray-400 text-xs mb-1">주소</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.address}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Payment & Update */}
                            <section>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">이용권 및 결제</h4>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                                    {/* 1. Status Part (With Toggle Button) */}
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1 font-medium">만료일</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '미등록'}
                                                <span className="text-xs font-normal text-gray-400 ml-2">
                                                    {member.payment_end_date && new Date(member.payment_end_date) < new Date() ? '(만료됨)' : ''}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                결제 기준일: <span className="font-medium text-gray-600">매월 {member.payment_due_day || '1'}일</span>
                                            </p>
                                            {/* Toggle Button Here */}
                                            <div className="mt-2 text-[10px] select-none cursor-pointer inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors" onClick={togglePaymentForm}>
                                                {isPaymentFormOpen ? 'v 결제하기' : '> 결제하기'}
                                            </div>
                                        </div>
                                        {(member.remaining_sessions > 0) && (
                                            <div className="text-right">
                                                <p className="text-gray-500 text-xs mb-1 font-medium">잔여 횟수</p>
                                                <p className="text-xl font-bold text-blue-600">{member.remaining_sessions}회</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Accordion: New Payment Form (In Middle) */}
                                    {isPaymentFormOpen && (
                                        <div className="border-b border-blue-100 bg-blue-50/30 p-5 transition-all">
                                            <div className="space-y-4">
                                                {/* Plan Select */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">이용권 선택</label>
                                                    <select
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                                        value={selectedPlanId}
                                                        onChange={(e) => { setSelectedPlanId(e.target.value); setManualAmount(null); }}
                                                    >
                                                        <option value="">선택해주세요</option>
                                                        {plans.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.price.toLocaleString()}원)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {selectedPlan?.type === 'period' && (
                                                    <>
                                                        {/* Options */}
                                                        <div className="bg-white border border-gray-200 p-3 rounded-md">
                                                            <p className="text-xs font-semibold text-gray-700 mb-2">옵션 선택</p>
                                                            <div className="space-y-2">
                                                                {Object.entries(options.reduce((acc: any, opt) => {
                                                                    (acc[opt.group_name] = acc[opt.group_name] || []).push(opt);
                                                                    return acc;
                                                                }, {})).map(([group, opts]: [string, any]) => (
                                                                    <div key={group}>
                                                                        <p className="text-[10px] text-gray-500 font-medium mb-1">{group}</p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {opts.map((opt: any) => (
                                                                                <label key={opt.id} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer select-none transition-colors ${selectedOptionIds.has(opt.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="hidden"
                                                                                        checked={selectedOptionIds.has(opt.id)}
                                                                                        onChange={() => handleToggleOption(opt.id)}
                                                                                    />
                                                                                    {selectedOptionIds.has(opt.id) && (
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                                                    )}
                                                                                    {opt.name} ({opt.price > 0 ? '+' : ''}{opt.price.toLocaleString()})
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Duration */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">기간 (개월)</label>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setDurationMonths(Math.max(1, durationMonths - 1))} className="w-8 h-8 rounded border flex items-center justify-center bg-white hover:bg-gray-50">-</button>
                                                                <span className="w-12 text-center text-sm font-medium">{durationMonths}개월</span>
                                                                <button onClick={() => setDurationMonths(durationMonths + 1)} className="w-8 h-8 rounded border flex items-center justify-center bg-white hover:bg-gray-50">+</button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <hr className="border-blue-100" />

                                                {/* Final Calc & Action */}
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">결제일</label>
                                                        <input
                                                            type="date"
                                                            value={paymentDate}
                                                            onChange={(e) => setPaymentDate(e.target.value)}
                                                            className="text-xs border-gray-300 rounded px-2 py-1"
                                                        />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500 text-xs mb-1">최종 결제 금액</p>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    className="text-right w-24 border-b border-gray-300 focus:border-blue-500 bg-transparent text-xl font-bold text-blue-600 focus:outline-none p-0"
                                                                    value={finalAmount}
                                                                    onChange={(e) => setManualAmount(Number(e.target.value))}
                                                                />
                                                                <span className="text-sm font-bold text-gray-900 mr-2">원</span>
                                                            </div>
                                                            {/* Inline Submit Button */}
                                                            <button
                                                                onClick={handleSubmitPayment}
                                                                disabled={isSubmitting}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap"
                                                            >
                                                                {isSubmitting ? '처리 중...' : '결제하기'}
                                                            </button>
                                                        </div>
                                                        {manualAmount !== null && manualAmount !== currentTotal && (
                                                            <p className="text-[10px] text-red-500 cursor-pointer mt-1" onClick={() => setManualAmount(null)}>↺ 자동계산 복구 ({currentTotal.toLocaleString()})</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. History List Part */}
                                    <div>
                                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase">최근 결제 내역</h5>
                                        </div>
                                        <ul className="divide-y divide-gray-100">
                                            {payments.map(pay => (
                                                <li key={pay.id} className="px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-gray-900">{pay.payment_date}</p>
                                                            {(pay as any).plan_snapshot?.plan_name && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{(pay as any).plan_snapshot.plan_name}</span>
                                                            )}
                                                        </div>
                                                        {(pay as any).plan_snapshot?.options_summary && (
                                                            <p className="text-xs text-gray-600 mb-0.5">➕ {(pay as any).plan_snapshot.options_summary}</p>
                                                        )}
                                                        {pay.note && (
                                                            <p className="text-xs text-gray-400">📝 {pay.note}</p>
                                                        )}
                                                        {!pay.note && !(pay as any).plan_snapshot?.options_summary && (
                                                            <p className="text-xs text-gray-400">결제 완료</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-gray-900">{pay.amount.toLocaleString()}원</span>
                                                    </div>
                                                </li>
                                            ))}
                                            {payments.length === 0 && <li className="px-5 py-8 text-center text-xs text-gray-400">결제 내역이 없습니다.</li>}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Activity */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">활동 기록</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">가입일</p>
                                            <p className="font-medium text-gray-900 text-sm">{new Date(member.joined_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="relative h-16 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                        <p className="text-xs text-gray-400">최근 출석 기록이 없습니다.</p>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
