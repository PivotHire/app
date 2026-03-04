'use server';

import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ProjectStatus, MilestoneStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getDbUser() {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!dbUser) throw new Error('User not found in database');
    return dbUser;
}

export async function getProjects() {
    const dbUser = await getDbUser();

    // Admin sees all, others see their own
    const where = dbUser.role === 'admin' ? {} : { ownerId: dbUser.id };

    const projects = await prisma.project.findMany({
        where,
        include: {
            milestones: {
                orderBy: { sortOrder: 'asc' },
            },
            owner: {
                select: { email: true },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return projects;
}

export async function getProjectById(id: string) {
    const dbUser = await getDbUser();

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            milestones: {
                orderBy: { sortOrder: 'asc' },
            },
            owner: {
                select: { email: true, giteaUsername: true },
            },
        },
    });

    if (!project) throw new Error('Project not found');

    // Non-admin can only view their own projects
    if (dbUser.role !== 'admin' && project.ownerId !== dbUser.id) {
        throw new Error('Unauthorized');
    }

    return project;
}

export async function createProject(data: {
    name: string;
    description?: string;
    demoUrl?: string;
    giteaOwner?: string;
    giteaRepo?: string;
}) {
    const dbUser = await getDbUser();

    const project = await prisma.project.create({
        data: {
            ...data,
            ownerId: dbUser.id,
            milestones: {
                create: [
                    { title: 'Requirements', sortOrder: 0, status: 'pending' },
                    { title: 'Design', sortOrder: 1, status: 'pending' },
                    { title: 'Development', sortOrder: 2, status: 'pending' },
                    { title: 'Testing', sortOrder: 3, status: 'pending' },
                    { title: 'Deployment', sortOrder: 4, status: 'pending' },
                ],
            },
        },
    });

    revalidatePath('/dashboard/projects');
    return project;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
    const dbUser = await getDbUser();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (dbUser.role !== 'admin' && project.ownerId !== dbUser.id) {
        throw new Error('Unauthorized');
    }

    await prisma.project.update({
        where: { id: projectId },
        data: { status },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
}

export async function updateMilestoneStatus(milestoneId: string, status: MilestoneStatus) {
    const dbUser = await getDbUser();

    const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { project: true },
    });

    if (!milestone) throw new Error('Milestone not found');
    if (dbUser.role !== 'admin' && milestone.project.ownerId !== dbUser.id) {
        throw new Error('Unauthorized');
    }

    await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
            status,
            completedAt: status === 'completed' ? new Date() : null,
        },
    });

    revalidatePath(`/dashboard/projects/${milestone.projectId}`);
}

export async function getGiteaToken() {
    const dbUser = await getDbUser();
    return dbUser.giteaAccessToken;
}

export async function submitTask(formData: {
    businessName: string;
    industry: string;
    projectTitle: string;
    projectDescription: string;
    budget: string;
    timeline: string;
    techStack: string;
    otherRequirements: string;
}) {
    const dbUser = await getDbUser();

    // Build a structured description from all form fields
    const description = [
        formData.projectDescription,
        '',
        `Industry: ${formData.industry}`,
        `Budget: ${formData.budget}`,
        `Timeline: ${formData.timeline}`,
        `Tech Stack: ${formData.techStack}`,
        `Other Requirements: ${formData.otherRequirements}`,
    ].join('\n');

    const project = await prisma.project.create({
        data: {
            name: formData.projectTitle || formData.businessName,
            description,
            status: 'awaiting_match',
            ownerId: dbUser.id,
            milestones: {
                create: [
                    { title: 'Requirements', sortOrder: 0, status: 'pending' },
                    { title: 'Design', sortOrder: 1, status: 'pending' },
                    { title: 'Development', sortOrder: 2, status: 'pending' },
                    { title: 'Testing', sortOrder: 3, status: 'pending' },
                    { title: 'Deployment', sortOrder: 4, status: 'pending' },
                ],
            },
        },
    });

    revalidatePath('/dashboard/projects');
    return { id: project.id };
}

