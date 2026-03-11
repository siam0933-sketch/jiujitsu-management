import Link from 'next/link'
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

        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            주짓수 도장 관리 시스템
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
            원활한 출석 관리와 스마트한 도장 운영의 시작
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Card 1: Gym Master Login */}
          <Link href="/admin/login" className="group flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center mr-4 sm:mr-0 sm:mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow sm:items-center text-left sm:text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white sm:mb-2">관장님 로그인</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 sm:mb-6 mt-0.5 hidden sm:block">등록된 도장을 운영하고 수강생을 관리하세요</p>
            </div>
            <div className="flex items-center text-blue-600 font-medium ml-auto sm:ml-0">
              <ArrowRight size={18} />
            </div>
          </Link>

          {/* Card 2: Gym Signup */}
          <Link href="/signup" className="group flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-white/10 text-white rounded-xl sm:rounded-2xl flex items-center justify-center mr-4 sm:mr-0 sm:mb-6 group-hover:scale-110 transition-transform">
              <UserCircle size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow sm:items-center text-left sm:text-center">
              <h2 className="text-base sm:text-lg font-bold text-white sm:mb-2">신규 도장 가입</h2>
              <p className="text-[11px] sm:text-xs text-blue-100 sm:mb-6 mt-0.5 hidden sm:block">아직 계정이 없으신가요? 새로운 도장을 등록해보세요</p>
            </div>
            <div className="flex items-center text-white font-medium ml-auto sm:ml-0">
              <ArrowRight size={18} />
            </div>
          </Link>

          {/* Card 3: Member Login */}
          <Link href="/login" className="group flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center mr-4 sm:mr-0 sm:mb-6 group-hover:scale-110 transition-transform">
              <LogIn size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow sm:items-center text-left sm:text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white sm:mb-2">수강생 로그인</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 sm:mb-6 mt-0.5 hidden sm:block">나의 출석 현황과 등록 정보를 확인하세요</p>
            </div>
            <div className="flex items-center text-emerald-600 font-medium ml-auto sm:ml-0">
              <ArrowRight size={18} />
            </div>
          </Link>

          {/* Card 4: Member Signup (NEW) */}
          <Link href="/portal/signup" className="group flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-orange-500/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-xl sm:rounded-2xl flex items-center justify-center mr-4 sm:mr-0 sm:mb-6 group-hover:scale-110 transition-transform">
              <UserPlus size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow sm:items-center text-left sm:text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white sm:mb-2">수강생 회원가입</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 sm:mb-6 mt-0.5 hidden sm:block">도장을 검색하고 회원으로 가입하세요</p>
            </div>
            <div className="flex items-center text-orange-500 font-medium ml-auto sm:ml-0">
              <ArrowRight size={18} />
            </div>
          </Link>

        </div>
      </main>

      <footer className="w-full py-8 text-center text-sm text-gray-500 dark:text-zinc-500 border-t border-gray-200 dark:border-zinc-800">
        <p>© {new Date().getFullYear()} Jiu-Jitsu Management System. All rights reserved.</p>
      </footer>
    </div>
  )
}
