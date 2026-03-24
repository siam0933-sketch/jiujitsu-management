'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'

export default function LandingPageUI() {
  const [isOpen, setIsOpen] = useState(false)
  
  // Prevent background scrolling when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  return (
    <div className="min-h-screen bg-[#0E0E12] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 bg-transparent">
        <Link 
          href="/" 
          onClick={() => setIsOpen(false)}
          className="text-2xl md:text-3xl font-light tracking-wide font-['Inter',sans-serif]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          MY Jiu-Jitsu
        </Link>
        
        {/* Two-line Hamburger to X animated button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-10 h-10 flex flex-col justify-center items-center gap-[8px] z-50 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {/* 두 줄이 엑스(X)로 변형되는 애니메이션 */}
          <span 
            className={`block w-8 h-[2px] bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${
              isOpen ? 'rotate-45 translate-y-[5px]' : ''
            }`}
          ></span>
          <span 
            className={`block w-8 h-[2px] bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${
              isOpen ? '-rotate-45 -translate-y-[5px]' : ''
            }`}
          ></span>
        </button>
      </nav>

      <div className="w-full border-b border-white/20 absolute top-[88px] left-0 z-40"></div>

      {/* Main App Description - visible when menu is closed */}
      <main className={`flex-1 flex items-center justify-center transition-opacity duration-500 delay-100 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <h1 className="text-4xl md:text-6xl font-light tracking-widest animate-in fade-in zoom-in duration-1000">
          앱 설 명
        </h1>
      </main>

      {/* Full Screen Overlay Menu */}
      {/* 메뉴 클릭 시 오른쪽에서 스르륵 넘어오는 전체화면 덮는 효과 */}
      <div 
        className={`fixed inset-0 z-40 bg-[#0E0E12] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full border-b border-white/20 absolute top-[88px] left-0"></div>

        <div className="flex-1 flex flex-col pt-32 px-10 pb-10 max-w-5xl mx-auto w-full h-full overflow-y-auto">
          
          {/* Menu Links */}
          <div className="flex flex-col md:flex-row gap-16 md:gap-48 w-full justify-center md:items-start items-center mt-12 md:mt-24 flex-grow">
            
            {/* Admin Column (관장) */}
            <div className={`flex flex-col gap-6 w-full max-w-[200px] text-center md:text-left transition-all duration-500 delay-200 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-wide">관장</h2>
              <ul className="flex flex-col gap-5">
                <li><Link href="/signup" onClick={() => setIsOpen(false)} className="text-xl md:text-2xl font-light text-white/50 hover:text-white transition-colors">회원가입</Link></li>
                <li><Link href="/admin/login" onClick={() => setIsOpen(false)} className="text-xl md:text-2xl font-light text-white/50 hover:text-white transition-colors">로 그 인</Link></li>
              </ul>
            </div>

            {/* Member Column (수련생) */}
            <div className={`flex flex-col gap-6 w-full max-w-[200px] text-center md:text-left transition-all duration-500 delay-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-wide">수련생</h2>
              <ul className="flex flex-col gap-5">
                <li><Link href="/portal/signup" onClick={() => setIsOpen(false)} className="text-xl md:text-2xl font-light text-white/50 hover:text-white transition-colors">회원가입</Link></li>
                <li><Link href="/login" onClick={() => setIsOpen(false)} className="text-xl md:text-2xl font-light text-white/50 hover:text-white transition-colors">로 그 인</Link></li>
                <li><Link href="/member-app" onClick={() => setIsOpen(false)} className="text-xl md:text-2xl font-light text-white/50 hover:text-white transition-colors">앱 다운로드</Link></li>
              </ul>
            </div>

          </div>

          {/* Social Icons Footer */}
          <div className={`flex gap-6 justify-center md:justify-start pb-8 w-full transition-all duration-500 delay-500 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <a href="#" className="p-3 border-2 border-white rounded-xl hover:bg-white hover:text-black transition-all">
              <Instagram size={24} strokeWidth={2} />
            </a>
            <a href="mailto:admin@example.com" className="p-3 border-2 border-white rounded-xl hover:bg-white hover:text-black transition-all">
              <Mail size={24} strokeWidth={2} />
            </a>
          </div>

        </div>
      </div>
    
    </div>
  )
}
