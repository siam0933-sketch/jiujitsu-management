'use client'

import { useState, useEffect, useRef } from 'react'
import { checkInByPhone, checkInById, getKioskInitData, type CheckInResult, type KioskMember } from './actions'
import { useRouter } from 'next/navigation'

export default function KioskPage() {
    const [phone, setPhone] = useState('')
    const [isInit, setIsInit] = useState(false)
    const [gymId, setGymId] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'selection'>('idle')
    const [message, setMessage] = useState('')
    const [paymentWarning, setPaymentWarning] = useState('')
    const [candidates, setCandidates] = useState<KioskMember[]>([])
    const [isExitModalOpen, setIsExitModalOpen] = useState(false)
    const [exitPin, setExitPin] = useState('')
    const wakeLockRef = useRef<any>(null)

    // Screen Wake Lock to prevent screen from turning off
    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
                    console.log('Screen Wake Lock is active')

                    wakeLockRef.current.addEventListener('release', () => {
                        console.log('Screen Wake Lock released')
                    })
                }
            } catch (err: any) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`)
            }
        }

        requestWakeLock()

        const handleVisibilityChange = () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                requestWakeLock()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (wakeLockRef.current !== null) {
                wakeLockRef.current.release()
                wakeLockRef.current = null
            }
        }
    }, [])

    // Auto clear after success
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (status === 'success' || status === 'error') {
            timer = setTimeout(() => {
                setStatus('idle')
                setMessage('')
                setPaymentWarning('')
                setPhone('')
                setCandidates([])
            }, 3000)
        }
        return () => clearTimeout(timer)
    }, [status])

    const handleDigit = (digit: string) => {
        if (isExitModalOpen) {
            if (exitPin.length < 4) {
                const newPin = exitPin + digit
                setExitPin(newPin)
                // Auto verify PIN when 4 digits are entered
                if (newPin.length === 4) {
                    if (newPin === '0000') {
                        if (document.fullscreenElement) {
                            document.exitFullscreen()
                        }
                        router.back()
                    } else {
                        // Error handling: Shake effect via timeout or just clear
                        setTimeout(() => {
                            setExitPin('')
                        }, 500)
                    }
                }
            }
            return
        }

        if (status === 'loading' || status === 'success' || !isInit) return
        if (phone.length < 11) {
            setPhone(prev => prev + digit)
        }
    }

    const handleClear = () => {
        if (isExitModalOpen) {
            setExitPin('')
        } else {
            setPhone('')
            setStatus('idle')
            setMessage('')
            setPaymentWarning('')
        }
    }

    const handleBackspace = () => {
        if (isExitModalOpen) {
            setExitPin(prev => prev.slice(0, -1))
        } else {
            setPhone(prev => prev.slice(0, -1))
            setStatus('idle')
        }
    }

    const handleSubmit = async () => {
        if (!gymId) {
            setMessage('초기화 중입니다. 잠시 후 시도해주세요.')
            setStatus('error')
            return
        }
        if (phone.length < 4) {
            setMessage('전화번호 뒷 4자리 이상 입력해주세요.')
            setStatus('error')
            return
        }

        setStatus('loading')
        setMessage('회원 정보를 조회 중입니다...')
        setPaymentWarning('')

        try {
            const result = await checkInByPhone(phone, gymId)
            handleResult(result)
        } catch (e) {
            setStatus('error')
            setMessage('오류가 발생했습니다. 다시 시도해주세요.')
        }
    }

    const handleResult = (result: CheckInResult) => {
        if (result.success) {
            setStatus('success')
            setMessage(result.message)
            if (result.paymentWarning) {
                setPaymentWarning(result.paymentWarning)
            }
            // Optional: Play sound?
        } else if (result.multipleMatches) {
            setStatus('selection')
            setCandidates(result.multipleMatches)
            setMessage(result.message)
        } else {
            setStatus('error')
            setMessage(result.message)
        }
    }

    const handleSelectCandidate = async (member: KioskMember) => {
        if (!gymId) return
        setStatus('loading')

        try {
            const result = await checkInById(member.id, gymId)
            handleResult(result)
        } catch (e) {
            setStatus('error')
            setMessage('오류가 발생했습니다.')
        }
    }

    const router = useRouter()
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const initKiosk = async () => {
            const data = await getKioskInitData()
            if (data.gymId) {
                setGymId(data.gymId)
                setIsInit(true)
            } else {
                setMessage(data.error || '초기화 실패: 도장 정보를 찾을 수 없습니다.')
                setStatus('error')
            }
        }
        initKiosk()

        const checkFullscreen = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', checkFullscreen)

        // Attempt auto fullscreen on load
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Auto-fullscreen blocked by browser:', err)
            })
        }

        return () => document.removeEventListener('fullscreenchange', checkFullscreen)
    }, [])

    const handleGlobalClick = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable full-screen mode:', err)
            })
        }
    }

    return (
        <div
            onClick={handleGlobalClick}
            className="fixed inset-0 z-50 bg-gray-900 flex flex-col overflow-hidden overscroll-none h-[100dvh] w-screen select-none touch-manipulation"
        >
            {/* Exit Button Removed per user request */}

            {/* Initial Fullscreen Prompt Overlay */}
            {!isFullscreen && (
                <div className="absolute inset-x-0 top-0 bg-blue-600 text-white text-center py-2 text-sm font-bold z-[60] animate-pulse cursor-pointer shadow-md" onClick={handleGlobalClick}>
                    전체 화면으로 전환하려면 화면을 한 번 터치해주세요 (필수)
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header / Display Area */}
                <div onClick={handleGlobalClick} className={`p-4 text-center flex-[0.35] flex flex-col justify-center items-center transition-colors ${status === 'success' ? 'bg-green-100' :
                    status === 'error' ? 'bg-red-50' :
                        'bg-white dark:bg-zinc-900'
                    }`}>
                    {status === 'success' ? (
                        <div className="animate-bounce flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-green-800 text-center mb-4">{message}</h2>
                            {paymentWarning && (
                                <div className="mt-4 px-6 py-4 rounded-2xl bg-red-100 border-2 border-red-200 text-red-700 font-bold text-xl shadow-lg animate-pulse">
                                    ⚠️ {paymentWarning}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-medium text-gray-500 dark:text-zinc-400 mb-2">
                                {status === 'selection' ? '회원을 선택해주세요' : '출석체크'}
                            </h1>
                            <div className="text-5xl font-bold text-gray-900 dark:text-zinc-100 tracking-widest min-h-[4rem] flex items-center justify-center pointer-events-none select-none">
                                {phone}
                            </div>
                            {message && status !== 'selection' && (
                                <p className={`mt-2 text-lg ${status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {message}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Selection Overlay */}
                {status === 'selection' && (
                    <div className="absolute inset-x-0 bottom-0 top-[35%] bg-white dark:bg-zinc-900/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="space-y-3">
                            {candidates.map(candidate => (
                                <button
                                    key={candidate.id}
                                    onClick={() => handleSelectCandidate(candidate)}
                                    className="w-full p-6 bg-white dark:bg-zinc-900 border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center text-left shadow-md"
                                >
                                    <div>
                                        <div className="font-bold text-xl text-gray-900 dark:text-zinc-100">{candidate.name}</div>
                                        <div className="text-gray-500 dark:text-zinc-400">{candidate.phone}</div>
                                    </div>
                                    <div className="text-blue-500">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleClear}
                            className="w-full mt-4 p-4 text-lg font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 rounded-xl"
                        >
                            취소하고 다시 입력
                        </button>
                    </div>
                )}

                {/* Exit PIN Modal Overlay */}
                {isExitModalOpen && (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-[70]" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center mx-4 border border-red-100 flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center -mt-12 mb-4 shadow-sm border border-red-50">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">관리자 인증</h2>
                            <p className="text-gray-500 dark:text-zinc-400 mb-8 min-h-[48px] flex items-center justify-center">
                                {exitPin.length === 4 && exitPin !== '0000'
                                    ? <span className="text-red-500 font-bold animate-pulse">비밀번호가 틀렸습니다.</span>
                                    : "대시보드로 돌아가려면 4자리 관리자 비밀번호를 입력해주세요."
                                }
                            </p>

                            {/* PIN Display Dots */}
                            <div className="flex gap-4 mb-4 justify-center">
                                {[1, 2, 3, 4].map((index) => (
                                    <div
                                        key={index}
                                        className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${exitPin.length >= index ? 'bg-gray-800 border-gray-800 scale-110' : 'bg-transparent border-gray-300 dark:border-zinc-700'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Keypad */}
                {status !== 'selection' && status !== 'success' && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 grid grid-cols-3 gap-2 flex-[0.65]">
                        {!isInit && status !== 'error' ? (
                            <div className="col-span-3 flex items-center justify-center text-gray-400 dark:text-zinc-500 font-bold animate-pulse text-xl">
                                상태를 초기화하고 있습니다...
                            </div>
                        ) : (
                            <>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleDigit(num.toString())}
                                        className="h-full rounded-xl bg-white dark:bg-zinc-900 text-3xl font-bold shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 active:bg-gray-200 transition-colors select-none"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handleClear}
                                    className="h-full rounded-xl bg-gray-200 text-xl font-bold shadow-sm hover:bg-gray-300 active:bg-gray-400 transition-colors text-gray-600 dark:text-zinc-400 select-none"
                                >
                                    전체 지움
                                </button>
                                <button
                                    onClick={() => handleDigit('0')}
                                    className="h-full rounded-xl bg-white dark:bg-zinc-900 text-3xl font-bold shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 active:bg-gray-200 transition-colors select-none"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleBackspace}
                                    className="h-full rounded-xl bg-gray-200 text-xl font-bold shadow-sm hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center justify-center text-gray-600 dark:text-zinc-400 select-none"
                                >
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={isExitModalOpen ? () => setIsExitModalOpen(false) : handleSubmit}
                                    disabled={(!isExitModalOpen && phone.length < 4) || !isInit}
                                    className={`col-span-3 h-full rounded-xl text-white text-2xl font-bold transition-all flex items-center justify-center gap-2 mt-1 shadow-md select-none touch-manipulation
                                        ${isExitModalOpen
                                            ? 'bg-gray-50 dark:bg-zinc-800/500 hover:bg-gray-600 active:bg-gray-700'
                                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    <span>{isExitModalOpen ? '취소' : '출석하기'}</span>
                                    {!isExitModalOpen && (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
