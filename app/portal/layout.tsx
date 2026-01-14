export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
            {/* Background effects could go here */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {children}
            </div>
        </div>
    )
}
