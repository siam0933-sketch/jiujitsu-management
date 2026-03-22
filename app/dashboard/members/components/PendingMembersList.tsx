'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { displayBeltName } from '../constants'
import PendingMemberApprovalModal from './PendingMemberApprovalModal'

interface PendingMember {
    id: string
    name: string
    phone: string
    belt: string
    gender: string
    birth_date: string | null
    address: string | null
    school: string | null
    grade: string | null
    guardian_phone: string | null
    pending_stripe: number | null
    pending_promotion_date: string | null
}

interface Props {
    members: PendingMember[]
    onApprove: (id: string, belt: string, stripe: number, promotionDate: string | null) => Promise<{ success: boolean; error?: string }>
    onReject: (id: string) => Promise<{ success: boolean; error?: string }>
}

export default function PendingMembersList({ members, onApprove, onReject }: Props) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [approvingMember, setApprovingMember] = useState<PendingMember | null>(null)

    if (!members || members.length === 0) return null

    const handleApprove = (member: PendingMember) => {
        setApprovingMember(member)
    }

    const handleReject = async (member: PendingMember) => {
        if (!confirm(`${member.name} 회원의 가입 요청을 거절(삭제)하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
        setLoadingId(member.id)
        const res = await onReject(member.id)
        setLoadingId(null)
        if (res.error) alert(res.error)
    }

    return (
        <div className="mb-8">
            {approvingMember && (
                <PendingMemberApprovalModal
                    member={approvingMember}
                    onClose={() => setApprovingMember(null)}
                    onSuccess={() => {
                        setApprovingMember(null)
                        router.refresh()
                    }}
                />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                승인 대기 중인 신규 회원
                <span className="bg-red-100 text-red-600 text-sm py-0.5 px-2.5 rounded-full font-bold">
                    {members.length}
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {members.map((member) => (
                    <div key={member.id} className="bg-white dark:bg-zinc-900 border-2 border-orange-200 dark:border-orange-900/50 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                        {loadingId === member.id && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                <span className="text-orange-600 font-bold animate-pulse">처리 중...</span>
                            </div>
                        )}
                        <div className="p-5 flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        {member.name}
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                            {member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : member.gender}
                                        </span>
                                    </h3>
                                    <p className="text-gray-600 dark:text-zinc-400 font-medium">{member.phone}</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-3 py-1 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                                        {displayBeltName(member.belt || 'White')}
                                    </div>
                                    {(member.pending_stripe !== null && member.pending_stripe !== undefined) && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                                            {member.pending_stripe === 0 ? '그랄 없음' : `${member.pending_stripe}그랄`}
                                            {member.pending_promotion_date && ` · ${member.pending_promotion_date}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-zinc-400 grid grid-cols-1 gap-y-1.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                {member.birth_date && (
                                    <div className="flex select-text">
                                        <span className="w-20 text-gray-400 dark:text-zinc-500">생년월일</span>
                                        <span>{member.birth_date} （{new Date().getFullYear() - new Date(member.birth_date).getFullYear() + 1}세）</span>
                                    </div>
                                )}
                                {member.guardian_phone && (
                                    <div className="flex select-text">
                                        <span className="w-20 text-gray-400 dark:text-zinc-500">보호자</span>
                                        <span>{member.guardian_phone}</span>
                                    </div>
                                )}
                                {(member.school || member.grade) && (
                                    <div className="flex select-text">
                                        <span className="w-20 text-gray-400 dark:text-zinc-500">학교/학년</span>
                                        <span>{member.school} {member.grade}</span>
                                    </div>
                                )}
                                {member.address && (
                                    <div className="flex select-text">
                                        <span className="w-20 text-gray-400 dark:text-zinc-500">주소</span>
                                        <span className="truncate" title={member.address}>{member.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-zinc-800 flex divide-x divide-gray-100 dark:divide-zinc-800">
                            <button
                                onClick={() => handleReject(member)}
                                disabled={!!loadingId}
                                className="flex-1 py-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                거절 및 삭제
                            </button>
                            <button
                                onClick={() => handleApprove(member)}
                                disabled={!!loadingId}
                                className="flex-1 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                가입 승인
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
