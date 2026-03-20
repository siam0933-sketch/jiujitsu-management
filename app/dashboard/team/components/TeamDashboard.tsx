'use client'

import { useState, useTransition } from 'react'
import { Users, Bell, Clock, ShieldCheck, Star, CheckCircle, XCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { handleJoinRequest, createNotice, createComment, getNoticeComments } from '../actions'

const BELT_KR: Record<string, string> = {
    white: '화이트', blue: '블루', purple: '퍼플', brown: '브라운', black: '블랙'
}

const ROLE_LABEL: Record<string, string> = {
    representative: '대표', admin: '관리자', member: '팀원'
}

type Tab = 'members' | 'notices' | 'requests'

interface Props {
    team: { id: string; name: string; representative_name: string; representative_id: string }
    membership: { role: string; branch_name: string; current_belt: string }
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

    const canWriteNotice = membership.role === 'representative' || membership.role === 'admin'

    const handleRequest = (requestId: string, action: 'accept' | 'reject') => {
        startTransition(async () => {
            const res = await handleJoinRequest(requestId, action)
            if (res.error) setMessage({ type: 'error', text: res.error })
        })
    }

    const handleCreateNotice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        const formData = new FormData(e.currentTarget)
        formData.set('team_id', team.id)
        startTransition(async () => {
            const res = await createNotice(formData)
            if (res.error) setMessage({ type: 'error', text: res.error })
            else { setMessage({ type: 'success', text: '공지사항이 등록되었습니다.' }); (e.target as HTMLFormElement).reset() }
        })
    }

    const tabs = [
        { id: 'members' as Tab, label: '소속관장 리스트', icon: Users },
        { id: 'notices' as Tab, label: '공지사항', icon: Bell },
        ...(isRepresentative ? [{ id: 'requests' as Tab, label: `가입 대기 (${joinRequests.length})`, icon: Clock }] : []),
    ]

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{team.name}</h1>
                            {isRepresentative && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                    <ShieldCheck className="w-3 h-3" /> 대표
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">대표: {team.representative_name} · 소속원 {members.length}명</p>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-xs text-gray-400 mb-0.5">내 지부명</div>
                        <div className="font-medium text-gray-700 dark:text-zinc-300">{membership.branch_name}</div>
                        <div className="text-xs text-gray-400">{BELT_KR[membership.current_belt] || membership.current_belt}</div>
                    </div>
                </div>
            </div>

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
                        <div key={m.id} className="flex items-center p-4 gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                                {m.member_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{m.member_name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.role === 'representative' ? 'bg-yellow-100 text-yellow-700' : m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {ROLE_LABEL[m.role]}
                                    </span>
                                    {m.user_id === currentUserId && (
                                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">나</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{m.branch_name}</div>
                                {m.gym_name && <div className="text-xs text-gray-400">{m.gym_name}</div>}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs font-medium text-gray-500">{BELT_KR[m.current_belt] || m.current_belt}</div>
                                {m.last_promotion_date && (
                                    <div className="text-xs text-gray-400 mt-0.5">{new Date(m.last_promotion_date).toLocaleDateString('ko-KR')}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="p-10 text-center text-sm text-gray-400">소속 관장님이 없습니다.</div>
                    )}
                </div>
            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && (
                <div className="space-y-4">
                    {canWriteNotice && (
                        <form onSubmit={handleCreateNotice} className="bg-white dark:bg-zinc-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5 space-y-3">
                            <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400">✏️ 공지사항 작성</h3>
                            <input name="title" required placeholder="제목" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                            <textarea name="content" required rows={3} placeholder="내용을 입력하세요..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                            <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                {isPending ? '등록 중...' : '공지 올리기'}
                            </button>
                        </form>
                    )}
                    {notices.length > 0 ? notices.map(n => (
                        <NoticeCard key={n.id} notice={n} currentUserId={currentUserId} />
                    )) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-10 text-center text-sm text-gray-400">
                            아직 공지사항이 없습니다.
                        </div>
                    )}
                </div>
            )}

            {/* Join Requests Tab (Representative only) */}
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
                                    <div className="text-xs text-gray-400">{BELT_KR[req.current_belt] || req.current_belt}</div>
                                    <div className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('ko-KR')} 신청</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                <div>📞 {req.phone || '미기재'}</div>
                                <div>🏠 {req.gym_address || '미기재'}</div>
                                {req.gym_name && <div>🥋 도장: {req.gym_name}</div>}
                                <div>📅 최근 승급: {req.last_promotion_date ? new Date(req.last_promotion_date).toLocaleDateString('ko-KR') : '미기재'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRequest(req.id, 'accept')}
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" /> 수락
                                </button>
                                <button
                                    onClick={() => handleRequest(req.id, 'reject')}
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" /> 거절
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Notice Card with expandable comments
function NoticeCard({ notice, currentUserId }: { notice: any; currentUserId: string }) {
    const [expanded, setExpanded] = useState(false)
    const [comments, setComments] = useState<any[] | null>(null)
    const [newComment, setNewComment] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleExpand = async () => {
        if (!expanded && comments === null) {
            const data = await getNoticeComments(notice.id)
            setComments(data)
        }
        setExpanded(v => !v)
    }

    const handleComment = () => {
        if (!newComment.trim()) return
        startTransition(async () => {
            const res = await createComment(notice.id, newComment)
            if (!res.error) {
                const data = await getNoticeComments(notice.id)
                setComments(data)
                setNewComment('')
            }
        })
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <button className="w-full text-left p-5" onClick={handleExpand}>
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">{notice.title}</h3>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800">
                    <div className="px-5 py-4 text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{notice.content}</div>

                    {/* Comments */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 px-5 py-3">
                        <div className="text-xs font-bold text-gray-500 mb-3">댓글 {comments?.length ?? ''}</div>
                        {comments && comments.length > 0 ? comments.map(c => (
                            <div key={c.id} className="flex gap-2 mb-2">
                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                    {c.author_id === currentUserId ? '나' : '팀'}
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-zinc-300">
                                    {c.content}
                                    <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString('ko-KR')}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-xs text-gray-400 mb-3">아직 댓글이 없습니다.</div>
                        )}

                        <div className="flex gap-2 mt-3">
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleComment()}
                                placeholder="댓글을 입력하세요..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button onClick={handleComment} disabled={isPending || !newComment.trim()}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
