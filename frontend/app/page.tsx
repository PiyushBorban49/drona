"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/AuthContext";
import AuthClient from "./AuthClient";

export default function Page() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || isSignedIn) {
        return (
            <div className="min-h-screen bg-[#ECECEC] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <AuthClient />;
}
