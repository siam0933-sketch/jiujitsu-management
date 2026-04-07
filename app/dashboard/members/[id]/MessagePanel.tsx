'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { getMessages, sendAdminMessage, GymMessage } from '../../messages/actions'

interface MessagePanelProps {
    memberId: string
    memberName: string
}

function formatTime(isoString: string) {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function MessagePanel({ memberId, memberName }: MessagePanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<GymMessage[]>([])
    const [body, setBody] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(false)
    const [unread, setUnread] = useState(0)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const loadMessages = async () => {
        setIsLoading(true)
        const data = await getMessages(memberId)
        setMessages(data)
        setUnread(0)
        setIsLoading(false)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }

    useEffect(() => {
        // Load unread count on mount without opening panel
        ;(async () => {
            const { getUnreadCountForMember } = await import('../../messages/actions')
            const count = await getUnreadCountForMember(memberId)
            setUnread(count)
        })()
    }, [memberId])

    useEffect(() => {
        if (isOpen) {
            loadMessages()
            inputRef.current?.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSend = () => {
        const trimmed = body.trim()
        if (!trimmed || isPending) return
        const optimistic: GymMessage = {
            id: `temp-${Date.now()}`,
            sender: 'admin',
            body: trimmed,
            created_at: new Date().toISOString(),
            is_read_by_admin: true,
            is_read_by_member: false,
        }
        setMessages(prev => [...prev, optimistic])
        setBody('')
        startTransition(async () => {
            const res = await sendAdminMessage(memberId, trimmed)
            if (res?.error) {
                alert(res.error)
                setMessages(prev => prev.filter(m => m.id !== optimistic.id))
            }
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                title="쪽지 보내기"
            >
                <MessageCircle size={16} />
                쪽지
                {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex" onClick={() => setIsOpen(false)}>
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/40 backdrop-blur-sm" />

                    {/* Panel */}
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-indigo-600 text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageCircle size={18} />
                                <span className="font-bold">{memberName}님과의 쪽지</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 rounded-full p-1 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-zinc-950">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-zinc-500">
                                    <MessageCircle size={40} className="opacity-30" />
                                    <p className="text-sm">아직 쪽지가 없습니다.</p>
                                    <p className="text-xs">첫 번째 메시지를 보내보세요!</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                            <div className={`
                                                px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
                                                ${msg.sender === 'admin'
                                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                                    : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-bl-sm'
                                                }
                                            `}>
                                                {msg.body}
                                            </div>
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 px-1">
                                                {formatTime(msg.created_at)}
                                                {msg.sender === 'admin' && msg.is_read_by_member && (
                                                    <span className="ml-1 text-indigo-400">읽음</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="shrink-0 border-t border-gray-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    ref={inputRef}
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
                                    rows={2}
                                    className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!body.trim() || isPending}
                                    className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                                >
                                    {isPending ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
