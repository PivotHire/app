'use client';

import Atropos from 'atropos/react';
import 'atropos/css';
import { AuthTimelineCard } from './AuthTimelineCard';
import { BackgroundLogo } from './BackgroundLogo';

interface AuthRightSideProps {
    title: string;
}

export function AuthRightSide({ title }: AuthRightSideProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#242424] text-white rounded-[2rem] p-12 overflow-hidden relative">
            {/* Background Logo Texture */}
            <BackgroundLogo />

            {/* Background decorative glares */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-3xl -translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-black/40 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 pointer-events-none" />

            {/* Content */}
            <h2 className="mb-12 text-3xl font-bold z-10 text-center max-w-xl">
                {title}
            </h2>

            <div className="w-full max-w-md z-10 flex justify-center">
                <Atropos className="w-auto h-auto shadow-2xl rounded-xl" activeOffset={40} shadowScale={1.05}>
                    <AuthTimelineCard />
                </Atropos>
            </div>
        </div>
    );
}
