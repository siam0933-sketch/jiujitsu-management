import { PORTAL_STYLES } from '../styles';
import { getPortalRanking } from '../notice/actions';
import PortalRankingClient from '../notice/PortalRankingClient';

export default async function PortalRankingPage() {
    // Default to yearly ranking
    const rankingResult = await getPortalRanking(new Date().getFullYear(), null);

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <div className="pt-4 pb-8">
                <PortalRankingClient initialRanking={rankingResult} />
            </div>
            {/* Bottom spacer for nav bar spacing */}
            <div className="h-4"></div>
        </div>
    );
}
