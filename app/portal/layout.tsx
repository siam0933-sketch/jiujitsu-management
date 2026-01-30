import BottomNav from './components/BottomNav';
import PortalHeader from './components/PortalHeader';
import { PORTAL_STYLES } from './styles';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={PORTAL_STYLES.PAGE_WRAPPER}>
            <PortalHeader />
            <main className="flex-1 pt-14"> {/* pt-14 matches header height */}
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
