"use client";

import NextImage from "next/image";
import NextLink from "next/link";
import { useSignIn, useSignUp, useClerk, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Chrome, Github, Mail, Lock, ArrowRight, Check, AlertCircle, Loader2, KeyRound } from "lucide-react";

export default function AuthClient() {
    const { isLoaded: signInLoaded, signIn } = useSignIn();
    const { isLoaded: signUpLoaded, signUp } = useSignUp();
    const { setActive } = useClerk();
    const { isLoaded: authLoaded, isSignedIn } = useAuth();

    const isLoaded = signInLoaded && signUpLoaded && authLoaded;


    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const router = useRouter();

    const onSignInWithEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signIn) return;
        setLoading("email");
        setError(null);

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push("/dashboard");
            }
        }
        catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Invalid email or password");
        }
        finally {
            setLoading(null);
        }
    };

    const onSignUpWithEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signUp) return;
        setLoading("email");
        setError(null);

        try {
            await signUp.create({
                emailAddress: email,
                password,
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: unknown) {
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Failed to create account");
        } finally {

            setLoading(null);
        }
    };

    const onVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signUp) return;
        setLoading("verify");
        setError(null);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code
            });
            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                router.push("/dashboard");
            } else {
                console.log("Sign-up status after verification:", completeSignUp.status);
                setError("Verification incomplete. Please try again.");
            }
        } catch (err: unknown) {
            console.error("Verification error:", err);
            const clerkError = err as { errors?: { message: string }[] };
            setError(clerkError.errors?.[0]?.message || "Invalid verification code. Please try again.");
        } finally {

            setLoading(null);
        }
    };

    const handleSocialLogin = async (strategy: "oauth_google" | "oauth_github") => {
        if (!signIn) return;

        if (isSignedIn) {
            router.push("/dashboard");
            return;
        }

        try {
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err: unknown) {
            console.error("OAuth Error:", err);
            const clerkError = err as { errors?: { code: string; message: string }[]; message?: string };
            // If already signed in, just go to dashboard
            if (clerkError.errors?.[0]?.code === "already_signed_in" || clerkError.message?.includes("already signed in")) {
                router.push("/dashboard");
            } else {
                setError(clerkError.errors?.[0]?.message || "Something went wrong with social login");
            }
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-[#ECECEC] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#0D43E8]" size={48} strokeWidth={3} />
            </div>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#ECECEC] font-sans">
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* LEFT SIDE */}
                <section className="relative hidden lg:flex items-center justify-center overflow-hidden bg-[#E7DD52] border-r-[3px] border-black p-12">
                    {/* Decorative Blocks */}
                    <motion.div
                        initial={{ x: 100, rotate: 20 }}
                        animate={{ x: 0, rotate: 6 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="absolute top-[-90px] right-[-30px] w-[260px] h-[320px] bg-[#0D43E8] border-[3px] border-black shadow-[8px_8px_0px_#000]"
                    />

                    <motion.div
                        initial={{ x: -100, rotate: -20 }}
                        animate={{ x: 0, rotate: -6 }}
                        transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
                        className="absolute bottom-[-100px] left-[-40px] w-[220px] h-[220px] bg-[#FF0055] border-[3px] border-black shadow-[8px_8px_0px_#000]"
                    />

                    {/* Main Info Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
                        animate={{ scale: 1, opacity: 1, rotate: -2 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative z-10 w-[420px] bg-[#F3F3F3] border-[4px] border-black shadow-[12px_12px_0px_#000] p-10"
                    >
                        <p className="text-[#0D43E8] text-[12px] tracking-[0.3em] font-black uppercase mb-4">
                            DRONACHARYA LEARNING
                        </p>

                        <h1 className="text-[56px] leading-[0.85] font-black uppercase text-black mb-6">
                            {isSignUp ? "START YOUR" : "MASTER THE"}
                            <br />
                            <span className="text-[#FF0055]">{isSignUp ? "JOURNEY." : "FUTURE."}</span>
                        </h1>

                        <p className="text-[20px] leading-tight text-[#303030] font-bold">
                            {isSignUp
                                ? "Join the community of modern learners and unlock the power of AI-driven education."
                                : "Dronacharya is an AI-powered ecosystem designed for the modern learner with mind maps, quizzes, and intelligent tutoring."}
                        </p>

                        <div className="mt-8 flex gap-3">
                            <div className="w-12 h-3 bg-black" />
                            <div className="w-6 h-3 bg-[#0D43E8]" />
                            <div className="w-3 h-3 bg-[#FF0055]" />
                        </div>
                    </motion.div>

                    {/* Bottom Card */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="absolute bottom-10 right-16 rotate-[3deg]"
                    >
                        <div className="relative border-[3px] border-black shadow-[8px_8px_0px_#000] overflow-hidden bg-black group">
                            <NextImage
                                src="/ai-chip.png"
                                alt="AI"
                                width={300}
                                height={220}
                                className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-90"
                            />

                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                <span className="bg-[#FF0055] text-white text-[10px] font-black px-3 py-1 border-[2px] border-black shadow-[3px_3px_0px_#000] w-fit">
                                    AI GUIDED
                                </span>

                                <span className="bg-[#0D43E8] text-white text-[10px] font-black px-3 py-1 border-[2px] border-black shadow-[3px_3px_0px_#000] w-fit">
                                    SMART LEARNING
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* RIGHT SIDE */}
                <section className="flex flex-col items-center justify-center px-6 py-8 lg:py-4 bg-[#ECECEC] overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-[440px]"
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-2 mb-6 group cursor-pointer" onClick={() => { setIsSignUp(false); setPendingVerification(false); }}>
                            <div className="w-8 h-8 bg-[#0D43E8] border-[2px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center overflow-hidden">
                                <span className="text-white font-black text-xl">D</span>
                            </div>
                            <h2 className="text-[#0D43E8] text-3xl font-black italic tracking-tighter group-hover:tracking-normal transition-all duration-300">
                                DRONACHARYA
                            </h2>
                        </div>

                        <AnimatePresence mode="wait">
                            {!pendingVerification ? (
                                <motion.div
                                    key="auth-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    {/* Heading */}
                                    <div className="mb-6">
                                        <h1 className="text-[52px] leading-[0.85] font-black uppercase text-black">
                                            {isSignUp ? "Create" : "Welcome"}
                                            <br />
                                            <span className="text-[#0D43E8]">{isSignUp ? "Account" : "Back"}</span>
                                        </h1>

                                        <p className="mt-2 text-lg leading-tight text-[#4B4B4B] font-bold">
                                            {isSignUp
                                                ? "Initialize your access to the intelligent learning gateway."
                                                : "Ready to level up? Sign in to continue your journey."}
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                className="bg-[#FF0055] text-white p-3 border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 font-bold text-sm"
                                            >
                                                <AlertCircle size={18} strokeWidth={3} />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* OAuth Buttons */}
                                    <div className="grid grid-cols-2 gap-4 mb-5">
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin("oauth_google")}
                                            disabled={!!loading}
                                            className="flex items-center justify-center gap-2 w-full h-[56px] bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] font-black uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-gray-100 disabled:opacity-50"
                                        >
                                            <Chrome size={18} strokeWidth={3} />
                                            Google
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin("oauth_github")}
                                            disabled={!!loading}
                                            className="flex items-center justify-center gap-2 w-full h-[56px] bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] font-black uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-gray-100 disabled:opacity-50"
                                        >
                                            <Github size={18} strokeWidth={3} />
                                            Github
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex-1 h-[2px] bg-black" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black bg-[#ECECEC] px-2">
                                            Or email access
                                        </span>
                                        <div className="flex-1 h-[2px] bg-black" />
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={isSignUp ? onSignUpWithEmail : onSignInWithEmail} className="space-y-4">
                                        <div className="relative group">
                                            <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider mb-1 text-black">
                                                <Mail size={12} strokeWidth={3} />
                                                Email Address
                                            </label>

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="name@dronacharya.ai"
                                                required
                                                className="w-full h-[56px] border-[3px] border-black bg-white px-5 text-base font-bold outline-none focus:bg-[#E7DD52] shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:text-gray-400"
                                            />
                                        </div>

                                        <div className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-black">
                                                    <Lock size={12} strokeWidth={3} />
                                                    Password
                                                </label>

                                                {!isSignUp && (
                                                    <NextLink
                                                        href="/forgot-password"
                                                        className="text-[#0D43E8] text-[10px] font-black uppercase hover:underline"
                                                    >
                                                        Forgot?
                                                    </NextLink>
                                                )}
                                            </div>

                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="w-full h-[56px] border-[3px] border-black bg-white px-5 text-base font-bold outline-none focus:bg-[#FF0055] focus:text-white shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:text-gray-400"
                                            />
                                        </div>

                                        {/* Remember */}
                                        {!isSignUp && (
                                            <div className="flex items-center justify-between pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setRememberMe(!rememberMe)}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    <div className={`w-6 h-6 border-[2px] border-black shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center ${rememberMe ? 'bg-[#0D43E8]' : 'bg-white'} group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_#000]`}>
                                                        {rememberMe && <Check size={16} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                    <span className="text-base font-black uppercase tracking-tight text-black">
                                                        Keep me logged in
                                                    </span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={!!loading}
                                            className="group w-full h-[72px] mt-2 bg-[#0D43E8] text-white text-2xl font-black uppercase border-[3px] border-black shadow-[6px_6px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {loading === "email" ? (
                                                <Loader2 className="animate-spin" size={32} strokeWidth={3} />
                                            ) : (
                                                <>
                                                    {isSignUp ? "Join Now" : "Sign In"}
                                                    <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {/* Toggle Mode */}
                                    <p className="text-center mt-5 text-base text-black font-bold">
                                        {isSignUp ? "Already have an account?" : "New to Dronacharya?"}{" "}
                                        <button
                                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                                            className="text-[#FF0055] underline decoration-[2px] underline-offset-4 hover:bg-[#FF0055] hover:text-white px-1 transition-colors"
                                        >
                                            {isSignUp ? "Sign In" : "Create Account"}
                                        </button>
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="verify-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="mb-6">
                                        <h1 className="text-[52px] leading-[0.85] font-black uppercase text-black">
                                            Verify
                                            <br />
                                            <span className="text-[#FF0055]">Email</span>
                                        </h1>

                                        <p className="mt-2 text-lg leading-tight text-[#4B4B4B] font-bold">
                                            Enter the 6-digit code sent to your email address to initialize access.
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                className="bg-[#FF0055] text-white p-3 border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 font-bold text-sm"
                                            >
                                                <AlertCircle size={18} strokeWidth={3} />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={onVerifyCode} className="space-y-4">
                                        <div className="relative group">
                                            <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider mb-1 text-black">
                                                <KeyRound size={12} strokeWidth={3} />
                                                Verification Code
                                            </label>

                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                placeholder="123456"
                                                maxLength={6}
                                                required
                                                className="w-full h-[64px] border-[3px] border-black bg-white px-5 text-3xl font-black text-center tracking-[0.5em] outline-none focus:bg-[#E7DD52] shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:text-gray-300"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!!loading}
                                            className="group w-full h-[72px] mt-2 bg-[#FF0055] text-white text-2xl font-black uppercase border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {loading === "verify" ? (
                                                <Loader2 className="animate-spin" size={32} strokeWidth={3} />
                                            ) : (
                                                <>
                                                    Verify & Complete
                                                    <Check size={28} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPendingVerification(false)}
                                            className="w-full py-2 text-[10px] font-black uppercase text-gray-500 hover:text-black transition-colors"
                                        >
                                            Back to Registration
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="mt-8 flex justify-center">
                            <p className="px-4 py-2 bg-white border-[2px] border-black shadow-[3px_3px_0px_#000] text-[9px] text-center text-gray-500 font-black uppercase tracking-[0.2em]">
                                Secure Encrypted Authentication Interface
                            </p>
                        </div>
                    </motion.div>
                </section>
            </div>

            {/* Required for Clerk bot protection sign-up flows */}
            <div id="clerk-captcha" />
        </main>
    );
}
