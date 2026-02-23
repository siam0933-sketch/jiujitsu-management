'use client'

import { useState } from 'react'
import { changePassword } from './actions'
import { ChevronDown } from 'lucide-react'
import { PORTAL_STYLES } from '../styles'

export default function ChangePasswordForm() {
    const [isOpen, setIsOpen] = useState(false)
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
        <div className={`${PORTAL_STYLES.CARD} mb-6 overflow-hidden`}>
            <button
                type="button"
                className={`w-full flex justify-between items-center transition-colors ${PORTAL_STYLES.CARD_PADDING}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <h2 className={PORTAL_STYLES.HEADING_MD}>비밀번호 변경</h2>
                <div className={`p-1 bg-gray-50 rounded-full transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-gray-500" />
                </div>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
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
                            className="w-full mt-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
