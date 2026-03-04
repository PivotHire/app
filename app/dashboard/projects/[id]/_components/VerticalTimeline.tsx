'use client';

import { useRef, useEffect, useState } from 'react';
import { MilestoneStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { Check, Circle, Loader2, SkipForward } from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    description: string | null;
    status: MilestoneStatus;
    completedAt: Date | null;
    sortOrder: number;
}

interface VerticalTimelineProps {
    milestones: Milestone[];
}

const MIN_ITEM_HEIGHT = 80; // px — minimum height per milestone

const statusIcon: Record<MilestoneStatus, React.ReactNode> = {
    completed: <Check size={14} className="text-white" />,
    in_progress: <Loader2 size={14} className="text-white animate-spin" />,
    pending: <Circle size={10} className="text-gray-400" />,
    skipped: <SkipForward size={12} className="text-gray-400" />,
};

const statusStyles: Record<MilestoneStatus, { dot: string; label: string; labelColor: string }> = {
    completed: {
        dot: 'bg-emerald-500 ring-emerald-100',
        label: 'Completed',
        labelColor: 'text-emerald-600',
    },
    in_progress: {
        dot: 'bg-blue-500 ring-blue-100',
        label: 'In Progress',
        labelColor: 'text-blue-600',
    },
    pending: {
        dot: 'bg-white border-2 border-gray-300 ring-gray-50',
        label: 'Pending',
        labelColor: 'text-gray-400',
    },
    skipped: {
        dot: 'bg-gray-200 ring-gray-50',
        label: 'Skipped',
        labelColor: 'text-gray-400',
    },
};

export function VerticalTimeline({ milestones }: VerticalTimelineProps) {
    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progressPct = milestones.length > 0
        ? Math.round((completedCount / milestones.length) * 100)
        : 0;

    const containerRef = useRef<HTMLDivElement>(null);
    const [needsScroll, setNeedsScroll] = useState(false);

    useEffect(() => {
        const check = () => {
            if (!containerRef.current) return;
            const available = containerRef.current.clientHeight;
            const needed = milestones.length * MIN_ITEM_HEIGHT;
            setNeedsScroll(needed > available);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [milestones.length]);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#242424]">Project Timeline</h3>
                <span className="text-xs font-medium text-gray-500">{completedCount}/{milestones.length} completed</span>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Timeline area — fills remaining space */}
            <div
                ref={containerRef}
                className={cn(
                    'relative flex-1 min-h-0',
                    needsScroll && 'overflow-y-auto pr-2'
                )}
            >
                <div className={cn(
                    'relative',
                    !needsScroll && 'h-full flex flex-col'
                )}>
                    {milestones.map((milestone, index) => {
                        const styles = statusStyles[milestone.status];
                        const isLast = index === milestones.length - 1;

                        return (
                            <div
                                key={milestone.id}
                                className={cn(
                                    'relative flex gap-4',
                                    !needsScroll && !isLast && 'flex-1',
                                    !needsScroll && isLast && 'shrink-0',
                                )}
                                style={needsScroll ? { minHeight: `${MIN_ITEM_HEIGHT}px` } : undefined}
                            >
                                {/* Connector line */}
                                {!isLast && (
                                    <div className="absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] bg-gray-200">
                                        {milestone.status === 'completed' && (
                                            <div className="w-full h-full bg-emerald-300 rounded-full" />
                                        )}
                                    </div>
                                )}

                                {/* Dot */}
                                <div
                                    className={cn(
                                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 transition-all',
                                        styles.dot
                                    )}
                                >
                                    {statusIcon[milestone.status]}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'text-sm font-medium',
                                            milestone.status === 'completed' ? 'text-[#242424]' :
                                                milestone.status === 'in_progress' ? 'text-[#242424]' :
                                                    'text-gray-400'
                                        )}>
                                            {milestone.title}
                                        </span>
                                        <span className={cn(
                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                            styles.labelColor,
                                            milestone.status === 'in_progress' && 'bg-blue-50',
                                            milestone.status === 'completed' && 'bg-emerald-50',
                                        )}>
                                            {styles.label}
                                        </span>
                                    </div>

                                    {milestone.description && (
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            {milestone.description}
                                        </p>
                                    )}

                                    {milestone.completedAt && (
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            Completed on {new Date(milestone.completedAt).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
