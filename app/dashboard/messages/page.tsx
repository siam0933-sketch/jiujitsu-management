import { getInboxConversations } from './actions'
import MessagesInboxClient from './components/MessagesInboxClient'

export default async function MessagesPage() {
    const initialConversations = await getInboxConversations()

    return (
        <div className="max-w-6xl mx-auto h-full py-2 md:py-6">
            <MessagesInboxClient initialConversations={initialConversations} />
        </div>
    )
}
