"use client";
import React, { useRef, useEffect } from "react";

interface ProgressBarProps {
    progress: number;
    title: string;
    className?: string;
    barClassName?: string;
}

export default function ProgressBar({ progress, title, className = "", barClassName = "" }: ProgressBarProps) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (barRef.current) {
            const rounded = Math.round(progress);
            barRef.current.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
            barRef.current.setAttribute("aria-valuenow", rounded.toString());
            barRef.current.setAttribute("aria-valuemin", "0");
            barRef.current.setAttribute("aria-valuemax", "100");
            barRef.current.setAttribute("role", "progressbar");
            barRef.current.setAttribute("title", title);
        }
    }, [progress, title]);

    return (
        <div
            className={`w-full h-6 bg-white border-[3px] border-black p-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${className}`}
        >
            <div
                ref={barRef}
                className={`h-full bg-[#2F58EE] border-r-[3px] border-black transition-all ${barClassName}`}
            />
        </div>
    );
}
