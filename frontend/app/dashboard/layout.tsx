"use client";
import React from "react";
import { StudyProvider } from "@/context/StudyContext";
import { MainSidebar } from "@/components/layout/MainSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <StudyProvider>
            <div className="flex h-screen overflow-hidden bg-white">
                <MainSidebar />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <DashboardHeader />
                    <main className="flex-1 relative overflow-y-auto bg-white p-8">
                        {children}
                    </main>
                </div>
            </div>
        </StudyProvider>
    );
}
