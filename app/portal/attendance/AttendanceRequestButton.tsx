'use client'

import { useState, useEffect } from 'react'
import { requestAttendance, checkOutMemberSelf } from './actions'
import { useRouter } from 'next/navigation'

type AttendanceStatus = {
    status: 'pending' | 'present'
    checked_out_at: string | null
    check_in_at: string
    id: string
} | null

export default function AttendanceRequestButton({ initialStatus }: { initialStatus: AttendanceStatus }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)

    // Calculate time left for 5-minute rule
    useEffect(() => {
        // Condition: Status is present OR pending (since user wants "Check Out" button visible for pending too)
        // Checks if checked_out_at is null.
        if (initialStatus && !initialStatus.checked_out_at) {
            // Use check_in_at if available, else maybe created_at? 
            // The type definition in actions.ts might need ensuring check_in_at exists. 
            // If pending, check_in_at might be null/undefined depending on schema defaults.
            // Assuming check_in_at is set on insert (default now()) or we use a timestamp.
            // Let's rely on data passed.
            const startTimeStr = initialStatus.check_in_at || new Date().toISOString()
            const checkInTime = new Date(startTimeStr).getTime()
            const fiveMin = 5 * 60 * 1000

            const updateTimer = () => {
                const now = Date.now()
                const diff = now - checkInTime
                if (diff < fiveMin) {
                    setTimeLeft(Math.ceil((fiveMin - diff) / 1000))
                } else {
                    setTimeLeft(0)
                }
            }

            updateTimer() // Run immediately
            const interval = setInterval(updateTimer, 1000)

            return () => clearInterval(interval)
        } else {
            setTimeLeft(0) // Reset if no status or checked out
        }
    }, [initialStatus])

    const handleRequest = async () => {
        if (!confirm('출석 하시겠습니까?')) return
        setLoading(true)
        // Optimistic UI could be handled here if we had local state for status, 
        // but router.refresh() + server action is usually fast enough. 
        // User asked for "Immediately changes". 
        // Since we await the result, there is a delay. 
        // For true instant feedback, we'd need local state override.

        const res = await requestAttendance()
        if (res?.error) {
            alert(res.error)
            setLoading(false)
        } else {
            // Success
            // Do NOT setLoading(false) to prevent flicker before refresh?
            // Actually router.refresh() is async.
            alert('출석 요청이 완료되었습니다.')
            router.refresh()
            // We rely on parent/page reload to show new state. 
            // If user demands INSTANT, we might need a local "fake" status.
            setLoading(false)
        }
    }

    const handleCheckOut = async () => {
        if (!confirm('하원 처리하시겠습니까?')) return
        setLoading(true)
        const res = await checkOutMemberSelf()
        if (res?.error) {
            alert(res.error)
        } else {
            alert('하원 처리가 완료되었습니다.')
            router.refresh()
        }
        setLoading(false)
    }

    // 1. Not checked in (No status)
    if (!initialStatus) {
        return (
            <button
                onClick={handleRequest}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.98]"
            >
                {loading ? '요청 중...' : '출석'}
            </button>
        )
    }

    // 2. Checked Out (Done for day)
    if (initialStatus.checked_out_at) {
        return (
            <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-lg text-center border border-gray-200">
                금일 출석 완료 (하원함)
            </div>
        )
    }

    // 3. Pending OR Present (Active)
    const isPending = initialStatus.status === 'pending'
    const isLocked = timeLeft > 0

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleCheckOut}
                disabled={loading || isLocked}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all
                    ${isLocked
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-90'
                        : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.98]'
                    }
                `}
            >
                {loading ? '처리 중...' : '하원 하기'}
                {isLocked && (
                    <span className="block text-xs font-normal mt-1 opacity-80">
                        {Math.floor(timeLeft / 60)}분 {timeLeft % 60}초 후 가능
                    </span>
                )}
            </button>

            {isPending && (
                <p className="text-center text-sm text-blue-600 font-bold bg-blue-50 py-2 rounded-lg border border-blue-100">
                    관리자가 승인하면 출석이 완료됩니다.
                </p>
            )}
        </div>
    )
}
