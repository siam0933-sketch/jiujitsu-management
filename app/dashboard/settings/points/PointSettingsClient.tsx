'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { updatePointSetting, createManualPointSetting, deletePointSetting } from './actions'
import { PlusCircle, Trash2, Star, Smile } from 'lucide-react'

type PointSetting = {
    id: string
    name: string
    type: string
    points: number
    is_active: boolean
    icon?: string | null
}

const TYPE_LABELS: Record<string, string> = {
    auto_portal: '🤳 자동 (회원앱 출석)',
    auto_kiosk: '📟 자동 (키오스크·관장 출석)',
    auto_payment: '💳 자동 (결제)',
    manual: '✋ 수동',
}

// Preset emoji palette
const EMOJI_PALETTE = [
    '⭐', '🏆', '🎁', '💪', '🤝', '🎂',
    '💳', '📟', '🤳', '🥇', '🔥', '💎',
    '🎯', '🌟', '👑', '🎉', '🏅', '🦋',
    '🌈', '⚡', '🎖️', '💫', '🚀', '❤️',
]

function EmojiPicker({ current, onSelect, onClear }: { current?: string | null; onSelect: (e: string) => void; onClear: () => void }) {
    return (
        <div className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl p-3 w-56">
            <div className="grid grid-cols-6 gap-1 mb-2">
                {EMOJI_PALETTE.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        className={`h-8 w-8 text-lg rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${current === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-1 ring-indigo-400' : ''}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            {current && (
                <button
                    onClick={onClear}
                    className="w-full text-xs text-gray-400 dark:text-zinc-500 hover:text-red-500 text-center py-1 border-t border-gray-100 dark:border-zinc-700 mt-1"
                >
                    아이콘 제거
                </button>
            )}
        </div>
    )
}

function IconButton({ icon, id, onSave }: { icon?: string | null; id: string; onSave: (id: string, icon: string | null) => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                title="아이콘 설정"
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-lg transition-colors border ${open ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-zinc-900'}`}
            >
                {icon ? icon : <Smile size={14} className="text-gray-300 dark:text-zinc-600" />}
            </button>
            {open && (
                <EmojiPicker
                    current={icon}
                    onSelect={emoji => { onSave(id, emoji); setOpen(false) }}
                    onClear={() => { onSave(id, null); setOpen(false) }}
                />
            )}
        </div>
    )
}

export default function PointSettingsClient({ settings }: { settings: PointSetting[] }) {
    const [items, setItems] = useState(settings)
    const [newName, setNewName] = useState('')
    const [newPoints, setNewPoints] = useState(1)
    const [newIcon, setNewIcon] = useState<string>('')
    const [showNewIconPicker, setShowNewIconPicker] = useState(false)
    const newIconRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (newIconRef.current && !newIconRef.current.contains(e.target as Node)) setShowNewIconPicker(false)
        }
        if (showNewIconPicker) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [showNewIconPicker])

    const handleToggle = (id: string, val: boolean) => {
        setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: val } : s))
        startTransition(async () => {
            await updatePointSetting(id, { is_active: val })
        })
    }

    const handlePointsChange = (id: string, val: number) => {
        setItems(prev => prev.map(s => s.id === id ? { ...s, points: val } : s))
    }

    const handlePointsBlur = (id: string, val: number) => {
        startTransition(async () => {
            await updatePointSetting(id, { points: val })
        })
    }

    const handleIconSave = (id: string, icon: string | null) => {
        setItems(prev => prev.map(s => s.id === id ? { ...s, icon } : s))
        startTransition(async () => {
            await updatePointSetting(id, { icon })
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm('이 포인트 항목을 삭제하시겠습니까?')) return
        setItems(prev => prev.filter(s => s.id !== id))
        startTransition(async () => {
            const res = await deletePointSetting(id)
            if (res?.error) setError(res.error)
        })
    }

    const handleAdd = () => {
        if (!newName.trim() || newPoints <= 0) {
            setError('이름과 점수를 올바르게 입력해주세요.')
            return
        }
        setError('')
        startTransition(async () => {
            const res = await createManualPointSetting(newName, newPoints, newIcon || undefined)
            if (res?.error) {
                setError(res.error)
            } else {
                setNewName('')
                setNewPoints(1)
                setNewIcon('')
            }
        })
    }

    const systemItems = items.filter(s => s.type !== 'manual')
    const manualItems = items.filter(s => s.type === 'manual')

    const SettingRow = ({ s, showDelete }: { s: PointSetting, showDelete?: boolean }) => (
        <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <IconButton icon={s.icon} id={s.id} onSave={handleIconSave} />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{TYPE_LABELS[s.type]}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min={0}
                        value={items.find(x => x.id === s.id)?.points ?? s.points}
                        onChange={e => handlePointsChange(s.id, parseInt(e.target.value) || 0)}
                        onBlur={e => handlePointsBlur(s.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-1 px-2 text-gray-900 dark:text-zinc-100"
                    />
                    <Star size={14} className="text-yellow-400" />
                </div>
                <button
                    onClick={() => handleToggle(s.id, !s.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.is_active ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                {showDelete && (
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            {/* System auto point items */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    시스템 자동 적립
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow divide-y divide-gray-100 dark:divide-zinc-800">
                    {systemItems.map(s => <SettingRow key={s.id} s={s} />)}
                </div>
            </div>

            {/* Manual point items */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    수동 적립 항목
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow divide-y divide-gray-100 dark:divide-zinc-800">
                    {manualItems.length === 0 && (
                        <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-zinc-500">수동 항목이 없습니다. 아래에서 추가해주세요.</p>
                    )}
                    {manualItems.map(s => <SettingRow key={s.id} s={s} showDelete />)}
                </div>

                {/* Add new manual item */}
                <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl shadow px-4 py-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">새 수동 항목 추가</p>
                    {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                    <div className="flex gap-2 items-center">
                        {/* Icon picker for new item */}
                        <div ref={newIconRef} className="relative shrink-0">
                            <button
                                onClick={() => setShowNewIconPicker(v => !v)}
                                title="아이콘 선택"
                                className={`h-9 w-9 rounded-md flex items-center justify-center text-lg border transition-colors ${showNewIconPicker ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-indigo-300'}`}
                            >
                                {newIcon ? newIcon : <Smile size={16} className="text-gray-300 dark:text-zinc-600" />}
                            </button>
                            {showNewIconPicker && (
                                <EmojiPicker
                                    current={newIcon}
                                    onSelect={e => { setNewIcon(e); setShowNewIconPicker(false) }}
                                    onClear={() => { setNewIcon(''); setShowNewIconPicker(false) }}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="항목 이름 (예: 추천인 보너스)"
                            className="flex-1 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 px-3 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
                        />
                        <input
                            type="number"
                            min={1}
                            value={newPoints}
                            onChange={e => setNewPoints(parseInt(e.target.value) || 1)}
                            className="w-20 text-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm py-2 px-2 text-gray-900 dark:text-zinc-100"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={isPending}
                            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <PlusCircle size={16} />
                            추가
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
