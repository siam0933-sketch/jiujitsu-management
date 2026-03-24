'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'
import DownloadMemberApkButton from './DownloadMemberApkButton'
import DownloadAdminApkButton from './DownloadAdminApkButton'

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
      <main className={`flex-1 flex flex-col items-center justify-center px-6 transition-opacity duration-500 delay-100 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col items-center max-w-4xl text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-snug text-white drop-shadow-md">
            주짓수 도장 전용 시스템으로<br className="hidden md:block"/> 완벽한 도장운영.
          </h1>

          <div className="pt-6 flex flex-wrap justify-center gap-4 text-lg md:text-2xl font-bold text-white drop-shadow-md">
            <span className="py-3 px-6 border-2 border-white/30 rounded-full bg-white/10 hover:bg-white/20 transition-colors">#승급관리</span>
            <span className="py-3 px-6 border-2 border-white/30 rounded-full bg-white/10 hover:bg-white/20 transition-colors">#키오스크 출석</span>
            <span className="py-3 px-6 border-2 border-white/30 rounded-full bg-white/10 hover:bg-white/20 transition-colors">#회원전용앱</span>
          </div>
        </div>
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
          <div className="flex flex-col md:flex-row gap-16 md:gap-48 w-full justify-center md:items-start items-center mt-12 md:mt-24 mb-16">
            
            {/* Admin Column (관장) */}
            <div className={`flex flex-col gap-6 w-full max-w-[200px] text-center md:text-left transition-all duration-500 delay-200 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-wide">관장</h2>
              <ul className="flex flex-col gap-5">
                <li><Link href="/signup" onClick={() => setIsOpen(false)} className="inline-block text-xl md:text-2xl font-normal text-white/80 hover:text-white hover:translate-x-2 hover:scale-105 origin-left transition-all duration-300">회원가입</Link></li>
                <li><Link href="/admin/login" onClick={() => setIsOpen(false)} className="inline-block text-xl md:text-2xl font-normal text-white/80 hover:text-white hover:translate-x-2 hover:scale-105 origin-left transition-all duration-300">로 그 인</Link></li>
                <li className="flex flex-col items-center md:items-start group">
                  <DownloadAdminApkButton 
                    buttonText="앱 다운로드"
                    className="inline-block text-xl md:text-2xl font-normal text-white/80 group-hover:text-white group-hover:translate-x-2 group-hover:scale-105 origin-left transition-all duration-300"
                    onDownloadStart={() => setIsOpen(false)}
                  />
                  <span className="text-[11px] text-white/40 mt-1 md:ml-1 group-hover:translate-x-2 transition-all duration-300">안드로이드 전용</span>
                </li>
              </ul>
            </div>

            {/* Member Column (수련생) */}
            <div className={`flex flex-col gap-6 w-full max-w-[200px] text-center md:text-left transition-all duration-500 delay-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-wide">수련생</h2>
              <ul className="flex flex-col gap-5">
                <li><Link href="/portal/signup" onClick={() => setIsOpen(false)} className="inline-block text-xl md:text-2xl font-normal text-white/80 hover:text-white hover:translate-x-2 hover:scale-105 origin-left transition-all duration-300">회원가입</Link></li>
                <li><Link href="/login" onClick={() => setIsOpen(false)} className="inline-block text-xl md:text-2xl font-normal text-white/80 hover:text-white hover:translate-x-2 hover:scale-105 origin-left transition-all duration-300">로 그 인</Link></li>
                <li className="flex flex-col items-center md:items-start group">
                  <DownloadMemberApkButton 
                    buttonText="앱 다운로드"
                    className="inline-block text-xl md:text-2xl font-normal text-white/80 group-hover:text-white group-hover:translate-x-2 group-hover:scale-105 origin-left transition-all duration-300"
                    onDownloadStart={() => setIsOpen(false)}
                  />
                  <span className="text-[11px] text-white/40 mt-1 md:ml-1 group-hover:translate-x-2 transition-all duration-300">안드로이드 전용</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Social Icons Footer */}
          <div className={`mt-auto flex gap-6 justify-center md:justify-start pb-8 pt-8 w-full transition-all duration-500 delay-500 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
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
