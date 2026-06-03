"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    handleRedirectCallback({
      afterSignInUrl: "/dashboard",
      afterSignUpUrl: "/dashboard",
      redirectUrl: "/dashboard",
    }).catch((err) => {
      console.error("SSO Callback Error:", err);
      router.push("/");
    });
  }, [handleRedirectCallback, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#ECECEC]">
      <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_#000] p-10 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-[#0D43E8] animate-spin" strokeWidth={3} />
        <h1 className="text-2xl text-black font-black uppercase italic">
          Completing Login...
        </h1>
      </div>
      <div id="clerk-captcha"></div>
    </div>
  );
}