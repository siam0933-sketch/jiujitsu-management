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
            <h1 className="text-2xl font-bold mb-4">회원 대시보드</h1>
            <p className="text-gray-400">회원 포털에 오신 것을 환영합니다. (콘텐츠 준비 중)</p>
        </div>
    )
}
