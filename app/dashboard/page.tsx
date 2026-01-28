import { currentUser } from "@clerk/nextjs/server";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
    const user = await currentUser();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#242424]">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Welcome Card */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#242424]">Welcome back!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Hello, {user?.firstName || "User"}. You are logged in successfully.
                    </p>
                    <div className="mt-4 inline-flex items-center rounded-full bg-[#242424]/10 px-2.5 py-0.5 text-xs font-medium text-[#242424]">
                        Role: {user?.publicMetadata?.role as string || "Access Pending"}
                    </div>
                </div>

                {/* Stats Placeholder */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#242424]">Active Projects</h3>
                    <p className="mt-2 text-3xl font-bold text-[#242424]">2</p>
                    <p className="text-xs text-gray-500">+1 from last month</p>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#242424]">Pending Tasks</h3>
                    <p className="mt-2 text-3xl font-bold text-[#242424]">12</p>
                    <p className="text-xs text-gray-500">3 high priority</p>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold text-[#242424]">Recent Activity</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500">No recent activity to show.</p>
                </div>
            </div>
        </div>
    );
}
