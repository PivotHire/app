"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

const STEPS = [
    "Business Profile",
    "Project Info",
    "Budget & Timeline",
    "Tech Stack",
    "Talent Preference",
    "Review"
];

export default function PostTaskPage() {
    const [currentStep, setCurrentStep] = useState(0);
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
    const formScrollAreaRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<any[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your PivotHire Agent. I'll help you define your task requirements. Let's start with your Business Profile. What is the name of your company and what industry are you in?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    // Helper to process chat with history
    const processChat = async (history: any[]) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentStepName: STEPS[currentStep],
                    formData: formData, // Send current form data
                    messages: history.map(m => {
                        const msg: any = {
                            role: m.role,
                            content: m.content || null,
                        };
                        if (m.tool_calls && m.tool_calls.length > 0) {
                            msg.tool_calls = m.tool_calls;
                        }
                        if (m.tool_call_id) {
                            msg.tool_call_id = m.tool_call_id;
                        }
                        if (m.name) {
                            msg.name = m.name;
                        }
                        return msg;
                    })
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || "An error occurred");
                setIsLoading(false);
                return;
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Create a placeholder assistant message
            let assistantMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "",
                tool_calls: [] as any[]
            };

            setMessages(prev => [...prev, assistantMessage]);

            let toolCallBuffer: Record<number, any> = {};

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        const delta = data.choices[0].delta;

                        if (delta.content) {
                            assistantMessage.content += delta.content;
                            setMessages(prev => {
                                const newPrev = [...prev];
                                newPrev[newPrev.length - 1] = { ...assistantMessage };
                                return newPrev;
                            });
                        }

                        if (delta.tool_calls) {
                            for (const toolCall of delta.tool_calls) {
                                const index = toolCall.index;
                                if (!toolCallBuffer[index]) {
                                    toolCallBuffer[index] = {
                                        id: toolCall.id,
                                        type: toolCall.type,
                                        function: { name: "", arguments: "" }
                                    };
                                }
                                if (toolCall.id) toolCallBuffer[index].id = toolCall.id;
                                if (toolCall.function?.name) toolCallBuffer[index].function.name += toolCall.function.name;
                                if (toolCall.function?.arguments) toolCallBuffer[index].function.arguments += toolCall.function.arguments;
                            }
                        }
                    } catch (err) {
                        console.error("Error parsing stream:", err);
                    }
                }
            }

            // After stream ends, check for tool calls
            const finalToolCalls = Object.values(toolCallBuffer).map((tc: any) => ({
                id: tc.id,
                type: 'function',
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }));

            if (finalToolCalls.length > 0) {
                // Update the assistant message with the full tool calls
                assistantMessage.tool_calls = finalToolCalls;
                setMessages(prev => {
                    const newPrev = [...prev];
                    newPrev[newPrev.length - 1] = { ...assistantMessage };
                    return newPrev;
                });

                // Execute tools and generate tool results
                const newHistory = [...history, assistantMessage];

                for (const toolCall of finalToolCalls) {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        // Execute on Client
                        if (toolCall.function.name === 'updateTaskInfo') {
                            setFormData(prev => ({ ...prev, ...args }));
                        } else if (toolCall.function.name === 'completeStep') {
                            // Trigger Next Step
                            // We need to call handleNext, but it might be async/state dependent.
                            // Since we are in the loop, we can't easily access the latest closure of handleNext if it depends on state 
                            // that isn't ref-based, but handleNext mainly depends on 'currentStep' and 'STEPS'.
                            // However, calling state updates in a loop is fine. 
                            // We should defer this slightly or just call it.
                            // Actually, we must be careful not to infinite loop if the AI keeps calling it.
                            // But the AI should stop after calling it.

                            // Using a timeout to break stack or just calling it.
                            setTimeout(() => {
                                handleNext();
                            }, 500);
                        }

                        // Create Tool Result Message
                        const toolMessage = {
                            id: Date.now().toString(),
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                            content: JSON.stringify({ success: true, updated: args })
                        };
                        newHistory.push(toolMessage);
                        setMessages(prev => [...prev, toolMessage]);

                    } catch (e) {
                        console.error("Error parsing/executing tool args:", e);
                        const errorMessage = {
                            id: Date.now().toString(),
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                            content: JSON.stringify({ error: "Failed to execute" })
                        };
                        newHistory.push(errorMessage);
                        setMessages(prev => [...prev, errorMessage]);
                    }
                }

                // Recursively call processChat with the new history (tool results included) 
                // to get the AI confirmation text.
                await processChat(newHistory);
            } else {
                setIsLoading(false);
            }

        } catch (error) {
            console.error("Chat error:", error);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: input };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);
        setInput("");

        await processChat(newHistory);
    };

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);

            // Notify AI that user moved to next step
            const nextStepName = STEPS[currentStep + 1];
            const systemNote = {
                id: Date.now().toString(),
                role: 'system', // or user, but system is hidden usually. 
                // OpenAI API allows system messages in middle, but sometimes 'developer' or treating as user instruction is better.
                // Let's use 'user' message but hidden from UI? 
                // Or just append to history and process.
                // User requested "Trigger next prompt".
                content: `Using the 'Next' button, I have moved to the next step: "${nextStepName}". Please ask for the information required for this step.`
            };

            // We verify if we should show this message in UI. Ideally not, or as a system event. 
            // For simplicity, we can add it as a user action but maybe styled differently, or just standard.
            // Let's treat it as a user message for now so the user sees "I moved next".
            // Actually, better to be invisible to user? 
            // "Hidden trigger". 
            // We can add it to 'messages' but mark it hidden if we want, OR just send it to backend but don't show in UI.
            // But 'setMessages' drives the UI.
            // Let's add it as a visible user message for clarity: "Moving to next step..."

            const userMoveMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: `I am moving to the next step: ${nextStepName}.`
            };

            const newHistory = [...messages, userMoveMessage];
            setMessages(newHistory);
            await processChat(newHistory);
        }
    };

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

    // Auto-scroll form when step changes or formData updates
    useEffect(() => {
        // Find the viewport element of the ScrollArea
        const viewport = formScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            // Use smooth scroll to bottom
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [currentStep, formData]);



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
                <div className={`${isReview ? "hidden" : "col-span-8"} flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 relative`}>
                    {/* Frozen Header */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex h-16 shrink-0 items-center justify-center border-b bg-white/80 backdrop-blur-md">
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
                    {/* Add overflow-y-auto to this container to make it the scroll parent, 
                        and ensure pt-16 accounts for header. 
                        Radix ScrollArea handles this via its Viewport, but we need to ensure layout.
                    */}
                    <div className="flex-1 min-h-0 relative">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col space-y-4 p-6 pt-20 pb-4">
                                {messages.map((msg) => {
                                    // Skip tool messages or empty content
                                    if (msg.role === 'tool') return null;
                                    if (!msg.content && (!msg.tool_calls || msg.tool_calls.length === 0)) return null;
                                    // Also skip messages that are just tool calls without content if we want to hide "Checking..." type states,
                                    // but usually we want to see AI text. If content is empty but has tool_calls, it's a function call.
                                    // User requested to hide JSON. Function calls themselves (from assistant) might be interesting but maybe hidden too?
                                    // "Need not show confirmed JSON". That's the tool RESULT (role=tool).
                                    // The AI tool CALL (role=assistant, tool_calls=[...]) also usually has null content.
                                    if (msg.role === 'assistant' && !msg.content) return null;

                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-gray-100">
                                                    <Image src="/icon.png" alt="AI" fill className="object-cover" />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${msg.role === "assistant"
                                                    ? "bg-gray-100 text-[#242424] prose prose-sm max-w-none"
                                                    : "bg-[#242424] text-white"
                                                    }`}
                                            >
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>

                                            {msg.role === 'user' && (
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                                                    <User size={16} className="text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Frozen Footer / Input */}
                    <div className="shrink-0 border-t bg-white p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(e);
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder={isLoading ? "AI is thinking..." : "Type your response..."}
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" className="bg-[#242424] text-white hover:bg-[#242424]/90" disabled={isLoading}>
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
                    {/* We use pointer-events-none on non-Review steps to prevent manual scrolling if that's what strict 'auto scroll only' implies, 
                        BUT user said "only review stage can free scroll", defaulting to overflow-hidden approach for the container or similar.
                        Actually, Radix ScrollArea is a bit complex. 
                        Let's try a simpler approach: Just add a class that hides scrollbars or disables interaction if !isReview.
                    */}
                    <div className="flex-1 min-h-0 relative" ref={formScrollAreaRef}>
                        <ScrollArea className={`h-full ${!isReview ? 'pointer-events-none' : ''}`}>
                            <div className="space-y-6 p-6" ref={formScrollRef}>

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
