'use client'

import { useState, useEffect } from 'react'
import { getAccountInfo, updatePassword } from './actions'
import { User, Lock, Mail, Calendar } from 'lucide-react'

export default function AccountPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [createdAt, setCreatedAt] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const data = await getAccountInfo()
        if (!('error' in data)) {
            setEmail(data.email)
            setFullName(data.fullName)
            setCreatedAt(data.createdAt)
        }
        setIsLoading(false)
    }

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await updatePassword(formData)
        if (res.error) {
            alert(res.error)
        } else {
            alert('비밀번호가 변경되었습니다.')
            setIsChangingPassword(false)
                ; (e.target as HTMLFormElement).reset()
        }
        setIsSubmitting(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    관리자 계정 정보
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">로그인 계정 정보를 확인하고 비밀번호를 변경합니다.</p>
            </div>

            {/* 계정 정보 카드 */}
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800 mb-6">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">기본 정보</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <User className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">이름 (관리자)</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{fullName || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <Mail className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">이메일 (로그인 ID)</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{email || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">가입일</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                {createdAt
                                    ? new Date(createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 비밀번호 변경 카드 */}
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        비밀번호 변경
                    </h2>
                    {!isChangingPassword && (
                        <button
                            onClick={() => setIsChangingPassword(true)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            변경하기
                        </button>
                    )}
                </div>
                <div className="px-6 py-5">
                    {isChangingPassword ? (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                    새 비밀번호
                                </label>
                                <input
                                    type="password"
                                    name="new_password"
                                    required
                                    minLength={6}
                                    placeholder="최소 6자 이상"
                                    className="block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                    새 비밀번호 확인
                                </label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    required
                                    minLength={6}
                                    placeholder="비밀번호 재입력"
                                    className="block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsChangingPassword(false)}
                                    className="flex-1 py-2 text-sm text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            보안을 위해 주기적으로 비밀번호를 변경해 주세요.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
