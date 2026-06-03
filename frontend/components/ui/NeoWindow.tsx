import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeoWindowProps {
    title: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    headerStyle?: 'default' | 'blue' | 'white';
}

export const NeoWindow: React.FC<NeoWindowProps> = ({
    title,
    icon: Icon,
    children,
    className = '',
    bodyClassName = '',
    headerStyle = 'default'
}) => {
    const headerThemes = {
        default: "bg-[#F3F4F6] text-black border-b-[-3px] border-black",
        blue: "bg-[#2F58EE] text-white",
        white: "bg-white text-black",
    };

    return (
        <div className={`bg-white rounded-3xl border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden ${className}`}>
            <div className={`px-5 py-3 flex items-center gap-2 border-b-[3px] border-black font-extrabold tracking-tight ${headerThemes[headerStyle]}`}>
                {Icon && <Icon size={18} strokeWidth={2.5} />}
                {title}
            </div>
            <div className={`flex-1 overflow-auto bg-white ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};
