import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
// import MemberActions from './MemberActions' // Deprecated
import PromotionHistory from './PromotionHistory'
import { getPromotionLogs } from './actions'
import { MemberStartDate, MemberPauseController } from '../components/MemberComponents'

export default async function MemberDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Member
    const { data: member } = await supabase
        .from('gym_members')
        .select('*')
        .eq('id', id)
        .single()

    if (!member) {
        notFound()
    }

    // 2. Fetch Pause Status
    const { data: activePause } = await supabase
        .from('gym_membership_pauses')
        .select('id')
        .eq('member_id', id)
        .is('end_date', null)
        .single()

    const isPaused = !!activePause

    // 3. Fetch Promotion Logs
    const promotionLogs = await getPromotionLogs(id)

    const calculateAge = (birthDateString: string | null) => {
        if (!birthDateString) return '-'
        const birthDate = new Date(birthDateString)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear() + 1
        return `${age}세`
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between border-b border-gray-200 pb-6 mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {member.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {member.grade} {member.school} | {member.gender === 'male' ? '남성' : '여성'}
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <button
                        type="button"
                        className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        정보 수정
                    </button>
                </div>
            </div>

            {/* <MemberActions ... /> Removed as per user request (deprecated UI) */}

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Promotion History (New) */}
                    <PromotionHistory memberId={id} initialLogs={promotionLogs} joinedAt={member.joined_at} />

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">신상 정보</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">개인 및 연락처 정보입니다.</p>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">이름</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{member.name}</dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">생년월일 (나이)</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        {member.birth_date} <span className="text-gray-400">({calculateAge(member.birth_date)})</span>
                                    </dd>
                                </div>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">연락처</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{member.phone}</dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">성별</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        {member.gender === 'male' ? '남성' : '여성'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">주소</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{member.address}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">학교 및 보호자</h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">학교 / 학년</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        {member.school} {member.grade}
                                    </dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">보호자 연락처</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{member.guardian_phone}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Right Column: System Info */}
                <div className="space-y-8">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">도장 관리 정보</h3>
                            {/* Pause Controller in Header */}
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                {/* Access Code */}
                                <div className="bg-white px-4 py-5">
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">출결/접속 코드(PIN)</dt>
                                    <dd className="text-2xl font-mono font-bold text-blue-600 tracking-widest text-center py-2 bg-blue-50 rounded-lg border border-blue-100">
                                        {member.access_code}
                                    </dd>
                                </div>

                                {/* Status / Pause */}
                                <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
                                    <dt className="text-xs font-medium text-gray-500 mb-1">회원 상태</dt>
                                    <dd>
                                        <MemberPauseController
                                            memberId={id}
                                            isPaused={isPaused}
                                            paymentEndDate={member.payment_end_date}
                                        />
                                    </dd>
                                </div>

                                {/* Start Date / Joined Date */}
                                <div className="bg-white px-4 py-4 border-t border-gray-200">
                                    <div className="mb-2">
                                        <MemberStartDate memberId={id} startDate={member.start_date || member.joined_at} joinedAt={member.joined_at} />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>가입일:</span>
                                        <span>{new Date(member.joined_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Billing Info */}
                                <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <dt className="text-sm font-medium text-gray-500">수납 청구일</dt>
                                        <dd className="text-sm font-bold text-gray-900">매월 {member.payment_due_day ? `${member.payment_due_day}일` : '-'}</dd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <dt className="text-sm font-medium text-gray-500">회원권 만료일</dt>
                                        <dd className="text-sm font-bold text-red-600">
                                            {member.payment_end_date ? new Date(member.payment_end_date).toLocaleDateString() : '-'}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
