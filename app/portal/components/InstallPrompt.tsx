'use client'

import { useState, useEffect } from 'react'
import { PlusSquare, Share, X } from 'lucide-react'

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [showIOSInstructions, setShowIOSInstructions] = useState(false)

    useEffect(() => {
        // 1. Check if already installed (standalone mode)
        const checkStandalone = () => {
            const isStandAlone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://')
            setIsStandalone(isStandAlone)
            return isStandAlone
        }

        if (checkStandalone()) return // Do not show if already installed

        // 2. Platform detection
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIOSDevice)

        // 3. Android Install Prompt Event
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            // Show the custom prompt UI
            if (localStorage.getItem('hideInstallPrompt') !== 'true') {
                setShowPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // If it's iOS and not standalone, we can optionally show a prompt right away
        // (Only if user hasn't dismissed it before)
        if (isIOSDevice && localStorage.getItem('hideInstallPrompt') !== 'true') {
            setShowPrompt(true)
        }

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (isIOS) {
            // Show iOS specific instructions modal
            setShowIOSInstructions(true)
            setShowPrompt(false)
            return
        }

        if (!deferredPrompt) return

        // Show the native install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted the A2HS prompt')
            setShowPrompt(false)
        } else {
            console.log('User dismissed the A2HS prompt')
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
    }

    const dismissPrompt = () => {
        setShowPrompt(false)
        localStorage.setItem('hideInstallPrompt', 'true')
    }

    const closeIOSInstructions = () => {
        setShowIOSInstructions(false)
        localStorage.setItem('hideInstallPrompt', 'true')
    }

    if (isStandalone) return null

    return (
        <>
            {/* Install Banner / Button */}
            {showPrompt && (
                <div className="fixed bottom-20 left-4 right-4 z-40 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-5">
                    <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-gray-900">앱으로 더 편리하게!</p>
                        <p className="text-xs text-gray-600 mt-1">홈 화면에 아이콘을 추가하고 바로 접속하세요.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleInstallClick}
                            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            설치하기
                        </button>
                        <button
                            onClick={dismissPrompt}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10">
                        <button
                            onClick={closeIOSInstructions}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6 mt-2">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <PlusSquare size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">홈 화면에 추가하기</h3>
                            <p className="text-sm text-gray-600">
                                아이폰(Safari)은 수동으로 추가해야 합니다.<br />아래 가이드를 따라해주세요.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 space-y-4 text-sm text-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 shrink-0 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                    <span className="font-bold">1</span>
                                </div>
                                <p>Safari 화면 하단바 중앙의 <strong className="inline-flex items-center gap-1"><Share size={14} /> (공유)</strong> 버튼을 탭하세요.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 shrink-0 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                    <span className="font-bold">2</span>
                                </div>
                                <p>메뉴를 조금 올려 <strong className="inline-flex items-center gap-1"><PlusSquare size={14} /> 홈 화면에 추가</strong>를 찾아 탭하세요.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 shrink-0 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                    <span className="font-bold">3</span>
                                </div>
                                <p>우측 상단의 <strong>추가</strong>를 누르면 끝!</p>
                            </div>
                        </div>

                        <button
                            onClick={closeIOSInstructions}
                            className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            확인했습니다
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
