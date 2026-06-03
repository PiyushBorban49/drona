"use client";
import React, { useRef, useEffect } from "react";

interface ColorDotProps {
    color?: string;
    className?: string;
}

export default function ColorDot({ color, className = "" }: ColorDotProps) {
    const dotRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (dotRef.current && color) {
            dotRef.current.style.backgroundColor = color;
        }
    }, [color]);

    return <span ref={dotRef} className={`w-3 h-3 rounded-full border-[2px] border-black ${className}`} />;
}
