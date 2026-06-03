"use client";
import React, { useState } from "react";
import { X, Save, User as UserIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
    const { user, isLoaded } = useUser();
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !isLoaded) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            await user.update({
                firstName,
                lastName,
            });
            alert("Profile updated successfully!");
            onClose();
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white border-[4px] border-black w-full max-w-md shadow-[12px_12px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
                <div className="bg-[#F4E361] border-b-[4px] border-black p-4 flex items-center justify-between">
                    <h3 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                        <UserIcon size={24} strokeWidth={3} />
                        Edit Profile
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/10 transition-colors"
                        title="Close Modal"
                        aria-label="Close Profile Edit Modal"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-white border-[3px] border-black p-3 font-bold focus:outline-none focus:bg-gray-50 transition-colors"
                                required
                                placeholder="Enter your first name"
                                title="First Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-white border-[3px] border-black p-3 font-bold focus:outline-none focus:bg-gray-50 transition-colors"
                                required
                                placeholder="Enter your last name"
                                title="Last Name"
                            />
                        </div>

                        <div className="pt-4 border-t-2 border-black/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-snug">
                                To update your email or profile picture, please use the main account security settings.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border-[3px] border-black font-black uppercase text-sm tracking-widest hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-3 bg-[#003BFF] text-white border-[3px] border-black font-black uppercase text-sm tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                        >
                            <Save size={18} strokeWidth={3} />
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
