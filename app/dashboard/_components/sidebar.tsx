"use client";

import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    Menu,
    PlusCircle,
    HelpCircle,
    Bell,
    CreditCard,
    CheckCircle,
    FileText,
    User
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { UserRole, getRoleFromEmail } from "@/lib/roles";

type NavItem = {
    href: string;
    label: string;
    icon: any;
    variant?: "default" | "cta";
};

export function Sidebar() {
    const pathname = usePathname();
    const { user, isLoaded } = useUser();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);

    useEffect(() => {
        if (isLoaded && user) {
            const email = user.primaryEmailAddress?.emailAddress;
            const adminRole = email ? getRoleFromEmail(email) : null;

            if (adminRole === UserRole.ADMIN) {
                setRole(UserRole.ADMIN);
            } else {
                const metadataRole = user.publicMetadata?.role as UserRole;
                setRole(metadataRole || UserRole.BUSINESS);
            }
        }
    }, [isLoaded, user]);

    const getNavItems = (currentRole: UserRole | null): NavItem[] => {
        if (!currentRole) return [];

        const dashboardItem = { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard };
        const settingsItem = { href: "/dashboard/settings", label: "Settings", icon: Settings };

        // Business Items
        const businessItems: NavItem[] = [
            dashboardItem,
            { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
            { href: "/dashboard/profile", label: "Profile", icon: User },
            { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
            { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
            settingsItem,
            { href: "/dashboard/help", label: "Help", icon: HelpCircle },
        ];

        // Talent Items
        const talentItems: NavItem[] = [
            dashboardItem,
            { href: "/dashboard/my-tasks", label: "My Tasks", icon: FileText },
            { href: "/dashboard/profile", label: "Profile", icon: User },
            { href: "/dashboard/verification", label: "Verification", icon: CheckCircle },
            settingsItem,
        ];

        // Admin Items
        const adminItems: NavItem[] = [
            dashboardItem,
            { href: "/dashboard/users", label: "Users", icon: Users },
            { href: "/dashboard/all-orders", label: "Orders", icon: Briefcase },
            { href: "/dashboard/projects", label: "Projects", icon: LayoutDashboard },
            { href: "/dashboard/verification", label: "Verification", icon: CheckCircle },
            { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
            { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
            settingsItem,
        ];

        switch (currentRole) {
            case UserRole.ADMIN:
                return adminItems;
            case UserRole.BUSINESS:
                return businessItems;
            case UserRole.TALENT:
                return talentItems;
            default:
                return [];
        }
    };

    const navItems = getNavItems(role);

    return (
        <>
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed left-4 top-4 z-50 rounded-md bg-[#242424] p-2 text-white lg:hidden"
            >
                <Menu size={20} />
            </button>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#242424] text-white transition-transform duration-200 lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center px-4 pt-2">
                    <Image
                        src="/logo-dark-transparent.png"
                        alt="PivotHire"
                        width={120}
                        height={32}
                        className="h-10 w-auto object-contain"
                    />
                </div>

                {/* CTA for Business */}
                {(role === UserRole.BUSINESS) && (
                    <div className="px-3 py-4">
                        <Link
                            href="/dashboard/post-task"
                            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#242424] hover:bg-gray-100 transition-colors"
                        >
                            <PlusCircle size={16} />
                            Post a New Task
                        </Link>
                    </div>
                )}

                <nav className="flex-1 space-y-1 px-3 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "h-9 w-9",
                                    userButtonPopoverCard: "border-[#242424]",
                                }
                            }}
                        />
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium text-white">
                                {user?.fullName || user?.username || "User"}
                            </span>
                            <span className="truncate text-xs text-gray-400 capitalize">
                                {role || "Loading..."}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
