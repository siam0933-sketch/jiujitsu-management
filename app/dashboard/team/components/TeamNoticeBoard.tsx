'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Send } from 'lucide-react'
import { createNotice, createComment, getNoticeComments } from '../actions'
import NoticeEditor from '../../components/NoticeEditor'

interface TeamNoticeBoardProps {
    teamId: string
    notices: any[]
    canWriteNotice: boolean
    currentUserId: string
}

export default function TeamNoticeBoard({ teamId, notices, canWriteNotice, currentUserId }: TeamNoticeBoardProps) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isWriting, setIsWriting] = useState(false)

    const handleCreateNotice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        
        if (!content || content === '<p></p>') {
            setMessage({ type: 'error', text: '내용을 입력해주세요.' })
            return
        }

        const fd = new FormData()
        fd.set('team_id', teamId)
        fd.set('title', title)
        fd.set('content', content)

        startTransition(async () => {
            const res = await createNotice(fd)
            if (res.error) setMessage({ type: 'error', text: res.error })
            else { 
                setMessage({ type: 'success', text: '공지사항 등록 완료!' })
                setTitle('')
                setContent('')
                setIsWriting(false)
            }
        })
    }

    return (
        <div className="space-y-4">
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {canWriteNotice && !isWriting && (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsWriting(true)} 
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5">
                        <span className="text-base leading-none">✏️</span> 공지사항 작성
                    </button>
                </div>
            )}

            {canWriteNotice && isWriting && (
                <form onSubmit={handleCreateNotice} className="bg-white dark:bg-zinc-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <span>✏️</span> 공지사항 작성
                        </h3>
                        <button type="button" onClick={() => setIsWriting(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300">
                            취소
                        </button>
                    </div>
                    <input 
                        required 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요" 
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <NoticeEditor content={content} onChange={setContent} />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isPending || !title.trim() || !content.trim()} 
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isPending ? '등록 중...' : '공지 올리기'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {notices.length > 0 ? notices.map(n => (
                    <NoticeCard key={n.id} notice={n} currentUserId={currentUserId} />
                )) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-10 text-center text-sm text-gray-400">
                        아직 등록된 공지사항이 없습니다.
                    </div>
                )}
            </div>
        </div>
    )
}

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
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden transition-all hover:border-gray-300 dark:hover:border-zinc-600">
            <button className="w-full text-left p-5 flex items-center justify-between" onClick={handleExpand}>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base mb-1">{notice.title}</h3>
                    <div className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
            </button>
            
            {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Notice Content (Rendered HTML) */}
                    <div 
                        className="px-5 py-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-zinc-200"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                    />
                    
                    {/* Comments Section */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20 px-5 py-4">
                        <div className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-1">
                            💬 댓글 <span className="bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{comments?.length ?? 0}</span>
                        </div>
                        
                        <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                            {comments && comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-zinc-400 shrink-0 shadow-sm">
                                        {c.author_id === currentUserId ? '나' : '팀'}
                                    </div>
                                    <div className="flex-1 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                        <div className="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-wrap">{c.content}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            {comments?.length === 0 && (
                                <div className="text-xs text-gray-400 py-2 text-center bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800">
                                    첫 번째 댓글을 남겨보세요.
                                </div>
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex gap-2 relative">
                            <input 
                                value={newComment} 
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleComment();
                                    }
                                }}
                                placeholder="댓글을 입력하세요..."
                                className="flex-1 pl-4 pr-12 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow" 
                            />
                            <button 
                                onClick={handleComment} 
                                disabled={isPending || !newComment.trim()}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-zinc-700 transition-colors"
                            >
                                <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
