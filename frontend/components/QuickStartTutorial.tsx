"use client";
import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Zap, Search, PlayCircle, Star, Target } from "lucide-react";

interface QuickStartTutorialProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QuickStartTutorial({ isOpen, onClose }: QuickStartTutorialProps) {
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            title: "Welcome to Lumina!",
            desc: "Let's get you ready to crush your NCERT goals in 4 simple steps.",
            icon: Zap,
            color: "bg-[#F4E361]",
        },
        {
            title: "1. Search & Discover",
            desc: "Use the top search bar to find any NCERT topic. From Biology to Business Studies, we've got it all.",
            icon: Search,
            color: "bg-blue-400",
        },
        {
            title: "2. Generate Lectures",
            desc: "Click 'Quick Start' or any topic to generate a custom AI video lecture tailored to your learning pace.",
            icon: PlayCircle,
            color: "bg-pink-400",
        },
        {
            title: "3. Master with Quizzes",
            desc: "After watching, test your knowledge with interactive quizzes and earn XP to level up your avatar.",
            icon: Target,
            color: "bg-emerald-400",
        },
        {
            title: "You're All Set!",
            desc: "The more you learn, the higher your streak. Ready to start your session?",
            icon: Star,
            color: "bg-[#F4E361]",
        }
    ];

    const currentStep = steps[step];
    const Icon = currentStep.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white border-[6px] border-black w-full max-w-xl shadow-[16px_16px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-2 bg-black transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />

                <div className="p-12 flex flex-col items-center text-center space-y-8">
                    <div className={`w-24 h-24 ${currentStep.color} border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)]`}>
                        <Icon size={48} strokeWidth={3} className="text-black" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{currentStep.title}</h2>
                        <p className="text-lg font-bold text-gray-600 leading-tight">{currentStep.desc.replace(/'/g, "&apos;")}</p>
                    </div>

                    <div className="flex gap-4 w-full pt-4">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex-1 py-4 border-[3px] border-black font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={18} strokeWidth={3} />
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 border-[3px] border-black font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Skip
                            </button>
                        )}

                        {step < steps.length - 1 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="flex-1 py-4 bg-black text-white border-[3px] border-black font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_rgba(244,227,97,1)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                Next
                                <ChevronRight size={18} strokeWidth={3} />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-[#003BFF] text-white border-[3px] border-black font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 transition-all"
                            >
                                Let&apos;s Go!
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-black/5 transition-colors"
                    title="Close Tutorial"
                    aria-label="Close Tutorial"
                >
                    <X size={24} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
