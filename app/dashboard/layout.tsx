import { Sidebar } from "./_components/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main className="transition-all duration-200 lg:pl-64">
                <div className="container mx-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
