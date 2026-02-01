"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, User } from "lucide-react";
import Image from "next/image";

const STEPS = [
    "Business Profile",
    "Project Info",
    "Budget & Timeline",
    "Tech Stack",
    "Talent Preference",
    "Review"
];

type Message = {
    role: "ai" | "user";
    content: string;
};

export default function PostTaskPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I'm your PivotHire Agent. I'll help you define your task requirements. Let's start with your Business Profile. What is the name of your company and what industry are you in?" }
    ]);
    const [input, setInput] = useState("");
    const [formData, setFormData] = useState({
        businessName: "",
        industry: "",
        projectTitle: "",
        projectDescription: "",
        budget: "",
        timeline: "",
        techStack: "",
        talentType: ""
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formScrollRef = useRef<HTMLDivElement>(null);

    // Unsaved changes warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-scroll form when step changes
    useEffect(() => {
        if (formScrollRef.current) {
            const scrollContainer = formScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [currentStep, formData]);

    const sendMessage = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input } as Message];
        setMessages(newMessages);
        setInput("");

        // Simulate AI feeling "thinking" then response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: "ai", content: "Got it. I've updated the details. Is there anything else you'd like to add?" }]);
        }, 1000);
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
        // No toast needed
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const isReview = currentStep === STEPS.length - 1;

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4 relative pb-20">
            {/* Top Stepper */}
            <div className="mx-8 mt-6 shrink-0 rounded-xl border bg-white px-8 py-6 shadow-sm">
                <div className="relative flex items-center justify-between">
                    {/* Dashed Background Line */}
                    <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 border-t-2 border-dashed border-gray-200" />

                    {/* Progress Fill (Solid) */}
                    <div
                        className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-[#242424] transition-all duration-300"
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;

                        return (
                            <div key={step} className="flex flex-col items-center bg-white px-2">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${isCompleted || isCurrent
                                        ? "border-[#242424] bg-[#242424] text-white"
                                        : "border-gray-300 bg-white text-gray-300"
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs">{index + 1}</span>}
                                </div>
                                <span className={`mt-2 text-xs font-medium ${isCurrent ? "text-[#242424]" : "text-gray-500"}`}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area - Use min-h-0 to allow inner scroll areas to function in grid/flex */}
            <div className="grid flex-1 grid-cols-12 gap-6 px-8 min-h-0">

                {/* Left: AI Chatbot (2/3 width) - Hidden on Review */}
                <div className={`${isReview ? "hidden" : "col-span-8"} flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300`}>
                    {/* Frozen Header */}
                    <div className="flex h-16 shrink-0 items-center justify-center border-b bg-white relative">
                        <div className="flex items-center gap-2">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                <Image
                                    src="/icon.png"
                                    alt="Agent"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="font-bold text-[#242424]">PivotHire Agent</h3>
                        </div>
                    </div>

                    {/* Scrollable Chat Area */}
                    <ScrollArea className="flex-1">
                        <div className="space-y-4 p-6">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                                    {msg.role === 'ai' && (
                                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-gray-100">
                                            <Image src="/icon.png" alt="AI" fill className="object-cover" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${msg.role === "ai"
                                            ? "bg-gray-100 text-[#242424]"
                                            : "bg-[#242424] text-white"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                                            <User size={16} className="text-gray-500" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Frozen Footer / Input */}
                    <div className="shrink-0 border-t bg-white p-4">
                        <form
                            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your response..."
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" className="bg-[#242424] text-white hover:bg-[#242424]/90">
                                <Send size={18} />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Right: Summary Form (1/3 width normally, Full width on Review) */}
                <div className={`${isReview ? "col-span-12" : "col-span-4"} flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300`}>
                    {/* Frozen Header - Aligned Height (h-16) */}
                    <div className="flex h-16 shrink-0 items-center justify-center border-b bg-white">
                        <h3 className="text-lg font-bold text-[#242424]">Task Summary</h3>
                    </div>

                    {/* Scrollable Form Area */}
                    <ScrollArea className="flex-1" ref={formScrollRef}>
                        <div className="space-y-6 p-6">

                            {/* Step 1: Business Profile */}
                            <div className={`space-y-3 ${currentStep > 0 && !isReview ? "opacity-70" : ""}`}>
                                <div className="flex items-center gap-2 font-medium text-[#242424]">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">1</div>
                                    Business Profile
                                </div>
                                <div className="grid gap-2 pl-7">
                                    <div className="grid gap-1">
                                        <label className="text-xs font-medium text-gray-500">Company Name</label>
                                        <Input
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="Acme Inc."
                                            disabled={currentStep > 0 && !isReview}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-xs font-medium text-gray-500">Industry</label>
                                        <Input
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            placeholder="Tech, Healthcare..."
                                            disabled={currentStep > 0 && !isReview}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Step 2: Project Info */}
                            {(currentStep >= 1 || isReview) && (
                                <div className={`space-y-3 ${currentStep > 1 && !isReview ? "opacity-70" : ""}`}>
                                    <div className="flex items-center gap-2 font-medium text-[#242424]">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">2</div>
                                        Project Info
                                    </div>
                                    <div className="grid gap-2 pl-7">
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Project Title</label>
                                            <Input
                                                value={formData.projectTitle}
                                                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                                                placeholder="e.g. New Website"
                                                disabled={currentStep > 1 && !isReview}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Description</label>
                                            <Textarea
                                                value={formData.projectDescription}
                                                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                                                placeholder="Brief description..."
                                                className="min-h-[80px]"
                                                disabled={currentStep > 1 && !isReview}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Budget & Timeline */}
                            {(currentStep >= 2 || isReview) && (
                                <div className={`space-y-3 ${currentStep > 2 && !isReview ? "opacity-70" : ""}`}>
                                    <div className="flex items-center gap-2 font-medium text-[#242424]">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">3</div>
                                        Budget & Timeline
                                    </div>
                                    <div className="grid gap-2 pl-7">
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Budget ($)</label>
                                            <Input
                                                value={formData.budget}
                                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                placeholder="5000"
                                                disabled={currentStep > 2 && !isReview}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Timeline</label>
                                            <Input
                                                value={formData.timeline}
                                                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                                placeholder="e.g. 2 months"
                                                disabled={currentStep > 2 && !isReview}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Tech Stack (New) */}
                            {(currentStep >= 3 || isReview) && (
                                <div className={`space-y-3 ${currentStep > 3 && !isReview ? "opacity-70" : ""}`}>
                                    <div className="flex items-center gap-2 font-medium text-[#242424]">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">4</div>
                                        Tech Stack
                                    </div>
                                    <div className="grid gap-2 pl-7">
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Technologies</label>
                                            <Input
                                                value={formData.techStack}
                                                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                                placeholder="React, Node.js..."
                                                disabled={currentStep > 3 && !isReview}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Talent Preference (New) */}
                            {(currentStep >= 4 || isReview) && (
                                <div className={`space-y-3 ${currentStep > 4 && !isReview ? "opacity-70" : ""}`}>
                                    <div className="flex items-center gap-2 font-medium text-[#242424]">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">5</div>
                                        Talent Preference
                                    </div>
                                    <div className="grid gap-2 pl-7">
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium text-gray-500">Talent Type</label>
                                            <Input
                                                value={formData.talentType}
                                                onChange={(e) => setFormData({ ...formData, talentType: e.target.value })}
                                                placeholder="Senior, Junior, Agency..."
                                                disabled={currentStep > 4 && !isReview}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Extra Bottom Padding for Scrolling past content */}
                            <div className="h-10" />
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Navigation Controls - Fixed Position */}
            <div className="absolute bottom-6 left-8 z-20">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="min-w-[120px] shadow-sm bg-white"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back
                </Button>
            </div>

            <div className="absolute bottom-6 right-8 z-20">
                <Button
                    size="lg"
                    onClick={handleNext}
                    className="min-w-[120px] bg-[#242424] text-white shadow-lg hover:bg-[#242424]/90"
                >
                    {isReview ? "Submit Task" : "Next Step"}
                    <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
        </div>
    );
}
