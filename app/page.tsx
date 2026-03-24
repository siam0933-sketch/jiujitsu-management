import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LandingPageUI from './components/LandingPageUI'

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

  return <LandingPageUI />
}
