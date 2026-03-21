'use client'

import { useState } from 'react'
import { optimizeStorage } from '../actions_storage'

export default function StorageOptimizer() {
    const [loading, setLoading] = useState(false)

    const handleOptimize = async () => {
        if (!confirm('스토리지 최적화를 시작하시겠습니까?\n작성 중 취소되거나 글이 삭제되어 허공에 남겨진 고립된 사진 파일(찌꺼기)들을 모두 찾아 자동 삭제합니다. (이 작업은 되돌릴 수 없습니다)')) return
        
        setLoading(true)
        const res = await optimizeStorage()
        if (res.error) {
            alert(res.error)
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    return (
        <button 
            onClick={handleOptimize}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="사용되지 않는 사진 파일들 일괄 청소"
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    스토리지 청소 중...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    스토리지 최적화 (찌꺼기 청소)
                </>
            )}
        </button>
    )
}
