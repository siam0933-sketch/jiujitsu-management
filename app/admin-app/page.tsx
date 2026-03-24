'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminAppSplashScreen() {
    const router = useRouter()
    const [opacity, setOpacity] = useState(0)

    useEffect(() => {
        // Fade in logo
        setOpacity(1)

        // After 3 seconds, navigate to the admin login page with app=true parameter
        const timer = setTimeout(() => {
            setOpacity(0)
            setTimeout(() => {
                router.replace('/admin/login?app=true')
            }, 500)
        }, 2500)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
            <div 
                className="transition-opacity duration-1000 ease-in-out flex flex-col items-center gap-4"
                style={{ opacity }}
            >
                <Image 
                    src="/mj-logo.png" 
                    alt="My jiu-jitsu Logo" 
                    width={120} 
                    height={120} 
                    className="rounded-2xl shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    priority
                />
                <h1 className="text-2xl font-bold tracking-widest text-[#f5f5f7] mt-4" style={{fontFamily: "'Inter', sans-serif"}}>
                    MY Jiu-Jitsu <span className="text-blue-500">ADMIN</span>
                </h1>
            </div>
        </div>
    )
}
