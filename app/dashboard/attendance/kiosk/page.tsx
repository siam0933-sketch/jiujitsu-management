'use client'

import { useState, useEffect, useRef } from 'react'
import { checkInByPhone, checkInById, type CheckInResult, type KioskMember } from './actions'
import { useRouter } from 'next/navigation'

export default function KioskPage() {
    const [phone, setPhone] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'selection'>('idle')
    const [message, setMessage] = useState('')
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

        if (status === 'loading' || status === 'success') return
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
        if (phone.length < 4) {
            setMessage('전화번호 뒷 4자리 이상 입력해주세요.')
            setStatus('error')
            return
        }

        setStatus('loading')
        setMessage('회원 정보를 조회 중입니다...')

        try {
            const result = await checkInByPhone(phone)
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
        setStatus('loading')

        try {
            const result = await checkInById(member.id)
            handleResult(result)
        } catch (e) {
            setStatus('error')
            setMessage('오류가 발생했습니다.')
        }
    }

    const router = useRouter()

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
            className="fixed inset-0 z-50 bg-gray-900 flex flex-col overflow-hidden overscroll-none h-[100dvh] w-screen"
        >
            {/* Exit Button (Hidden or discreet) */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExitModalOpen(true)
                }}
                className="absolute top-4 right-4 text-gray-400/50 hover:text-gray-600 p-2 z-[60]"
                aria-label="Exit Kiosk"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="bg-white w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header / Display Area */}
                <div onClick={handleGlobalClick} className={`p-4 text-center flex-[0.35] flex flex-col justify-center items-center transition-colors ${status === 'success' ? 'bg-green-100' :
                    status === 'error' ? 'bg-red-50' :
                        'bg-white'
                    }`}>
                    {status === 'success' ? (
                        <div className="animate-bounce">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-green-800">{message}</h2>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-medium text-gray-500 mb-2">
                                {status === 'selection' ? '회원을 선택해주세요' : '출석체크'}
                            </h1>
                            <div className="text-5xl font-bold text-gray-900 tracking-widest min-h-[4rem] flex items-center justify-center">
                                {phone.length > 0 ? phone : <span className="text-gray-200">01012345678</span>}
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
                    <div className="absolute inset-x-0 bottom-0 top-[35%] bg-white/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="space-y-3">
                            {candidates.map(candidate => (
                                <button
                                    key={candidate.id}
                                    onClick={() => handleSelectCandidate(candidate)}
                                    className="w-full p-6 bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center text-left shadow-md"
                                >
                                    <div>
                                        <div className="font-bold text-xl text-gray-900">{candidate.name}</div>
                                        <div className="text-gray-500">{candidate.phone}</div>
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
                            className="w-full mt-4 p-4 text-lg font-medium text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            취소하고 다시 입력
                        </button>
                    </div>
                )}

                {/* Exit PIN Modal Overlay */}
                {isExitModalOpen && (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-[70]" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center mx-4 border border-red-100 flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center -mt-12 mb-4 shadow-sm border border-red-50">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">관리자 인증</h2>
                            <p className="text-gray-500 mb-8 min-h-[48px] flex items-center justify-center">
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
                                        className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${exitPin.length >= index ? 'bg-gray-800 border-gray-800 scale-110' : 'bg-transparent border-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Keypad */}
                {status !== 'selection' && status !== 'success' && (
                    <div className="bg-gray-50 p-2 grid grid-cols-3 gap-2 flex-[0.65]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                className="h-full rounded-xl bg-white shadow-sm border border-gray-200 text-3xl font-semibold text-gray-800 active:bg-gray-100 active:scale-[0.98] transition-all"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleClear}
                            className="h-full rounded-xl bg-red-50 text-red-600 font-medium active:bg-red-100 border border-red-100 text-xl"
                        >
                            초기화
                        </button>
                        <button
                            onClick={() => handleDigit('0')}
                            className="h-full rounded-xl bg-white shadow-sm border border-gray-200 text-3xl font-semibold text-gray-800 active:bg-gray-100 active:scale-[0.98]"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="h-full rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 flex items-center justify-center border border-gray-200"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </button>

                        <button
                            onClick={isExitModalOpen ? () => setIsExitModalOpen(false) : handleSubmit}
                            disabled={!isExitModalOpen && phone.length < 4}
                            className={`col-span-3 h-full rounded-xl text-white text-2xl font-bold transition-all flex items-center justify-center gap-2 mt-1 shadow-md
                                ${isExitModalOpen
                                    ? 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700'
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
                    </div>
                )}
            </div>
        </div>
    )
}
