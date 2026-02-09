'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { UserRole, BusinessProfile, TalentProfile, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to ensure user exists in DB
async function ensureUserExists() {
    const user = await currentUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
        throw new Error('User has no email address');
    }

    // Check if user exists, if not create
    let dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: {
            businessProfile: true,
            talentProfile: true,
        },
    });

    if (!dbUser) {
        console.log(`Creating user for ${email}`);
        dbUser = await prisma.user.create({
            data: {
                clerkId: user.id,
                email: email,
                role: UserRole.business,
            },
            include: {
                businessProfile: true,
                talentProfile: true,
            },
        });
    }

    // Sync Clerk Metadata if needed
    const client = await clerkClient();
    if (user.publicMetadata.role !== dbUser.role) {
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                role: dbUser.role,
            },
        });
    }

    return dbUser;
}

export async function getUserProfile() {
    const user = await ensureUserExists();
    return user;
}

// Update User Role
export async function updateUserRole(role: UserRole) {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    await prisma.user.update({
        where: { clerkId: user.id },
        data: { role },
    });

    // Sync with Clerk
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
            role: role,
        },
    });

    revalidatePath('/dashboard/profile');
}

// Update Business Profile
export async function updateBusinessProfile(data: Partial<BusinessProfile>) {
    const user = await getUserProfile();

    // Clean up data (remove id, userId, createdAt, updatedAt if present)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId, createdAt, updatedAt, ...updateData } = data as any;

    await prisma.businessProfile.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            ...updateData,
        },
        update: {
            ...updateData,
        },
    });

    revalidatePath('/dashboard/profile');
    return { success: true };
}

// Update Talent Profile
export async function updateTalentProfile(data: Partial<TalentProfile>) {
    const user = await getUserProfile();

    // Clean up data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId, createdAt, updatedAt, ...updateData } = data as any;

    await prisma.talentProfile.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            ...updateData,
        },
        update: {
            ...updateData,
        },
    });

    revalidatePath('/dashboard/profile');
    return { success: true };
}
