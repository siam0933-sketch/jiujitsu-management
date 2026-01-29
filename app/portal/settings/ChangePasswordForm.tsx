'use client'

import { useState } from 'react'
import { changePassword } from './actions'

export default function ChangePasswordForm() {
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setLoading(true)

        if (newPw !== confirmPw) {
            setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
            setLoading(false)
            return
        }

        try {
            const result = await changePassword(currentPw, newPw)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' })
                setCurrentPw('')
                setNewPw('')
                setConfirmPw('')
            }
        } catch (e) {
            setMessage({ type: 'error', text: '알 수 없는 오류가 발생했습니다.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 비밀번호
                </label>
                <input
                    type="password"
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 비밀번호 (6자 이상)
                </label>
                <input
                    type="password"
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 비밀번호 확인
                </label>
                <input
                    type="password"
                    required
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
        </form>
    )
}
