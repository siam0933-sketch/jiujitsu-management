
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
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

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link
            href="/login"
            className="px-8 py-4 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition duration-150 ease-in-out shadow-lg"
          >
            Go to Login
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
