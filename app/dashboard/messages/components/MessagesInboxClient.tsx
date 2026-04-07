'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { InboxConversation, getMessages, sendAdminMessage, GymMessage } from '../actions'
import { MessageCircle, Send, Search, User, Users } from 'lucide-react'
import Link from 'next/link'

function formatTime(isoString: string) {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function MessagesInboxClient({ initialConversations }: { initialConversations: InboxConversation[] }) {
    const [conversations, setConversations] = useState(initialConversations)
    const [selectedConvo, setSelectedConvo] = useState<InboxConversation | null>(null)
    const [messages, setMessages] = useState<GymMessage[]>([])
    const [body, setBody] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Mobile view handling
    const [isMobileListOpen, setIsMobileListOpen] = useState(true)

    useEffect(() => {
        if (selectedConvo) {
            loadMessages(selectedConvo.memberId)
            setIsMobileListOpen(false)
        }
    }, [selectedConvo])

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' })
        }
    }, [messages])

    const loadMessages = async (memberId: string) => {
        setIsLoadingMsgs(true)
        const data = await getMessages(memberId)
        setMessages(data)
        setIsLoadingMsgs(false)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        
        // Clear unread count in Sidebar/State
        setConversations(prev => prev.map(c => 
            c.memberId === memberId ? { ...c, unreadCount: 0 } : c
        ))
    }

    const handleSend = () => {
        const trimmed = body.trim()
        if (!trimmed || isPending || !selectedConvo) return
        
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
        
        // Update conversation list optimistic
        setConversations(prev => {
            const next = [...prev]
            const idx = next.findIndex(c => c.memberId === selectedConvo.memberId)
            if (idx > -1) {
                const updated = { ...next[idx], lastMessageBody: trimmed, lastMessageDate: optimistic.created_at }
                next.splice(idx, 1)
                next.unshift(updated) // move to top
            }
            return next
        })

        startTransition(async () => {
            const res = await sendAdminMessage(selectedConvo.memberId, trimmed)
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

    const filteredConvos = conversations.filter(c => 
        c.memberName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
            
            {/* Left Sidebar: Conversations List */}
            <div className={`
                ${isMobileListOpen ? 'flex' : 'hidden'} 
                md:flex flex-col w-full md:w-80 border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 shrink-0
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-3 flex items-center justify-between">
                        <span>전체 쪽지함</span>
                        <Link href="/dashboard/members" className="text-xs font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition inline-flex items-center gap-1 border border-indigo-100 dark:border-indigo-800/50">
                            <Users size={12} />
                            새 쪽지 보내기
                        </Link>
                    </h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="회원 이름 검색..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {filteredConvos.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-zinc-400 text-sm px-4">
                            <MessageCircle className="mx-auto mb-3 opacity-20" size={32} />
                            아직 주고받은 쪽지가 없습니다.<br/>회원 관리 메뉴에서 회원을 선택해 첫 쪽지를 보내보세요.
                        </div>
                    ) : (
                        filteredConvos.map(convo => (
                            <button
                                key={convo.memberId}
                                onClick={() => setSelectedConvo(convo)}
                                className={`w-full text-left p-4 border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition flex items-start gap-3
                                    ${selectedConvo?.memberId === convo.memberId ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${convo.unreadCount > 0 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                                    <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className={`font-bold truncate pr-2 ${convo.unreadCount > 0 ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'}`}>{convo.memberName}</span>
                                        <span className={`text-[11px] shrink-0 ${convo.unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-400'}`}>{formatTime(convo.lastMessageDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-gray-900 dark:text-zinc-200 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>{convo.lastMessageBody}</p>
                                        {convo.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
                                                {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Chat Thread */}
            <div className={`
                ${!isMobileListOpen ? 'flex' : 'hidden'} 
                md:flex flex-col flex-1 bg-white dark:bg-zinc-950 min-w-0
            `}>
                {selectedConvo ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsMobileListOpen(true)}
                                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <User size={18} />
                                </div>
                                <span className="font-bold text-lg text-gray-900 dark:text-zinc-100">{selectedConvo.memberName}</span>
                            </div>
                            
                            <Link href={`/dashboard/members?id=${selectedConvo.memberId}`} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-indigo-600 underline font-medium">
                                회원 정보 보기
                            </Link>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50 dark:bg-zinc-950/50">
                            {isLoadingMsgs ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                    <MessageCircle size={48} className="opacity-30" />
                                    <p className="text-sm">대화 내용이 없습니다.</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const showTime = i === messages.length - 1 || new Date(messages[i+1].created_at).getTime() - new Date(msg.created_at).getTime() > 60000
                                    return (
                                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                <div className={`
                                                    px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm
                                                    ${msg.sender === 'admin'
                                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none md:rounded-br-sm md:rounded-tr-2xl'
                                                        : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-2xl rounded-tl-none md:rounded-bl-sm md:rounded-tl-2xl'
                                                    }
                                                `}>
                                                    {msg.body}
                                                </div>
                                                {showTime && (
                                                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 px-1">
                                                        {formatTime(msg.created_at)}
                                                        {msg.sender === 'admin' && msg.is_read_by_member && (
                                                            <span className="ml-1 text-indigo-400 font-medium">읽음</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} className="h-1" />
                        </div>

                        {/* Input Area */}
                        <div className="shrink-0 p-3 md:p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                            <div className="flex gap-2 items-end max-w-4xl mx-auto">
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="쪽지 보내기... (Enter: 전송, Shift+Enter: 줄바꿈)"
                                    rows={1}
                                    className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-400 max-h-32 min-h-[48px]"
                                    style={{
                                        height: 'auto',
                                        minHeight: '48px'
                                    }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!body.trim() || isPending}
                                    className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                                >
                                    {isPending ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={18} className="translate-x-[1px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-950/50">
                        <div className="text-center text-gray-400">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>왼쪽에서 쪽지를 보낼 회원을 선택해주세요.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
