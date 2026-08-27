"use client";
import React from "react";

export default function ProfileActionButtons() {
    const handleEdit = () => {
        // Profile editing is handled by the ProfileEditModal on the settings page.
        window.location.href = "/dashboard/settings";
    };

    return (
        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <button
                onClick={handleEdit}
                className="px-8 py-3 bg-[#003BFF] text-white border-[3px] border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
                Edit Profile
            </button>
        </div>
    );
}
