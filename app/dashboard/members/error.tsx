'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 m-4">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-red-800">회원 목록을 불러오는 중 문제가 발생했습니다.</h2>
                    <p className="text-sm text-red-600 mt-1 mb-4">
                        {error.message || '네트워크 오류가 발생했거나 서버 응답 시간이 초과되었습니다.'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => reset()}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                            페이지 새로고침
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
