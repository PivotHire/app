'use client';

import { cn } from '@/lib/utils';
import { Check, Circle, Loader2 } from 'lucide-react';

const milestones = [
    {
        id: '1',
        title: 'Requirements',
        description: 'Gather requirements and scope',
        status: 'completed',
        completedAt: 'Jan 14',
    },
    {
        id: '2',
        title: 'Design',
        description: 'UI/UX design and prototyping',
        status: 'completed',
        completedAt: 'Jan 31',
    },
    {
        id: '3',
        title: 'Development',
        description: 'Core frontend implementation',
        status: 'in_progress',
    },
    {
        id: '4',
        title: 'Testing',
        description: 'QA and user acceptance testing',
        status: 'pending',
    },
    {
        id: '5',
        title: 'Deployment',
        description: 'Production deployment and monitoring',
        status: 'pending',
    },
];

const statusIcon: Record<string, React.ReactNode> = {
    completed: <Check size={14} className="text-white" />,
    in_progress: <Loader2 size={14} className="text-white animate-spin" />,
    pending: <Circle size={10} className="text-gray-400" />,
};

const statusStyles: Record<string, { dot: string; label: string; labelColor: string }> = {
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
};

export function AuthTimelineCard() {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xl flex-1 flex flex-col text-left font-sans w-[380px] max-w-full" data-atropos-offset="0">
            <div className="flex items-center justify-between mb-4" data-atropos-offset="1">
                <h3 className="text-base font-semibold text-[#242424]">Project Timeline</h3>
                <span className="text-xs font-medium text-gray-500">2/5 completed</span>
            </div>

            {/* Progress bar */}
            <div className="mb-6 relative h-1.5" data-atropos-offset="1">
                <div className="absolute inset-0 rounded-full bg-gray-100" />
                <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: '40%' }}
                    data-atropos-offset="2"
                />
            </div>

            {/* Timeline area */}
            <div className="relative flex-1" data-atropos-offset="1">
                <div className="relative flex flex-col">
                    {milestones.map((milestone, index) => {
                        const styles = statusStyles[milestone.status];
                        const isLast = index === milestones.length - 1;

                        return (
                            <div
                                key={milestone.id}
                                className={cn(
                                    'relative flex gap-4',
                                    !isLast ? 'pb-8' : ''
                                )}
                            >
                                {/* Connector line */}
                                {!isLast && (
                                    <div className="absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] bg-gray-200" data-atropos-offset="1">
                                        {milestone.status === 'completed' && (
                                            <div className="w-full h-full bg-emerald-300 rounded-full" data-atropos-offset="2" />
                                        )}
                                    </div>
                                )}

                                {/* Dot */}
                                <div
                                    className={cn(
                                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4',
                                        styles.dot
                                    )}
                                    data-atropos-offset="4"
                                >
                                    <div data-atropos-offset="6">
                                        {statusIcon[milestone.status]}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2" data-atropos-offset="4">
                                        <span className={cn(
                                            'text-sm font-medium',
                                            milestone.status === 'completed' || milestone.status === 'in_progress' ? 'text-[#242424]' : 'text-gray-400'
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
                                        <p className="mt-0.5 text-xs text-gray-400" data-atropos-offset="3">
                                            {milestone.description}
                                        </p>
                                    )}

                                    {milestone.completedAt && (
                                        <p className="mt-1 text-[10px] text-gray-400" data-atropos-offset="2">
                                            Completed on {milestone.completedAt}
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
