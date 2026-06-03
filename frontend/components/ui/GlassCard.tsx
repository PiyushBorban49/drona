import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className = "", hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <div
            className={`glass-panel ${hoverEffect ? 'glass-panel-hover' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
