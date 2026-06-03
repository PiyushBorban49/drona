"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Video, BrainCircuit, MessageSquare,
    HelpCircle, LogOut, Layers, Network
} from "lucide-react";


const navItems = [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/video", label: "AI Video", Icon: Video },
    { href: "/dashboard/quiz", label: "Quizzes", Icon: BrainCircuit },
    { href: "/dashboard/explorer", label: "Mind Map", Icon: Network },
    { href: "/dashboard/flashcards", label: "Flashcards", Icon: Layers },
    { href: "/dashboard/chat", label: "AI Tutor", Icon: MessageSquare },
];

export function MainSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-full bg-[#f3f4f6] flex flex-col border-r-[3px] border-black overflow-hidden relative z-40">
            {/* Branding */}
            <div className="p-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-[#003BFF] p-2 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <Network size={24} className="text-white" strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-black leading-none">
                            LUMINA
                        </h1>
                        <span className="text-[9px] font-black tracking-wider text-gray-500 mt-1 uppercase">
                            Edu-OS v1.0
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={`flex items-center gap-4 px-4 py-3 border-[3px] transition-all ${isActive
                                    ? "bg-[#F4E361] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1 text-black"
                                    : "bg-transparent border-transparent text-gray-600 hover:border-black hover:bg-white hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:text-black"
                                    }`}
                            >
                                <item.Icon size={20} strokeWidth={isActive ? 3 : 2} className={isActive ? "text-black" : ""} />
                                <span className={`text-[13px] font-black tracking-tight`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-4">
                {/* Upgrade Pro Button */}
                <button className="w-full bg-[#BE003F] text-white border-[3px] border-black py-4 px-2 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                    GO PRO
                </button>

                <div className="pt-4 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-black transition-colors group text-left">
                        <HelpCircle size={20} className="group-hover:stroke-[3px]" />
                        <span className="text-sm font-black tracking-tight">Help</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-black transition-colors group text-left">
                        <LogOut size={20} className="group-hover:stroke-[3px]" />
                        <span className="text-sm font-black tracking-tight">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
