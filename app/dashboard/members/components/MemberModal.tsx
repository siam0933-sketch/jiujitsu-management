'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment, deletePayment } from '../actions_payment'
import { updateMember, pauseMember, resumeMember, getMemberAttendanceLogs, generateMemberPassword, updateMemberPaymentEndDate, updatePaymentBillingDay } from '../actions'
import { enrollMemberInClass, unenrollMemberFromClass } from '../../attendance/actions_enrollment'
import { MemberStatusBadge, MemberStartDate, MemberJoinedDate, MemberPauseController, PaymentBillingDay } from './MemberComponents'
import { BELT_OPTIONS_DATA, displayBeltName } from '../constants'
import AttendanceHistory from '../[id]/AttendanceHistory'
import PromotionHistory from '../[id]/PromotionHistory'
import ResetPasswordButton from './ResetPasswordButton'
import { addManualPoint, deductPoint, addCustomPoint } from '../[id]/point-actions'
import { Star, Plus, Minus } from 'lucide-react'
import MessagePanel from '../[id]/MessagePanel'

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

    // Points State
    const [pointLogs, setPointLogs] = useState<any[]>([])
    const [manualPointSettings, setManualPointSettings] = useState<any[]>([])
    const [showPointAdd, setShowPointAdd] = useState(false)
    const [showPointDeduct, setShowPointDeduct] = useState(false)
    const [pointDeductAmount, setPointDeductAmount] = useState('')
    const [pointDeductReason, setPointDeductReason] = useState('')
    const [pointError, setPointError] = useState('')
    const [isPointPending, startPointTransition] = useTransition()
    const [customPointName, setCustomPointName] = useState('')
    const [customPointAmount, setCustomPointAmount] = useState('')

    // Pause Modal State
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
    const [pauseStartDate, setPauseStartDate] = useState(new Date().toISOString().split('T')[0])
    const [pauseEndDate, setPauseEndDate] = useState('')
    const [isIndefinitePause, setIsIndefinitePause] = useState(true)

    // Load Data + auto-advance school grade
    useEffect(() => {
        const loadData = async () => {
            try {
                const [pricing, history, attLogs, promos, enrolls, schedules, pLogs, pSettings] = await Promise.all([
                    getPricingData(),
                    getPaymentHistory(member.id),
                    getMemberAttendanceLogs(member.id),
                    supabase.from('gym_promotion_logs').select('*').eq('member_id', member.id).order('promoted_at', { ascending: false }),
                    supabase.from('gym_class_enrollments').select('*, gym_schedules(*)').eq('member_id', member.id),
                    supabase.from('gym_schedules').select('*').eq('gym_id', member.gym_id).order('start_time'),
                    supabase.from('gym_point_logs').select('id, name, points, created_at').eq('member_id', member.id).order('created_at', { ascending: false }),
                    supabase.from('gym_point_settings').select('id, name, points').eq('gym_id', member.gym_id).eq('type', 'manual').eq('is_active', true)
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
                if (pLogs.data) setPointLogs(pLogs.data)
                if (pSettings.data) setManualPointSettings(pSettings.data)

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

                // 자동 학년 갱신: 현재 연도와 grade_updated_year를 비교
                const currentYear = new Date().getFullYear()
                const schoolType = member.school_type
                const gradeNumber = member.grade_number
                const gradeUpdatedYear = member.grade_updated_year

                if (
                    schoolType && schoolType !== '일반' &&
                    gradeNumber && gradeUpdatedYear &&
                    gradeUpdatedYear < currentYear
                ) {
                    let newSchoolType = schoolType
                    let newGradeNumber = gradeNumber + 1

                    if (schoolType === '초등학교' && gradeNumber === 6) {
                        newSchoolType = '중학교'; newGradeNumber = 1
                    } else if (schoolType === '중학교' && gradeNumber === 3) {
                        newSchoolType = '고등학교'; newGradeNumber = 1
                    } else if (schoolType === '고등학교' && gradeNumber === 3) {
                        newSchoolType = '일반'; newGradeNumber = 0
                    }

                    await supabase.from('gym_members').update({
                        school_type: newSchoolType,
                        grade_number: newSchoolType === '일반' ? null : newGradeNumber,
                        grade_updated_year: currentYear
                    }).eq('id', member.id)
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

    // Auto-calc Expiry Date when plan/months/paymentDate change
    useEffect(() => {
        if (!selectedPlan || selectedPlan.type !== 'period') {
            setNewExpiryDate('')
            return
        }

        // Base Date: Max(Current Expiry, Payment Date)
        let baseDate = paymentDate ? new Date(paymentDate) : new Date()

        if (member.payment_end_date) {
            const currentEnd = new Date(member.payment_end_date)
            // If the member's current expiry is later than the new payment date, 
            // the new period should be appended to the current expiry
            if (currentEnd > baseDate) {
                baseDate = currentEnd
            }
        }

        // Add Months
        const nextDate = new Date(baseDate)
        nextDate.setMonth(nextDate.getMonth() + durationMonths)

        // Adjust for leap years/month end clipping if necessary (JS Date handles most of this intuitively but can overflow to next month if target month has fewer days)
        if (nextDate.getDate() !== baseDate.getDate()) {
            nextDate.setDate(0); // Go to last day of previous month if it overflowed
        }

        setNewExpiryDate(nextDate.toISOString().split('T')[0])

    }, [selectedPlanId, durationMonths, member.payment_end_date, paymentDate])

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
                    <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-zinc-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-white dark:bg-zinc-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-1">회원 상세 정보</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <MessagePanel memberId={member.id} memberName={member.name} />
                                <button onClick={closeModal} className="text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:text-zinc-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Simplified Pause Modal */}
                        {isPauseModalOpen && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setIsPauseModalOpen(false); }}>
                                <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-4">휴관 설정</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">시작일</label>
                                            <input
                                                type="date"
                                                value={pauseStartDate}
                                                onChange={e => setPauseStartDate(e.target.value)}
                                                className="w-full text-sm border-gray-300 dark:border-zinc-700 rounded"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs text-gray-500 dark:text-zinc-400">종료일</label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 w-3 h-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 dark:border-zinc-700 appearance-none"
                                                        checked={isIndefinitePause}
                                                        onChange={e => setIsIndefinitePause(e.target.checked)}
                                                    />
                                                    <span className="text-xs text-gray-500 dark:text-zinc-400">무기한</span>
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
                                                className="w-full text-sm border-gray-300 dark:border-zinc-700 rounded disabled:bg-gray-100 dark:bg-zinc-800 disabled:text-gray-400 dark:text-zinc-500"
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
                                                className="flex-1 py-2 text-sm text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200"
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

                        <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-6 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                            {/* Section 1: Basic Info */}
                            <section>
                                <div className="flex justify-between items-center w-full mb-3">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">기본 정보</h4>
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
                                        <ResetPasswordButton memberId={member.id} />
                                        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                                        {!isEditingBasicInfo ? (
                                            <button onClick={startEditingBasicInfo} className="text-sm text-gray-500 dark:text-zinc-400 hover:text-blue-600 underline font-medium">편집</button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={cancelEditingBasicInfo} className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-300 underline font-medium">취소</button>
                                                <button onClick={saveBasicInfo} className="text-sm text-blue-600 hover:text-blue-800 font-bold underline">저장</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col gap-6 ${isEditingBasicInfo ? 'ring-2 ring-blue-100' : ''}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        {/* Simplified View/Edit Fields */}
                                    {/* Row 1: Name, Gender, Birth Date, ID */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">이름</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.name} onChange={e => setBasicInfoForm({ ...basicInfoForm, name: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" />
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <p className="font-bold text-xl text-gray-900 dark:text-zinc-100 leading-none">{member.name}</p>
                                                <span className="text-sm text-gray-500 dark:text-zinc-400 ml-1">({calculateAge(member.birth_date)})</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">성별</p>
                                        {isEditingBasicInfo ? (
                                            <select value={basicInfoForm.gender || 'male'} onChange={e => setBasicInfoForm({ ...basicInfoForm, gender: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2">
                                                <option value="male">남성</option>
                                                <option value="female">여성</option>
                                            </select>
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">{member.gender === 'male' ? '남성' : '여성'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">생년월일</p>
                                        {isEditingBasicInfo ? (
                                            <input type="date" value={basicInfoForm.birth_date || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, birth_date: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">{member.birth_date || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">출석번호</p>
                                        {isEditingBasicInfo ? (
                                            <input
                                                value={basicInfoForm.access_code || ''}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, access_code: e.target.value })}
                                                className="w-full text-base border-gray-300 dark:border-zinc-700 rounded font-mono p-2"
                                                placeholder="출석번호"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <code className="text-lg bg-gray-50 dark:bg-zinc-800/50 px-2 py-1 rounded text-gray-900 dark:text-zinc-100 font-bold font-mono tracking-wider">
                                                    {member.access_code || (member.phone ? member.phone.slice(-4) : '-')}
                                                </code>
                                            </div>
                                        )}
                                    </div>


                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                                        {/* Row 2: Phone, Guardian Phone, Address */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.phone} onChange={e => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">{member.phone}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">보호자 전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.guardian_phone || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, guardian_phone: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">{member.guardian_phone || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">주소</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.address || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, address: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100 truncate">{member.address || '-'}</p>
                                        )}
                                    </div>

                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                                        {/* Row 3: School */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">학교 구분</p>
                                        {isEditingBasicInfo ? (
                                            <select
                                                value={basicInfoForm.school_type || '일반'}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, school_type: e.target.value, grade_number: null })}
                                                className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2"
                                            >
                                                <option value="일반">일반</option>
                                                <option value="초등학교">초등학교</option>
                                                <option value="중학교">중학교</option>
                                                <option value="고등학교">고등학교</option>
                                            </select>
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">{member.school_type || '일반'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">학년</p>
                                        {isEditingBasicInfo ? (
                                            (basicInfoForm.school_type && basicInfoForm.school_type !== '일반') ? (
                                                <select
                                                    value={basicInfoForm.grade_number ?? ''}
                                                    onChange={e => setBasicInfoForm({ ...basicInfoForm, grade_number: e.target.value ? Number(e.target.value) : null })}
                                                    className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2"
                                                >
                                                    <option value="">선택</option>
                                                    {(basicInfoForm.school_type === '초등학교' ? [1,2,3,4,5,6] : [1,2,3]).map(n => (
                                                        <option key={n} value={n}>{n}학년</option>
                                                    ))}
                                                </select>
                                            ) : <p className="text-sm text-gray-400 dark:text-zinc-500 mt-2">-</p>
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100">
                                                {member.grade_number ? `${member.grade_number}학년` : '-'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">학교 이름</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.school || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, school: e.target.value })} className="w-full text-base border-gray-300 dark:border-zinc-700 rounded p-2" placeholder="학교 이름 (선택)" />
                                        ) : (
                                            <p className="font-medium text-lg text-gray-900 dark:text-zinc-100 truncate">{member.school || '-'}</p>
                                        )}
                                    </div>

                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Payment */}
                            <section>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider mb-3">이용권 및 결제</h4>
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
                                    {/* Status */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 h-5">
                                                <p className="text-gray-500 dark:text-zinc-400 text-sm font-bold leading-none">만료일</p>
                                                {!isEditingExpiryDate ? (
                                                    <button onClick={() => setIsEditingExpiryDate(true)} title="만료일 수정" className="text-gray-400 dark:text-zinc-500 hover:text-indigo-600 transition-colors focus:outline-none">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-1 ml-2">
                                                        <button onClick={handleSaveExpiryDate} disabled={isSubmitting} className="text-blue-600 hover:text-blue-800 disabled:opacity-50" title="저장">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button onClick={() => { setIsEditingExpiryDate(false); setTempExpiryDate(member.payment_end_date ? new Date(member.payment_end_date).toISOString().split('T')[0] : '') }} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600" title="취소">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {!isEditingExpiryDate ? (
                                                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '미등록'}</p>
                                            ) : (
                                                <input
                                                    type="date"
                                                    value={tempExpiryDate}
                                                    onChange={e => setTempExpiryDate(e.target.value)}
                                                    className="block w-full text-lg font-bold border-gray-300 dark:border-zinc-700 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2"
                                                />
                                            )}
                                        </div>
                                        {/* 결제 기준일 */}
                                        <div className="text-right">
                                            <PaymentBillingDay
                                                memberId={member.id}
                                                billingDay={member.payment_due_day ?? null}
                                                joinedDay={new Date(member.joined_at).getDate()}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Form Toggle */}
                                    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg mb-4 sm:mb-6 overflow-hidden">
                                        <button onClick={togglePaymentForm} className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-zinc-800/50 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800">
                                            <span>결제하기</span>
                                            <span>{isPaymentFormOpen ? '▲' : '▼'}</span>
                                        </button>
                                        {isPaymentFormOpen && (
                                            <div className="p-3 sm:p-6 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                                                {/* Simple Payment Form */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-500 dark:text-zinc-400 mb-1 font-bold">이용권 선택</label>
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
                                                        <div className="flex flex-wrap gap-2 sm:gap-4 items-start">
                                                            <div className="w-16 sm:w-auto sm:flex-1">
                                                                <label className="block text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-1 whitespace-nowrap">개월 수</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={durationMonths}
                                                                    onChange={e => setDurationMonths(Number(e.target.value))}
                                                                    className="w-full text-sm sm:text-base border-2 border-gray-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded p-1.5 sm:p-2"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-[120px]">
                                                                <label className="block text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-1 whitespace-nowrap">결제일</label>
                                                                <input
                                                                    type="date"
                                                                    value={paymentDate}
                                                                    onChange={e => setPaymentDate(e.target.value)}
                                                                    className="w-full text-sm sm:text-base border-2 border-gray-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded p-1.5 sm:p-2"
                                                                />
                                                            </div>
                                                            <div className="w-full sm:flex-1 sm:min-w-[120px]">
                                                                <label className="block text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-1 whitespace-nowrap">만료 예정일</label>
                                                                <input
                                                                    type="date"
                                                                    value={newExpiryDate}
                                                                    onChange={e => setNewExpiryDate(e.target.value)}
                                                                    className="w-full text-sm sm:text-base border-2 border-gray-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded p-1.5 sm:p-2"
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
                                                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-bold">{groupName}</p>
                                                                    {groupOptions.map((opt: any) => (
                                                                        <label key={opt.id} className="flex items-center justify-between p-2 sm:p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50">
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedOptionIds.has(opt.id)}
                                                                                    onChange={() => handleToggleOption(opt.id)}
                                                                                    className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 w-4 h-4 sm:w-5 sm:h-5"
                                                                                />
                                                                                <span className="text-sm sm:text-base text-gray-700 dark:text-zinc-300">{opt.name}</span>
                                                                            </div>
                                                                            <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-zinc-100">
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
                                                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                                                            <div className="space-y-2">
                                                                <p className="text-sm text-gray-500 dark:text-zinc-400 font-bold">상품 (일회성 구매)</p>
                                                                {products.map((prod: any) => (
                                                                    <label key={prod.id} className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedProductIds.has(prod.id)}
                                                                                onChange={() => handleToggleProduct(prod.id)}
                                                                                className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 w-5 h-5"
                                                                            />
                                                                            <span className="text-base text-gray-700 dark:text-zinc-300">{prod.name}</span>
                                                                        </div>
                                                                        <span className="text-base font-medium text-gray-900 dark:text-zinc-100">
                                                                            {prod.price < 0 ? '' : '+'}{prod.price.toLocaleString()}원
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded mb-2 border border-gray-100 dark:border-zinc-800/50">
                                                        <span className="text-base font-bold text-gray-700 dark:text-zinc-300">결제방법</span>
                                                        <select
                                                            value={paymentMethod}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-900"
                                                        >
                                                            <option value="card">카드</option>
                                                            <option value="cash">현금</option>
                                                            <option value="transfer">계좌이체</option>
                                                            <option value="other">기타</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded border border-gray-100 dark:border-zinc-800/50 mb-4">
                                                        <span className="text-base font-bold">총 결제금액</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={(manualAmount !== null ? manualAmount : currentTotal).toLocaleString()}
                                                                onChange={e => {
                                                                    const val = Number(e.target.value.replace(/[^0-9]/g, ''))
                                                                    setManualAmount(val)
                                                                }}
                                                                className="text-2xl font-bold text-blue-600 bg-transparent text-right border-0 border-b border-gray-300 dark:border-zinc-700 focus:ring-0 focus:border-blue-500 w-40 p-0"
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
                                    <h5 className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-2">최근 결제 내역</h5>
                                    <div className="space-y-2">
                                        {payments.map(pay => (
                                            <div key={pay.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                                                {editingPaymentId === pay.id ? (
                                                    <div className="flex items-center gap-1 sm:gap-2 w-full">
                                                        <input
                                                            type="date"
                                                            value={editDate}
                                                            onChange={e => setEditDate(e.target.value)}
                                                            className="w-24 sm:w-auto text-xs border border-blue-300 rounded px-1 py-0.5"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editAmount.toLocaleString()}
                                                            onChange={e => {
                                                                const val = Number(e.target.value.replace(/[^0-9]/g, ''))
                                                                setEditAmount(val)
                                                            }}
                                                            className="w-20 sm:w-auto flex-1 text-xs border border-blue-300 rounded px-1 py-0.5 text-right"
                                                        />
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={() => handleUpdatePayment(pay)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
                                                            <button onClick={cancelEditing} className="text-xs bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 px-2 py-1 rounded">취소</button>
                                                            <button onClick={() => handleDeletePayment(pay.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">삭제</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3 w-full">
                                                            <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap shrink-0">{pay.payment_date}</span>
                                                            <div className="flex justify-between items-center flex-1 min-w-0">
                                                                <span className="text-gray-700 dark:text-zinc-300 text-base truncate pr-2">
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
                                                                    <span className="font-bold cursor-pointer hover:text-blue-600 text-sm" onClick={() => startEditing(pay)}>
                                                                        {pay.amount.toLocaleString()}원
                                                                    </span>
                                                                    <div className="flex gap-1 ml-2">
                                                                        <button onClick={() => startEditing(pay)} className="text-xs text-blue-500 hover:underline">수정</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {payments.length === 0 && <p className="text-xs text-gray-300 dark:text-zinc-600 text-center py-2">내역 없음</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: History */}
                            <section>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider mb-3">활동 기록</h4>
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <MemberJoinedDate memberId={member.id} joinedAt={member.joined_at} />
                                        <MemberStartDate memberId={member.id} startDate={member.start_date} joinedAt={member.joined_at} />
                                    </div>
                                    <hr className="border-gray-100 dark:border-zinc-800/50" />

                                    {/* Weekly Schedule */}
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-500 dark:text-zinc-400 mb-2">수강 중인 수업 (주간 시간표) <span className="text-xs font-normal text-gray-400 dark:text-zinc-500 ml-1">요일 칸을 눌러 편집</span></h5>
                                        <div className="space-y-2 sm:space-y-3 relative">
                                            {[
                                                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                                                ['Sat', 'Sun']
                                            ].map((weekPart, partIndex) => (
                                                <div key={partIndex} className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
                                                    {weekPart.map(day => {
                                                        const dayMap: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일' }
                                                        const classesOnDay = enrolledClasses.filter((e: any) => e.day_of_week === day)
                                                        // Sort by start_time
                                                        classesOnDay.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))

                                                        const isPopoverOpen = popoverDay === day
                                                        const availableClasses = allSchedules.filter(s => s.day_of_week === day)
                                                        const hasClassesForDay = availableClasses.length > 0

                                                        return (
                                                            <div key={day} className="flex flex-col relative">
                                                                <div className={`py-1 text-[11px] sm:text-xs font-bold ${day === 'Sun' ? 'text-red-500' : day === 'Sat' ? 'text-blue-500' : 'text-gray-500 dark:text-zinc-400'}`}>
                                                                    {dayMap[day]}
                                                                </div>
                                                                <div
                                                                    className="min-h-[50px] sm:min-h-[60px] bg-white dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-700 p-1 flex flex-col gap-1 items-center justify-start cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all relative z-10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (hasClassesForDay) setPopoverDay(isPopoverOpen ? null : day)
                                                                    }}
                                                                >
                                                                    {classesOnDay.length > 0 ? classesOnDay.map((c: any, i: number) => (
                                                                        <span key={i} className="text-[10px] sm:text-xs leading-tight text-blue-700 font-medium block bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-0.5 sm:px-1 py-1 rounded w-full truncate">
                                                                            {c.class_name}
                                                                        </span>
                                                                    )) : (
                                                                        <div className="h-full w-full flex items-center justify-center flex-1">
                                                                            <span className="text-[10px] sm:text-xs text-gray-300 dark:text-zinc-600 block mt-1">+ 추가</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Popup Menu */}
                                                                {isPopoverOpen && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-20" onClick={() => setPopoverDay(null)} />
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-30 p-1 text-left">
                                                                            <div className="px-2 py-1.5 mb-1 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800/50">
                                                                                <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">{dayMap[day]}요일 전체 수업</span>
                                                                            </div>
                                                                            {availableClasses.length > 0 ? availableClasses.map((ac: any) => {
                                                                                const isEnrolled = enrolledClasses.some(ec => ec.id === ac.id)
                                                                                return (
                                                                                    <button
                                                                                        key={ac.id}
                                                                                        onClick={() => handleEnrollToggle(ac.id, isEnrolled)}
                                                                                        disabled={isSubmitting}
                                                                                        className={`w-full text-left px-2 py-2 text-xs rounded mb-1 flex justify-between items-center ${isEnrolled ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'}`}
                                                                                    >
                                                                                        <span className="truncate pr-2">{ac.class_name}</span>
                                                                                        {isEnrolled && <span className="text-[10px] bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded shadow-sm text-red-500 hover:bg-red-50 ml-1 shrink-0">취소</span>}
                                                                                        {!isEnrolled && <span className="text-[10px] text-gray-400 dark:text-zinc-500 align-middle shrink-0">{ac.start_time.slice(0, 5)}</span>}
                                                                                    </button>
                                                                                )
                                                                            }) : (
                                                                                <div className="px-2 py-3 text-center text-xs text-gray-400 dark:text-zinc-500">등록된 수업 없음</div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
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

                                    <hr className="border-gray-100 dark:border-zinc-800/50" />

                                    <PromotionHistory
                                        memberId={member.id}
                                        memberName={member.name}
                                        memberBelt={member.belt}
                                        memberStripe={member.latest_stripe}
                                        initialLogs={promotionLogs}
                                        joinedAt={member.joined_at}
                                        startDate={member.start_date}
                                    />

                                    <hr className="border-gray-100 dark:border-zinc-800/50" />

                                    {/* Points Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                                                <Star size={14} className="text-yellow-400" />
                                                포인트
                                                <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-400">
                                                    {pointLogs.reduce((sum, l) => sum + l.points, 0).toLocaleString()}점
                                                </span>
                                            </h5>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setShowPointAdd(true); setPointError('') }}
                                                    disabled={false}
                                                    title="포인트 추가"
                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors"
                                                >
                                                    <Plus size={12} /> 추가
                                                </button>
                                                <button
                                                    onClick={() => { setShowPointDeduct(true); setPointError('') }}
                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                                                >
                                                    <Minus size={12} /> 차감
                                                </button>
                                            </div>
                                        </div>

                                        {pointError && <p className="text-xs text-red-500 mb-2">{pointError}</p>}

                                        {pointLogs.length === 0 ? (
                                            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-4">포인트 내역이 없습니다.</p>
                                        ) : (
                                            <ul className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-zinc-800">
                                                {pointLogs.map(log => (
                                                    <li key={log.id} className="flex items-center justify-between px-3 py-2">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-1">
                                                                {manualPointSettings.find(s => s.name === log.name)?.icon && (
                                                                    <span>{manualPointSettings.find(s => s.name === log.name)?.icon}</span>
                                                                )}
                                                                {log.name}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 dark:text-zinc-500">{new Date(log.created_at).toLocaleDateString('ko-KR')}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold ${log.points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                            {log.points >= 0 ? `+${log.points}` : log.points}점
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Add Modal */}
                                        {showPointAdd && (
                                            <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                                                <div className="absolute inset-0 bg-black/50" onClick={() => setShowPointAdd(false)} />
                                                <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-4">포인트 추가</h3>

                                                    {/* 즉석 입력 폼 */}
                                                    <div className="mb-4">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">직접 입력</p>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={customPointName}
                                                                onChange={e => setCustomPointName(e.target.value)}
                                                                placeholder="항목 이름"
                                                                className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100"
                                                            />
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={customPointAmount}
                                                                onChange={e => setCustomPointAmount(e.target.value)}
                                                                placeholder="점수"
                                                                className="w-20 rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100"
                                                            />
                                                            <button
                                                                disabled={isPointPending}
                                                                onClick={() => {
                                                                    const amt = parseInt(customPointAmount)
                                                                    if (!customPointName.trim()) { setPointError('항목 이름을 입력해주세요.'); return }
                                                                    if (!amt || amt <= 0) { setPointError('점수를 올바르게 입력해주세요.'); return }
                                                                    setShowPointAdd(false)
                                                                    const optimistic = { id: `temp-${Date.now()}`, name: customPointName.trim(), points: amt, created_at: new Date().toISOString() }
                                                                    setPointLogs(prev => [optimistic, ...prev])
                                                                    startPointTransition(async () => {
                                                                        const res = await addCustomPoint(member.id, customPointName.trim(), amt)
                                                                        if (res?.error) {
                                                                            setPointLogs(prev => prev.filter(l => l.id !== optimistic.id))
                                                                            setPointError(res.error)
                                                                        }
                                                                    })
                                                                    setCustomPointName('')
                                                                    setCustomPointAmount('')
                                                                }}
                                                                className="px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                                                            >추가</button>
                                                        </div>
                                                    </div>

                                                    {/* 수동 항목 목록 */}
                                                    {manualPointSettings.length > 0 && (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                                                                <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">설정된 항목</p>
                                                                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                                                            </div>
                                                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                                                {manualPointSettings.map(s => (
                                                                    <li key={s.id}>
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowPointAdd(false)
                                                                                const optimistic = { id: `temp-${Date.now()}`, name: s.name, points: s.points, created_at: new Date().toISOString() }
                                                                                setPointLogs(prev => [optimistic, ...prev])
                                                                                startPointTransition(async () => {
                                                                                    const res = await addManualPoint(member.id, s.id)
                                                                                    if (res?.error) {
                                                                                        setPointLogs(prev => prev.filter(l => l.id !== optimistic.id))
                                                                                        setPointError(res.error)
                                                                                    }
                                                                                })
                                                                            }}
                                                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                                        >
                                                                            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-1">
                                                                                {s.icon && <span>{s.icon}</span>}
                                                                                {s.name}
                                                                            </span>
                                                                            <span className="text-indigo-600 font-bold text-sm">+{s.points}점</span>
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </>
                                                    )}

                                                    <button onClick={() => { setShowPointAdd(false) }} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Deduct Modal */}
                                        {showPointDeduct && (
                                            <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                                                <div className="absolute inset-0 bg-black/50" onClick={() => setShowPointDeduct(false)} />
                                                <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xs p-5 z-10">
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-3">포인트 차감</h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">사유 (선택)</label>
                                                            <input type="text" value={pointDeductReason} onChange={e => setPointDeductReason(e.target.value)} placeholder="예: 상품 교환" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">차감 점수</label>
                                                            <input type="number" min={1} value={pointDeductAmount} onChange={e => setPointDeductAmount(e.target.value)} placeholder="0" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4">
                                                        <button onClick={() => setShowPointDeduct(false)} className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50">취소</button>
                                                        <button
                                                            disabled={isPointPending}
                                                            onClick={() => {
                                                                const amt = parseInt(pointDeductAmount)
                                                                if (!amt || amt <= 0) { setPointError('차감 점수를 올바르게 입력해주세요.'); return }
                                                                setShowPointDeduct(false)
                                                                const label = pointDeductReason.trim() || '관장 차감'
                                                                const optimistic = { id: `temp-${Date.now()}`, name: label, points: -amt, created_at: new Date().toISOString() }
                                                                setPointLogs(prev => [optimistic, ...prev])
                                                                startPointTransition(async () => {
                                                                    const res = await deductPoint(member.id, amt, label)
                                                                    if (res?.error) {
                                                                        setPointLogs(prev => prev.filter(l => l.id !== optimistic.id))
                                                                        setPointError(res.error)
                                                                    }
                                                                })
                                                                setPointDeductAmount('')
                                                                setPointDeductReason('')
                                                            }}
                                                            className="flex-1 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                                                        >차감하기</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100 dark:border-zinc-800/50">
                                <button type="button" onClick={closeModal} className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 sm:mt-0 sm:w-auto">
                                    닫기
                                </button>
                            </div>

                        </div>
                    </div>
                </div >
            </div >
        </div >
    )
}
