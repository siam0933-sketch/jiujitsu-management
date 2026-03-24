'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function MemberAppSplashScreen() {
  const router = useRouter()
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Fade in
    const inTimer = setTimeout(() => {
      setOpacity(1)
    }, 100)

    // Redirect after 3 seconds
    const outTimer = setTimeout(() => {
      setOpacity(0) // Fade out before redirect
      setTimeout(() => {
        // Use replace to prevent going back to splash screen
        router.replace('/login?app=true')
      }, 500)
    }, 3000)

    return () => {
      clearTimeout(inTimer)
      clearTimeout(outTimer)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0E0E12] flex flex-col items-center justify-center relative overflow-hidden">
      <div 
        className="flex flex-col items-center transition-opacity duration-500 ease-in-out"
        style={{ opacity }}
      >
        <div className="relative w-32 h-32 mb-6">
          {/* Subtle pulse effect behind logo */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl animate-ping opacity-75"></div>
          <Image 
            src="/mj-logo.png" 
            alt="My jiu-jitsu logo" 
            fill
            className="rounded-2xl shadow-2xl relative z-10" 
          />
        </div>
        
        <h1 className="text-3xl font-light text-white tracking-widest mb-2">
          MY Jiu-Jitsu
        </h1>
        <p className="text-white/50 text-sm tracking-wide">
          수강생 전용 앱에 오신 것을 환영합니다
        </p>
      </div>
    </div>
  )
}
