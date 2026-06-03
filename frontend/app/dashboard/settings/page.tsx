"use client";
import React, { useState } from "react";
import { User, Bell, LogOut, ChevronRight, Settings } from "lucide-react";

import { useClerk, useUser } from "@clerk/nextjs";
import ProfileEditModal from "@/components/ProfileEditModal";

interface SettingsItemBase {
    id: string;
    label: string;
    desc: string;
}

interface SettingsItemAction extends SettingsItemBase {
    action: string;
    onClick: () => void;
}

interface SettingsItemToggle extends SettingsItemBase {
    toggle: boolean;
    onToggle: () => void;
}

interface SettingsItemLink extends SettingsItemBase {
    action: string;
    link: string;
}

type SettingsItem = SettingsItemAction | SettingsItemToggle | SettingsItemLink;

interface SettingsSection {
    title: string;
    icon: React.ElementType;
    items: SettingsItem[];
}

export default function SettingsPage() {
    const { signOut } = useClerk();
    const { user } = useUser();

    // Toggle States
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);

    const [density, setDensity] = useState("Comfortable");
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            window.location.href = "/";
        } catch (err) {
            console.error("Sign out failed", err);
        }
    };

    const toggleDensity = () => {
        const options = ["Comfortable", "Compact", "Spacious"];
        const currentIndex = options.indexOf(density);
        setDensity(options[(currentIndex + 1) % options.length]);
    };

    const sections: SettingsSection[] = [
        {
            title: "Account Settings",
            icon: User,
            items: [
                {
                    id: "profile",
                    label: "Profile Information",
                    desc: user ? `${user.firstName} ${user.lastName}` : "Update your name, email and avatar",
                    action: "Edit",
                    onClick: () => setIsProfileModalOpen(true)
                },
                { id: "personalization", label: "Personalization", desc: "Customize your learning experience", action: "Manage", onClick: () => console.log("Manage Personalization") },
            ]
        },
        {
            title: "Notifications",
            icon: Bell,
            items: [
                { id: "email", label: "Email Notifications", desc: "Weekly summaries and reminders", toggle: emailNotif, onToggle: () => setEmailNotif(!emailNotif) },
                { id: "push", label: "Push Notifications", desc: "Instant updates on video generation", toggle: pushNotif, onToggle: () => setPushNotif(!pushNotif) },
            ]
        },
        {
            title: "Interface Preferences",
            icon: Settings,
            items: [
                { id: "density", label: "Density", desc: "Adjust the UI compactness", action: density, onClick: toggleDensity },
            ]
        }
    ];

    const isToggleItem = (item: SettingsItem): item is SettingsItemToggle => 'toggle' in item;
    const isLinkItem = (item: SettingsItem): item is SettingsItemLink => 'link' in item;
    const isActionItem = (item: SettingsItem): item is SettingsItemAction => 'onClick' in item && !('toggle' in item);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 bg-white text-black">
            <header className="mb-12">
                <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 text-black">Settings</h1>
                <p className="text-xl font-bold text-gray-500 tracking-tight">Manage your account preferences and application settings.</p>
            </header>

            <div className="space-y-12 pb-20">
                {sections.map((section) => (
                    <section key={section.title} className="space-y-6">
                        <div className="flex items-center gap-4 border-b-[4px] border-black pb-2">
                            <div className="w-10 h-10 bg-[#F4E361] border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                                <section.icon size={20} className="text-black" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">{section.title}</h2>
                        </div>

                        <div className="grid gap-4">
                            {section.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border-[3px] border-black p-6 flex items-center justify-between shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all group active:scale-[0.99] bg-white hover:bg-gray-50"
                                >
                                    <div>
                                        <h4 className="font-black text-lg">{item.label}</h4>
                                        <p className="text-sm font-bold text-gray-500">{item.desc}</p>
                                    </div>

                                    {isToggleItem(item) ? (
                                        <button
                                            onClick={item.onToggle}
                                            className={`w-14 h-8 border-[3px] border-black relative transition-all duration-300 ${item.toggle ? 'bg-[#003BFF]' : 'bg-gray-200'}`}
                                            title={`Toggle ${item.label}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 border-[2px] border-black bg-white transition-all duration-300 ${item.toggle ? 'left-7 rotate-90' : 'left-1'}`} />
                                        </button>
                                    ) : isLinkItem(item) ? (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 py-2 px-4 border-[2px] border-black font-black text-xs uppercase tracking-widest bg-white text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all active:shadow-none translate-y-0 active:translate-y-[2px]"
                                        >
                                            {item.action}
                                            <ChevronRight size={14} strokeWidth={3} />
                                        </a>
                                    ) : isActionItem(item) ? (
                                        <button
                                            onClick={item.onClick}
                                            className="flex items-center gap-2 py-2 px-4 border-[2px] border-black font-black text-xs uppercase tracking-widest bg-white text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all active:shadow-none translate-y-0 active:translate-y-[2px]"
                                        >
                                            {item.action}
                                            <ChevronRight size={14} strokeWidth={3} />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <div className="pt-8 border-t-[4px] border-black">
                    <button
                        onClick={handleSignOut}
                        className="w-full py-6 bg-[#BE003F] text-white border-[4px] border-black font-black text-xl uppercase tracking-[0.2em] shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4 active:scale-95"
                    >
                        <LogOut size={24} strokeWidth={3} />
                        Sign Out of Lumina
                    </button>
                </div>
            </div>
            <ProfileEditModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}
