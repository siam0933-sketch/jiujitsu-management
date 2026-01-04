'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPricingData } from '../../settings/pricing/actions'
import { createPayment, getPaymentHistory, updatePayment, deletePayment } from '../actions_payment'
import { updateMember, pauseMember, resumeMember } from '../actions'
import { MemberStatusBadge, MemberStartDate, MemberJoinedDate } from './MemberComponents'

// ... existing imports ...

export default function MemberModal({ member }: { member: any }) {
    const router = useRouter()
    const supabase = createClient()

    // ... existing state ...

    // Pause Modal State
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
    const [pauseStartDate, setPauseStartDate] = useState(new Date().toISOString().split('T')[0])
    const [pauseEndDate, setPauseEndDate] = useState('')
    const [isIndefinitePause, setIsIndefinitePause] = useState(true)

    // Helper calculate extension
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
        if (!confirm('휴관 처리하시겠습니까?')) return
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

    // ... existing functions ...
    // Note: I will replace MemberPauseButton with a custom handler or modify it to open my modal?
    // Actually, MemberPauseButton in Header is nice to keep.
    // I will hook into MemberPauseButton later if I can, OR just let it do its thing? 
    // Wait, the user said "Keep existing button location".
    // AND "Add new button next to date".
    // Both should trigger the same logic.
    // MemberPauseButton is an imported component. I should probably replace it INLINE here to share the modal state.

    // Replacing Header Section Logic:

    return (
        <div className="relative z-50">
            {/* ... Overlay ... */}
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">회원 상세 정보</p>
                                <h3 className="text-xl font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                    {member.name}
                                    <MemberStatusBadge isPaused={isPaused} />
                                    {isPaused ? (
                                        <button
                                            onClick={handleResume}
                                            className="text-xs border border-green-200 bg-green-50 text-green-600 px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
                                        >
                                            복귀
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsPauseModalOpen(true)}
                                            className="text-xs border border-orange-200 bg-orange-50 text-orange-600 px-2 py-0.5 rounded hover:bg-orange-100 transition-colors"
                                        >
                                            휴관
                                        </button>
                                    )}
                                </h3>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* PAUSE MODAL OVERLAY (Nested) */}
                        {isPauseModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setIsPauseModalOpen(false); }}>
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
                                                <p className="font-bold">기존 만료일: {new Date(member.payment_end_date).toLocaleDateString()}</p>
                                                <p className="font-bold text-blue-600">변경 만료일: {calculateNewExpiry()}</p>
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
                                                className="flex-1 py-2 text-sm text-white bg-orange-600 rounded hover:bg-orange-500 disabled:opacity-50"
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
                                        <button
                                            onClick={startEditingBasicInfo}
                                            className="text-xs text-gray-400 hover:text-blue-600 underline"
                                        >
                                            편집
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={cancelEditingBasicInfo}
                                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={saveBasicInfo}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                                            >
                                                저장
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isEditingBasicInfo ? (
                                    // Edit Mode
                                    <div className="bg-blue-50/50 rounded-xl border border-blue-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {/* Name */}
                                        <div className="col-span-1">
                                            <p className="text-blue-400 text-xs mb-1">이름</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={basicInfoForm.name}
                                                    onChange={e => setBasicInfoForm({ ...basicInfoForm, name: e.target.value })}
                                                    className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <select
                                                    value={basicInfoForm.gender}
                                                    onChange={e => setBasicInfoForm({ ...basicInfoForm, gender: e.target.value })}
                                                    className="text-sm border-gray-300 rounded px-1 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="male">남</option>
                                                    <option value="female">여</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Birth Date */}
                                        <div className="col-span-1">
                                            <p className="text-blue-400 text-xs mb-1">생년월일</p>
                                            <input
                                                type="date"
                                                value={basicInfoForm.birth_date}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, birth_date: e.target.value })}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Access Code */}
                                        <div className="col-span-2">
                                            <p className="text-blue-400 text-xs mb-1">접속 코드</p>
                                            <input
                                                type="text"
                                                value={basicInfoForm.access_code}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, access_code: e.target.value })}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="col-span-1">
                                            <p className="text-blue-400 text-xs mb-1">연락처</p>
                                            <input
                                                type="text"
                                                value={basicInfoForm.phone}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Guardian Phone */}
                                        <div className="col-span-1">
                                            <p className="text-blue-400 text-xs mb-1">보호자</p>
                                            <input
                                                type="text"
                                                value={basicInfoForm.guardian_phone}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, guardian_phone: e.target.value })}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="-"
                                            />
                                        </div>

                                        {/* School / Grade */}
                                        <div className="col-span-2">
                                            <p className="text-blue-400 text-xs mb-1">학교/학년</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={basicInfoForm.school}
                                                    onChange={e => setBasicInfoForm({ ...basicInfoForm, school: e.target.value })}
                                                    className="w-2/3 text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="학교"
                                                />
                                                <input
                                                    type="text"
                                                    value={basicInfoForm.grade}
                                                    onChange={e => setBasicInfoForm({ ...basicInfoForm, grade: e.target.value })}
                                                    className="w-1/3 text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="학년"
                                                />
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="col-span-4">
                                            <p className="text-blue-400 text-xs mb-1">주소</p>
                                            <input
                                                type="text"
                                                value={basicInfoForm.address}
                                                onChange={e => setBasicInfoForm({ ...basicInfoForm, address: e.target.value })}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
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
                                        <div className="col-span-4">
                                            <p className="text-gray-400 text-xs mb-1">주소</p>
                                            <p className="font-medium text-gray-900 text-sm">{member.address}</p>
                                        </div>
                                    </div>
                                )}
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
                                                {!isPaused && (
                                                    <button
                                                        onClick={() => setIsPauseModalOpen(true)}
                                                        className="ml-2 text-xs border border-orange-200 bg-orange-50 text-orange-600 px-2 py-0.5 rounded hover:bg-orange-100 transition-colors"
                                                    >
                                                        휴관
                                                    </button>
                                                )}
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
                                        <MemberJoinedDate memberId={member.id} joinedAt={member.joined_at} />
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

                                    {/* Attendance History Moved Here */}
                                    <div>
                                        <p className="text-gray-400 text-xs mb-2">출석 기록</p>
                                        <AttendanceHistory
                                            logs={attendanceLogs}
                                            memberId={member.id}
                                            onUpdate={async () => {
                                                const logs = await getMemberAttendanceLogs(member.id)
                                                setAttendanceLogs(logs)
                                                // Also update attendance count stats on screen if possible, or just router.refresh
                                                router.refresh()
                                            }}
                                        />
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Moved Promotion History Here */}
                                    <div>
                                        <p className="text-gray-400 text-xs mb-2">승급 이력</p>
                                        <PromotionHistory memberId={member.id} initialLogs={promotionLogs} joinedAt={member.joined_at} startDate={member.start_date} />
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
