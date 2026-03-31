import { getMemberMessages } from './actions'
import MessageClient from './MessageClient'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/server'

export default async function MessagesPage() {
    const { data: messages } = await getMemberMessages()

    // Get gym name for display
    let gymName = '관장님'
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('member_session')
        if (sessionCookie) {
            const session = JSON.parse(sessionCookie.value)
            const supabase = await createAdminClient()
            const { data: gym } = await supabase
                .from('gyms').select('name').eq('id', session.gymId).single()
            if (gym?.name) gymName = gym.name
        }
    } catch { /* ignore */ }

    return (
        <div className="flex flex-col h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-4rem)] bg-gray-50">
            <MessageClient initialMessages={messages} gymName={gymName} />
        </div>
    )
}
