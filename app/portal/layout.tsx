import BottomNav from './components/BottomNav';
import { PORTAL_STYLES } from './styles';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={PORTAL_STYLES.PAGE_WRAPPER}>
            <main className="flex-1">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
