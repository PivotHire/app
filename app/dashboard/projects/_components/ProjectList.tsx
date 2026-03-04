'use client';

import { ProjectStatus, MilestoneStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Briefcase, ArrowRight, FolderGit2 } from 'lucide-react';

const statusConfig: Record<ProjectStatus, { color: string; dot: string; label: string }> = {
    awaiting_match: { color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', label: 'Awaiting Match' },
    in_progress: { color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    on_hold: { color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'On Hold' },
    completed: { color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    cancelled: { color: 'bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
};

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    demoUrl: string | null;
    giteaOwner: string | null;
    giteaRepo: string | null;
    updatedAt: Date;
    milestones: {
        id: string;
        status: MilestoneStatus;
    }[];
    owner: { email: string };
}

interface ProjectListProps {
    projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <Briefcase size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No Projects Yet</p>
                <p className="mt-1 text-xs text-gray-400">
                    Projects will appear here once they are created.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
                const config = statusConfig[project.status];
                const totalMilestones = project.milestones.length;
                const completedMilestones = project.milestones.filter(
                    m => m.status === 'completed'
                ).length;
                const progressPct = totalMilestones > 0
                    ? Math.round((completedMilestones / totalMilestones) * 100)
                    : 0;

                return (
                    <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
                    >
                        {/* Top content */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-[#242424] truncate group-hover:text-blue-600 transition-colors">
                                    {project.name}
                                </h3>
                                {project.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1 shrink-0 ml-3" />
                        </div>

                        {/* Spacer to push bottom content down */}
                        <div className="flex-1" />

                        {/* Bottom-aligned content */}
                        <div className="mt-4">
                            {/* Status badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                                    config.color
                                )}>
                                    <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                                    {config.label}
                                </span>
                                {project.giteaRepo && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                                        <FolderGit2 size={10} />
                                        {project.giteaRepo}
                                    </span>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-gray-400">
                                        {completedMilestones}/{totalMilestones} milestones
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-500">{progressPct}%</span>
                                </div>
                                <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400">
                                    Updated {new Date(project.updatedAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
