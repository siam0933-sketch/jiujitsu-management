import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function MemberDashboard() {
    const cookieStore = await cookies()
    const session = cookieStore.get('member_session')

    if (!session) {
        redirect('/portal')
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Member Dashboard</h1>
            <p className="text-gray-400">Welcome to your portal. (Content coming soon)</p>
        </div>
    )
}
