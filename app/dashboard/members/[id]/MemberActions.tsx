'use client'

import { useState } from 'react'
import { updateMemberStartDate, togglePauseStatus } from './actions'

type MemberActionsProps = {
    memberId: string
    startDate: string | null
    joinedAt: string
    isPaused: boolean
}

export default function MemberActions({ memberId, startDate, joinedAt, isPaused }: MemberActionsProps) {
    const [isEditingStart, setIsEditingStart] = useState(false)
    const [currentStartDate, setCurrentStartDate] = useState(startDate || joinedAt?.split('T')[0] || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleStartDateSave = async () => {
        setIsLoading(true)
        const res = await updateMemberStartDate(memberId, currentStartDate)
        if (res.error) {
            alert(res.error)
        } else {
            setIsEditingStart(false)
        }
        setIsLoading(false)
    }

    const handleTogglePause = async () => {
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

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 border-l-4 border-l-indigo-500">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">회원 관리 액션</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">입문일 관리 및 휴관 처리를 할 수 있습니다.</p>
                </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div>
                        <dt className="text-sm font-medium text-gray-500 mb-1">입문일 (수련 시작일)</dt>
                        <dd className="flex items-center gap-2">
                            {isEditingStart ? (
                                <>
                                    <input
                                        type="date"
                                        value={currentStartDate}
                                        onChange={(e) => setCurrentStartDate(e.target.value)}
                                        className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        onClick={handleStartDateSave}
                                        disabled={isLoading}
                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setIsEditingStart(false)}
                                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                                    >
                                        취소
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-gray-900 font-medium">{currentStartDate}</span>
                                    <button
                                        onClick={() => setIsEditingStart(true)}
                                        className="text-gray-400 hover:text-indigo-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </dd>
                        <p className="text-xs text-gray-400 mt-1">* 가입일: {new Date(joinedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Pause Status */}
                    <div>
                        <dt className="text-sm font-medium text-gray-500 mb-1">회원 상태</dt>
                        <dd className="flex items-center gap-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isPaused
                                    ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                    : 'bg-green-50 text-green-700 ring-green-600/20'
                                }`}>
                                {isPaused ? '휴관 중 (Paused)' : '수련 중 (Active)'}
                            </span>

                            <button
                                onClick={handleTogglePause}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded text-sm font-bold shadow-sm transition-colors ${isPaused
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-yellow-500 text-white hover:bg-yellow-400'
                                    }`}
                            >
                                {isPaused ? '▶ 복귀 처리 (Resume)' : '⏸ 휴관 처리 (Pause)'}
                            </button>
                        </dd>
                    </div>
                </div>
            </div>
        </div>
    )
}
