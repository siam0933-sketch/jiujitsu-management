'use client'

import { useState, useEffect, useRef } from 'react'
import { Schedule, deleteSchedule } from '../actions_schedule'
import { checkInMember, cancelAttendance, getMemberAttendanceDates } from '../actions'
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
    const [checkedInMembers, setCheckedInMembers] = useState<Set<string>>(new Set())
    const [manualAttendanceDates, setManualAttendanceDates] = useState<{ [memberId: string]: string[] }>({}) // Cached dates for calendar

    // Modal Selection State
    const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())

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
        // Note: We don't load "checkedIn" status here for 'Other Days' by default to keep it simple?
        // Actually, if we are in 'Other Day' view (e.g. user clicked Monday but today is Tuesday),
        // we might want to show who attended that past class?
        // Implementation Plan said: "If targetDate != Today: Show Calendar icon".
        // Use case: Master goes to yesterday's class. Should they see who attended?
        // Current requirement: "Other day (than today) -> Calendar icon instead of button".
        // So we don't necessarily show attendance stauts row-by-row for the *schedule*,
        // but rather give access to *individual* member's calendar.
    }

    const openManageModal = () => {
        setTempSelectedIds(new Set(enrolledMemberIds))
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
        }
    }

    // 1. Today logic: One-click check-in, Click again to cancel
    const handleCheckInToggle = async (member: Member) => {
        const isChecked = checkedInMembers.has(member.id)

        if (!isChecked) {
            // Check-in
            // No confirm for check-in as requested: "누르면 즉시 출석 처리"
            const res = await checkInMember(member.id, schedule.class_name, effectiveDate)
            if (res?.error) {
                alert(res.error)
            } else {
                // alert(`${member.name} 출석 완료!`)
                setCheckedInMembers(prev => new Set(prev).add(member.id))
            }
        } else {
            // Cancel
            if (!confirm('출석을 취소하시겠습니까?')) return

            const res = await cancelAttendance(member.id, effectiveDate, schedule.class_name)
            if (res?.error) {
                alert(res.error)
            } else {
                setCheckedInMembers(prev => {
                    const next = new Set(prev)
                    next.delete(member.id)
                    return next
                })
            }
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

    // Weekly Mode: Simple View
    if (mode === 'weekly') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-2 group relative hover:border-blue-300 transition-colors h-auto min-h-[60px] flex flex-col justify-center">
                <h4 className="font-bold text-gray-800 text-sm whitespace-normal break-words leading-tight">{schedule.class_name}</h4>
                <p className="text-xs text-blue-600 font-bold mt-1">{schedule.start_time}</p>
                {/* Show enrollment count */}
                <p className="text-[10px] text-gray-400 mt-1">수강생 {schedule.enrollment_count ?? 0}명</p>

                <button
                    onClick={handleDeleteClass}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="수업 삭제"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        )
    }

    // Daily Mode: Interactive View
    return (
        <>
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
                                        <button
                                            onClick={() => handleCheckInToggle(member)}
                                            className={`
                                                px-3 py-1 rounded text-xs font-bold transition-all
                                                ${checkedInMembers.has(member.id)
                                                    ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
                                            `}
                                        >
                                            {checkedInMembers.has(member.id) ? '출석됨' : '출석'}
                                        </button>
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

            {/* Member Management Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">수강생 관리</h3>
                            <button onClick={() => setIsManageModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        {/* Member List (Omitted for brevity, logic remains same as before) */}
                        {/* Note: I am pasting the FULL content, so I must include the modal body */}
                        <div className="p-2 border-b border-gray-100 bg-white">
                            <p className="text-xs text-gray-500 px-2 mb-1">전체 회원 리스트</p>
                        </div>

                        {/* Column Headers */}
                        <div className="px-4 py-2 border-b border-gray-100 bg-white grid grid-cols-[auto_1fr_0.5fr_0.5fr] gap-2 text-xs font-bold text-gray-500">
                            <div className="w-5">{/* Checkbox spacer */}</div>
                            <button onClick={() => handleSort('name')} className="text-left flex items-center gap-1 hover:text-blue-600">
                                이름 <SortIcon colKey="name" />
                            </button>
                            <button onClick={() => handleSort('age')} className="text-left flex items-center gap-1 hover:text-blue-600">
                                나이 <SortIcon colKey="age" />
                            </button>
                            <button onClick={() => handleSort('belt')} className="text-left flex items-center gap-1 hover:text-blue-600">
                                등급 <SortIcon colKey="belt" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {sortedMembers.map(member => {
                                const isSelected = tempSelectedIds.has(member.id)
                                return (
                                    <label
                                        key={member.id}
                                        className={`
                                            grid grid-cols-[auto_1fr_0.5fr_0.5fr] gap-2 items-center p-3 rounded-lg border cursor-pointer transition-all
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
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded text-center">{member.belt}</span>
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
