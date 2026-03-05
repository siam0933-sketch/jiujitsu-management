import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, UserCircle, LogIn, ArrowRight } from 'lucide-react'

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Card 1: Gym Master Login */}
          <Link href="/admin/login" className="group flex flex-row md:flex-col items-center justify-start md:justify-center p-5 md:p-8 bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all duration-300">
            <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-0 md:mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow md:items-center text-left md:text-center">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white md:mb-2">관장님 로그인</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 md:mb-6 hidden sm:block">
                등록된 도장을 운영하고 수강생을 관리하세요
              </p>
            </div>
            <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all ml-auto md:ml-0">
              <span className="hidden md:inline">입장하기</span> <ArrowRight size={18} className="md:ml-1" />
            </div>
          </Link>

          {/* Card 2: Gym Signup */}
          <Link href="/signup" className="group flex flex-row md:flex-col items-center justify-start md:justify-center p-5 md:p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform md:hover:-translate-y-1">
            <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 bg-white/10 text-white rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-0 md:mb-6 group-hover:scale-110 transition-transform">
              <UserCircle size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow md:items-center text-left md:text-center">
              <h2 className="text-lg md:text-2xl font-bold text-white md:mb-2">신규 도장 가입</h2>
              <p className="text-xs md:text-sm text-blue-100 md:mb-6 hidden sm:block">
                아직 계정이 없으신가요?<br />새로운 도장을 등록해보세요
              </p>
            </div>
            <div className="flex items-center text-white font-medium group-hover:gap-2 transition-all ml-auto md:ml-0 md:bg-white/10 md:px-4 md:py-2 md:rounded-full">
              <span className="hidden md:inline">가입 시작하기</span> <ArrowRight size={18} className="md:ml-1" />
            </div>
          </Link>

          {/* Card 3: Member Login */}
          <Link href="/login" className="group flex flex-row md:flex-col items-center justify-start md:justify-center p-5 md:p-8 bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-0 md:mb-6 group-hover:scale-110 transition-transform">
              <LogIn size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col flex-grow md:items-center text-left md:text-center">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white md:mb-2">수강생 로그인</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 md:mb-6 hidden sm:block">
                나의 출석 현황과 등록 정보를 확인하세요
              </p>
            </div>
            <div className="flex items-center text-emerald-600 font-medium group-hover:gap-2 transition-all ml-auto md:ml-0">
              <span className="hidden md:inline">조회하기</span> <ArrowRight size={18} className="md:ml-1" />
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
