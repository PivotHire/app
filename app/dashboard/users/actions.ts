"use server";

import { createClerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/lib/roles";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function getUsers() {
    const users = await clerkClient.users.getUserList({
        limit: 100, // Good enough for MVP
    });

    return JSON.parse(JSON.stringify(users.data));
}

export async function updateUserRole(userId: string, role: UserRole) {
    try {
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, error: "Failed to update role" };
    }
}
