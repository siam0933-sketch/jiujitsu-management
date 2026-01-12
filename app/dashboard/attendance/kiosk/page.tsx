'use client'

import { useState, useEffect } from 'react'
import { checkInByPhone, type CheckInResult, type KioskMember } from './actions'
import { useRouter } from 'next/navigation'

export default function KioskPage() {
    const [phone, setPhone] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'selection'>('idle')
    const [message, setMessage] = useState('')
    const [candidates, setCandidates] = useState<KioskMember[]>([])

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
        if (status === 'loading' || status === 'success') return
        if (phone.length < 11) {
            setPhone(prev => prev + digit)
        }
    }

    const handleClear = () => {
        setPhone('')
        setStatus('idle')
        setMessage('')
    }

    const handleBackspace = () => {
        setPhone(prev => prev.slice(0, -1))
        setStatus('idle')
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
        // We call checkInByPhone again with full phone number to exact match
        // Or we need a specific 'checkInById' action? 
        // For security in a kiosk (public facing?), ID might be spoofable if exposed.
        // But here we are authenticated as Admin on the device.
        // Let's just use the full phone number of the selected candidate to retry.
        // Or matching ID.
        // To be safe and simple, let's just retry with the EXACT phone number

        const result = await checkInByPhone(member.phone)
        handleResult(result)
    }

    const router = useRouter()

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-4">
            {/* Exit Button (Hidden or discreet) */}
            <button
                onClick={() => router.back()}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 p-2"
                aria-label="Exit Kiosk"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">

                {/* Header / Display Area */}
                <div className={`p-8 text-center flex-1 flex flex-col justify-center items-center transition-colors ${status === 'success' ? 'bg-green-100' :
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
                            <h2 className="text-2xl font-bold text-green-800">{message}</h2>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-medium text-gray-500 mb-2">
                                {status === 'selection' ? '회원을 선택해주세요' : '출석체크'}
                            </h1>
                            <div className="text-4xl font-bold text-gray-900 tracking-widest min-h-[3rem]">
                                {phone.length > 0 ? phone : <span className="text-gray-200">01012345678</span>}
                            </div>
                            {message && status !== 'selection' && (
                                <p className={`mt-4 ${status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {message}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Selection Overlay */}
                {status === 'selection' && (
                    <div className="absolute inset-x-0 bottom-0 top-32 bg-white/95 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="space-y-2">
                            {candidates.map(candidate => (
                                <button
                                    key={candidate.id}
                                    onClick={() => handleSelectCandidate(candidate)}
                                    className="w-full p-4 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center text-left shadow-sm"
                                >
                                    <div>
                                        <div className="font-bold text-lg text-gray-900">{candidate.name}</div>
                                        <div className="text-sm text-gray-500">{candidate.phone}</div>
                                    </div>
                                    <div className="text-blue-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleClear}
                            className="w-full mt-4 p-3 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            취소하고 다시 입력
                        </button>
                    </div>
                )}

                {/* Keypad */}
                {status !== 'selection' && status !== 'success' && (
                    <div className="bg-gray-50 p-6 grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                className="h-16 rounded-xl bg-white shadow-sm border border-gray-200 text-2xl font-semibold text-gray-800 active:bg-gray-100 hover:shadow-md transition-all"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleClear}
                            className="h-16 rounded-xl bg-red-100 text-red-600 font-medium active:bg-red-200"
                        >
                            초기화
                        </button>
                        <button
                            onClick={() => handleDigit('0')}
                            className="h-16 rounded-xl bg-white shadow-sm border border-gray-200 text-2xl font-semibold text-gray-800 active:bg-gray-100"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="h-16 rounded-xl bg-gray-200 text-gray-700 active:bg-gray-300 flex items-center justify-center"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                            </svg>
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={phone.length < 4}
                            className="col-span-3 h-20 mt-2 rounded-xl bg-blue-600 text-white text-xl font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            <span>출석하기</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 text-white/50 text-sm">
                관리자가 로그인한 상태에서 사용하는 키오스크 모드입니다.
            </div>
        </div>
    )
}
