'use client'

import { useState, useTransition } from 'react'
import { Users, Bell, Clock, ShieldCheck, Settings, ChevronDown, ChevronUp, LogOut, Trash2, Crown, Check, X } from 'lucide-react'
import { handleJoinRequest, leaveTeam, deleteTeam, delegateLeadership, updateMemberBelt, updateMemberRole } from '../actions'
import TeamNoticeBoard from './TeamNoticeBoard'

const BELT_KR: Record<string, string> = {
    white: '화이트', blue: '블루', purple: '퍼플', brown: '브라운', black: '블랙'
}
const BELT_COLOR: Record<string, string> = {
    white: 'bg-gray-100 text-gray-700', blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700', brown: 'bg-amber-100 text-amber-800', black: 'bg-gray-800 text-gray-100'
}
const ROLE_LABEL: Record<string, string> = { representative: '대표', admin: '공지권한', member: '팀원' }

type Tab = 'members' | 'notices' | 'requests'

interface Props {
    team: { id: string; name: string; representative_name: string; representative_id: string }
    membership: { role: string; branch_name: string; current_belt: string; stripe?: number }
    members: any[]
    notices: any[]
    joinRequests: any[]
    isRepresentative: boolean
    currentUserId: string
}

export default function TeamDashboard({ team, membership, members, notices, joinRequests, isRepresentative, currentUserId }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('members')
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [confirmAction, setConfirmAction] = useState<'delete' | 'leave' | null>(null)
    const [delegateTarget, setDelegateTarget] = useState<string>('')

    const canWriteNotice = membership.role === 'representative' || membership.role === 'admin'

    const setError = (text: string) => setMessage({ type: 'error', text })
    const setSuccess = (text: string) => setMessage({ type: 'success', text })

    const doLeave = () => {
        startTransition(async () => {
            const res = await leaveTeam()
            if (res.error) { setError(res.error); setConfirmAction(null) }
            else { setSuccess('팀에서 탈퇴했습니다.'); setTimeout(() => window.location.reload(), 1000) }
        })
    }

    const doDelete = () => {
        startTransition(async () => {
            const res = await deleteTeam()
            if (res.error) { setError(res.error); setConfirmAction(null) }
            else { setSuccess('팀이 삭제되었습니다.'); setTimeout(() => window.location.reload(), 1000) }
        })
    }

    const doDelegate = () => {
        if (!delegateTarget) { setError('위임할 팀원을 선택해주세요.'); return }
        startTransition(async () => {
            const res = await delegateLeadership(delegateTarget)
            if (res.error) setError(res.error)
            else { setSuccess('대표 위임 완료!'); setShowSettings(false); setTimeout(() => window.location.reload(), 1200) }
        })
    }

    const handleRequest = (reqId: string, action: 'accept' | 'reject') => {
        startTransition(async () => {
            const res = await handleJoinRequest(reqId, action)
            if (res.error) setError(res.error)
        })
    }


    const tabs = [
        { id: 'members' as Tab, label: '소속 관장', icon: Users },
        { id: 'notices' as Tab, label: '공지사항', icon: Bell },
        ...(isRepresentative ? [{ id: 'requests' as Tab, label: `가입 대기 (${joinRequests.length})`, icon: Clock }] : []),
    ]

    const otherMembers = members.filter(m => m.user_id !== currentUserId)

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{team.name}</h1>
                            {isRepresentative && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    <ShieldCheck className="w-3 h-3" /> 대표
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">대표: {team.representative_name} · 총 {members.length}명</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                            <div className="text-xs text-gray-400 mb-0.5">내 지부</div>
                            <div className="font-medium text-gray-700 dark:text-zinc-300">{membership.branch_name}</div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${BELT_COLOR[membership.current_belt] || 'bg-gray-100'}`}>
                                    {BELT_KR[membership.current_belt] || membership.current_belt}
                                </span>
                                {(membership.stripe ?? 0) > 0 && (
                                    <span className="text-xs text-yellow-600 font-bold">{'|'.repeat(membership.stripe ?? 0)}</span>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowSettings(v => !v)}
                                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                            {showSettings && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 z-20 w-56 overflow-hidden">
                                    <div className="p-2 space-y-1">
                                        {isRepresentative && otherMembers.length > 0 && (
                                            <div className="p-2">
                                                <div className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> 대표 위임</div>
                                                <select value={delegateTarget} onChange={e => setDelegateTarget(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg dark:bg-zinc-900 dark:text-zinc-100 mb-1.5">
                                                    <option value="">팀원 선택</option>
                                                    {otherMembers.map(m => (
                                                        <option key={m.user_id} value={m.user_id}>{m.member_name} ({m.branch_name})</option>
                                                    ))}
                                                </select>
                                                <button onClick={doDelegate} disabled={isPending || !delegateTarget}
                                                    className="w-full text-xs py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 font-bold">
                                                    위임하기
                                                </button>
                                            </div>
                                        )}
                                        <button onClick={() => { setConfirmAction('leave'); setShowSettings(false) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg">
                                            <LogOut className="w-4 h-4" /> 팀 탈퇴
                                        </button>
                                        {isRepresentative && (
                                            <button onClick={() => { setConfirmAction('delete'); setShowSettings(false) }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                <Trash2 className="w-4 h-4" /> 팀 삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 mb-2">
                            {confirmAction === 'leave' ? '팀 탈퇴' : '팀 삭제'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {confirmAction === 'leave'
                                ? '정말 팀에서 탈퇴하시겠습니까? 탈퇴 후 재가입하려면 대표의 승인이 필요합니다.'
                                : `'${team.name}' 팀을 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmAction(null)}
                                className="flex-1 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                                취소
                            </button>
                            <button disabled={isPending}
                                onClick={confirmAction === 'leave' ? doLeave : doDelete}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-800'}`}>
                                {isPending ? '처리 중...' : confirmAction === 'leave' ? '탈퇴하기' : '삭제하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6 bg-white dark:bg-zinc-900 rounded-t-xl overflow-hidden">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
                    {members.map(m => (
                        <MemberCard key={m.id} member={m} isRepresentative={isRepresentative} currentUserId={currentUserId}
                            onRoleChange={isRepresentative ? async (newRole) => {
                                const res = await updateMemberRole(m.id, newRole)
                                if (res.error) setError(res.error)
                            } : undefined}
                        />
                    ))}
                    {members.length === 0 && <div className="p-10 text-center text-sm text-gray-400">소속 관장님이 없습니다.</div>}
                </div>
            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && (
                <TeamNoticeBoard 
                    teamId={team.id}
                    notices={notices}
                    canWriteNotice={canWriteNotice}
                    currentUserId={currentUserId}
                />
            )}

            {/* Join Requests Tab */}
            {activeTab === 'requests' && isRepresentative && (
                <div className="space-y-4">
                    {joinRequests.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-10 text-center text-sm text-gray-400">
                            현재 대기 중인 가입 신청이 없습니다.
                        </div>
                    ) : joinRequests.map((req: any) => (
                        <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-zinc-100">{req.member_name}</div>
                                    <div className="text-sm text-gray-500 mt-0.5">지부명: <span className="font-medium text-gray-700 dark:text-zinc-300">{req.branch_name}</span></div>
                                </div>
                                <div className="text-right text-sm shrink-0">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${BELT_COLOR[req.current_belt] || 'bg-gray-100'}`}>{BELT_KR[req.current_belt] || req.current_belt}</span>
                                    {(req.stripe ?? 0) > 0 && <span className="ml-1 text-xs text-yellow-600 font-bold">{'|'.repeat(req.stripe)}</span>}
                                    <div className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString('ko-KR')} 신청</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                <div>📞 {req.phone || '미기재'}</div>
                                <div>🏠 {req.gym_address || '미기재'}</div>
                                {req.gym_name && <div>🥋 도장: {req.gym_name}</div>}
                                <div>📅 최근 승급: {req.last_promotion_date ? new Date(req.last_promotion_date).toLocaleDateString('ko-KR') : '미기재'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleRequest(req.id, 'accept')} disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                                    ✓ 수락
                                </button>
                                <button onClick={() => handleRequest(req.id, 'reject')} disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 disabled:opacity-50">
                                    ✕ 거절
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// MemberCard with expandable details, phone/stripe defaults, and promote button
function MemberCard({ member, isRepresentative, currentUserId, onRoleChange }: {
    member: any
    isRepresentative: boolean
    currentUserId: string
    onRoleChange?: (role: 'admin' | 'member') => Promise<void>
}) {
    const [expanded, setExpanded] = useState(false)
    const [promoting, setPromoting] = useState(false)
    const [belt, setBelt] = useState(member.current_belt)
    const [stripe, setStripe] = useState(member.stripe ?? 0)
    const [isPending, startTransition] = useTransition()

    const saveBelt = () => {
        startTransition(async () => {
            await updateMemberBelt(member.id, belt, stripe)
            setPromoting(false)
        })
    }

    const isMe = member.user_id === currentUserId
    const canManage = isRepresentative && !isMe && member.role !== 'representative'
    const stripeVal = member.stripe ?? 0

    return (
        <div className="border-b border-gray-100 dark:border-zinc-800 last:border-0">
            {/* Main Row */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => { setExpanded(v => !v); setPromoting(false) }}
            >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                    {member.member_name?.charAt(0) || '?'}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{member.member_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${member.role === 'representative' ? 'bg-yellow-100 text-yellow-700' : member.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-400'}`}>
                            {ROLE_LABEL[member.role]}
                        </span>
                        {isMe && <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">나</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 truncate">{member.branch_name}</span>
                        {member.phone && (
                            <span className="text-xs text-gray-400">· 📞 {member.phone}</span>
                        )}
                    </div>
                </div>

                {/* Belt + Stripe badge */}
                <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BELT_COLOR[member.current_belt] || 'bg-gray-100 text-gray-700'}`}>
                        {BELT_KR[member.current_belt] || member.current_belt}
                    </span>
                    {stripeVal > 0 && (
                        <span className="text-xs font-black text-yellow-500 tracking-tighter">{'|'.repeat(stripeVal)}</span>
                    )}
                </div>

                {/* More button */}
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setExpanded(v => !v); setPromoting(false) }}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded Detail Panel */}
            {expanded && (
                <div className="px-4 pb-4 pt-0 bg-gray-50 dark:bg-zinc-800/40 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                        {member.gym_name && (
                            <div className="flex gap-2">
                                <span className="text-gray-400 text-xs w-16 shrink-0">도장이름</span>
                                <span className="text-gray-700 dark:text-zinc-300 text-xs font-medium">{member.gym_name}</span>
                            </div>
                        )}
                        {member.gym_address && (
                            <div className="flex gap-2">
                                <span className="text-gray-400 text-xs w-16 shrink-0">주소</span>
                                <span className="text-gray-700 dark:text-zinc-300 text-xs font-medium">{member.gym_address}</span>
                            </div>
                        )}
                        {member.phone && (
                            <div className="flex gap-2">
                                <span className="text-gray-400 text-xs w-16 shrink-0">전화번호</span>
                                <span className="text-gray-700 dark:text-zinc-300 text-xs font-medium">{member.phone}</span>
                            </div>
                        )}
                        {member.last_promotion_date && (
                            <div className="flex gap-2">
                                <span className="text-gray-400 text-xs w-16 shrink-0">최근 승급</span>
                                <span className="text-gray-700 dark:text-zinc-300 text-xs font-medium">{new Date(member.last_promotion_date).toLocaleDateString('ko-KR')}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <span className="text-gray-400 text-xs w-16 shrink-0">벨트/그랄</span>
                            <span className="text-gray-700 dark:text-zinc-300 text-xs font-medium">
                                {BELT_KR[member.current_belt] || member.current_belt} / {stripeVal}그랄
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {/* Promote button (representative only, not self, not other representative) */}
                        {canManage && !promoting && (
                            <button
                                onClick={e => { e.stopPropagation(); setPromoting(true) }}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-emerald-300 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
                            >
                                <Crown className="w-3.5 h-3.5" /> 승급
                            </button>
                        )}

                        {/* Notice permission toggle */}
                        {canManage && onRoleChange && !promoting && (
                            <button
                                onClick={e => { e.stopPropagation(); onRoleChange(member.role === 'admin' ? 'member' : 'admin') }}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shadow-sm ${member.role === 'admin' ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-500 hover:border-blue-300 hover:text-blue-500'}`}
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {member.role === 'admin' ? '공지권한 해제' : '공지권한 부여'}
                            </button>
                        )}
                    </div>

                    {/* Belt/Stripe Edit Form */}
                    {promoting && (
                        <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2.5">🥋 승급 처리 — {member.member_name}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <select value={belt} onChange={e => setBelt(e.target.value)}
                                    className="text-xs px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-400 outline-none">
                                    <option value="white">화이트</option>
                                    <option value="blue">블루</option>
                                    <option value="purple">퍼플</option>
                                    <option value="brown">브라운</option>
                                    <option value="black">블랙</option>
                                </select>
                                <select value={stripe} onChange={e => setStripe(Number(e.target.value))}
                                    className="text-xs px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-400 outline-none">
                                    <option value={0}>0그랄</option>
                                    <option value={1}>1그랄</option>
                                    <option value={2}>2그랄</option>
                                    <option value={3}>3그랄</option>
                                    <option value={4}>4그랄</option>
                                </select>
                                <button onClick={saveBelt} disabled={isPending}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                                    <Check className="w-3.5 h-3.5" /> 저장
                                </button>
                                <button onClick={() => { setPromoting(false); setBelt(member.current_belt); setStripe(member.stripe ?? 0) }}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg hover:bg-gray-200 transition-colors">
                                    <X className="w-3.5 h-3.5" /> 취소
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
