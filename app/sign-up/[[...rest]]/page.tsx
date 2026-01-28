import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
    return (
        <div className="flex h-screen w-full">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col justify-between bg-white p-8 lg:w-1/2">
                <div>
                    <Image
                        src="/logo-light-transparent.png"
                        alt="PivotHire Logo"
                        width={150}
                        height={40}
                        priority
                    />
                </div>

                <div className="flex flex-col items-center justify-center">
                    <div className="w-full max-w-sm">
                        <SignUp
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    cardBox: {
                                        border: "none",
                                        boxShadow: "none",
                                    },
                                    footer: "hidden",
                                    header: "hidden",
                                    formButtonPrimary: 'bg-[#242424] text-white hover:bg-[#242424]/90',
                                    footerActionLink: 'text-[#242424] hover:text-[#242424]/90',
                                    formFieldInput: 'rounded-md border-gray-300',
                                }
                            }}
                        />
                        <div className="w-full text-center text-xs text-neutral-500"><span>Already have an account? <Link href="/sign-in" className="text-[#242424] hover:text-[#242424]/90">Sign In</Link></span></div>
                    </div>
                </div>

                <div className="text-xs text-neutral-500">
                    &copy; {new Date().getFullYear()} PivotHire Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden w-1/2 flex-col items-center justify-center bg-[#242424] p-12 text-white lg:flex">
                <div className="max-w-md text-center">
                    <h2 className="mb-4 text-3xl font-bold">
                        Join the workforce revolution
                    </h2>
                    <p className="text-gray-300">
                        Connect with top-tier engineering talent today
                    </p>
                    {/* Placeholder for future logos/diagrams */}
                    <div className="mt-12 flex items-center justify-center rounded-lg bg-white/5 p-8 backdrop-blur-sm">
                        <span className="text-sm opacity-50">[Dashboard Preview / Diagram Placeholder]</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
