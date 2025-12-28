'use client'

import { useState, useEffect } from 'react'
import { checkInMember, getTodayAttendanceLogs, getActiveMembers } from './actions'

export default function AttendancePage() {
    const [members, setMembers] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const [m, l] = await Promise.all([getActiveMembers(), getTodayAttendanceLogs()])
        setMembers(m)
        setLogs(l)
        setIsLoading(false)
    }

    const handleCheckIn = async (memberId: string) => {
        // Optimistic update could be added here
        const res = await checkInMember(memberId)
        if (res.error) {
            alert(res.error)
        } else {
            // Refresh logs
            const l = await getTodayAttendanceLogs()
            setLogs(l)
        }
    }

    // Filter members who haven't checked in yet
    const checkedInIds = new Set(logs.map(l => l.member_id))
    const filteredMembers = members
        .filter(m => !checkedInIds.has(m.id))
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm))

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6 h-[calc(100vh-100px)]">
            {/* Left: Check-in Panel */}
            <div className="flex-1 bg-white shadow-lg rounded-xl flex flex-col overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">출석 체크</h1>
                    <input
                        type="text"
                        placeholder="이름 또는 전화번호 검색..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group cursor-pointer" onClick={() => handleCheckIn(member.id)}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800 text-lg">{member.name}</span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{member.belt}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            누적 {member.attendance_count}회
                                            {member.remaining_sessions !== null && <span className="text-blue-600 ml-2 font-medium">(잔여 {member.remaining_sessions}회)</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCheckIn(member.id); }}
                                        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        출석
                                    </button>
                                </div>
                            ))}
                            {filteredMembers.length === 0 && searchTerm && (
                                <p className="text-center text-gray-500 py-4">검색 결과가 없습니다.</p>
                            )}
                            {filteredMembers.length === 0 && !searchTerm && members.length > 0 && (
                                <p className="text-center text-gray-500 py-4">모든 회원이 출석했습니다! 🎉</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Today's Logs */}
            <div className="w-80 bg-white shadow-lg rounded-xl flex flex-col overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">오늘 출석 현황</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{logs.length}명</span>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <ul className="divide-y divide-gray-50">
                        {logs.map(log => (
                            <li key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        {log.gym_members?.belt ? log.gym_members.belt[0] : 'W'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{log.gym_members?.name}</p>
                                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Manual</span>
                            </li>
                        ))}
                        {logs.length === 0 && (
                            <li className="p-8 text-center text-gray-400 text-sm">
                                아직 출석한 회원이 없습니다.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
