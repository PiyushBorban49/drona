"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

import { Subtopic } from "@/lib/api";

interface StudyContextType {
    activeTopic: string;
    setActiveTopic: (topic: string) => void;
    activeSubtopic: Subtopic | null;
    setActiveSubtopic: (subtopic: Subtopic | null) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
    const [activeTopic, setActiveTopic] = useState("");
    const [activeSubtopic, setActiveSubtopic] = useState<Subtopic | null>(null);

    return (
        <StudyContext.Provider value={{ activeTopic, setActiveTopic, activeSubtopic, setActiveSubtopic }}>
            {children}
        </StudyContext.Provider>
    );
}

export function useStudy() {
    const context = useContext(StudyContext);
    if (context === undefined) {
        throw new Error("useStudy must be used within a StudyProvider");
    }
    return context;
}
