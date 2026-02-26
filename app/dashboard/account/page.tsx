'use client'

import { useState, useEffect } from 'react'
import { getAccountInfo, updateAccountInfo, updatePassword } from './actions'
import { User, Lock, Mail, Calendar, Phone, Building2, MapPin, Hash } from 'lucide-react'

type AccountData = {
    email: string
    fullName: string
    phone: string
    createdAt: string
    gymId: string
    gymName: string
    gymPhone: string
    gymAddress: string
    businessNumber: string
}

export default function AccountPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<AccountData | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isPwSubmitting, setIsPwSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const res = await getAccountInfo()
        if (!('error' in res)) {
            setData(res as AccountData)
        }
        setIsLoading(false)
    }

    const handleInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        formData.append('gym_id', data?.gymId || '')
        const res = await updateAccountInfo(formData)
        if (res.error) {
            alert(res.error)
        } else {
            alert('정보가 수정되었습니다.')
            setIsEditing(false)
            loadData()
        }
        setIsSubmitting(false)
    }

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPwSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await updatePassword(formData)
        if (res.error) {
            alert(res.error)
        } else {
            alert('비밀번호가 변경되었습니다.')
            setIsChangingPassword(false)
                ; (e.target as HTMLFormElement).reset()
        }
        setIsPwSubmitting(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    const labelClass = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
    const inputClass = "block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
    const readonlyClass = "block w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-zinc-300 sm:text-sm p-2 cursor-not-allowed"

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    관리자 계정 정보
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">가입 당시 입력한 정보를 확인하고 수정합니다.</p>
            </div>

            {/* 계정/관리자 정보 */}
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        <User className="w-4 h-4" /> 관리자 정보
                    </h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            수정
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleInfoSubmit} className="px-6 py-5 space-y-5">
                        {/* 관리자 정보 */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">관리자</p>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>이메일 (로그인 ID)</label>
                                    <input type="text" value={data?.email} readOnly className={readonlyClass} />
                                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">이메일은 변경할 수 없습니다.</p>
                                </div>
                                <div>
                                    <label className={labelClass}>성함 <span className="text-red-500">*</span></label>
                                    <input name="full_name" defaultValue={data?.fullName} required className={inputClass} placeholder="관장님 성함" />
                                </div>
                                <div>
                                    <label className={labelClass}>휴대폰 번호 <span className="text-red-500">*</span></label>
                                    <input name="phone" defaultValue={data?.phone} required className={inputClass} placeholder="010-0000-0000" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">도장</p>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>도장 이름 <span className="text-red-500">*</span></label>
                                    <input name="gym_name" defaultValue={data?.gymName} required className={inputClass} placeholder="예: 강남 주짓수" />
                                </div>
                                <div>
                                    <label className={labelClass}>사업자 등록번호</label>
                                    <input name="business_registration_number" defaultValue={data?.businessNumber} className={inputClass} placeholder="선택 입력" />
                                </div>
                                <div>
                                    <label className={labelClass}>도장 전화번호</label>
                                    <input name="gym_phone" defaultValue={data?.gymPhone} className={inputClass} placeholder="선택 입력" />
                                </div>
                                <div>
                                    <label className={labelClass}>도장 주소</label>
                                    <input name="gym_address" defaultValue={data?.gymAddress} className={inputClass} placeholder="선택 입력" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-2 text-sm text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors font-semibold"
                            >
                                {isSubmitting ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="px-6 py-5 space-y-5">
                        {/* 관리자 */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">관리자</p>
                            <div className="space-y-3">
                                <InfoRow icon={<Mail className="w-4 h-4" />} label="이메일 (로그인 ID)" value={data?.email} />
                                <InfoRow icon={<User className="w-4 h-4" />} label="성함" value={data?.fullName} />
                                <InfoRow icon={<Phone className="w-4 h-4" />} label="휴대폰 번호" value={data?.phone} />
                                <InfoRow icon={<Calendar className="w-4 h-4" />} label="가입일" value={
                                    data?.createdAt
                                        ? new Date(data.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : undefined
                                } />
                            </div>
                        </div>

                        {/* 도장 */}
                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">도장</p>
                            <div className="space-y-3">
                                <InfoRow icon={<Building2 className="w-4 h-4" />} label="도장 이름" value={data?.gymName} />
                                <InfoRow icon={<Hash className="w-4 h-4" />} label="사업자 등록번호" value={data?.businessNumber} />
                                <InfoRow icon={<Phone className="w-4 h-4" />} label="도장 전화번호" value={data?.gymPhone} />
                                <InfoRow icon={<MapPin className="w-4 h-4" />} label="도장 주소" value={data?.gymAddress} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> 비밀번호 변경
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
                                <label className={labelClass}>새 비밀번호</label>
                                <input type="password" name="new_password" required minLength={6} placeholder="최소 6자 이상" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>새 비밀번호 확인</label>
                                <input type="password" name="confirm_password" required minLength={6} placeholder="비밀번호 재입력" className={inputClass} />
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
                                    disabled={isPwSubmitting}
                                    className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    {isPwSubmitting ? '변경 중...' : '비밀번호 변경'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">보안을 위해 주기적으로 비밀번호를 변경해 주세요.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{value || '-'}</p>
            </div>
        </div>
    )
}
