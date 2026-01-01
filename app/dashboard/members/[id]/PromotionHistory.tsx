'use client'

import { useState, useEffect } from 'react'
import { PromotionLog, logPromotion, calculatePromotionStats } from './actions'

// Simple Belts Constant (Should ideally match DB or Global Config)
// Simple Belts Constant (Should ideally match DB or Global Config)
// Belt Config with Colors (Copied/Adapted from settings/promotion/page.tsx)
type BeltOption = {
    name: string
    // Using generic style object for flexibility (tailwind classes or inline styles)
    colorClass?: string
    style?: React.CSSProperties
}

// Ordered List: Adults -> Kids
// "화이트 (성인)" is above "블루".
const BELT_OPTIONS_DATA: BeltOption[] = [
    // Adult Belts
    { name: '화이트 (성인)', colorClass: 'bg-white border-gray-200' },
    { name: '블루', colorClass: 'bg-blue-600 text-white' },
    { name: '퍼플', colorClass: 'bg-purple-600 text-white' },
    { name: '브라운', colorClass: 'bg-yellow-800 text-white' },
    { name: '블랙', colorClass: 'bg-gray-900 text-white' },

    // Kids Belts
    { name: '화이트 (유소년)', colorClass: 'bg-white border border-gray-200' },
    { name: '그레이-화이트', colorClass: 'border border-gray-300', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #ffffff 35%, #ffffff 65%, #9ca3af 65%)' } },
    { name: '그레이', colorClass: 'bg-gray-400 text-white border border-gray-400' },
    { name: '그레이-블랙', colorClass: 'border border-gray-400', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #1f2937 35%, #1f2937 65%, #9ca3af 65%)' } },
    { name: '옐로우-화이트', colorClass: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #ffffff 35%, #ffffff 65%, #facc15 65%)' } },
    { name: '옐로우', colorClass: 'bg-yellow-400 text-yellow-900 border border-yellow-400' },
    { name: '옐로우-블랙', colorClass: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #1f2937 35%, #1f2937 65%, #facc15 65%)' } },
    { name: '오렌지-화이트', colorClass: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #ffffff 35%, #ffffff 65%, #f97316 65%)' } },
    { name: '오렌지', colorClass: 'bg-orange-500 text-white border border-orange-500' },
    { name: '오렌지-블랙', colorClass: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #1f2937 35%, #1f2937 65%, #f97316 65%)' } },
    { name: '그린-화이트', colorClass: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #ffffff 35%, #ffffff 65%, #16a34a 65%)' } },
    { name: '그린', colorClass: 'bg-green-600 text-white border border-green-600' },
    { name: '그린-블랙', colorClass: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #1f2937 35%, #1f2937 65%, #16a34a 65%)' } },
]

// Helper to display legacy names correctly
const displayBeltName = (name: string) => {
    if (name === 'White') return '화이트 (성인)' // Default legacy White to Adult White for display
    return name
}

// Custom Select Component for Belts
const BeltSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectedOption = BELT_OPTIONS_DATA.find(b => b.name === value) || BELT_OPTIONS_DATA[0]

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 h-[38px]"
            >
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-block w-4 h-4 rounded-full border ${selectedOption.colorClass?.includes('border') ? '' : 'border-gray-200'} ${selectedOption.colorClass}`}
                        style={selectedOption.style}
                    />
                    <span className="block truncate">{selectedOption.name}</span>
                </div>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {BELT_OPTIONS_DATA.map((belt) => (
                            <li
                                key={belt.name}
                                className={`relative cursor-default select-none py-2 pl-3 pr-9 ${belt.name === value ? 'bg-indigo-600 text-white' : 'text-gray-900 hover:bg-indigo-50'}`}
                                onClick={() => {
                                    onChange(belt.name)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-block w-4 h-4 rounded-full border ${belt.colorClass?.includes('border') ? '' : 'border-gray-200'} ${belt.colorClass}`}
                                        style={belt.style}
                                    />
                                    <span className={`block truncate ${belt.name === value ? 'font-semibold' : 'font-normal'}`}>
                                        {belt.name}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}


type PromotionHistoryProps = {
    memberId: string
    initialLogs: PromotionLog[]
}

export default function PromotionHistory({ memberId, initialLogs }: PromotionHistoryProps) {
    const [logs, setLogs] = useState<PromotionLog[]>(initialLogs)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [belt, setBelt] = useState('화이트 (성인)') // Default to new name
    const [stripe, setStripe] = useState('0')
    const [trainingDays, setTrainingDays] = useState(0)
    const [attendanceCount, setAttendanceCount] = useState(0)
    const [memo, setMemo] = useState('')

    // Effect: Recalculate stats when Date changes
    useEffect(() => {
        if (isModalOpen) {
            updateStats(date)
        }
    }, [date, isModalOpen])

    const updateStats = async (targetDate: string) => {
        const stats = await calculatePromotionStats(memberId, targetDate)
        setTrainingDays(stats.trainingDays)
        setAttendanceCount(stats.attendanceCount)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!confirm('승급 기록을 저장하시겠습니까?')) return

        setIsLoading(true)
        const res = await logPromotion(memberId, {
            belt,
            stripe: Number(stripe),
            date,
            trainingDays,
            attendanceCount,
            memo
        })

        if (res.error) {
            alert(res.error)
        } else {
            alert('저장되었습니다.')
            setIsModalOpen(false)
            // Ideally re-fetch logs or router.refresh(). 
            // Since we use revalidatePath in action, refreshing router is enough, 
            // but for instant feedback we might reload or rely on parent re-rendering if this was fully integrated.
            // For now, let's just reload to be safe or assuming parent re-renders.
            window.location.reload()
        }
        setIsLoading(false)
    }

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">승급 이력 (Promotion Logs)</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-500 shadow-sm"
                >
                    + 승급 기록 추가
                </button>
            </div>

            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-200">
                    {logs.length === 0 ? (
                        <li className="px-4 py-5 text-sm text-gray-500 text-center">기록이 없습니다.</li>
                    ) : (
                        logs.map((log) => {
                            const displayName = displayBeltName(log.belt_name)
                            // Find color for display in list
                            const beltMeta = BELT_OPTIONS_DATA.find(b => b.name === displayName) || { name: displayName, colorClass: 'bg-gray-100', style: undefined }

                            return (
                                <li key={log.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 items-center">
                                            {/* Belt Icon in History List - Using color from config */}
                                            <div className="flex flex-col items-center justify-center bg-white w-12 h-12 rounded-full shadow-sm border ring-1 ring-gray-100 overflow-hidden relative">
                                                <div
                                                    className={`absolute inset-0 opacity-80 ${beltMeta.colorClass}`}
                                                    style={beltMeta.style}
                                                ></div>
                                                <span className="relative z-10 text-xs font-bold text-gray-800 drop-shadow-md bg-white/50 px-1 rounded">
                                                    {displayName.split(' ')[0]}
                                                </span>
                                                {log.stripe_level > 0 && <span className="relative z-10 text-[10px] bg-black/50 text-white px-1 rounded-full mt-0.5">{log.stripe_level}</span>}
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                                    {displayName} {log.stripe_level}그랄
                                                </p>
                                                <p className="text-xs text-gray-500">수여자: {log.awarded_by}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">{new Date(log.promoted_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500">
                                                수련 {log.training_days}일 / 출석 {log.attendance_count}회
                                            </p>
                                        </div>
                                    </div>
                                    {log.memo && (
                                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            Memo: {log.memo}
                                        </p>
                                    )}
                                </li>
                            )
                        })
                    )}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">승급 기록 추가</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">승급 날짜</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            {/* Belt & Stripe */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">벨트</label>
                                    <BeltSelect value={belt} onChange={setBelt} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">그랄 (Stripe)</label>
                                    <select
                                        value={stripe}
                                        onChange={e => setStripe(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-[38px]"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-gray-50 p-3 rounded-md grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">총 수련일 (휴관 제외)</p>
                                    <p className="text-lg font-bold text-indigo-600">{trainingDays}일</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">총 누적 출석</p>
                                    <p className="text-lg font-bold text-indigo-600">{attendanceCount}회</p>
                                </div>
                            </div>

                            {/* Memo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">메모</label>
                                <textarea
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    placeholder="특이사항 입력..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-500 shadow-sm"
                                >
                                    {isLoading ? '저장 중...' : '기록 저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
