'use client'

import { useRouter } from 'next/navigation'
import { promoteMember } from '../attendance/actions_promotion'

export default function PromotionWidget({ candidates }: { candidates: any[] }) {
    const router = useRouter()

    const handlePromote = async (memberName: string, memberId: string, nextBelt: string) => {
        if (!confirm(`${memberName} 회원을 '${nextBelt}' (으)로 승급 처리하시겠습니까?\n\n- 벨트 정보가 업데이트됩니다.\n- 출석 횟수가 0으로 초기화됩니다.\n- 승급일이 오늘로 기록됩니다.`)) return

        const res = await promoteMember(memberId, nextBelt)
        if (res.error) {
            alert(res.error)
        } else {
            alert('승급 처리되었습니다! 🎉')
            router.refresh()
        }
    }

    if (candidates.length === 0) return null

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-100 p-2 rounded-full">🔔</span>
                <h3 className="text-lg font-bold text-gray-800">승급 심사 대상자가 있습니다! ({candidates.length}명)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-gray-900">{candidate.name}</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{candidate.current_belt}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1 mb-3">
                                <p className="flex items-center gap-1">
                                    <span className="text-blue-500">➜</span>
                                    <span className="font-bold text-blue-700">{candidate.next_belt}</span>
                                </p>
                                {candidate.reason.map((r: string, i: number) => (
                                    <p key={i} className="text-xs text-gray-500">✓ {r}</p>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <a href="/dashboard/members" className="flex-1 text-center text-xs border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-50 transition-colors font-semibold">
                                정보 확인
                            </a>
                            <button
                                onClick={() => handlePromote(candidate.name, candidate.member_id, candidate.next_belt)}
                                className="flex-1 text-center text-xs bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                            >
                                승급 확정
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
