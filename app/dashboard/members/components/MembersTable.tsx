'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteMembers, generateMissingPasswords } from '../actions'
import { checkInMember, checkOutMember, cancelAttendance } from '../../attendance/actions'
import MemberModal from './MemberModal'

interface Member {
    id: string
    name: string
    phone: string
    gender: string
    joined_at: string
    gym_id: string
    birth_date?: string
    belt?: string
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

    const filteredMembers = initialMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
    )

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

        if (!targetDate) return { status: 'normal', label: '-', dateStr: '-' }

        targetDate.setHours(0, 0, 0, 0)
        const diffTime = targetDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const dateStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`

        if (diffDays < 0) return { status: 'unpaid', label: '미납', dateStr }
        if (diffDays >= 0 && diffDays <= 5) return { status: 'due', label: '결제예정', dateStr }
        return { status: 'normal', label: dateStr, dateStr }
    }

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
                <span className={`ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible ${isCurrent ? 'visible text-gray-900' : 'invisible'}`}>
                    {isCurrent ? (order === 'desc' ? '↓' : '↑') : '↕'}
                </span>
            </Link>
        )
    }

    return (
        <div>
            <div className="sm:flex sm:items-center justify-between">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">회원 관리</h1>
                    <p className="mt-2 text-sm text-gray-700">총 {count}명의 회원이 등록되어 있습니다.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="이름 또는 전화번호 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={handleGeneratePasswords}
                                    disabled={isGenerating}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors mr-2"
                                >
                                    {isGenerating ? '생성 중...' : '미설정 PW 일괄생성'}
                                </button>
                                <span className="text-gray-300 mr-2">|</span>
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedIds.size === 0 || isDeleting}
                                    className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                                >
                                    {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false)
                                        setSelectedIds(new Set())
                                    }}
                                    className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    취소
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    일괄 편집
                                </button>
                                <span className="text-gray-300">|</span>
                                <Link
                                    href="/dashboard/members/new"
                                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    신규 회원 등록
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    {['active', 'paused', 'all'].map((tab) => {
                        const label = tab === 'active' ? '수련 중 (Active)' : tab === 'paused' ? '휴관 중 (Paused)' : '전체 (All)'
                        const isActive = currentStatus === tab
                        return (
                            <Link
                                key={tab}
                                href={`/dashboard/members?status=${tab}&sort=${sort}&order=${order}`}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                {label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-16">
                                            {isEditMode ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === filteredMembers.length && filteredMembers.length > 0}
                                                    onChange={toggleAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            ) : 'No.'}
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><SortLink column="name" label="이름" /></th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">나이</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">출석</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><SortLink column="belt" label="등급" /></th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">다음 결제일</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"><SortLink column="joined_at" label="등록일" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredMembers && filteredMembers.length > 0 ? (
                                        filteredMembers.map((member, index) => {
                                            const paymentInfo = getPaymentStatus(member)
                                            // USE OPTIMISTIC STATE
                                            const attendance = optimisticAttendance[member.id]
                                            const isProcessing = processingIds.has(member.id)

                                            return (
                                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                                        {isEditMode ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(member.id)}
                                                                onChange={() => toggleSelection(member.id)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                            />
                                                        ) : (count || 0) - index}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/dashboard/members?${new URLSearchParams({ ...Object.fromEntries(searchParams), id: member.id }).toString()}`}
                                                                scroll={false}
                                                                className="text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                                                            >
                                                                {member.name || '이름 없음'}
                                                            </Link>
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-0.5">{member.phone || '-'}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {calculateYearAge(member.birth_date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <button
                                                            onClick={() => handleAttendanceToggle(member.id)}
                                                            disabled={isProcessing}
                                                            className={`
                                                                rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset transition-all
                                                                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                                                ${!attendance
                                                                    ? 'bg-gray-100 text-gray-600 ring-gray-500/10 hover:bg-gray-200' // Default: Wait (대기)
                                                                    : !attendance.checkedOut
                                                                        ? 'bg-green-100 text-green-700 ring-green-600/20 hover:bg-green-200' // Checked In: Present (출석)
                                                                        : 'bg-amber-100 text-amber-800 ring-amber-600/20 hover:bg-amber-200' // Checked Out: Left (하원)
                                                                }
                                                            `}
                                                        >
                                                            {isProcessing ? '...' : !attendance ? '대기' : !attendance.checkedOut ? '출석' : '하원'}
                                                        </button>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                            {member.belt}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        {paymentInfo.status === 'unpaid' && (
                                                            <div className="flex flex-col items-start">
                                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 mb-1">미납</span>
                                                                <span className="text-xs text-gray-500">{paymentInfo.dateStr}</span>
                                                            </div>
                                                        )}
                                                        {paymentInfo.status === 'due' && (
                                                            <div className="flex flex-col items-start">
                                                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 mb-1">결제예정</span>
                                                                <span className="text-xs text-gray-500">{paymentInfo.dateStr}</span>
                                                            </div>
                                                        )}
                                                        {paymentInfo.status === 'normal' && <span className="text-gray-500">{paymentInfo.dateStr}</span>}
                                                        {paymentInfo.status === 'none' && <span className="text-gray-300">-</span>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" suppressHydrationWarning>
                                                        {(() => {
                                                            const d = new Date(member.joined_at)
                                                            return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
                                                        })()}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500">등록된 회원이 없습니다. 신규 회원을 등록해주세요.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
