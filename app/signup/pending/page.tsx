import Link from 'next/link'
import { Clock, CheckCircle } from 'lucide-react'

export default function SignupPendingPage({ searchParams }: { searchParams: { type?: string } }) {
    const isMember = searchParams.type === 'member'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800 p-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
                        {isMember ? '가입 신청 완료!' : '팀 가입 신청 완료!'}
                    </h1>

                    {isMember ? (
                        <>
                            <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed mb-2">
                                가입 신청이 완료되었습니다.
                            </p>
                            <p className="text-amber-600 dark:text-amber-400 font-semibold text-sm mb-6">
                                관리자의 승인 후 로그인을 해주세요.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed mb-2">
                                팀 가입 신청이 완료되었습니다.
                            </p>
                            <p className="text-amber-600 dark:text-amber-400 font-semibold text-sm mb-6">
                                팀 대표님의 승인 후 마이 팀 페이지에서 확인하실 수 있습니다.
                            </p>
                        </>
                    )}

                    <div className="flex flex-col gap-3">
                        <Link href="/login"
                            className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors text-center">
                            로그인 페이지로
                        </Link>
                        <Link href="/"
                            className="w-full py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 transition-colors">
                            홈으로
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
