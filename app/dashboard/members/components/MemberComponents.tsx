'use client'

import { useState } from 'react'
import { updateMemberStartDate, togglePauseStatus } from '../[id]/actions'

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

// --- 2. Start Date Component ---
type MemberStartDateProps = {
    memberId: string
    startDate: string | null
    joinedAt: string
}

export function MemberStartDate({ memberId, startDate, joinedAt }: MemberStartDateProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [currentDate, setCurrentDate] = useState(startDate || joinedAt?.split('T')[0] || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await updateMemberStartDate(memberId, currentDate)
        if (res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
        }
        setIsLoading(false)
    }

    // User requested "가입일과 같은 스타일로 통일".
    // In MemberModal Activity section:
    // <p className="text-gray-400 text-xs mb-1">가입일</p>
    // <p className="font-medium text-gray-900 text-sm">{new Date(member.joined_at).toLocaleDateString()}</p>

    return (
        <div>
            <p className="text-gray-400 text-xs mb-1">입문일</p>
            <div className="flex items-center gap-2 h-5">
                {/* h-5 to match text height if needed, or just allow grow */}
                {isEditing ? (
                    <>
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="p-0 text-sm border-gray-300 rounded focus:ring-0 border-b w-32"
                        />
                        <button onClick={handleSave} disabled={isLoading} className="text-xs text-blue-600 hover:text-blue-800">저장</button>
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                    </>
                ) : (
                    <>
                        <p className="font-medium text-gray-900 text-sm cursor-pointer hover:underline decoration-dashed underline-offset-4 decoration-gray-300"
                            onClick={() => setIsEditing(true)}
                            title="클릭하여 입문일 수정"
                        >
                            {currentDate ? new Date(currentDate).toLocaleDateString() : '-'}
                        </p>
                        {/* Optional edit icon if hover isn't obvious, but user asked for "same style as joinedAt" which is plain text. 
                            I'll add a subtle visual cue or just rely on click. 
                            Let's add a tiny pencil on hover? Or just keep it clean.
                        */}
                    </>
                )}
            </div>
        </div>
    )
}

// --- 3. Pause Button ---
type MemberPauseButtonProps = {
    memberId: string
    isPaused: boolean
}

export function MemberPauseButton({ memberId, isPaused }: MemberPauseButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async () => {
        const action = isPaused ? '복귀' : '휴관'
        if (!confirm(`정말 ${action} 처리하시겠습니까?\n${isPaused ? '다시 수련 일수가 계산됩니다.' : '수련 일수 계산이 일시 정지되며, 결제일이 연장됩니다.'}`)) return

        setIsLoading(true)
        const res = await togglePauseStatus(memberId, isPaused ? 'paused' : 'active')
        if (res.error) {
            alert(res.error)
        } else {
            alert(`${action} 처리되었습니다.`)
        }
        setIsLoading(false)
    }

    // User requested "휴관 버튼은 결제내역박스 안으로 이동해줘".
    // Style should probably match the buttons in Payment section (Edit/Delete are small text buttons, "결제하기" is a big action).
    // Let's make it a noticeable but compact button, maybe outlined.

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`text-xs px-2 py-1 rounded border transition-colors ${isPaused
                ? 'border-green-600 text-green-600 hover:bg-green-50'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
        >
            {isLoading ? '처리 중...' : (isPaused ? '▶ 복귀 (Resume)' : '⏸ 휴관 (Pause)')}
        </button>
    )
}
