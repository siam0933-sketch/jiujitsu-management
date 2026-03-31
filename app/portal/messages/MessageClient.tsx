'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import type { GymMessage } from './actions'
import { sendMemberMessage } from './actions'

interface MessageClientProps {
    initialMessages: GymMessage[]
    gymName: string
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

export default function MessageClient({ initialMessages, gymName }: MessageClientProps) {
    const [messages, setMessages] = useState<GymMessage[]>(initialMessages)
    const [body, setBody] = useState('')
    const [isPending, startTransition] = useTransition()
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    }, [])

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
            sender: 'member',
            body: trimmed,
            created_at: new Date().toISOString(),
            is_read_by_admin: false,
            is_read_by_member: true,
        }
        setMessages(prev => [...prev, optimistic])
        setBody('')
        startTransition(async () => {
            const res = await sendMemberMessage(trimmed)
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
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-20">
                        <MessageCircle size={48} className="opacity-20" />
                        <p className="text-sm font-medium">{gymName}에 첫 쪽지를 보내보세요</p>
                        <p className="text-xs opacity-70">관장님께 궁금한 것을 물어보세요!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'member' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'admin' && (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mr-2 mt-auto mb-5">
                                    <MessageCircle size={14} />
                                </div>
                            )}
                            <div className={`max-w-[75%] flex flex-col gap-0.5 ${msg.sender === 'member' ? 'items-end' : 'items-start'}`}>
                                {msg.sender === 'admin' && (
                                    <span className="text-[10px] text-gray-500 font-medium px-1">{gymName}</span>
                                )}
                                <div className={`
                                    px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
                                    ${msg.sender === 'member'
                                        ? 'bg-indigo-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                    }
                                `}>
                                    {msg.body}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1">
                                    {formatTime(msg.created_at)}
                                    {msg.sender === 'member' && msg.is_read_by_admin && (
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
            <div className="shrink-0 border-t border-gray-100 p-3 bg-white">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`${gymName}에 쪽지 보내기...`}
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!body.trim() || isPending}
                        className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">Enter: 전송 &nbsp;·&nbsp; Shift+Enter: 줄바꿈</p>
            </div>
        </div>
    )
}
