'use client'

import { useState } from 'react'
import { Schedule, deleteSchedule } from '../actions_schedule'
import { checkInMember } from '../actions'

type Member = {
    id: string
    name: string
    belt: string
    attendance_count: number
}

interface Props {
    schedule: Schedule
    allMembers: Member[]
    mode: 'daily' | 'weekly'
}

export default function AttendanceCheck({ schedule, allMembers, mode }: Props) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [checkedInMembers, setCheckedInMembers] = useState<Set<string>>(new Set())

    const handleCheckIn = async (member: Member) => {
        if (!confirm(`${member.name}님을 출석 처리하시겠습니까?`)) return

        const res = await checkInMember(member.id, schedule.class_name)
        if (res?.error) {
            alert(res.error)
        } else {
            alert(`${member.name} 출석 완료!`)
            setCheckedInMembers(prev => new Set(prev).add(member.id))
        }
    }

    const handleDeleteClass = async () => {
        if (!confirm('정말 이 수업을 삭제하시겠습니까?')) return
        await deleteSchedule(schedule.id)
    }

    // Weekly Mode: Simple View
    if (mode === 'weekly') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-2 group relative hover:border-blue-300 transition-colors h-auto min-h-[60px] flex flex-col justify-center">
                <h4 className="font-bold text-gray-800 text-sm whitespace-normal break-words leading-tight">{schedule.class_name}</h4>
                <p className="text-xs text-blue-600 font-bold mt-1">{schedule.start_time}</p>

                {/* Delete Button (Only visible on hover in Weekly mode for quick management) */}
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all mb-4 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
                <div>
                    <h4 className="font-bold text-gray-800 text-lg">{schedule.class_name}</h4>
                    <p className="text-sm text-blue-600 font-bold mt-1">{schedule.start_time}</p>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-gray-200 text-gray-700' : 'bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            {/* Editing / Loading Section */}
            {isEditing && (
                <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-3 animation-slide-down">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${isExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {isExpanded ? '회원 목록 닫기' : '회원 불러오기'}
                        </button>
                        <button
                            onClick={handleDeleteClass}
                            className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                        >
                            삭제
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {allMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleCheckIn(member)}
                                    disabled={checkedInMembers.has(member.id)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors
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
                    )}
                </div>
            )}
        </div>
    )
}
