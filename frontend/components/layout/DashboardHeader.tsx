"use client";
import React from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export function DashboardHeader() {
    const { user } = useUser();

    return (
        <header className="h-20 bg-white border-b-[3px] border-black flex items-center px-8 justify-end shrink-0 relative z-30">
            {/* Actions */}
            <div className="flex items-center gap-6 relative">
                <Link href="/dashboard/settings">
                    <button className="p-2 hover:bg-gray-100 transition-colors group" title="Settings">
                        <Settings size={24} className="text-[#003BFF] group-hover:rotate-45 transition-transform" strokeWidth={2.5} />
                    </button>
                </Link>

                <Link href="/dashboard/profile">
                    <div className="w-10 h-10 rounded-lg border-[3px] border-black overflow-hidden shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-gray-200 hover:-translate-y-1 transition-transform cursor-pointer">
                        {user?.imageUrl ? (
                            <Image
                                src={user.imageUrl}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#BE003F] flex items-center justify-center text-white font-black">
                                {user?.firstName?.charAt(0) || "L"}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
