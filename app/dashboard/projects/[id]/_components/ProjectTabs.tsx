'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerticalTimeline } from './VerticalTimeline';
import { LiveDemo } from './LiveDemo';
import { FileBrowser } from './FileBrowser';
import { LayoutDashboard, MessageSquare, FolderGit2 } from 'lucide-react';
import type { ProjectStatus, MilestoneStatus } from '@prisma/client';

interface ProjectTabsProps {
    project: {
        id: string;
        name: string;
        description: string | null;
        status: ProjectStatus;
        demoUrl: string | null;
        giteaOwner: string | null;
        giteaRepo: string | null;
        milestones: {
            id: string;
            title: string;
            description: string | null;
            status: MilestoneStatus;
            completedAt: Date | null;
            sortOrder: number;
        }[];
        owner: {
            email: string;
            giteaUsername: string | null;
        };
    };
}

export function ProjectTabs({ project }: ProjectTabsProps) {
    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-gray-100/80 p-1">
                <TabsTrigger
                    value="overview"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <LayoutDashboard size={14} />
                    Overview
                </TabsTrigger>
                <TabsTrigger
                    value="messages"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <MessageSquare size={14} />
                    Messages
                </TabsTrigger>
                <TabsTrigger
                    value="files"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <FolderGit2 size={14} />
                    Files
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ minHeight: 'calc(100vh - 320px)' }}>
                    {/* Left: Timeline (2/5) */}
                    <div className="lg:col-span-2 flex flex-col">
                        <VerticalTimeline milestones={project.milestones} />
                    </div>

                    {/* Right: Live Demo (3/5) */}
                    <div className="lg:col-span-3 flex flex-col">
                        <LiveDemo demoUrl={project.demoUrl} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                            <MessageSquare size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Messages Coming Soon</p>
                        <p className="mt-1 text-xs text-gray-400 max-w-sm">
                            AI-organized tickets and work orders will appear here. This feature is under development.
                        </p>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="files" className="mt-6">
                <FileBrowser
                    giteaOwner={project.giteaOwner}
                    giteaRepo={project.giteaRepo}
                />
            </TabsContent>
        </Tabs>
    );
}
