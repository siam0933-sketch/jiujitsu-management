'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment, deletePayment } from '../actions_payment'
import { updateMember } from '../actions'
import { MemberStatusBadge, MemberStartDate, MemberPauseButton } from './MemberComponents'
import PromotionHistory from '../[id]/PromotionHistory'
import { getPromotionLogs, type PromotionLog } from '../[id]/actions'
import { getMemberEnrollments, type EnrolledClassInfo } from '../../attendance/actions_enrollment'
import { createClient } from '@/utils/supabase/client'

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
    const supabase = createClient()

    // Data State
    const [plans, setPlans] = useState<Plan[]>([])
    const [options, setOptions] = useState<Option[]>([])
    const [payments, setPayments] = useState<Payment[]>([])

    // New Data State
    const [promotionLogs, setPromotionLogs] = useState<PromotionLog[]>([])
    const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClassInfo[]>([])
    const [isPaused, setIsPaused] = useState(false)

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

    // Edit Mode State
    const [editAmount, setEditAmount] = useState<number>(0)
    const [editDate, setEditDate] = useState('')
    const [editOptionIds, setEditOptionIds] = useState<Set<string>>(new Set())

    const closeModal = () => {
        router.push('/dashboard/members')
    }

    const startEditing = (payment: Payment) => {
        setEditingPaymentId(payment.id)
        setEditAmount(payment.amount)
        setEditDate(payment.payment_date)
        const snap = payment.plan_snapshot || {}
        setEditOptionIds(new Set(snap.option_ids || []))
    }

    const cancelEditing = () => {
        setEditingPaymentId(null)
    }

    const handleToggleEditOption = (id: string) => {
        const next = new Set(editOptionIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setEditOptionIds(next)
    }

    const handleUpdatePayment = async (payment: Payment) => {
        if (!confirm('결제 내역을 수정하시겠습니까?')) return

        const snap = payment.plan_snapshot || {}
        // Recalculate options summary
        const optionNames = Array.from(editOptionIds).map(id => options.find(o => o.id === id)?.name).filter(Boolean).join(', ')

        const updatedSnapshot = {
            ...snap,
            option_ids: Array.from(editOptionIds),
            options_summary: optionNames
        }

        const res = await updatePayment(payment.id, {
            amount: editAmount,
            payment_date: editDate,
            plan_snapshot: updatedSnapshot
        })

        if (res.error) {
            alert(res.error)
        } else {
            alert('수정되었습니다.')
            setEditingPaymentId(null)
            const history = await getPaymentHistory(member.id)
            setPayments(history)
            router.refresh()
        }
    }

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('정말로 이 결제 내역을 삭제하시겠습니까? 복구할 수 없습니다.')) return

        const res = await deletePayment(paymentId)
        if (res.error) {
            alert(res.error)
        } else {
            alert('삭제되었습니다.')
            const history = await getPaymentHistory(member.id)
            setPayments(history)
            router.refresh()
        }
    }

    // Load Data
    useEffect(() => {
        const load = async () => {
            const pricing = await getPricingData()
            setPlans(pricing.plans)
            setOptions(pricing.options)

            const history = await getPaymentHistory(member.id)
            setPayments(history)

            // Load Promotion Logs
            const logs = await getPromotionLogs(member.id)
            setPromotionLogs(logs)

            // Load Enrolled Classes
            const enrolled = await getMemberEnrollments(member.id)
            setEnrolledClasses(enrolled)

            // Check Pause Status
            const { data: activePause } = await supabase
                .from('gym_membership_pauses')
                .select('id')
                .eq('member_id', member.id)
                .is('end_date', null)
                .single()
            setIsPaused(!!activePause)
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
                                <h3 className="text-xl font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                    {member.name}
                                    <MemberStatusBadge isPaused={isPaused} />
                                </h3>
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
                                    {/* Moved Start Date here from Activity? Or vice versa? User said Activity section. 
                                        Let's keep Basic Info as is, and put Start Date in Activity section as requested.
                                    */}
                                    <div className="col-span-2">
                                        <p className="text-gray-400 text-xs mb-1">학교/학년</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.school} {member.grade}</p>
                                    </div>
                                    <div className="col-span-4">
                                        <p className="text-gray-400 text-xs mb-1">주소</p>
                                        <p className="font-medium text-gray-900 text-sm">{member.address}</p>
                                    </div>
                                </div>
                            </section>

                            {/* MemberActions and Promotions moved to other sections */}

                            {/* Section 2: Payment & Update (New Layout) */}
                            <section>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">이용권 및 결제</h4>
                                </div>

                                {/* Main Container (Standard White Card) */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

                                    {/* 1. Status Info (Direct on Gray) */}
                                    <div className="flex justify-between items-start mb-4 px-1">
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1 font-bold">만료일</p>
                                            <div className="flex items-center gap-2 group">
                                                <p className="text-xl font-bold text-gray-900">
                                                    {member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '미등록'}
                                                    <span className="text-xs font-normal text-gray-500 ml-2">
                                                        {member.payment_end_date && new Date(member.payment_end_date) < new Date() ? '(만료됨)' : ''}
                                                    </span>
                                                </p>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer z-10"
                                                        defaultValue={member.payment_end_date ? member.payment_end_date.split('T')[0] : ''}
                                                        onChange={async (e) => {
                                                            if (!confirm('만료일을 변경하시겠습니까?')) return
                                                            const newDate = e.target.value
                                                            if (!newDate) return
                                                            await updateMember(member.id, { payment_end_date: newDate })
                                                            router.refresh()
                                                        }}
                                                    />
                                                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-white/50">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-500 text-xs mb-1 font-bold">결제 기준일</p>
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-gray-900 font-bold text-xl">매월</span>
                                                <input
                                                    type="number"
                                                    className="w-12 text-center text-xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none p-0"
                                                    defaultValue={member.payment_due_day || 1}
                                                    min={1}
                                                    max={31}
                                                    onBlur={async (e) => {
                                                        const newVal = parseInt(e.target.value)
                                                        if (newVal === member.payment_due_day) return
                                                        if (newVal < 1 || newVal > 31) return alert('1~31일 사이의 날짜를 입력해주세요.')

                                                        if (confirm(`결제 기준일을 매월 ${newVal}일로 변경하시겠습니까?`)) {
                                                            await updateMember(member.id, { payment_due_day: newVal })
                                                            router.refresh()
                                                        } else {
                                                            e.target.value = String(member.payment_due_day || 1)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.currentTarget.blur()
                                                    }}
                                                />
                                                <span className="text-gray-900 font-bold text-xl">일</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* (Optional) Remaining Sessions can go here too if needed, fitting the layout */}
                                    {member.remaining_sessions > 0 && (
                                        <div className="text-right mb-4 px-1">
                                            <p className="text-gray-500 text-xs mb-1 font-bold">잔여 횟수</p>
                                            <p className="text-xl font-bold text-blue-600">{member.remaining_sessions}회</p>
                                        </div>
                                    )}

                                    {/* 2. Payment Action Box (White Card) */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-3">
                                        <div
                                            onClick={togglePaymentForm}
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                                        >
                                            <svg
                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPaymentFormOpen ? 'rotate-90' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <h5 className="text-xs font-bold text-gray-500 uppercase group-hover:text-gray-700 transition-colors">
                                                결제하기
                                            </h5>
                                        </div>

                                        {/* Accordion Content */}
                                        {isPaymentFormOpen && (
                                            <div className="border-t border-gray-100 bg-gray-50/50 p-4">
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
                                                                <div className="space-y-3">
                                                                    {Object.entries(options.reduce((acc: any, opt) => {
                                                                        (acc[opt.group_name] = acc[opt.group_name] || []).push(opt);
                                                                        return acc;
                                                                    }, {})).map(([group, opts]: [string, any]) => (
                                                                        <div key={group} className="flex items-start gap-4">
                                                                            <p className="text-[11px] text-gray-500 font-bold mt-1.5 w-16 shrink-0">{group}</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {opts.map((opt: any) => (
                                                                                    <label key={opt.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs cursor-pointer select-none transition-colors shadow-sm ${selectedOptionIds.has(opt.id) ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="hidden"
                                                                                            checked={selectedOptionIds.has(opt.id)}
                                                                                            onChange={() => handleToggleOption(opt.id)}
                                                                                        />
                                                                                        {selectedOptionIds.has(opt.id) && (
                                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                                                        )}
                                                                                        <span>{opt.name}</span>
                                                                                        {opt.price > 0 && <span className="text-[10px] text-gray-400 font-normal">+{opt.price.toLocaleString()}</span>}
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
                                                                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-fit shadow-sm">
                                                                    <button onClick={() => setDurationMonths(Math.max(1, durationMonths - 1))} className="px-3 py-1.5 hover:bg-gray-50 border-r border-gray-300 text-gray-500 hover:text-gray-700 transition-colors text-xs font-bold">-</button>
                                                                    <span className="w-16 text-center text-sm font-bold text-gray-900 border-r border-gray-300 py-1">{durationMonths}개월</span>
                                                                    <button onClick={() => setDurationMonths(durationMonths + 1)} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors text-xs font-bold">+</button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <hr className="border-gray-200" />

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
                                    </div>

                                    {/* 3. Payment History Box (White Card) */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-3 bg-white border-b border-gray-100 flex justify-between items-center">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase">최근 결제 내역</h5>
                                            <MemberPauseButton memberId={member.id} isPaused={isPaused} />
                                        </div>
                                        <ul className="divide-y divide-gray-100">
                                            {payments.map(pay => {
                                                const isEditing = editingPaymentId === pay.id
                                                return (
                                                    <li key={pay.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                        {isEditing ? (
                                                            // Edit Form
                                                            <div className="space-y-3 bg-white p-2 rounded border border-blue-200">
                                                                <div className="flex gap-2">
                                                                    <div className="flex-1">
                                                                        <label className="text-[10px] text-gray-400 block mb-1">결제일</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editDate}
                                                                            onChange={(e) => setEditDate(e.target.value)}
                                                                            className="w-auto text-xs border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="text-[10px] text-gray-400 block mb-1">금액</label>
                                                                        <input
                                                                            type="number"
                                                                            value={editAmount}
                                                                            onChange={(e) => setEditAmount(Number(e.target.value))}
                                                                            className="w-full text-xs border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Options (Only if period plan or generic options available) */}
                                                                {(pay as any).plan_snapshot?.type === 'period' && (
                                                                    <div>
                                                                        <label className="text-[10px] text-gray-400 block mb-1">옵션 수정</label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {options.map((opt) => (
                                                                                <label key={opt.id} className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] cursor-pointer select-none ${editOptionIds.has(opt.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="hidden"
                                                                                        checked={editOptionIds.has(opt.id)}
                                                                                        onChange={() => handleToggleEditOption(opt.id)}
                                                                                    />
                                                                                    {editOptionIds.has(opt.id) && <span>✓</span>}
                                                                                    {opt.name}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between items-center pt-2">
                                                                    <button
                                                                        onClick={() => handleDeletePayment(pay.id)}
                                                                        className="text-xs text-red-500 underline hover:text-red-700"
                                                                    >
                                                                        삭제
                                                                    </button>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={cancelEditing}
                                                                            className="text-xs px-2 py-1 text-gray-500 border border-gray-300 rounded hover:bg-gray-100"
                                                                        >
                                                                            취소
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleUpdatePayment(pay)}
                                                                            className="text-xs px-2 py-1 text-white bg-blue-600 rounded hover:bg-blue-500"
                                                                        >
                                                                            저장
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // View Mode
                                                            <div className="flex justify-between items-center">
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
                                                                    <button
                                                                        onClick={() => startEditing(pay)}
                                                                        className="text-[10px] text-gray-400 hover:text-blue-600 border border-transparent hover:border-blue-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all"
                                                                    >
                                                                        수정
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                            {payments.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">결제 내역이 없습니다.</li>}
                                        </ul>
                                    </div>

                                </div>
                            </section>

                            {/* Section 3: Activity */}
                            {/* Section 3: Activity */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">활동 기록</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6">
                                    {/* Row 1: Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">가입일</p>
                                            <p className="font-medium text-gray-900 text-sm">{new Date(member.joined_at).toLocaleDateString()}</p>
                                        </div>
                                        <MemberStartDate memberId={member.id} startDate={member.start_date} joinedAt={member.joined_at} />
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Enrolled Classes */}
                                    <div>
                                        <p className="text-gray-400 text-xs mb-2">수강 중인 수업</p>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {enrolledClasses.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {enrolledClasses.map((cls, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-gray-200 text-gray-700 shadow-sm">
                                                            {cls.class_name} <span className="text-blue-600 ml-1">({cls.day_of_week})</span>
                                                            <span className="text-gray-300 mx-1 text-[10px]">•</span>
                                                            <span className="text-gray-500 font-normal">{cls.start_time}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400">등록된 수업이 없습니다.</p>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Row 2: Recent Attendance */}
                                    <div>
                                        <p className="text-gray-400 text-xs mb-2">최근 출석</p>
                                        <div className="relative h-16 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                            <p className="text-xs text-gray-400">최근 출석 기록이 없습니다.</p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Moved Promotion History Here */}
                                    <div>
                                        <p className="text-gray-400 text-xs mb-2">승급 이력</p>
                                        <PromotionHistory memberId={member.id} initialLogs={promotionLogs} />
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
