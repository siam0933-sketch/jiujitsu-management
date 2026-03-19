'use client'

import { useState } from 'react'
import { resetMemberPassword } from '../actions'

export default function ResetPasswordButton({ memberId }: { memberId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleReset = async () => {
        if (!confirm('정말 이 회원의 비밀번호를 초기화하시겠습니까?\n\n초기화 시 휴대전화 뒷자리 4자리로 설정되며, 회원이 다음 로그인 시 새 비밀번호를 설정하게 됩니다.')) {
            return
        }

        setIsLoading(true)
        try {
            const result = await resetMemberPassword(memberId)
            if (result.error) {
                alert(result.error)
            } else {
                alert(`비밀번호가 초기화되었습니다.\n초기화된 비밀번호: ${result.password}`)
            }
        } catch (e: any) {
            alert('오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors font-medium disabled:opacity-50"
        >
            {isLoading ? '처리 중...' : '비밀번호 초기화'}
        </button>
    )
}
