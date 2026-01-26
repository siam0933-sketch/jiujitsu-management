'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAttendanceLogsForDate, checkInMember } from '../actions'

type Member = {
    id: string
    name: string
    belt: string
}

type AttendanceLog = {
    id: string
    member_id: string
    status: string
    created_at: string
    gym_members: {
        name: string
        belt: string
    }
}

interface Props {
    todayKST: string
}

export default function PendingApprovalList({ todayKST }: Props) {
    const router = useRouter()
    const [pendingLogs, setPendingLogs] = useState<AttendanceLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

    const loadPendingLogs = async () => {
        setIsLoading(true)
        try {
            const logs = await getAttendanceLogsForDate(todayKST)
            // Filter only pending logs
            const pending = logs.filter((log: any) => log.status === 'pending')
            setPendingLogs(pending)
        } catch (error) {
            console.error('Failed to load pending logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPendingLogs()
    }, [todayKST])

    const handleApprove = async (log: AttendanceLog) => {
        if (!confirm(`${log.gym_members.name}님의 출석을 승인하시겠습니까?`)) return

        setProcessingIds(prev => new Set(prev).add(log.member_id))
        try {
            // checkInMember handles pending -> present transition
            const res = await checkInMember(log.member_id, undefined, todayKST)
            if (res?.error) {
                alert(res.error)
            } else {
                // Remove from list locally for immediate feedback
                setPendingLogs(prev => prev.filter(p => p.id !== log.id))
                router.refresh() // Refresh server data (counts etc)
            }
        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev)
                next.delete(log.member_id)
                return next
            })
        }
    }

    if (isLoading) return null // Or simple skeleton
    if (pendingLogs.length === 0) return null // Don't show if empty

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6 p-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-red-800 font-bold text-lg mb-3 flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                승인 대기 중인 출석 요청 ({pendingLogs.length}건)
            </h3>

            <div className="space-y-2">
                {pendingLogs.map(log => (
                    <div
                        key={log.id}
                        className="bg-white border border-red-100 rounded-lg p-3 flex justify-between items-center shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                {log.gym_members.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">
                                    {log.gym_members.name}
                                    <span className="text-xs text-gray-500 font-normal ml-1">({log.gym_members.belt})</span>
                                </p>
                                <p className="text-xs text-red-500">
                                    {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 요청
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleApprove(log)}
                            disabled={processingIds.has(log.member_id)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${processingIds.has(log.member_id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'}
                            `}
                        >
                            {processingIds.has(log.member_id) ? '처리 중...' : '승인하기'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
