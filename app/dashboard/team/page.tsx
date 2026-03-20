import { getMyTeamData, getJoinRequests, getTeamNotices } from './actions'
import NoTeamView from './components/NoTeamView'
import TeamDashboard from './components/TeamDashboard'

export default async function TeamPage() {
    const teamData = await getMyTeamData()

    if (!teamData) {
        return <NoTeamView />
    }

    const [joinRequests, notices] = await Promise.all([
        teamData.isRepresentative ? getJoinRequests(teamData.team.id) : Promise.resolve([]),
        getTeamNotices(teamData.team.id),
    ])

    return (
        <TeamDashboard
            team={teamData.team}
            membership={teamData.membership}
            members={teamData.members}
            notices={notices}
            joinRequests={joinRequests}
            isRepresentative={teamData.isRepresentative}
            currentUserId={teamData.currentUserId}
        />
    )
}
