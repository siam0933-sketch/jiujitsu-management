'use client'

import { useState, useEffect } from 'react'
import { getGymSettings, updateGymSettings } from './actions'
import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function GymSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [gymId, setGymId] = useState('')
    const [gymName, setGymName] = useState('')
    const [adminName, setAdminName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [portalUrl, setPortalUrl] = useState('')
    const [invitationUrl, setInvitationUrl] = useState('')

    useEffect(() => {
        loadData()
        setPortalUrl(`${window.location.origin}/portal/login`)
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
            if (data.invitationCode) {
                setInvitationUrl(`${window.location.origin}/portal/signup?code=${data.invitationCode}`)
            }
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-8">도장 및 관리자 정보 설정</h1>

            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 border border-gray-200 dark:border-zinc-800 mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    기본 정보 수정
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">도장 이름</label>
                        <input
                            name="gym_name"
                            value={gymName}
                            onChange={e => setGymName(e.target.value)}
                            required
                            className="block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-transparent placeholder:text-gray-400 dark:text-zinc-500 dark:placeholder:text-zinc-500 focus:ring-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 appearance-none"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">회원들에게 표시되는 도장 이름입니다.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">관리자 이름 (대표자)</label>
                        <input
                            name="admin_name"
                            value={adminName}
                            onChange={e => setAdminName(e.target.value)}
                            required
                            className="block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-transparent placeholder:text-gray-400 dark:text-zinc-500 dark:placeholder:text-zinc-500 focus:ring-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 appearance-none"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">시스템 상에 표시되는 관리자 이름입니다.</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50 flex justify-end">
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

            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gray-900 dark:text-zinc-100" />
                    회원 전용 포탈 접속 QR코드
                </h2>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Portal Login QR */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800/50 rounded-xl shadow-sm">
                            {portalUrl && <QRCodeSVG value={portalUrl} size={150} />}
                        </div>
                        <div className="text-center w-full max-w-[250px]">
                            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">기존 회원 로그인 URL</label>
                            <input
                                type="text"
                                value={portalUrl}
                                readOnly
                                className="block w-full text-center rounded-md border-gray-300 dark:border-zinc-700 shadow-sm bg-gray-50 dark:bg-zinc-800 sm:text-xs p-2 mb-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                                기존 회원이 출석체크/단증을 확인할 때 사용하는 로그인 주소입니다.
                            </p>
                        </div>
                    </div>

                    {/* New Member Invitation Link */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-zinc-800 pt-8 md:pt-0 md:pl-8">
                        <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-blue-100 dark:border-blue-900/30 rounded-xl shadow-sm">
                            {invitationUrl && <QRCodeSVG value={invitationUrl} size={150} fgColor="#2563eb" />}
                        </div>
                        <div className="text-center w-full max-w-[250px]">
                            <label className="block text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">신규 회원 가입 초대 링크</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={invitationUrl}
                                    readOnly
                                    className="block w-full text-center rounded-md border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 shadow-sm bg-blue-50/50 dark:bg-blue-900/10 sm:text-xs p-2"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(invitationUrl)
                                        alert('초대 링크가 복사되었습니다.')
                                    }}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                    복사
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                                신규 회원에게 이 링크를 보내면, 회원이 직접 스마트폰으로 체육관에 가입할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 border border-gray-200 dark:border-zinc-800 mt-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    출석 키오스크 단말기
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                    도장 입구에 거치용 공용 PC 또는 태블릿을 설치하여, 회원 본인이 직접 뒷번호 4자리를 입력하고 출석체크할 수 있도록 돕는 전체화면 전용 모드입니다.
                </p>
                <div className="flex justify-start">
                    <a
                        href="/dashboard/attendance/kiosk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-semibold text-sm"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        키오스크 모드 실행하기 (새 창)
                    </a>
                </div>
            </div>
        </div>
    )
}
