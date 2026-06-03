"use client";
import React, { useState } from "react";
import { Zap } from "lucide-react";
import QuickStartTutorial from "./QuickStartTutorial";

export default function QuickStartComponent() {
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsTutorialOpen(true)}
                className="bg-[#2F58EE] text-white border-[4px] border-black py-4 px-8 font-black text-sm uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
            >
                <Zap size={20} fill="currentColor" />
                Quick Start
            </button>

            <QuickStartTutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />
        </>
    );
}
