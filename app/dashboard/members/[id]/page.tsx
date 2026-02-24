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
            <div className="md:flex md:items-center md:justify-between border-b border-gray-200 dark:border-zinc-800 pb-6 mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-zinc-100 sm:truncate sm:text-3xl sm:tracking-tight">
                        {member.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
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
                    <PromotionHistory
                        memberId={id}
                        memberName={member.name}
                        memberBelt={member.belt}
                        initialLogs={promotionLogs}
                        joinedAt={member.joined_at}
                        startDate={member.start_date}
                    />

                    <div className="bg-white dark:bg-zinc-900 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-100">신상 정보</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-zinc-400">개인 및 연락처 정보입니다.</p>
                        </div>
                        <div className="border-t border-gray-200 dark:border-zinc-800">
                            <dl>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">이름</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">{member.name}</dd>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">생년월일 (나이)</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                                        {member.birth_date} <span className="text-gray-400 dark:text-zinc-500">({calculateAge(member.birth_date)})</span>
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">연락처</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">{member.phone}</dd>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">성별</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                                        {member.gender === 'male' ? '남성' : '여성'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">주소</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">{member.address}</dd>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">시스템 ID</dt>
                                    <dd className="mt-1 text-xs font-mono text-gray-500 dark:text-zinc-400 sm:col-span-2 sm:mt-0 flex items-center">
                                        {member.id}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-100">학교 및 보호자</h3>
                        </div>
                        <div className="border-t border-gray-200 dark:border-zinc-800">
                            <dl>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">학교 / 학년</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                                        {member.school} {member.grade}
                                    </dd>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">보호자 연락처</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">{member.guardian_phone}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Right Column: System Info */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-zinc-900 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex justify-between items-center">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-zinc-100">도장 관리 정보</h3>
                            {/* Pause Controller in Header */}
                        </div>
                        <div className="border-t border-gray-200 dark:border-zinc-800">
                            <dl>
                                {/* Attendance Number */}
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5">
                                    <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">출석번호</dt>
                                    <dd className="text-2xl font-mono font-bold text-blue-600 tracking-widest text-center py-2 bg-blue-50 rounded-lg border border-blue-100">
                                        {member.access_code}
                                    </dd>
                                </div>

                                {/* Login Password */}
                                <div className="bg-white dark:bg-zinc-900 px-4 py-5 border-t border-gray-100 dark:border-zinc-800/50">
                                    <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">로그인 비밀번호</dt>
                                    <dd className="text-xl font-mono font-bold text-gray-700 dark:text-zinc-300 tracking-widest text-center py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-800">
                                        {member.login_password || '미설정'}
                                    </dd>
                                </div>



                                {/* Status / Pause */}
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-4 border-t border-gray-200 dark:border-zinc-800">
                                    <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">회원 상태</dt>
                                    <dd>
                                        <MemberPauseController
                                            memberId={id}
                                            isPaused={isPaused}
                                            paymentEndDate={member.payment_end_date}
                                        />
                                    </dd>
                                </div>

                                {/* Start Date / Joined Date */}
                                <div className="bg-white dark:bg-zinc-900 px-4 py-4 border-t border-gray-200 dark:border-zinc-800">
                                    <div className="mb-2">
                                        <MemberStartDate memberId={id} startDate={member.start_date || member.joined_at} joinedAt={member.joined_at} />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 dark:text-zinc-500">
                                        <span>가입일:</span>
                                        <span>{new Date(member.joined_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Billing Info */}
                                <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-4 border-t border-gray-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">수납 청구일</dt>
                                        <dd className="text-sm font-bold text-gray-900 dark:text-zinc-100">매월 {member.payment_due_day ? `${member.payment_due_day}일` : '-'}</dd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400">회원권 만료일</dt>
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
