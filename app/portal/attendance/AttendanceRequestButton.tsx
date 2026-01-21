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

    useEffect(() => {
        if (initialStatus?.status === 'present' && !initialStatus.checked_out_at && initialStatus.check_in_at) {
            const checkInTime = new Date(initialStatus.check_in_at).getTime()
            const fiveMin = 5 * 60 * 1000

            const interval = setInterval(() => {
                const now = Date.now()
                const diff = now - checkInTime
                if (diff < fiveMin) {
                    setTimeLeft(Math.ceil((fiveMin - diff) / 1000))
                } else {
                    setTimeLeft(0)
                    clearInterval(interval)
                }
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [initialStatus])

    const handleRequest = async () => {
        if (!confirm('출석 체크를 요청하시겠습니까?')) return
        setLoading(true)
        const res = await requestAttendance()
        if (res?.error) alert(res.error)
        else {
            alert('출석 요청이 완료되었습니다. 관리자 승인을 기다려주세요.')
            router.refresh()
        }
        setLoading(false)
    }

    const handleCheckOut = async () => {
        if (!confirm('하원 처리하시겠습니까?')) return
        setLoading(true)
        const res = await checkOutMemberSelf()
        if (res?.error) alert(res.error)
        else {
            alert('하원 처리가 완료되었습니다.')
            router.refresh()
        }
        setLoading(false)
    }

    if (!initialStatus) {
        return (
            <button
                onClick={handleRequest}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.98]"
            >
                {loading ? '요청 중...' : '출석 체크 요청'}
            </button>
        )
    }

    if (initialStatus.status === 'pending') {
        return (
            <div className="w-full py-4 bg-yellow-100 text-yellow-800 rounded-xl font-bold text-lg text-center border border-yellow-200">
                승인 대기 중...
            </div>
        )
    }

    if (initialStatus.status === 'present') {
        if (initialStatus.checked_out_at) {
            return (
                <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-lg text-center border border-gray-200">
                    금일 출석 완료 (하원함)
                </div>
            )
        }

        if (timeLeft > 0) {
            return (
                <button
                    disabled
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg shadow-sm opacity-90 cursor-not-allowed flex flex-col items-center justify-center gap-1"
                >
                    <span>출석 완료</span>
                    <span className="text-xs font-normal opacity-90">{Math.floor(timeLeft / 60)}분 {timeLeft % 60}초 후 하원 가능</span>
                </button>
            )
        }

        return (
            <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.98]"
            >
                {loading ? '처리 중...' : '하원 하기'}
            </button>
        )
    }

    return null
}
