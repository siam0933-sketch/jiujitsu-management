'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Schedule, deleteSchedule, createSchedule } from '../actions_schedule'
import { checkInMember, checkOutMember, cancelAttendance, getMemberAttendanceDates, getAttendanceLogsForDate } from '../actions'
import { getEnrollments, updateEnrollments } from '../actions_enrollment'

type Member = {
    id: string
    name: string
    belt: string
    phone?: string
    birth_date?: string
    attendance_count: number
}

interface Props {
    schedule: Schedule
    allMembers: Member[]
    mode: 'daily' | 'weekly'
    targetDate?: string
}

export default function AttendanceCheck({ schedule, allMembers, mode, targetDate }: Props) {
    const router = useRouter()
    // Mode States
    const [isMenuOpen, setIsMenuOpen] = useState(false) // Gear menu toggle
    const [isManageModalOpen, setIsManageModalOpen] = useState(false) // Enrollment Modal
    const [isCalendarOpen, setIsCalendarOpen] = useState(false) // Calendar Popover

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'age' | 'belt', direction: 'asc' | 'desc' } | null>(null)

    const handleSort = (key: 'name' | 'age' | 'belt') => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // Sort Members
    const sortedMembers = [...(Array.isArray(allMembers) ? allMembers : [])].sort((a, b) => {
        if (!sortConfig) return 0

        // Special handling for Age (calculated from birth_date)
        if (sortConfig.key === 'age') {
            const aValue = a.birth_date || ''
            const bValue = b.birth_date || ''
            // Invert direction for intuitive age sorting (Younger date = Older age)
            if (aValue < bValue) return sortConfig.direction === 'asc' ? 1 : -1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? -1 : 1
            return 0
        }

        // Standard string comparison for other keys
        const key = sortConfig.key as keyof Member
        const aValue = a[key] || ''
        const bValue = b[key] || ''

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    // Helper: Sort Icon
    const SortIcon = ({ colKey }: { colKey: 'name' | 'age' | 'belt' }) => {
        if (sortConfig?.key !== colKey) return <span className="text-gray-300 ml-1">↕</span>
        return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>
    }

    // Data States
    const [enrolledMemberIds, setEnrolledMemberIds] = useState<Set<string>>(new Set())
    const [attendanceStatus, setAttendanceStatus] = useState<Record<string, { checkedOut: boolean, status?: string }>>({})
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    const [manualAttendanceDates, setManualAttendanceDates] = useState<{ [memberId: string]: string[] }>({}) // Cached dates for calendar

    // Modal Selection State
    const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())

    // Copy Class State
    const [isCopyMode, setIsCopyMode] = useState(false)
    const [selectedCopyDays, setSelectedCopyDays] = useState<Set<string>>(new Set())
    const [isCopying, setIsCopying] = useState(false)

    const handleToggleCopyDay = (dayId: string) => {
        const next = new Set(selectedCopyDays)
        if (next.has(dayId)) next.delete(dayId)
        else next.add(dayId)
        setSelectedCopyDays(next)
    }

    const handleCopyClass = async () => {
        if (selectedCopyDays.size === 0) {
            alert('복사할 요일을 선택해주세요.')
            return
        }
        if (!confirm(`선택한 ${selectedCopyDays.size}개 요일에 이 수업을 복사하시겠습니까?\n체크된 ${tempSelectedIds.size}명의 수강생도 함께 등록됩니다.`)) return

        setIsCopying(true)
        try {
            const res = await createSchedule({
                days: Array.from(selectedCopyDays),
                time: schedule.start_time,
                name: schedule.class_name,
                initialEnrollments: Array.from(tempSelectedIds)
            })

            if (res?.error) {
                alert(res.error)
            } else {
                alert('수업이 복사되었습니다.')
                router.refresh()
                setIsCopyMode(false)
                setSelectedCopyDays(new Set())
                // No need to close Manage modal? Maybe close it to see result
                setIsManageModalOpen(false)
            }
        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
        } finally {
            setIsCopying(false)
        }
    }

    // Date Logic
    const todayStr = new Date().toISOString().split('T')[0]
    // If targetDate is not provided (weekly view default?), default to today. But ClassScheduleBoard sends it.
    const effectiveDate = targetDate || todayStr
    const isToday = effectiveDate === todayStr

    // Calendar State (Current View)
    const [calendarMonth, setCalendarMonth] = useState(new Date())
    const [selectedMemberForCalendar, setSelectedMemberForCalendar] = useState<string | null>(null)

    // Initial Load of Enrollments
    useEffect(() => {
        if (mode === 'daily') {
            loadEnrollments()
        }
    }, [schedule.id, mode, effectiveDate])

    const loadEnrollments = async () => {
        const ids = await getEnrollments(schedule.id)
        setEnrolledMemberIds(new Set(ids))

        // Load Attendance Status for Effective Date
        const logs = await getAttendanceLogsForDate(effectiveDate)
        const statusMap: Record<string, { checkedOut: boolean, status?: string }> = {}
        logs.forEach((log: any) => {
            statusMap[log.member_id] = { checkedOut: !!log.checked_out_at, status: log.status }
        })
        setAttendanceStatus(statusMap)
    }

    const openManageModal = () => {
        setTempSelectedIds(new Set(enrolledMemberIds))
        setIsCopyMode(false) // Reset copy mode
        setSelectedCopyDays(new Set())
        setIsManageModalOpen(true)
    }

    const handleToggleSelect = (id: string) => {
        const next = new Set(tempSelectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setTempSelectedIds(next)
    }

    const handleSaveEnrollments = async () => {
        if (!confirm('수강생 목록을 저장하시겠습니까?')) return

        const ids = Array.from(tempSelectedIds)
        const res = await updateEnrollments(schedule.id, ids)

        if (res?.error) {
            alert(res.error)
        } else {
            setEnrolledMemberIds(new Set(ids))
            setIsManageModalOpen(false)
            alert('저장되었습니다.')
            router.refresh()
        }
    }

    // 1. Today logic: 3-State Toggle (CheckIn -> CheckOut -> Cancel)
    const handleCheckInToggle = async (member: Member) => {
        if (processingIds.has(member.id)) return
        setProcessingIds(prev => new Set(prev).add(member.id))

        const status = attendanceStatus[member.id]

        try {
            if (!status) {
                // 1. Check In
                const res = await checkInMember(member.id, schedule.class_name, effectiveDate)
                if (res?.error) alert(res.error)
                else {
                    setAttendanceStatus(prev => ({ ...prev, [member.id]: { checkedOut: false, status: 'present' } }))
                }
            } else if (status.status === 'pending') {
                // 1.5 Approve (Pending -> Present)
                const res = await checkInMember(member.id, schedule.class_name, effectiveDate) // Re-use checkIn to approve
                if (res?.error) alert(res.error)
                else {
                    setAttendanceStatus(prev => ({ ...prev, [member.id]: { checkedOut: false, status: 'present' } }))
                }
            } else if (!status.checkedOut) {
                // 2. Check Out (하원)
                const res = await checkOutMember(member.id, effectiveDate)
                if (res?.error) alert(res.error)
                else {
                    setAttendanceStatus(prev => ({ ...prev, [member.id]: { checkedOut: true, status: 'present' } }))
                }
            } else {
                // 3. Cancel (취소)
                if (!confirm('출석 기록을 취소하시겠습니까?')) return // Early return, finally block handles cleanup

                const res = await cancelAttendance(member.id, effectiveDate, schedule.class_name)
                if (res?.error) alert(res.error)
                else {
                    setAttendanceStatus(prev => {
                        const next = { ...prev }
                        delete next[member.id]
                        return next
                    })
                }
            }
        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev)
                next.delete(member.id)
                return next
            })
        }
    }

    // 2. Calendar Logic
    const openCalendar = async (memberId: string) => {
        setSelectedMemberForCalendar(memberId)
        setIsCalendarOpen(true)
        // Load dates
        const dates = await getMemberAttendanceDates(memberId)
        setManualAttendanceDates(prev => ({ ...prev, [memberId]: dates }))
    }

    const handleGenericCheckIn = async (memberId: string, date: string) => {
        // Toggle logic for calendar
        const currentDates = manualAttendanceDates[memberId] || []
        const isAttended = currentDates.includes(date)

        if (isAttended) {
            // Cancel
            if (!confirm('이 날짜의 출석을 취소하시겠습니까?')) return
            const res = await cancelAttendance(memberId, date) // Generic cancel (no class name needed? or context?)
            // Assuming geneic or "Manual" for calendar unless we want to link to THIS class.
            // Requirement: "달력안에서 날짜 선택후 출석버튼을 누르면 출석이되"
            // Let's use current class context if possible, or generic. 
            // Ideally calendar attendance is generic manual attendance unless specified.
            // But we are in a Class Card. Let's use class_name context if valid.

            if (res?.error) alert(res.error)
            else {
                setManualAttendanceDates(prev => ({
                    ...prev,
                    [memberId]: prev[memberId].filter(d => d !== date)
                }))
            }
        } else {
            // Check-in
            if (!confirm(`${date}에 출석 처리하시겠습니까?`)) return
            const res = await checkInMember(memberId, schedule.class_name, date)
            if (res?.error) alert(res.error)
            else {
                setManualAttendanceDates(prev => ({
                    ...prev,
                    [memberId]: [...prev[memberId], date]
                }))
            }
        }
    }

    const handleDeleteClass = async () => {
        if (!confirm('정말 이 수업을 삭제하시겠습니까?')) return
        await deleteSchedule(schedule.id)
        router.refresh()
    }

    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return ''
        const birth = new Date(birthDate)
        if (isNaN(birth.getTime())) return '' // Validation
        const today = new Date()
        const age = today.getFullYear() - birth.getFullYear()
        return `${age}세`
    }

    // Filtered Members for Display (Only Enrolled)
    const paramsMembers = Array.isArray(allMembers) ? allMembers : []
    const enrolledMembers = paramsMembers.filter(m => m && enrolledMemberIds.has(m.id))

    // Ref for menu container
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMenuOpen])

    // Weekly Mode: Handle Manage Click
    const handleWeeklyManageClick = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent bubbling if needed
        // Fetch fresh enrollments
        await loadEnrollments()
        // Open modal
        // Note: loadEnrollments updates enrolledMemberIds state.
        // We need to sync tempSelectedIds with the *newly fetched* data.
        // Since setState is async, we can't rely on 'enrolledMemberIds' being updated immediately in the next line.
        // So we should modify separate loadEnrollments to return data or handle it here.
        // Re-implementing fetch here for clarity and safety:
        const ids = await getEnrollments(schedule.id)
        setEnrolledMemberIds(new Set(ids))
        setTempSelectedIds(new Set(ids))
        setIsManageModalOpen(true)
    }

    // Weekly Mode: Simple View
    return (
        <>
            {/* Weekly Mode View */}
            {mode === 'weekly' && (
                <div
                    onClick={handleWeeklyManageClick}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-2 group relative hover:border-blue-300 hover:shadow-md transition-all h-auto min-h-[100px] flex flex-col cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm whitespace-normal break-words leading-tight">{schedule.class_name}</h4>
                            <p className="text-xs text-blue-600 font-bold mt-0.5">{schedule.start_time}</p>
                        </div>
                        {/* Show enrollment count badge */}
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {schedule.enrollment_count ?? 0}명
                        </span>
                    </div>

                    {/* Enrolled Students List */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide max-h-[120px] border-t border-gray-50 pt-1">
                        {schedule.enrolled_members && schedule.enrolled_members.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {[...schedule.enrolled_members]
                                    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                    .map((m, idx) => (
                                        <span key={idx} className="text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                            {m.name}
                                        </span>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-300 text-center py-2">수강생 없음</p>
                        )}
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClass()
                            }}
                            className="text-gray-300 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50"
                            title="수업 삭제"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Daily Mode View */}
            {mode === 'daily' && (
                <div className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all mb-4 overflow-visible relative ${isMenuOpen ? 'z-20' : 'z-0'}`}>
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white relative">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-blue-600 font-bold">{schedule.start_time}</p>
                            <h4 className="font-bold text-gray-800 text-lg">{schedule.class_name}</h4>
                            <p className="text-xs text-gray-400">({enrolledMembers.length}명)</p>
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animation-fade-in">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            openManageModal()
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        회원 추가/관리
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            handleDeleteClass()
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        수업 삭제
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enrolled List */}
                    <div className="border-t border-gray-100 bg-white">
                        {enrolledMembers.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {enrolledMembers.map(member => (
                                    <div
                                        key={member.id}
                                        className={`
                                        w-full px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors border-b border-gray-50 last:border-0
                                        hover:bg-gray-50
                                    `}
                                    >
                                        <span className="text-gray-700">
                                            {member.name}
                                            {member.birth_date && <span className="text-gray-400 text-xs ml-1 font-normal">({calculateAge(member.birth_date)})</span>}
                                            <span className="text-gray-400 text-xs ml-1">({member.belt})</span>
                                        </span>

                                        {/* Action Button: Today -> CheckIn/Out, Other -> Calendar */}
                                        {isToday ? (
                                            (() => {
                                                const status = attendanceStatus[member.id]
                                                const isProcessing = processingIds.has(member.id)

                                                // Default: Wait (대기)
                                                let btnClass = 'bg-gray-100 text-gray-600 ring-gray-500/10 hover:bg-gray-200'
                                                let btnText = '대기'

                                                if (status) {
                                                    if (status.status === 'pending') {
                                                        // Pending: Approval Request (승인 요청)
                                                        btnClass = 'bg-red-100 text-red-700 ring-red-600/20 hover:bg-red-200 animate-pulse'
                                                        btnText = '승인 요청'
                                                    } else if (status.checkedOut) {
                                                        // Checked Out: Left (하원)
                                                        btnClass = 'bg-amber-100 text-amber-800 ring-amber-600/20 hover:bg-amber-200'
                                                        btnText = '하원'
                                                    } else {
                                                        // Checked In: Present (출석)
                                                        btnClass = 'bg-green-100 text-green-700 ring-green-600/20 hover:bg-green-200'
                                                        btnText = '출석'
                                                    }
                                                }

                                                return (
                                                    <button
                                                        onClick={() => handleCheckInToggle(member)}
                                                        disabled={isProcessing}
                                                        className={`
                                                        rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset transition-all
                                                        ${btnClass}
                                                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                    >
                                                        {isProcessing ? '...' : btnText}
                                                    </button>
                                                )
                                            })()
                                        ) : (
                                            <button
                                                onClick={() => openCalendar(member.id)}
                                                className="p-1 px-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="달력 보기"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-gray-400">
                                등록된 수강생이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Member Management Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">수강생 관리</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsCopyMode(!isCopyMode)}
                                    className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-colors shadow-sm ${isCopyMode ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isCopyMode ? '복사 취소' : '+ 수업 복사하기'}
                                </button>
                                <button onClick={() => setIsManageModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                        </div>

                        {/* Copy Mode Panel */}
                        {isCopyMode && (
                            <div className="bg-blue-50 p-4 border-b border-blue-100 animate-in slide-in-from-top-2">
                                <p className="text-sm text-blue-800 font-bold mb-2">어떤 요일로 복사할까요?</p>
                                <div className="flex justify-between gap-1 mb-3">
                                    {[
                                        { id: 'Mon', label: '월' },
                                        { id: 'Tue', label: '화' },
                                        { id: 'Wed', label: '수' },
                                        { id: 'Thu', label: '목' },
                                        { id: 'Fri', label: '금' },
                                        { id: 'Sat', label: '토' },
                                        { id: 'Sun', label: '일' },
                                    ].map(day => (
                                        <button
                                            key={day.id}
                                            onClick={() => handleToggleCopyDay(day.id)}
                                            className={`
                                                flex-1 h-9 rounded-lg text-sm font-bold transition-all
                                                ${selectedCopyDays.has(day.id)
                                                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                    : 'bg-white text-gray-500 border border-blue-100 hover:border-blue-300'}
                                            `}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleCopyClass}
                                    disabled={selectedCopyDays.size === 0 || isCopying}
                                    className={`
                                        w-full py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex justify-center items-center gap-2
                                        ${selectedCopyDays.size > 0
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                    `}
                                >
                                    {isCopying ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            복사 중...
                                        </>
                                    ) : (
                                        `선택한 요일에 복사하기 (${selectedCopyDays.size}개)`
                                    )}
                                </button>
                                <p className="text-[10px] text-blue-400 mt-2 text-center">
                                    * 아래 리스트에서 체크된 <strong>{tempSelectedIds.size}명</strong>의 수강생도 함께 등록됩니다.
                                </p>
                            </div>
                        )}
                        {/* Member List (Omitted for brevity, logic remains same as before) */}
                        {/* Note: I am pasting the FULL content, so I must include the modal body */}
                        <div className="p-2 border-b border-gray-100 bg-white">
                            <p className="text-xs text-gray-500 px-2 mb-1">전체 회원 리스트</p>
                        </div>

                        {/* Column Headers */}
                        <div className="px-4 py-2 border-b border-gray-100 bg-white grid grid-cols-[auto_1fr_0.4fr] gap-2 text-xs font-bold text-gray-500">
                            <div className="w-5">{/* Checkbox spacer */}</div>
                            <button onClick={() => handleSort('name')} className="text-left flex items-center gap-1 hover:text-blue-600">
                                이름 <SortIcon colKey="name" />
                            </button>
                            <button onClick={() => handleSort('age')} className="text-left flex items-center gap-1 hover:text-blue-600">
                                나이 <SortIcon colKey="age" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {sortedMembers.map(member => {
                                const isSelected = tempSelectedIds.has(member.id)
                                return (
                                    <label
                                        key={member.id}
                                        className={`
                                            grid grid-cols-[auto_1fr_0.4fr] gap-2 items-center p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(member.id)}
                                        />
                                        <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>{member.name}</span>
                                        <span className="text-xs text-gray-400">{calculateAge(member.birth_date)}</span>
                                    </label>
                                )
                            })}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                            <button onClick={() => setIsManageModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100">취소</button>
                            <button onClick={handleSaveEnrollments} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md">저장하기 ({tempSelectedIds.size}명)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Modal */}
            {isCalendarOpen && selectedMemberForCalendar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCalendarOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</h3>
                            <div className="flex gap-1">
                                <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">◀</button>
                                <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">▶</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="text-xs text-gray-500 font-medium">{d}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {(() => {
                                const year = calendarMonth.getFullYear()
                                const month = calendarMonth.getMonth()
                                const firstDay = new Date(year, month, 1).getDay()
                                const lastDate = new Date(year, month + 1, 0).getDate()
                                const days = []

                                // Empties
                                for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`}></div>)

                                // Days
                                for (let d = 1; d <= lastDate; d++) {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                    const attended = manualAttendanceDates[selectedMemberForCalendar]?.includes(dateStr)
                                    days.push(
                                        <button
                                            key={d}
                                            onClick={() => handleGenericCheckIn(selectedMemberForCalendar, dateStr)}
                                            className={`
                                                h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors
                                                ${attended
                                                    ? 'bg-green-500 text-white font-bold shadow-sm'
                                                    : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            {d}
                                        </button>
                                    )
                                }
                                return days
                            })()}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setIsCalendarOpen(false)} className="text-sm text-gray-500 hover:text-gray-800 underline">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
