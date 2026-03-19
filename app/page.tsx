import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, UserCircle, LogIn, ArrowRight, UserPlus } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'super_admin') {
      redirect('/super-admin')
    } else if (profile?.role === 'gym_member') {
      redirect('/portal')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-zinc-950 font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">

        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
          <Image src="/mj-logo.png" alt="My jiu-jitsu logo" width={80} height={80} className="mb-6 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            My jiu-jitsu
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
            스마트한 주짓수 도장 회원 관리 및 출석 시스템
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Admin Section */}
          <div className="flex flex-col gap-3">
            <Link href="/admin/login" className="group flex flex-col items-center justify-center p-10 sm:p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Building2 size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">관리자 로그인</h2>
              <p className="text-blue-100 text-sm sm:text-base text-center max-w-xs font-medium">
                도장을 효율적으로 운영하고 수강생을 관리하세요
              </p>

              <div className="mt-8 flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                <ArrowRight size={20} strokeWidth={2.5} />
              </div>
            </Link>

            <Link href="/signup" className="group flex items-center justify-center p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-gray-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">
              <UserCircle size={22} className="mr-3 text-blue-500" />
              <span className="font-semibold text-sm sm:text-base">
                아직 계정이 없으신가요? <span className="underline underline-offset-4 decoration-2 decoration-blue-200 group-hover:decoration-blue-400 transition-colors">새로운 도장 가입하기</span>
              </span>
            </Link>
          </div>

          {/* Member Section */}
          <div className="flex flex-col gap-3">
            <Link href="/login" className="group flex flex-col items-center justify-center p-10 sm:p-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <LogIn size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">회원 로그인</h2>
              <p className="text-emerald-50 text-sm sm:text-base text-center max-w-xs font-medium">
                나의 출석 현황과 등록 정보를 빠르고 쉽게 확인하세요
              </p>

              <div className="mt-8 flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                <ArrowRight size={20} strokeWidth={2.5} />
              </div>
            </Link>

            <Link href="/portal/signup" className="group flex items-center justify-center p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-gray-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              <UserPlus size={22} className="mr-3 text-emerald-500" />
              <span className="font-semibold text-sm sm:text-base">
                도장을 처음 방문하셨나요? <span className="underline underline-offset-4 decoration-2 decoration-emerald-200 group-hover:decoration-emerald-400 transition-colors">수강생 회원가입</span>
              </span>
            </Link>
          </div>

        </div>
      </main>

      <footer className="w-full py-8 text-center text-sm text-gray-500 dark:text-zinc-500 border-t border-gray-200 dark:border-zinc-800">
        <p>© {new Date().getFullYear()} My jiu-jitsu. All rights reserved.</p>
      </footer>
    </div>
  )
}
