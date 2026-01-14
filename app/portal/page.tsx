'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

const initialState = {
    error: '',
}

export default function MemberLoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState)

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        MEMBERS PORTAL
                    </h1>
                    <p className="text-gray-400 text-sm">소속 회원 전용 접속 페이지</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">이름</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="이름을 입력하세요"
                                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">비밀번호</label>
                            <input
                                name="password"
                                type="text"
                                placeholder="발급된 6자리 비밀번호"
                                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium font-mono"
                                required
                            />
                        </div>

                        {state?.error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                                {state.error}
                            </div>
                        )}

                        <button
                            disabled={isPending}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform ${isPending
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 hover:scale-[1.02] hover:shadow-blue-500/25'
                                }`}
                        >
                            {isPending ? '접속 중...' : '로그인'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        비밀번호를 분실하신 경우, 데스크에 문의해주세요.
                    </p>
                </div>
            </div>
        </div>
    )
}
