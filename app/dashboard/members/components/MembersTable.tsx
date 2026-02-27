'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteMembers, generateMissingPasswords, bulkPromoteMembers } from '../actions'
import { checkInMember, checkOutMember, cancelAttendance } from '../../attendance/actions'
import MemberModal from './MemberModal'
import { displayBeltName } from '../constants'

interface Member {
    id: string
    name: string
    phone: string
    gender: string
    joined_at: string
    gym_id: string
    birth_date?: string
    belt?: string
    latest_stripe?: number
    payment_due_day?: number
    payment_end_date?: string
    [key: string]: any
}

interface AttendanceStatus {
    checkedOut: boolean
}

interface Props {
    initialMembers: Member[]
    count: number
    status: string
    attendanceStatusMap: Record<string, AttendanceStatus>
}

export default function MembersTable({ initialMembers, count, status, attendanceStatusMap }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const sort = searchParams.get('sort') || 'name'
    const order = searchParams.get('order') || 'asc'
    const currentStatus = status

    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPromoting, setIsPromoting] = useState(false)
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

    const [searchTerm, setSearchTerm] = useState('')

    // ... (rest of state items: Optimistic UI State etc)

    // Optimistic UI State
    const [optimisticAttendance, setOptimisticAttendance] = useState<Record<string, AttendanceStatus>>(attendanceStatusMap)

    // Sync with server props
    useEffect(() => {
        setOptimisticAttendance(attendanceStatusMap)
    }, [attendanceStatusMap])

    const calculateYearAge = (birthDate?: string) => {
        if (!birthDate) return '-'
        const birthYear = new Date(birthDate).getFullYear()
        const currentYear = new Date().getFullYear()
        if (isNaN(birthYear)) return '-'
        return `${currentYear - birthYear + 1}세`
    }

    const getPaymentStatus = (member: Member) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let targetDate: Date | null = null

        if (member.payment_end_date) {
            targetDate = new Date(member.payment_end_date)
        } else if (member.payment_due_day) {
            targetDate = new Date()
            targetDate.setDate(member.payment_due_day)
        }

        if (!targetDate) return { status: 'normal', label: '-', dateStr: '-', diffDays: Infinity }

        targetDate.setHours(0, 0, 0, 0)
        const diffTime = targetDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const dateStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`

        if (diffDays < 0) return { status: 'unpaid', label: '미납', dateStr, diffDays }
        if (diffDays >= 0 && diffDays <= 5) return { status: 'due', label: '결제예정', dateStr, diffDays }
        return { status: 'normal', label: dateStr, dateStr, diffDays }
    }

    const getAttendanceWeight = (id: string) => {
        const att = optimisticAttendance[id]
        if (!att) return 0 // 대기
        if (!att.checkedOut) return 1 // 출석
        return 2 // 하원
    }

    const filteredMembers = initialMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
    ).sort((a, b) => {
        if (sort === 'attendance') {
            const wA = getAttendanceWeight(a.id)
            const wB = getAttendanceWeight(b.id)
            if (wA !== wB) return order === 'asc' ? wA - wB : wB - wA
            return a.name.localeCompare(b.name)
        }
        if (sort === 'payment') {
            const pA = getPaymentStatus(a)
            const pB = getPaymentStatus(b)
            if (pA.diffDays !== pB.diffDays) return order === 'asc' ? pA.diffDays - pB.diffDays : pB.diffDays - pA.diffDays
            return a.name.localeCompare(b.name)
        }
        return 0
    })

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size === initialMembers.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(initialMembers.map(m => m.id)))
    }

    const handleDelete = async () => {
        if (!confirm(`${selectedIds.size}명의 회원을 삭제하시겠습니까?`)) return
        setIsDeleting(true)
        const ids = Array.from(selectedIds)
        const res = await deleteMembers(ids)
        if (res?.error) alert(res.error)
        else {
            alert('삭제되었습니다.')
            setSelectedIds(new Set())
            setIsEditMode(false)
            router.refresh()
        }
        setIsDeleting(false)
    }

    const handleGeneratePasswords = async () => {
        if (!confirm('비밀번호가 설정되지 않은 회원들의 비밀번호를 일괄 생성하시겠습니까?')) return
        setIsGenerating(true)
        const res = await generateMissingPasswords()
        setIsGenerating(false)
        if (res?.error) alert(res.error)
        else {
            alert(res.message)
            router.refresh()
        }
    }

    const handleBulkPromote = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`${selectedIds.size}명을 1단계 승급하시겠습니까?

• 현재 벨트의 그랄이 최대이면 다음 벨트 0그랄로 승급됩니다.
• 승급 이력에 자동으로 기록됩니다.`)) return
        setIsPromoting(true)
        const ids = Array.from(selectedIds)
        const res = await bulkPromoteMembers(ids)
        setIsPromoting(false)
        if (res?.error) {
            alert(res.error)
        } else {
            const msg = `${res.successCount}명 승급 완료.${res.failCount ? ` (실패: ${res.failCount}명)` : ''}`
            alert(msg)
            setSelectedIds(new Set())
            setIsEditMode(false)
            router.refresh()
        }
    }

    const handleAttendanceToggle = async (memberId: string) => {
        if (processingIds.has(memberId)) return
        setProcessingIds(prev => new Set(prev).add(memberId))

        // Ensure KST Date for Consistency
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
        const status = optimisticAttendance[memberId]
        const prevStatus = status

        try {
            // 1. Calculate Next State
            let nextStatus: AttendanceStatus | undefined = undefined
            let action = ''

            if (!status) {
                // Check In
                nextStatus = { checkedOut: false }
                action = 'checkIn'
            } else if (!status.checkedOut) {
                // Check Out
                nextStatus = { checkedOut: true }
                action = 'checkOut'
            } else {
                // Cancel
                if (!confirm('출석 기록을 취소하시겠습니까?')) {
                    setProcessingIds(prev => {
                        const next = new Set(prev)
                        next.delete(memberId)
                        return next
                    })
                    return
                }
                nextStatus = undefined
                action = 'cancel'
            }

            // 2. Optimistic Update
            setOptimisticAttendance(prev => {
                const next = { ...prev }
                if (nextStatus === undefined) delete next[memberId]
                else next[memberId] = nextStatus
                return next
            })

            // 3. Server Action
            let res
            if (action === 'checkIn') {
                res = await checkInMember(memberId, undefined, today)
            } else if (action === 'checkOut') {
                res = await checkOutMember(memberId, today)
            } else if (action === 'cancel') {
                res = await cancelAttendance(memberId, today)
            }

            if (res?.error) {
                // Revert on Error
                alert(res.error)
                setOptimisticAttendance(prev => {
                    const next = { ...prev }
                    if (prevStatus === undefined) delete next[memberId]
                    else next[memberId] = prevStatus
                    return next
                })
            } else {
                router.refresh()
            }

        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
            // Revert on Exception
            setOptimisticAttendance(prev => {
                const next = { ...prev }
                if (prevStatus === undefined) delete next[memberId]
                else next[memberId] = prevStatus
                return next
            })
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev)
                next.delete(memberId)
                return next
            })
        }
    }

    const handleRowClick = (e: React.MouseEvent, memberId: string) => {
        const target = e.target as HTMLElement
        // 버튼, 인풋, 체크박스 등을 눌렀을 때는 상세모달이 뜨지 않도록 방지
        if (target.closest('button') || target.closest('input') || target.closest('a')) {
            return
        }

        const params = new URLSearchParams(searchParams.toString())
        params.set('id', memberId)
        router.push(`/dashboard/members?${params.toString()}`, { scroll: false })
    }

    const SortLink = ({ column, label }: { column: string, label: string }) => {
        const isCurrent = sort === column
        const nextOrder = isCurrent && order === 'desc' ? 'asc' : 'desc'
        return (
            <Link
                href={`/dashboard/members?sort=${column}&order=${nextOrder}`}
                scroll={false}
                className="group inline-flex items-center cursor-pointer"
            >
                {label}
                {isCurrent && (
                    <span className="ml-2 flex-none rounded text-gray-900 dark:text-zinc-100 font-bold">
                        {order === 'desc' ? '↓' : '↑'}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-zinc-100">회원 관리</h1>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">총 {count}명 등록</p>
                    </div>
                    <div className="relative w-full max-w-[180px] sm:max-w-xs">
                        <input
                            type="text"
                            placeholder="이름/전화번호 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 sm:pr-10 text-gray-900 dark:text-zinc-100 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 dark:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs sm:text-sm sm:leading-6"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
                            <svg className="h-4 w-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 sm:border-b sm:border-gray-200 dark:border-zinc-800">
                <div className="flex flex-row justify-between items-center sm:items-end gap-2 sm:gap-4 pb-4 sm:pb-0">
                    <div className="flex-shrink-0">
                        <div className="sm:hidden">
                            <label htmlFor="status-tabs" className="sr-only">회원 상태 선택</label>
                            <select
                                id="status-tabs"
                                name="status-tabs"
                                className="block rounded-md border-gray-300 dark:border-zinc-700 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 shadow-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 dark:border-zinc-700 appearance-none"
                                value={currentStatus}
                                onChange={(e) => {
                                    router.push(`/dashboard/members?status=${e.target.value}&sort=${sort}&order=${order}`)
                                }}
                            >
                                <option value="active">수련 중</option>
                                <option value="paused">휴관 중</option>
                                <option value="all">전체</option>
                            </select>
                        </div>
                        <nav className="-mb-px hidden sm:flex space-x-6">
                            {['active', 'paused', 'all'].map((tab) => {
                                const label = tab === 'active' ? '수련 중 (Active)' : tab === 'paused' ? '휴관 중 (Paused)' : '전체 (All)'
                                const isActive = currentStatus === tab
                                return (
                                    <Link
                                        key={tab}
                                        href={`/dashboard/members?status=${tab}&sort=${sort}&order=${order}`}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:border-zinc-700'}`}
                                    >
                                        {label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="flex gap-2 items-center flex-shrink-0 justify-end">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={handleGeneratePasswords}
                                    disabled={isGenerating}
                                    className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 disabled:opacity-50 transition-colors mr-1 sm:mr-2 whitespace-nowrap"
                                >
                                    {isGenerating ? '생성 중...' : '미설정 PW생성'}
                                </button>
                                <span className="text-gray-300 dark:text-zinc-600 mr-1 sm:mr-2">|</span>
                                <button
                                    onClick={handleBulkPromote}
                                    disabled={selectedIds.size === 0 || isPromoting}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 transition-colors mr-1 sm:mr-2 whitespace-nowrap"
                                >
                                    {isPromoting ? '승급 중...' : `선택승급 (${selectedIds.size})`}
                                </button>
                                <span className="text-gray-300 dark:text-zinc-600 mr-1 sm:mr-2">|</span>
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedIds.size === 0 || isDeleting}
                                    className="block rounded-md bg-red-600 px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false)
                                        setSelectedIds(new Set())
                                    }}
                                    className="block rounded-md bg-white dark:bg-zinc-900 px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 whitespace-nowrap"
                                >
                                    취소
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={async () => {
                                        const phone = prompt('초대 문자를 받을 분의 전화번호를 입력하세요 (예: 01012345678)')
                                        if (!phone) return
                                        // Dynamically import to avoid cluttering the top of the large file
                                        const { sendSmsInvitation } = await import('../actions')
                                        const res = await sendSmsInvitation(phone)
                                        if (res.error) alert(res.error)
                                        else alert(res.message)
                                    }}
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors whitespace-nowrap flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                    문자 초대
                                </button>
                                <span className="text-gray-300 dark:text-zinc-600 mx-1">|</span>
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 transition-colors whitespace-nowrap"
                                >
                                    일괄 편집
                                </button>
                                <span className="text-gray-300 dark:text-zinc-600 mx-1">|</span>
                                <Link
                                    href="/dashboard/members/new"
                                    className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 transition-colors whitespace-nowrap flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-1 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    신규 등록
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 sm:mt-8 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
                            <table className="min-w-full divide-y divide-gray-300 dark:border-zinc-800 dark:divide-zinc-800">
                                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th scope="col" className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-zinc-100 sm:pl-6 w-16 ${!isEditMode ? 'hidden sm:table-cell' : ''}`}>
                                            {isEditMode ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === filteredMembers.length && filteredMembers.length > 0}
                                                    onChange={toggleAll}
                                                    className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-600"
                                                />
                                            ) : 'No.'}
                                        </th>
                                        <th className="px-2 sm:px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[60px]"><SortLink column="name" label="이름" /></th>
                                        <th className="px-1 sm:px-3 py-3 text-center sm:text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[40px]"><SortLink column="birth_date" label="나이" /></th>
                                        <th className="px-1 sm:px-3 py-3 text-center sm:text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[40px]"><SortLink column="attendance" label="출석" /></th>
                                        <th className="px-1 sm:px-3 py-3 text-center sm:text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[40px]"><SortLink column="belt" label="벨트" /></th>
                                        <th className="px-2 sm:px-3 py-3 text-right sm:text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 min-w-[50px] whitespace-nowrap"><SortLink column="payment" label="결제일" /></th>
                                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 dark:text-zinc-100 hidden sm:table-cell"><SortLink column="joined_at" label="등록일" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                    {filteredMembers && filteredMembers.length > 0 ? (
                                        filteredMembers.map((member, index) => {
                                            const paymentInfo = getPaymentStatus(member)
                                            // USE OPTIMISTIC STATE
                                            const attendance = optimisticAttendance[member.id]
                                            const isProcessing = processingIds.has(member.id)

                                            return (
                                                <tr
                                                    key={member.id}
                                                    onClick={(e) => handleRowClick(e, member.id)}
                                                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 transition-colors cursor-pointer group"
                                                >
                                                    <td className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 dark:text-zinc-400 sm:pl-6 ${!isEditMode ? 'hidden sm:table-cell' : ''}`}>
                                                        {isEditMode ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(member.id)}
                                                                onChange={() => toggleSelection(member.id)}
                                                                className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-600"
                                                            />
                                                        ) : (count || 0) - index}
                                                    </td>
                                                    <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-sm font-medium text-gray-900 dark:text-zinc-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-900 dark:text-zinc-100 font-bold sm:font-semibold select-none group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                                                                {member.name || '이름 없음'}
                                                            </span>
                                                        </div>
                                                        <div className="hidden sm:block text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{member.phone || '-'}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-1 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 text-center sm:text-left">
                                                        {calculateYearAge(member.birth_date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-1 sm:px-3 py-3 sm:py-4 text-sm text-center sm:text-left">
                                                        <button
                                                            onClick={() => handleAttendanceToggle(member.id)}
                                                            disabled={isProcessing}
                                                            className={`
                                                                rounded px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold shadow-sm ring-1 ring-inset transition-all whitespace-nowrap w-10 sm:w-auto
                                                                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                                                ${!attendance
                                                                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 ring-gray-500/10 hover:bg-gray-200'
                                                                    : !attendance.checkedOut
                                                                        ? 'bg-green-100 text-green-700 ring-green-600/20 hover:bg-green-200'
                                                                        : 'bg-amber-100 text-amber-800 ring-amber-600/20 hover:bg-amber-200'
                                                                }
                                                            `}
                                                        >
                                                            {isProcessing ? '...' : !attendance ? '대기' : !attendance.checkedOut ? '출석' : '하원'}
                                                        </button>
                                                    </td>
                                                    <td className="whitespace-nowrap px-1 sm:px-3 py-3 sm:py-4 text-sm text-gray-500 dark:text-zinc-400 text-center sm:text-left">
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-zinc-800/50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-zinc-400 ring-1 ring-inset ring-gray-500/10 max-w-[70px] sm:max-w-none truncate sm:overflow-visible sm:whitespace-nowrap inline-block" title={displayBeltName(member.belt || '')}>{displayBeltName(member.belt || '')}{member.latest_stripe !== undefined ? member.latest_stripe : ''}</span>
                                                            {member.last_promotion_date && (<span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">{new Date(member.last_promotion_date).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}</span>)}


                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-sm text-right sm:text-left">
                                                        <div className="flex flex-col items-end sm:items-start">
                                                            {paymentInfo.status === 'unpaid' && (
                                                                <>
                                                                    <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 mb-0.5 sm:mb-1">미납</span>
                                                                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{paymentInfo.dateStr}</span>
                                                                </>
                                                            )}
                                                            {paymentInfo.status === 'due' && (
                                                                <>
                                                                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 mb-0.5 sm:mb-1">결제예정</span>
                                                                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{paymentInfo.dateStr}</span>
                                                                </>
                                                            )}
                                                            {paymentInfo.status === 'normal' && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{paymentInfo.dateStr}</span>}
                                                            {paymentInfo.status === 'none' && <span className="text-[10px] sm:text-xs text-gray-300 dark:text-zinc-600 whitespace-nowrap">-</span>}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 hidden sm:table-cell" suppressHydrationWarning>
                                                        {(() => {
                                                            const d = new Date(member.joined_at)
                                                            return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
                                                        })()}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500 dark:text-zinc-400">등록된 회원이 없습니다. 신규 회원을 등록해주세요.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
