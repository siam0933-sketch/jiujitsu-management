'use client'

import { useState } from 'react'
import { updateMemberStartDate, updateMemberJoinedDate } from '../[id]/actions'

// --- 1. Status Badge ---
export function MemberStatusBadge({ isPaused }: { isPaused: boolean }) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isPaused
            ? 'bg-gray-50 text-gray-600 ring-gray-500/10' // Neutral/Gray for Paused as requested? 
            // User requested "무채색으로 튀지않게" (achromatic, not flashy).
            // Let's use gray for both or very subtle distinction.
            // Actually, "Paused" might imply inactive, but user said "Member Status" badge in header.
            // Let's make it simple gray.
            : 'bg-green-50 text-green-700 ring-green-600/20'
            }`}>
            {isPaused ? '휴관 중 (Paused)' : '수련 중 (Active)'}
        </span>
    )
}

// User asked for "무채색으로 튀지않게" (achromatic, not flashy) for the status badge in the header.
// I will adjust the Active state to be less flashy too, or just keep green for active/good and gray for paused?
// "회원상태는 회원정보 제일 위에 이름옆에 배치해 컬러는 무채색으로 튀지않게하고" -> likely means the badge itself should be achromatic.
// Let's try neutral colors for both, maybe bold text for distinction.

export function MemberStatusBadgeSimple({ isPaused }: { isPaused: boolean }) {
    return (
        <span className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${isPaused
            ? 'bg-gray-100 text-gray-500 border-gray-200'
            : 'bg-white text-gray-600 border-gray-300'
            }`}>
            {isPaused ? '휴관' : '활동'}
        </span>
    )
}

// --- 2. Generic Date Editor Component ---
type MemberDateEditorProps = {
    memberId: string
    label: string
    dateValue: string | null
    onSave: (id: string, date: string) => Promise<{ error?: string, success?: boolean }>
}

function MemberDateEditor({ memberId, label, dateValue, onSave }: MemberDateEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [currentDate, setCurrentDate] = useState(dateValue ? dateValue.split('T')[0] : '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await onSave(memberId, currentDate)
        if (res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
        }
        setIsLoading(false)
    }

    return (
        <div>
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <div className="flex items-center gap-2 h-5">
                {isEditing ? (
                    <>
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="p-0 text-sm border-gray-300 rounded focus:ring-0 border-b w-32"
                        />
                        <button onClick={handleSave} disabled={isLoading} className="text-xs text-blue-600 hover:text-blue-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <p className="font-medium text-gray-900 text-sm">
                            {currentDate ? new Date(currentDate).toLocaleDateString() : '-'}
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title={`${label} 수정`}
                        >
                            {/* Calendar Icon */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export function MemberStartDate({ memberId, startDate, joinedAt }: { memberId: string, startDate: string | null, joinedAt: string }) {
    // Default to joinedAt if startDate is null, but for editing we might want to respect the null state or initialize with joinedAt?
    // User logic: "Start Date" defaults to "Joined At" usually.
    return <MemberDateEditor memberId={memberId} label="입문일" dateValue={startDate || joinedAt} onSave={updateMemberStartDate} />
}

export function MemberJoinedDate({ memberId, joinedAt }: { memberId: string, joinedAt: string }) {
    return <MemberDateEditor memberId={memberId} label="등록일" dateValue={joinedAt} onSave={updateMemberJoinedDate} />
}


