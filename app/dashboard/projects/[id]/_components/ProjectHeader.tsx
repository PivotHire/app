'use client';

import { ProjectStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<ProjectStatus, { color: string; dot: string; label: string }> = {
    awaiting_match: { color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', label: 'Awaiting Match' },
    in_progress: { color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
    on_hold: { color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'On Hold' },
    completed: { color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    cancelled: { color: 'bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
};

interface ProjectHeaderProps {
    project: {
        id: string;
        name: string;
        description: string | null;
        status: ProjectStatus;
        demoUrl: string | null;
        updatedAt: Date;
        owner: { email: string };
    };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
    const config = statusConfig[project.status];

    return (
        <div className="space-y-3">
            <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={14} />
                Back to Projects
            </Link>

            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-[#242424]">
                            {project.name}
                        </h1>
                        <span className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            config.color
                        )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                            {config.label}
                        </span>
                    </div>
                    {project.description && (
                        <p className="text-sm text-gray-500 max-w-2xl">{project.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        })}
                        {' · '}
                        Owner: {project.owner.email}
                    </p>
                </div>

                {project.demoUrl && (
                    <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <ExternalLink size={12} />
                        Open Demo
                    </a>
                )}
            </div>
        </div>
    );
}
