'use client'

import { useState, useEffect } from 'react'
import { getGymSettings, updateGymSettings } from './actions'

export default function GymSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [gymId, setGymId] = useState('')
    const [gymName, setGymName] = useState('')
    const [adminName, setAdminName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const data = await getGymSettings()
        if ('error' in data) {
            // Handle error if needed, for now just ignore
        } else {
            setGymId(data.gymId || '')
            setGymName(data.gymName)
            setAdminName(data.adminName)
        }
        setIsLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)

        // Append gym_id manually since it's state
        formData.append('gym_id', gymId)

        const res = await updateGymSettings(formData)
        if (res.error) {
            alert(res.error)
        } else {
            alert('정보가 수정되었습니다.')
            // No need to reload data as inputs are controlled/managed locally or just stay as is
            // But good to re-fetch to be sure
            loadData()
        }
        setIsSubmitting(false)
    }

    if (isLoading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">도장 및 관리자 정보 설정</h1>

            <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    기본 정보 수정
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">도장 이름</label>
                        <input
                            name="gym_name"
                            value={gymName}
                            onChange={e => setGymName(e.target.value)}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <p className="mt-1 text-xs text-gray-500">회원들에게 표시되는 도장 이름입니다.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">관리자 이름 (대표자)</label>
                        <input
                            name="admin_name"
                            value={adminName}
                            onChange={e => setAdminName(e.target.value)}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <p className="mt-1 text-xs text-gray-500">시스템 상에 표시되는 관리자 이름입니다.</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? '저장 중...' : '저장하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
