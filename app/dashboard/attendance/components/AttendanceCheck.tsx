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

export default function AttendanceCheck({ schedule, allMembers }: { schedule: Schedule, allMembers: Member[] }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [checkedInMembers, setCheckedInMembers] = useState<Set<string>>(new Set()) // Local optimisitic state? 
    // Actually, we should check real logs. But for now, let's just use toast/alert verification
    // and maybe local toggle to gray them out.
    // Ideally we fetch "Who checked in to THIS class today" on expand.

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

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-3 overflow-hidden group">
            <div className="p-3 bg-blue-50 border-b border-gray-100 flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">{schedule.class_name}</h4>
                    <p className="text-xs text-blue-600 font-bold mt-0.5">{schedule.start_time}</p>
                </div>
                <button
                    onClick={handleDeleteClass}
                    className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    삭제
                </button>
            </div>

            <div className="p-2">
                {!isExpanded ? (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                    >
                        회원 불러오기
                    </button>
                ) : (
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="w-full text-[10px] text-gray-400 mb-2 hover:text-gray-600"
                        >
                            접기
                        </button>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                            {allMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleCheckIn(member)}
                                    disabled={checkedInMembers.has(member.id)}
                                    className={`
                                        w-full text-left px-2 py-1.5 rounded text-xs flex justify-between items-center group
                                        ${checkedInMembers.has(member.id)
                                            ? 'bg-green-50 text-green-700 cursor-default'
                                            : 'hover:bg-blue-50 text-gray-700'}
                                    `}
                                >
                                    <span className="font-medium">{member.name}</span>
                                    {checkedInMembers.has(member.id) && <span>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
