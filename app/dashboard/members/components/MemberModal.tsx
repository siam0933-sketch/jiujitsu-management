'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment, deletePayment } from '../actions_payment'
import { updateMember, pauseMember, resumeMember, getMemberAttendanceLogs, generateMemberPassword, updateMemberPaymentEndDate } from '../actions'
import { enrollMemberInClass, unenrollMemberFromClass } from '../../attendance/actions_enrollment'
import { MemberStatusBadge, MemberStartDate, MemberJoinedDate, MemberPauseController } from './MemberComponents'
import { BELT_OPTIONS_DATA, displayBeltName } from '../constants'
import AttendanceHistory from '../[id]/AttendanceHistory'
import PromotionHistory from '../[id]/PromotionHistory'

export default function MemberModal({ member }: { member: any }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const closeModal = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('id')
        router.replace(`${pathname}?${params.toString()}`)
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPaused, setIsPaused] = useState(member.status === 'paused')

    // Basic Info State
    const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false)
    const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false)
    const [basicInfoForm, setBasicInfoForm] = useState({ ...member })

    // Expiry Date Edit State
    const [isEditingExpiryDate, setIsEditingExpiryDate] = useState(false)
    const [tempExpiryDate, setTempExpiryDate] = useState(member.payment_end_date ? new Date(member.payment_end_date).toISOString().split('T')[0] : '')

    const handleSaveExpiryDate = async () => {
        setIsSubmitting(true)
        const res = await updateMemberPaymentEndDate(member.id, tempExpiryDate || null)
        setIsSubmitting(false)
        if (res?.error) alert(res.error)
        else {
            setIsEditingExpiryDate(false)
            router.refresh()
        }
    }

    // Payment Form State
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
    const togglePaymentForm = () => setIsPaymentFormOpen(!isPaymentFormOpen)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [manualAmount, setManualAmount] = useState<number | null>(null)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentMethod, setPaymentMethod] = useState<string>('card')

    // Config Data
    const [plans, setPlans] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([]) // [NEW] Products
    const [durationMonths, setDurationMonths] = useState(1)
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set())
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set()) // [NEW] Selected Products
    const [newExpiryDate, setNewExpiryDate] = useState('') // New state for expiry preview

    // Payments List
    const [payments, setPayments] = useState<any[]>([])
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
    const [editAmount, setEditAmount] = useState(0)
    const [editDate, setEditDate] = useState('')
    const [editOptionIds, setEditOptionIds] = useState<Set<string>>(new Set())

    // History
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
    const [enrolledClasses, setEnrolledClasses] = useState<any[]>([])
    const [allSchedules, setAllSchedules] = useState<any[]>([]) // [NEW] All available gym classes
    const [popoverDay, setPopoverDay] = useState<string | null>(null) // [NEW] Current day for class enrollment popover
    const [promotionLogs, setPromotionLogs] = useState<any[]>([])

    // Pause Modal State
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
    const [pauseStartDate, setPauseStartDate] = useState(new Date().toISOString().split('T')[0])
    const [pauseEndDate, setPauseEndDate] = useState('')
    const [isIndefinitePause, setIsIndefinitePause] = useState(true)

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [pricing, history, attLogs, promos, enrolls, schedules] = await Promise.all([
                    getPricingData(),
                    getPaymentHistory(member.id),
                    getMemberAttendanceLogs(member.id),
                    supabase.from('gym_promotion_logs').select('*').eq('member_id', member.id).order('promoted_at', { ascending: false }),
                    supabase.from('gym_class_enrollments').select('*, gym_schedules(*)').eq('member_id', member.id),
                    supabase.from('gym_schedules').select('*').eq('gym_id', member.gym_id).order('start_time') // Fetch all classes
                ])

                // Sort plans: Period tickets first, then by price descending
                const sortedPlans = (pricing.plans || []).sort((a: any, b: any) => {
                    // Prioritize period type
                    if (a.type === 'period' && b.type !== 'period') return -1
                    if (a.type !== 'period' && b.type === 'period') return 1

                    // Then sort by price descending
                    return b.price - a.price
                })

                setPlans(sortedPlans)

                // Default select the first plan (most expensive period ticket)
                if (sortedPlans.length > 0) {
                    setSelectedPlanId(sortedPlans[0].id)
                }

                setOptions(pricing.options)
                setProducts(pricing.products) // [NEW]
                setPayments(history)
                setAttendanceLogs(attLogs)
                if (promos.data) setPromotionLogs(promos.data)

                // Format enrollments
                if (enrolls.data) {
                    const formatted = enrolls.data.map((e: any) => ({
                        id: e.schedule_id, // Need schedule_id to identify enrollment for unenroll
                        class_name: e.gym_schedules?.class_name || 'Unknown',
                        day_of_week: e.gym_schedules?.day_of_week,
                        start_time: e.gym_schedules?.start_time
                    }))
                    setEnrolledClasses(formatted)
                }

                if (schedules.data) {
                    setAllSchedules(schedules.data)
                }
            } catch (err) {
                console.error('Data Loading Error:', err)
                alert('데이터를 불러오는 중 오류가 발생했습니다.')
            }
        }
        loadData()
    }, [member.id])


    const handleEnrollToggle = async (scheduleId: string, isEnrolled: boolean) => {
        setIsSubmitting(true)
        if (isEnrolled) {
            if (!confirm('이 수업 수강을 취소하시겠습니까?')) {
                setIsSubmitting(false)
                return
            }
            const res = await unenrollMemberFromClass(scheduleId, member.id)
            if (res?.error) alert(res.error)
            else {
                setEnrolledClasses(prev => prev.filter(c => c.id !== scheduleId))
            }
        } else {
            const res = await enrollMemberInClass(scheduleId, member.id)
            if (res?.error) alert(res.error)
            else {
                // Optimistic UI update
                const schedule = allSchedules.find(s => s.id === scheduleId)
                if (schedule) {
                    setEnrolledClasses(prev => [...prev, {
                        id: schedule.id,
                        class_name: schedule.class_name,
                        day_of_week: schedule.day_of_week,
                        start_time: schedule.start_time
                    }])
                }
            }
        }
        setIsSubmitting(false)
        setPopoverDay(null)
        router.refresh()
    }

    // Helpers
    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return '-'
        const birthYear = new Date(birthDate).getFullYear()
        const currentYear = new Date().getFullYear()
        if (isNaN(birthYear)) return '-'
        return `${currentYear - birthYear + 1}세`
    }

    const startEditingBasicInfo = () => {
        setBasicInfoForm({ ...member })
        setIsEditingBasicInfo(true)
    }

    const cancelEditingBasicInfo = () => {
        setIsEditingBasicInfo(false)
        setBasicInfoForm({ ...member })
    }

    const saveBasicInfo = async () => {
        if (!confirm('기본 정보를 저장하시겠습니까?')) return
        const res = await updateMember(member.id, basicInfoForm)
        if (res?.error) alert(res.error)
        else {
            alert('저장되었습니다.')
            setIsEditingBasicInfo(false)
            router.refresh()
        }
    }

    // Payment Logic
    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    const handleToggleOption = (optId: string) => {
        const next = new Set(selectedOptionIds)
        if (next.has(optId)) next.delete(optId)
        else next.add(optId)
        setSelectedOptionIds(next)
        setManualAmount(null) // Reset manual override
    }

    const handleToggleProduct = (prodId: string) => {
        const next = new Set(selectedProductIds)
        if (next.has(prodId)) next.delete(prodId)
        else next.add(prodId)
        setSelectedProductIds(next)
        setManualAmount(null)
    }

    // Auto-calc Expiry Date when plan/months change
    useEffect(() => {
        if (!selectedPlan || selectedPlan.type !== 'period') {
            setNewExpiryDate('')
            return
        }

        // Base Date: Max(Current Expiry, Today)
        let baseDate = new Date()
        if (member.payment_end_date) {
            const currentEnd = new Date(member.payment_end_date)
            if (currentEnd > baseDate) {
                baseDate = currentEnd
            }
        }

        // Add Months
        const nextDate = new Date(baseDate)
        nextDate.setMonth(nextDate.getMonth() + durationMonths)
        setNewExpiryDate(nextDate.toISOString().split('T')[0])

    }, [selectedPlanId, durationMonths, member.payment_end_date])

    // Calculate Total
    const calculateTotal = () => {
        if (!selectedPlan) return 0
        let total = selectedPlan.price
        if (selectedPlan.type === 'period') {
            total = selectedPlan.price * durationMonths
            selectedOptionIds.forEach(id => {
                const opt = options.find(o => o.id === id)
                if (opt) total += opt.price * durationMonths
            })
        }

        // Add Products Price (Independent of duration)
        selectedProductIds.forEach(id => {
            const prod = products.find(p => p.id === id)
            if (prod) total += prod.price
        })

        return total
    }
    const currentTotal = calculateTotal()
    const finalAmount = manualAmount !== null ? manualAmount : currentTotal

    const handleSubmitPayment = async () => {
        if (!selectedPlanId) return alert('이용권을 선택해주세요.')
        if (!confirm(`${finalAmount.toLocaleString()}원 결제를 진행하시겠습니까?`)) return

        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('member_id', member.id)
        formData.append('plan_id', selectedPlanId)
        formData.append('amount', String(finalAmount))
        formData.append('payment_date', paymentDate)
        formData.append('payment_method', paymentMethod)
        formData.append('duration_months', String(durationMonths))
        formData.append('plan_name', selectedPlan?.name || '')
        formData.append('type', selectedPlan?.type || '')
        formData.append('option_ids', JSON.stringify(Array.from(selectedOptionIds)))
        formData.append('product_ids', JSON.stringify(Array.from(selectedProductIds))) // [NEW]

        // Generate options summary text
        const selectedOptionNames = Array.from(selectedOptionIds).map(id => options.find(o => o.id === id)?.name).filter(Boolean)
        const selectedProductNames = Array.from(selectedProductIds).map(id => products.find(p => p.id === id)?.name).filter(Boolean) // [NEW]

        const allSummary = [...selectedOptionNames, ...selectedProductNames].join(', ')
        formData.append('options_summary', allSummary)

        if (newExpiryDate) {
            formData.append('new_payment_end_date', newExpiryDate)
        }

        const res = await createPayment(formData)
        setIsSubmitting(false)

        if (res?.error) alert(res.error)
        else {
            alert('결제가 완료되었습니다.')
            setIsPaymentFormOpen(false)
            // Refresh payments
            const newHistory = await getPaymentHistory(member.id)
            setPayments(newHistory)
            router.refresh()
        }
    }

    // Edit Payment
    const startEditing = (pay: any) => {
        setEditingPaymentId(pay.id)
        setEditAmount(pay.amount)
        setEditDate(pay.payment_date)
    }
    const cancelEditing = () => setEditingPaymentId(null)

    const handleUpdatePayment = async (pay: any) => {
        const res = await updatePayment(pay.id, { amount: editAmount, payment_date: editDate })
        if (res?.error) alert(res.error)
        else {
            setEditingPaymentId(null)
            const newHistory = await getPaymentHistory(member.id)
            setPayments(newHistory)
        }
    }

    const handleDeletePayment = async (id: string) => {
        if (!confirm('결제 내역을 삭제하시겠습니까?')) return
        await deletePayment(id)
        const newHistory = await getPaymentHistory(member.id)
        setPayments(newHistory)
    }

    const handleToggleEditOption = (id: string) => {
        // ... implementation for editing options if needed
    }

    // Pause Helpers
    const calculateNewExpiry = () => {
        if (!member.payment_end_date || isIndefinitePause || !pauseEndDate) return null
        const start = new Date(pauseStartDate)
        const end = new Date(pauseEndDate)
        const durationMs = end.getTime() - start.getTime()
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1
        if (days <= 0) return null

        const currentExpiry = new Date(member.payment_end_date)
        const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
        return newExpiry.toLocaleDateString()
    }

    const handlePauseSubmit = async () => {
        // Modal "Apply" is confirmation
        setIsSubmitting(true)
        const res = await pauseMember(member.id, pauseStartDate, isIndefinitePause ? undefined : pauseEndDate)
        setIsSubmitting(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert('휴관 처리되었습니다.')
            setIsPauseModalOpen(false)
            setIsPaused(true) // Optimistic
            router.refresh()
        }
    }

    const handleResume = async () => {
        if (!confirm('복귀 처리하시겠습니까?')) return
        const res = await resumeMember(member.id)
        if (res.error) {
            alert(res.error)
        } else {
            alert('복귀 처리되었습니다.')
            setIsPaused(false) // Optimistic
            router.refresh()
        }
    }

    return (
        <div className="relative z-50">
            {/* Modal Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex-1">
                                <p className="text-2xl font-bold text-gray-900 mb-1">회원 상세 정보</p>
                                {/* Header content removed as per request */}
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Simplified Pause Modal */}
                        {isPauseModalOpen && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setIsPauseModalOpen(false); }}>
                                <div className="bg-white rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <h4 className="font-bold text-gray-900 mb-4">휴관 설정</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">시작일</label>
                                            <input
                                                type="date"
                                                value={pauseStartDate}
                                                onChange={e => setPauseStartDate(e.target.value)}
                                                className="w-full text-sm border-gray-300 rounded"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs text-gray-500">종료일</label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 w-3 h-3"
                                                        checked={isIndefinitePause}
                                                        onChange={e => setIsIndefinitePause(e.target.checked)}
                                                    />
                                                    <span className="text-xs text-gray-500">무기한</span>
                                                </label>
                                            </div>
                                            <input
                                                type="date"
                                                value={pauseEndDate}
                                                onChange={e => {
                                                    setPauseEndDate(e.target.value)
                                                    setIsIndefinitePause(false)
                                                }}
                                                disabled={isIndefinitePause}
                                                className="w-full text-sm border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                                            />
                                        </div>

                                        {!isIndefinitePause && pauseEndDate && member.payment_end_date && (
                                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                                                <p>예상 만료일 연장:</p>
                                                <p className="font-bold">기존: {new Date(member.payment_end_date).toLocaleDateString()}</p>
                                                <p className="font-bold text-blue-600">변경: {calculateNewExpiry()}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsPauseModalOpen(false)}
                                                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={handlePauseSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 py-2 text-sm text-white bg-orange-600 rounded hover:bg-orange-500 disabled:opacity-50 font-bold"
                                            >
                                                휴관 적용
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 px-4 py-6 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                            {/* Section 1: Basic Info */}
                            <section>
                                <div className="flex justify-between items-center w-full mb-3">
                                    <h4 className="text-lg font-bold text-gray-900 uppercase tracking-wider">기본 정보</h4>
                                    <div className="flex items-center gap-2">
                                        {isPaused ? (
                                            <button
                                                onClick={handleResume}
                                                className="text-sm border border-green-200 bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 transition-colors font-medium"
                                            >
                                                복귀 처리
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsPauseModalOpen(true)}
                                                className="text-sm border border-orange-200 bg-orange-50 text-orange-600 px-3 py-1.5 rounded hover:bg-orange-100 transition-colors font-medium"
                                            >
                                                휴관 설정
                                            </button>
                                        )}
                                        <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>
                                        {!isEditingBasicInfo ? (
                                            <button onClick={startEditingBasicInfo} className="text-sm text-gray-500 hover:text-blue-600 underline font-medium">편집</button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={cancelEditingBasicInfo} className="text-sm text-gray-500 hover:text-gray-700 underline font-medium">취소</button>
                                                <button onClick={saveBasicInfo} className="text-sm text-blue-600 hover:text-blue-800 font-bold underline">저장</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 ${isEditingBasicInfo ? 'ring-2 ring-blue-100' : ''}`}>
                                    {/* Simplified View/Edit Fields */}
                                    {/* Row 1: Name, Gender, Birth Date, ID */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">이름</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.name} onChange={e => setBasicInfoForm({ ...basicInfoForm, name: e.target.value })} className="w-full text-base border-gray-300 rounded p-2" />
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <p className="font-bold text-xl text-gray-900 leading-none">{member.name}</p>
                                                <span className="text-sm text-gray-500 ml-1">({calculateAge(member.birth_date)})</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">성별</p>
                                        {isEditingBasicInfo ? (
                                            <select value={basicInfoForm.gender || 'male'} onChange={e => setBasicInfoForm({ ...basicInfoForm, gender: e.target.value })} className="w-full text-base border-gray-300 rounded p-2">
                                                <option value="male">남성</option>
                                                <option value="female">여성</option>
                                            </select>
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900">{member.gender === 'male' ? '남성' : '여성'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">생년월일</p>
                                        {isEditingBasicInfo ? (
                                            <input type="date" value={basicInfoForm.birth_date || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, birth_date: e.target.value })} className="w-full text-base border-gray-300 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900">{member.birth_date || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">출석번호</p>
                                        {isEditingBasicInfo ? (
                                            <input
                                                value={basicInfoForm.access_code || ''}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, access_code: e.target.value })}
                                                className="w-full text-base border-gray-300 rounded font-mono p-2"
                                                placeholder="출석번호"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <code className="text-lg bg-gray-50 px-2 py-1 rounded text-gray-900 font-bold font-mono tracking-wider">
                                                    {member.access_code || (member.phone ? member.phone.slice(-4) : '-')}
                                                </code>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">로그인 비밀번호</p>
                                        <div className="flex items-center gap-2">
                                            {member.login_password ? (
                                                <code className="text-lg bg-gray-50 px-2 py-1 rounded text-gray-900 font-bold font-mono tracking-wider">
                                                    {member.login_password}
                                                </code>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`비밀번호를 자동으로 생성하시겠습니까?`)) {
                                                            setIsSubmitting(true)
                                                            const res = await generateMemberPassword(member.id)
                                                            setIsSubmitting(false)

                                                            if (res?.error) alert(res.error)
                                                            else {
                                                                alert(`비밀번호가 생성되었습니다: [${res.password}]`)
                                                                router.refresh()
                                                            }
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                    className="text-xs border border-blue-200 bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-bold flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <span>⚠️ 미설정</span>
                                                    <span className="text-[10px] font-normal text-blue-400">(클릭하여 자동생성)</span>
                                                </button>
                                            )}
                                            {/* 재발급 버튼 제거 (요청사항) */}
                                        </div>
                                    </div>

                                    {/* Row 2: Phone, Guardian Phone, Address */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.phone} onChange={e => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })} className="w-full text-base border-gray-300 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900">{member.phone}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 mb-1">보호자 전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.guardian_phone || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, guardian_phone: e.target.value })} className="w-full text-base border-gray-300 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900">{member.guardian_phone || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-sm font-bold text-gray-500 mb-1">주소</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.address || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, address: e.target.value })} className="w-full text-base border-gray-300 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 truncate">{member.address || '-'}</p>
                                        )}
                                    </div>


                                </div>
                            </section>

                            {/* Section 2: Payment */}
                            <section>
                                <h4 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-3">이용권 및 결제</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    {/* Status */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-gray-500 text-sm font-bold">만료일</p>
                                                {!isEditingExpiryDate ? (
                                                    <button onClick={() => setIsEditingExpiryDate(true)} className="text-xs text-blue-500 hover:text-blue-700 underline px-1 py-0.5 rounded focus:outline-none focus:bg-blue-50">수정</button>
                                                ) : (
                                                    <div className="flex gap-1 ml-2">
                                                        <button onClick={handleSaveExpiryDate} disabled={isSubmitting} className="text-xs text-white bg-blue-600 px-2 py-1 rounded shadow-sm hover:bg-blue-700 transition">저장</button>
                                                        <button onClick={() => { setIsEditingExpiryDate(false); setTempExpiryDate(member.payment_end_date ? new Date(member.payment_end_date).toISOString().split('T')[0] : '') }} disabled={isSubmitting} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-300 shadow-sm hover:bg-gray-200 transition">취소</button>
                                                    </div>
                                                )}
                                            </div>
                                            {!isEditingExpiryDate ? (
                                                <p className="text-2xl font-bold text-gray-900">{member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '미등록'}</p>
                                            ) : (
                                                <input
                                                    type="date"
                                                    value={tempExpiryDate}
                                                    onChange={e => setTempExpiryDate(e.target.value)}
                                                    className="block w-full text-xl font-bold border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Form Toggle */}
                                    <div className="border rounded-lg mb-6 overflow-hidden">
                                        <button onClick={togglePaymentForm} className="w-full flex items-center justify-between p-4 bg-gray-50 text-sm font-bold text-gray-600 hover:bg-gray-100">
                                            <span>결제하기</span>
                                            <span>{isPaymentFormOpen ? '▲' : '▼'}</span>
                                        </button>
                                        {isPaymentFormOpen && (
                                            <div className="p-6 bg-white border-t">
                                                {/* Simple Payment Form */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-500 mb-1 font-bold">이용권 선택</label>
                                                        <select
                                                            value={selectedPlanId}
                                                            onChange={e => setSelectedPlanId(e.target.value)}
                                                            className="w-full text-base border-2 border-gray-900 rounded p-2"
                                                        >
                                                            <option value="">이용권 선택</option>
                                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>)}
                                                        </select>
                                                    </div>

                                                    {selectedPlan?.type === 'period' && (
                                                        <div className="flex gap-4 items-center">
                                                            <div className="flex-1">
                                                                <label className="block text-sm text-gray-500 mb-1">개월 수</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={durationMonths}
                                                                    onChange={e => setDurationMonths(Number(e.target.value))}
                                                                    className="w-full text-base border-2 border-gray-900 rounded p-2"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-sm text-gray-500 mb-1">결제일</label>
                                                                <input
                                                                    type="date"
                                                                    value={paymentDate}
                                                                    onChange={e => setPaymentDate(e.target.value)}
                                                                    className="w-full text-base border-2 border-gray-900 rounded p-2"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-sm text-gray-500 mb-1">만료 예정일</label>
                                                                <input
                                                                    type="date"
                                                                    value={newExpiryDate}
                                                                    onChange={e => setNewExpiryDate(e.target.value)}
                                                                    className="w-full text-base border-2 border-gray-900 rounded p-2"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Options List Grouped by Group Name */}
                                                    {options.length > 0 && (
                                                        <div className="space-y-4 pt-2">
                                                            {Object.entries(
                                                                options.reduce((acc, opt) => {
                                                                    const group = opt.group_name || '기타';
                                                                    if (!acc[group]) acc[group] = [];
                                                                    acc[group].push(opt);
                                                                    return acc;
                                                                }, {} as Record<string, any[]>)
                                                            ).map(([groupName, groupOptions]: [string, any]) => (
                                                                <div key={groupName} className="space-y-2">
                                                                    <p className="text-sm text-gray-500 font-bold">{groupName}</p>
                                                                    {groupOptions.map((opt: any) => (
                                                                        <label key={opt.id} className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50">
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedOptionIds.has(opt.id)}
                                                                                    onChange={() => handleToggleOption(opt.id)}
                                                                                    className="rounded border-gray-300 text-blue-600 w-5 h-5"
                                                                                />
                                                                                <span className="text-base text-gray-700">{opt.name}</span>
                                                                            </div>
                                                                            <span className="text-base font-medium text-gray-900">
                                                                                {(() => {
                                                                                    const price = selectedPlan?.type === 'period' ? opt.price * durationMonths : opt.price
                                                                                    return `${price > 0 ? '+' : ''}${price.toLocaleString()}원`
                                                                                })()}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Product List */}
                                                    {products.length > 0 && (
                                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                                            <div className="space-y-2">
                                                                <p className="text-sm text-gray-500 font-bold">상품 (일회성 구매)</p>
                                                                {products.map((prod: any) => (
                                                                    <label key={prod.id} className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedProductIds.has(prod.id)}
                                                                                onChange={() => handleToggleProduct(prod.id)}
                                                                                className="rounded border-gray-300 text-blue-600 w-5 h-5"
                                                                            />
                                                                            <span className="text-base text-gray-700">{prod.name}</span>
                                                                        </div>
                                                                        <span className="text-base font-medium text-gray-900">
                                                                            +{prod.price.toLocaleString()}원
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded mb-2 border border-gray-100">
                                                        <span className="text-base font-bold text-gray-700">결제 수단</span>
                                                        <select
                                                            value={paymentMethod}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                        >
                                                            <option value="card">카드</option>
                                                            <option value="cash">현금</option>
                                                            <option value="transfer">계좌이체</option>
                                                            <option value="other">기타</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded border border-gray-100 mb-4">
                                                        <span className="text-base font-bold">총 결제금액</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={(manualAmount !== null ? manualAmount : currentTotal).toLocaleString()}
                                                                onChange={e => {
                                                                    const val = Number(e.target.value.replace(/[^0-9]/g, ''))
                                                                    setManualAmount(val)
                                                                }}
                                                                className="text-2xl font-bold text-blue-600 bg-transparent text-right border-0 border-b border-gray-300 focus:ring-0 focus:border-blue-500 w-40 p-0"
                                                            />
                                                            <span className="text-2xl font-bold text-blue-600">원</span>
                                                        </div>
                                                    </div>

                                                    <button onClick={handleSubmitPayment} disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-500">
                                                        결제하기
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* History */}
                                    <h5 className="text-sm font-bold text-gray-500 mb-2">최근 결제 내역</h5>
                                    <div className="space-y-2">
                                        {payments.map(pay => (
                                            <div key={pay.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                                                {editingPaymentId === pay.id ? (
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            type="date"
                                                            value={editDate}
                                                            onChange={e => setEditDate(e.target.value)}
                                                            className="text-xs border border-blue-300 rounded px-1 py-0.5"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editAmount.toLocaleString()}
                                                            onChange={e => {
                                                                const val = Number(e.target.value.replace(/[^0-9]/g, ''))
                                                                setEditAmount(val)
                                                            }}
                                                            className="flex-1 text-xs border border-blue-300 rounded px-1 py-0.5 text-right"
                                                        />
                                                        <button onClick={() => handleUpdatePayment(pay)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
                                                        <button onClick={cancelEditing} className="text-xs bg-gray-200 px-2 py-1 rounded">취소</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3 w-full">
                                                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{pay.payment_date}</span>
                                                            <div className="flex justify-between items-center flex-1 min-w-0">
                                                                <span className="text-gray-700 text-base truncate pr-2">
                                                                    {(() => {
                                                                        const snap = pay.plan_snapshot
                                                                        if (!snap) return '결제 내역'
                                                                        const parts = []
                                                                        if (snap.plan_name) parts.push(snap.plan_name)
                                                                        if (snap.type === 'period' && snap.duration_months) parts.push(`${snap.duration_months}개월`)
                                                                        else if (snap.type === 'session' && snap.session_count) parts.push(`${snap.session_count}회`)
                                                                        if (snap.options_summary) parts.push(snap.options_summary.replace(/, /g, '/'))
                                                                        return parts.join('/')
                                                                    })()}
                                                                </span>
                                                                <div className="flex gap-2 items-center">
                                                                    <span className="font-bold cursor-pointer hover:text-blue-600 text-base" onClick={() => startEditing(pay)}>
                                                                        {pay.amount.toLocaleString()}원
                                                                    </span>
                                                                    <div className="flex gap-1 ml-2">
                                                                        <button onClick={() => startEditing(pay)} className="text-xs text-blue-500 hover:underline">수정</button>
                                                                        <button onClick={() => handleDeletePayment(pay.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {payments.length === 0 && <p className="text-xs text-gray-300 text-center py-2">내역 없음</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: History */}
                            <section>
                                <h4 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-3">활동 기록</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <MemberJoinedDate memberId={member.id} joinedAt={member.joined_at} />
                                        <MemberStartDate memberId={member.id} startDate={member.start_date} joinedAt={member.joined_at} />
                                    </div>
                                    <hr className="border-gray-100" />

                                    {/* Weekly Schedule */}
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-500 mb-2">수강 중인 수업 (주간 시간표) <span className="text-xs font-normal text-gray-400 ml-1">요일 칸을 눌러 편집</span></h5>
                                        <div className="grid grid-cols-7 gap-1 text-center bg-gray-50 rounded-lg p-2 border border-gray-100 relative">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                const dayMap: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일' }
                                                const classesOnDay = enrolledClasses.filter((e: any) => e.day_of_week === day)
                                                // Sort by start_time
                                                classesOnDay.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))

                                                const isPopoverOpen = popoverDay === day
                                                const availableClasses = allSchedules.filter(s => s.day_of_week === day)
                                                const hasClassesForDay = availableClasses.length > 0

                                                return (
                                                    <div key={day} className="flex flex-col gap-1 relative">
                                                        <span className={`text-xs font-bold ${day === 'Sun' ? 'text-red-400' : day === 'Sat' ? 'text-blue-400' : 'text-gray-400'}`}>
                                                            {dayMap[day]}
                                                        </span>
                                                        <div
                                                            className="min-h-[50px] bg-white rounded border border-gray-100 p-1 flex flex-col gap-1 items-center justify-start cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all relative z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (hasClassesForDay) setPopoverDay(isPopoverOpen ? null : day)
                                                            }}
                                                        >
                                                            {classesOnDay.length > 0 ? classesOnDay.map((c: any, i: number) => (
                                                                <span key={i} className="text-xs leading-tight text-blue-600 font-normal block bg-blue-50 px-1 py-0.5 rounded w-full border border-blue-100">
                                                                    {c.class_name}
                                                                </span>
                                                            )) : (
                                                                <div className="h-full w-full flex items-center justify-center flex-1">
                                                                    <span className="text-xs text-gray-200 block mt-1">+ 추가</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Popup Menu */}
                                                        {isPopoverOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-20" onClick={() => setPopoverDay(null)} />
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-1 text-left">
                                                                    <div className="px-2 py-1 mb-1 bg-gray-50 border-b border-gray-100">
                                                                        <span className="text-xs font-bold text-gray-500">{dayMap[day]}요일 전체 수업</span>
                                                                    </div>
                                                                    {availableClasses.length > 0 ? availableClasses.map((ac: any) => {
                                                                        const isEnrolled = enrolledClasses.some(ec => ec.id === ac.id)
                                                                        return (
                                                                            <button
                                                                                key={ac.id}
                                                                                onClick={() => handleEnrollToggle(ac.id, isEnrolled)}
                                                                                disabled={isSubmitting}
                                                                                className={`w-full text-left px-2 py-1.5 text-xs rounded mb-1 flex justify-between items-center ${isEnrolled ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                            >
                                                                                <span className="truncate pr-2">{ac.class_name}</span>
                                                                                {isEnrolled && <span className="text-[10px] bg-white border border-blue-200 px-1 rounded shadow-sm text-red-500 hover:bg-red-50 ml-1 shrink-0">취소</span>}
                                                                                {!isEnrolled && <span className="text-[10px] text-gray-400 align-middle shrink-0">{ac.start_time.slice(0, 5)}</span>}
                                                                            </button>
                                                                        )
                                                                    }) : (
                                                                        <div className="px-2 py-3 text-center text-xs text-gray-400">등록된 수업 없음</div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <AttendanceHistory
                                        logs={attendanceLogs}
                                        memberId={member.id}
                                        onUpdate={async () => {
                                            const logs = await getMemberAttendanceLogs(member.id)
                                            setAttendanceLogs(logs)
                                            router.refresh()
                                        }}
                                    />

                                    <hr className="border-gray-100" />

                                    <PromotionHistory
                                        memberId={member.id}
                                        memberName={member.name}
                                        memberBelt={member.belt}
                                        initialLogs={promotionLogs}
                                        joinedAt={member.joined_at}
                                        startDate={member.start_date}
                                    />
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
            </div >
        </div >
    )
}
