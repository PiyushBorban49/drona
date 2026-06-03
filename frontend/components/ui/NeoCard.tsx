import React from 'react';
import { LucideIcon } from 'lucide-react';

export const NeoCard: React.FC<{
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}> = ({ title, subtitle, icon: Icon, children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${onClick ? 'cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)]' : ''} ${className}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="font-extrabold text-black text-lg tracking-tight leading-tight">{title}</h3>
                    {subtitle && <p className="text-sm font-bold text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {Icon && <Icon size={20} />}
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
};
