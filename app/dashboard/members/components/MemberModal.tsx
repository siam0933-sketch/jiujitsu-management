'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment, deletePayment } from '../actions_payment'
import { updateMember, pauseMember, resumeMember, getMemberAttendanceLogs } from '../actions'
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
    const [basicInfoForm, setBasicInfoForm] = useState({ ...member })

    // Payment Form State
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
    const togglePaymentForm = () => setIsPaymentFormOpen(!isPaymentFormOpen)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [manualAmount, setManualAmount] = useState<number | null>(null)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

    // Config Data
    const [plans, setPlans] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [durationMonths, setDurationMonths] = useState(1)
    const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set())

    // Payments List
    const [payments, setPayments] = useState<any[]>([])
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
    const [editAmount, setEditAmount] = useState(0)
    const [editDate, setEditDate] = useState('')
    const [editOptionIds, setEditOptionIds] = useState<Set<string>>(new Set())

    // History
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
    const [enrolledClasses, setEnrolledClasses] = useState<any[]>([])
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
                const [pricing, history, attLogs, promos, enrolls] = await Promise.all([
                    getPricingData(),
                    getPaymentHistory(member.id),
                    getMemberAttendanceLogs(member.id),
                    supabase.from('gym_promotion_logs').select('*').eq('member_id', member.id).order('promoted_at', { ascending: false }),
                    supabase.from('gym_class_enrollments').select('*, gym_schedules(*)').eq('member_id', member.id)
                ])

                setPlans(pricing.plans)
                setOptions(pricing.options)
                setPayments(history)
                setAttendanceLogs(attLogs)
                if (promos.data) setPromotionLogs(promos.data)

                // Format enrollments
                if (enrolls.data) {
                    const formatted = enrolls.data.map((e: any) => ({
                        class_name: e.gym_schedules?.class_name || 'Unknown',
                        day_of_week: e.gym_schedules?.day_of_week,
                        start_time: e.gym_schedules?.start_time
                    }))
                    setEnrolledClasses(formatted)
                }
            } catch (err) {
                console.error('Data Loading Error:', err)
                alert('데이터를 불러오는 중 오류가 발생했습니다.')
            }
        }
        loadData()
    }, [member.id])


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

    // Calculate Total
    const calculateTotal = () => {
        if (!selectedPlan) return 0
        let total = selectedPlan.price
        if (selectedPlan.type === 'period') {
            total = selectedPlan.price * durationMonths
            selectedOptionIds.forEach(id => {
                const opt = options.find(o => o.id === id)
                if (opt) total += opt.price
            })
        }
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
        formData.append('payment_method', 'card')
        formData.append('duration_months', String(durationMonths))
        formData.append('plan_name', selectedPlan?.name || '')
        formData.append('type', selectedPlan?.type || '')
        formData.append('option_ids', JSON.stringify(Array.from(selectedOptionIds)))

        // Generate options summary text
        const selectedOptionNames = Array.from(selectedOptionIds).map(id => options.find(o => o.id === id)?.name).filter(Boolean).join(', ')
        formData.append('options_summary', selectedOptionNames)

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
                                <p className="text-sm text-gray-500 mb-1">회원 상세 정보</p>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold leading-6 text-gray-900">
                                            {member.name}
                                        </h3>
                                        <span className="text-lg text-gray-500 font-medium">
                                            ({calculateAge(member.birth_date)})
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Belt Info */}
                                        {(() => {
                                            const currentLog = promotionLogs.length > 0 ? promotionLogs[0] : null
                                            // Fallback to member.belt if logs empty, though logs usually fetched. 
                                            // If no logs, assume White (Adult).
                                            const beltNameStr = currentLog ? currentLog.belt_name : (member.belt || 'White')
                                            const displayName = displayBeltName(beltNameStr)
                                            const stripe = currentLog ? currentLog.stripe_level : 0
                                            const beltMeta = BELT_OPTIONS_DATA.find(b => b.name === displayName) || BELT_OPTIONS_DATA[0]

                                            return (
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                                    <div
                                                        className={`w-4 h-4 rounded-full border ${beltMeta.colorClass?.includes('border') ? '' : 'border-gray-300'} ${beltMeta.colorClass}`}
                                                        style={beltMeta.style}
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {displayName} {stripe}그랄
                                                    </span>
                                                </div>
                                            )
                                        })()}

                                        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>

                                        <MemberStatusBadge isPaused={isPaused} />

                                        {/* Inline Pause/Resume Button */}
                                        {isPaused ? (
                                            <button
                                                onClick={handleResume}
                                                className="text-xs border border-green-200 bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors font-medium"
                                            >
                                                복귀 처리
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsPauseModalOpen(true)}
                                                className="text-xs border border-orange-200 bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 transition-colors font-medium"
                                            >
                                                휴관 설정
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">기본 정보</h4>
                                    {!isEditingBasicInfo ? (
                                        <button onClick={startEditingBasicInfo} className="text-xs text-gray-400 hover:text-blue-600 underline">편집</button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={cancelEditingBasicInfo} className="text-xs text-gray-400 hover:text-gray-600 underline">취소</button>
                                            <button onClick={saveBasicInfo} className="text-xs text-blue-600 hover:text-blue-800 font-bold underline">저장</button>
                                        </div>
                                    )}
                                </div>

                                <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 ${isEditingBasicInfo ? 'ring-2 ring-blue-100' : ''}`}>
                                    {/* Simplified View/Edit Fields */}
                                    <div className="col-span-1">
                                        <p className="text-xs text-gray-400 mb-1">이름</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.name} onChange={e => setBasicInfoForm({ ...basicInfoForm, name: e.target.value })} className="w-full text-xs border-gray-300 rounded" />
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900">{member.name}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-xs text-gray-400 mb-1">전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.phone} onChange={e => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })} className="w-full text-xs border-gray-300 rounded" />
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900">{member.phone}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-xs text-gray-400 mb-1">보호자 전화번호</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.guardian_phone || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, guardian_phone: e.target.value })} className="w-full text-xs border-gray-300 rounded" />
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900">{member.guardian_phone || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 mb-1">주소</p>
                                        {isEditingBasicInfo ? (
                                            <input value={basicInfoForm.address || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, address: e.target.value })} className="w-full text-xs border-gray-300 rounded" />
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900 truncate">{member.address || '-'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-xs text-gray-400 mb-1">성별</p>
                                        {isEditingBasicInfo ? (
                                            <select value={basicInfoForm.gender || 'male'} onChange={e => setBasicInfoForm({ ...basicInfoForm, gender: e.target.value })} className="w-full text-xs border-gray-300 rounded">
                                                <option value="male">남성</option>
                                                <option value="female">여성</option>
                                            </select>
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900">{member.gender === 'male' ? '남성' : '여성'}</p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-xs text-gray-400 mb-1">생년월일</p>
                                        {isEditingBasicInfo ? (
                                            <input type="date" value={basicInfoForm.birth_date || ''} onChange={e => setBasicInfoForm({ ...basicInfoForm, birth_date: e.target.value })} className="w-full text-xs border-gray-300 rounded" />
                                        ) : (
                                            <p className="font-medium text-sm text-gray-900">{member.birth_date || '-'}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Payment */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">이용권 및 결제</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                    {/* Status */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-gray-500 text-xs text-bold">만료일</p>
                                            <p className="text-xl font-bold text-gray-900">{member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '미등록'}</p>
                                        </div>
                                    </div>

                                    {/* Payment Form Toggle */}
                                    <div className="border rounded-lg mb-4 overflow-hidden">
                                        <button onClick={togglePaymentForm} className="w-full flex items-center justify-between p-3 bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100">
                                            <span>결제하기</span>
                                            <span>{isPaymentFormOpen ? '▲' : '▼'}</span>
                                        </button>
                                        {isPaymentFormOpen && (
                                            <div className="p-4 bg-white border-t">
                                                {/* Simple Payment Form */}
                                                <div className="space-y-3">
                                                    <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className="w-full text-sm border-gray-300 rounded">
                                                        <option value="">이용권 선택</option>
                                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>)}
                                                    </select>

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
                                                            ).map(([groupName, groupOptions]) => (
                                                                <div key={groupName} className="space-y-2">
                                                                    <p className="text-xs text-gray-400 font-bold">{groupName}</p>
                                                                    {groupOptions.map((opt: any) => (
                                                                        <label key={opt.id} className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50">
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedOptionIds.has(opt.id)}
                                                                                    onChange={() => handleToggleOption(opt.id)}
                                                                                    className="rounded border-gray-300 text-blue-600"
                                                                                />
                                                                                <span className="text-sm text-gray-700">{opt.name}</span>
                                                                            </div>
                                                                            <span className="text-sm font-medium text-gray-900">+{opt.price.toLocaleString()}원</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                                        <span className="text-sm font-bold">총 결제금액</span>
                                                        <span className="text-xl font-bold text-blue-600">{(finalAmount || 0).toLocaleString()}원</span>
                                                    </div>

                                                    <button onClick={handleSubmitPayment} disabled={isSubmitting} className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">
                                                        결제하기
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* History */}
                                    <h5 className="text-xs font-bold text-gray-400 mb-2">최근 결제 내역</h5>
                                    <div className="space-y-2">
                                        {payments.map(pay => (
                                            <div key={pay.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                                                <span>{pay.payment_date}</span>
                                                <div className="flex gap-2">
                                                    <span className="font-bold">{pay.amount.toLocaleString()}원</span>
                                                    <button onClick={() => handleDeletePayment(pay.id)} className="text-xs text-red-500">삭제</button>
                                                </div>
                                            </div>
                                        ))}
                                        {payments.length === 0 && <p className="text-xs text-gray-300 text-center py-2">내역 없음</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: History */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">활동 기록</h4>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <MemberJoinedDate memberId={member.id} joinedAt={member.joined_at} />
                                        <MemberStartDate memberId={member.id} startDate={member.start_date} joinedAt={member.joined_at} />
                                    </div>
                                    <hr className="border-gray-100" />

                                    {/* Weekly Schedule */}
                                    <div>
                                        <h5 className="text-xs font-bold text-gray-400 mb-2">수강 중인 수업 (주간 시간표)</h5>
                                        <div className="grid grid-cols-7 gap-1 text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                const dayMap: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일' }
                                                const classesOnDay = enrolledClasses.filter((e: any) => e.day_of_week === day)

                                                return (
                                                    <div key={day} className="flex flex-col gap-1">
                                                        <span className={`text-xs font-bold ${day === 'Sun' ? 'text-red-400' : day === 'Sat' ? 'text-blue-400' : 'text-gray-400'}`}>
                                                            {dayMap[day]}
                                                        </span>
                                                        <div className="min-h-[40px] bg-white rounded border border-gray-100 p-1 flex flex-col gap-1 items-center justify-center">
                                                            {classesOnDay.length > 0 ? classesOnDay.map((c: any, i: number) => (
                                                                <span key={i} className="text-[10px] leading-tight text-blue-600 font-medium block">
                                                                    {c.class_name}<br />{c.start_time}
                                                                </span>
                                                            )) : (
                                                                <span className="text-[10px] text-gray-200">-</span>
                                                            )}
                                                        </div>
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
            </div>
        </div>
    )
}
