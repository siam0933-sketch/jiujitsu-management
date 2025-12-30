'use client'

import { useState, useEffect } from 'react'
import { Schedule, deleteSchedule } from '../actions_schedule'
import { checkInMember } from '../actions'
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
}

export default function AttendanceCheck({ schedule, allMembers, mode }: Props) {
    // Mode States
    const [isMenuOpen, setIsMenuOpen] = useState(false) // Gear menu toggle

    // Close menu when clicking outside (simple implementation)
    useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false)
        if (isMenuOpen) {
            window.addEventListener('click', handleClickOutside)
        }
        return () => window.removeEventListener('click', handleClickOutside)
    }, [isMenuOpen])

    // ... (rest of logic same until return)

    // Daily Mode: Interactive View
    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all mb-4 overflow-visible relative z-0">
                {/* Header */}
                <div className="p-4 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white relative">
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">{schedule.class_name}</h4>
                        <p className="text-sm text-blue-600 font-bold mt-1">{schedule.start_time}</p>
                        <p className="text-xs text-gray-500 mt-1">총 {enrolledMembers.length}명 등록 중</p>
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsMenuOpen(!isMenuOpen)
                            }}
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
                                    onClick={(e) => {
                                        e.stopPropagation()
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
                                    onClick={(e) => {
                                        e.stopPropagation()
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
                                <button
                                    key={member.id}
                                    onClick={() => handleCheckIn(member)}
                                    disabled={checkedInMembers.has(member.id)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors border-b border-gray-50 last:border-0
                                        ${checkedInMembers.has(member.id)
                                            ? 'bg-green-50 text-green-700 font-medium cursor-default'
                                            : 'hover:bg-blue-50 text-gray-700'}
                                    `}
                                >
                                    <span>{member.name} <span className="text-gray-400 text-xs ml-1">({member.belt})</span></span>
                                    {checkedInMembers.has(member.id) && <span>✓</span>}
                                </button>
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

                        <div className="p-2 border-b border-gray-100 bg-white">
                            <p className="text-xs text-gray-500 px-2 mb-1">전체 회원 리스트</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {allMembers.map(member => {
                                const isSelected = tempSelectedIds.has(member.id)
                                return (
                                    <label
                                        key={member.id}
                                        className={`
                                            flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mr-3"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(member.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>{member.name}</span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{member.belt}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 flex gap-2">
                                                <span>{member.phone || '연락처 없음'}</span>
                                                {member.birth_date && <span>• {calculateAge(member.birth_date)}</span>}
                                            </div>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                            <button
                                onClick={() => setIsManageModalOpen(false)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEnrollments}
                                className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md"
                            >
                                저장하기 ({tempSelectedIds.size}명)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
