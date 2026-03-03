
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-8">
          Jiu-Jitsu Gym Management
        </h1>
        <p className="mt-3 text-2xl text-gray-700 max-w-2xl mb-12">
          Manage your members, track attendance, and run your dojo efficiently.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full">
          <Link
            href="/admin/login"
            className="px-8 py-4 w-full sm:w-auto text-xl font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition duration-150 ease-in-out shadow-lg"
          >
            관장(관리자) 로그인
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 w-full sm:w-auto text-xl font-bold rounded-xl bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition duration-150 ease-in-out shadow-lg"
          >
            신규 도장 가입하기
          </Link>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p className="flex items-center justify-center">
          Powered by Supabase & Next.js
        </p>
      </footer>
    </div>
  )
}
