'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteMembers, generateMissingPasswords, bulkPromoteMembers } from '../actions'
import { checkInMember, checkOutMember, cancelAttendance } from '../../attendance/actions'
import MemberModal from './MemberModal'
import { displayBeltName } from '../constants'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDownIcon, ClipboardDocumentIcon, ChatBubbleLeftIcon, PencilSquareIcon, UserPlusIcon } from '@heroicons/react/20/solid'

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
    gymId: string
}

export default function MembersTable({ initialMembers, count, status, attendanceStatusMap, gymId }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const sort = searchParams.get('sort') || 'name'
    const order = searchParams.get('order') || 'asc'
    const currentStatus = status

    const [isEditMode, setIsEditMode] = useState(false)
    const [bulkActionType, setBulkActionType] = useState<'delete' | 'promote' | 'password' | null>(null)
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
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
            setBulkActionType(null)
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
            setIsEditMode(false)
            setBulkActionType(null)
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
            setBulkActionType(null)
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

    const startBulkAction = (type: 'delete' | 'promote' | 'password') => {
        setBulkActionType(type)
        setIsEditMode(true)
        setIsBulkEditModalOpen(false)
        setSelectedIds(new Set())
    }

    return (
        <div>
            {/* Bulk Edit Modal */}
            <Transition appear show={isBulkEditModalOpen} as={Fragment}>
                <div className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-zinc-800">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-zinc-100 mb-4">
                                        일괄 편집 작업 선택
                                    </h3>
                                    <div className="mt-2 space-y-3">
                                        <button
                                            onClick={() => startBulkAction('delete')}
                                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors flex items-center gap-3 text-gray-700 dark:text-zinc-300 font-medium"
                                        >
                                            선택 삭제
                                        </button>
                                        <button
                                            onClick={() => startBulkAction('promote')}
                                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors flex items-center gap-3 text-gray-700 dark:text-zinc-300 font-medium"
                                        >
                                            선택 승급
                                        </button>
                                        <button
                                            onClick={() => startBulkAction('password')}
                                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-colors flex items-center gap-3 text-gray-700 dark:text-zinc-300 font-medium"
                                        >
                                            비밀번호 일괄 생성
                                        </button>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-zinc-100 hover:bg-gray-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                            onClick={() => setIsBulkEditModalOpen(false)}
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Transition>

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

            <div className="mt-6">
                <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 pb-4 sm:pb-0">
                    <div className="flex-shrink-0">
                        <div>
                            <label htmlFor="status-tabs" className="sr-only">회원 상태 선택</label>
                            <select
                                id="status-tabs"
                                name="status-tabs"
                                className="block rounded-md border-gray-300 dark:border-zinc-700 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 shadow-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 dark:border-zinc-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_10px_top_50%] bg-no-repeat"
                                value={currentStatus}
                                onChange={(e) => {
                                    router.push(`/dashboard/members?status=${e.target.value}&sort=${sort}&order=${order}`)
                                }}
                            >
                                <option value="active">수련중</option>
                                <option value="paused">휴관중</option>
                                <option value="all">전체</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center flex-shrink-0 justify-end">
                        {isEditMode ? (
                            <>
                                {bulkActionType === 'password' && (
                                    <button
                                        onClick={handleGeneratePasswords}
                                        disabled={isGenerating}
                                        className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 disabled:opacity-50 transition-colors mr-1 sm:mr-2 whitespace-nowrap"
                                    >
                                        {isGenerating ? '생성 중...' : '미설정 PW생성'}
                                    </button>
                                )}
                                {bulkActionType === 'promote' && (
                                    <button
                                        onClick={handleBulkPromote}
                                        disabled={selectedIds.size === 0 || isPromoting}
                                        className="block rounded-md bg-blue-600 px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isPromoting ? '승급 중...' : `선택 승급 (${selectedIds.size})`}
                                    </button>
                                )}
                                {bulkActionType === 'delete' && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={selectedIds.size === 0 || isDeleting}
                                        className="block rounded-md bg-red-600 px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
                                    </button>
                                )}
                                <span className="text-gray-300 dark:text-zinc-600 mr-1 sm:mr-2 ml-1 sm:ml-2">|</span>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false)
                                        setBulkActionType(null)
                                        setSelectedIds(new Set())
                                    }}
                                    className="block rounded-md bg-white dark:bg-zinc-900 px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 whitespace-nowrap"
                                >
                                    취소
                                </button>
                            </>
                        ) : (
                            <Menu as="div" className="relative inline-block text-left">
                                <div>
                                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800">
                                        회원관리
                                        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </Menu.Button>
                                </div>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700">
                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const { getInvitationUrl } = await import('../actions')
                                                                const res = await getInvitationUrl()
                                                                if (res.error) {
                                                                    alert(res.error)
                                                                    return
                                                                }

                                                                const copyToClipboard = async (text: string) => {
                                                                    try {
                                                                        if (navigator.clipboard && window.isSecureContext) {
                                                                            await navigator.clipboard.writeText(text);
                                                                            return true;
                                                                        }
                                                                    } catch (err) {
                                                                        console.warn('Clipboard API failed, trying fallback', err);
                                                                    }

                                                                    // Fallback
                                                                    try {
                                                                        const textArea = document.createElement("textarea");
                                                                        textArea.value = text;
                                                                        // Avoid scrolling to bottom
                                                                        textArea.style.top = "0";
                                                                        textArea.style.left = "0";
                                                                        textArea.style.position = "fixed";
                                                                        document.body.appendChild(textArea);
                                                                        textArea.focus();
                                                                        textArea.select();
                                                                        const successful = document.execCommand('copy');
                                                                        document.body.removeChild(textArea);
                                                                        return successful;
                                                                    } catch (err) {
                                                                        console.error('Fallback clipboard failed', err);
                                                                        return false;
                                                                    }
                                                                }

                                                                const success = await copyToClipboard(res.copyText || '')

                                                                if (success) {
                                                                    alert('초대 링크(문구 포함)가 클립보드에 복사되었습니다.\n\n카카오톡이나 문자 메시지에 붙여넣기 하여 전송해주세요!')
                                                                } else {
                                                                    prompt('클립보드 복사를 지원하지 않는 환경이거나 권한이 없습니다. 아래 내용을 직접 복사해주세요:', res.copyText)
                                                                }
                                                            } catch (e: any) {
                                                                alert(`복사 중 오류가 발생했습니다: ${e?.message || '알 수 없는 오류'}`)
                                                            }
                                                        }}
                                                        className={`${active ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex w-full items-center px-4 py-2 text-sm`}
                                                    >
                                                        <ClipboardDocumentIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                                        초대 링크 복사
                                                    </button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={async () => {
                                                            const phone = prompt('추가: 문자 초대(가상)를 진행하시려면 전화번호를 입력하세요 (방금 복사하신 기능 사용을 더 권장합니다)')
                                                            if (!phone) return
                                                            const { sendSmsInvitation } = await import('../actions')
                                                            const res = await sendSmsInvitation(phone)
                                                            if (res.error) alert(res.error)
                                                            else alert(res.message)
                                                        }}
                                                        className={`${active ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex w-full items-center px-4 py-2 text-sm`}
                                                    >
                                                        <ChatBubbleLeftIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                                        문자 발송(테스트)
                                                    </button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setIsBulkEditModalOpen(true)}
                                                        className={`${active ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex w-full items-center px-4 py-2 text-sm`}
                                                    >
                                                        <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                                        일괄 편집
                                                    </button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => router.push(`/portal/signup?gym_id=${gymId}`)}
                                                        className={`${active ? 'bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex w-full items-center px-4 py-2 text-sm text-left`}
                                                    >
                                                        <UserPlusIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                                        신규 등록
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
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
                                        <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-500 dark:text-zinc-400">등록된 회원이 없습니다. 신규 회원을 등록해주세요.</td></tr>
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
