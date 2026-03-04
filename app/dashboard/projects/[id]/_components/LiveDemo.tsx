'use client';

import { ExternalLink, MonitorPlay } from 'lucide-react';

interface LiveDemoProps {
    demoUrl: string | null;
}

export function LiveDemo({ demoUrl }: LiveDemoProps) {
    if (!demoUrl) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center flex-1">
                <div className="flex flex-col items-center gap-3 text-center p-8">
                    <div className="rounded-full bg-gray-100 p-4">
                        <MonitorPlay size={24} className="text-gray-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">No Live Demo Available</p>
                        <p className="mt-1 text-xs text-gray-400">
                            A demo URL has not been configured for this project yet.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="ml-2 text-xs text-gray-400 truncate max-w-[200px]">
                        {demoUrl}
                    </span>
                </div>
                <a
                    href={demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ExternalLink size={14} />
                </a>
            </div>

            {/* iframe */}
            <div className="flex-1 relative bg-gray-50">
                <iframe
                    src={demoUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    loading="lazy"
                    title="Live Demo Preview"
                />
            </div>
        </div>
    );
}
