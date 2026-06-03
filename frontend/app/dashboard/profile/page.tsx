import React from "react";
import {
    Trophy, Target, Zap, Clock, Edit3, Award
} from "lucide-react";
import ProfileActionButtons from "@/components/ProfileActionButtons";

import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import clientPromise from "@/lib/mongodb";
import { update_streak } from "@/lib/user_service";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    let mongoUser = null;
    try {
        const client = await clientPromise;
        if (client) {
            const db = client.db();
            // Sync streak
            await update_streak(user.id);
            mongoUser = await db.collection("users").findOne({ clerkId: user.id });
        }
    } catch (error) {
        console.error("Failed to fetch user for profile:", error);
    }

    const stats = [
        { label: "Total XP", value: (mongoUser?.xp || 0).toLocaleString(), icon: Zap, color: "bg-blue-400" },
        { label: "Current Streak", value: `${mongoUser?.streak || 0} Days`, icon: Trophy, color: "bg-[#F4E361]" },
        { label: "Hours Learned", value: `${mongoUser?.hoursLearned || 0}h`, icon: Clock, color: "bg-pink-400" },
        { label: "Completion", value: `${mongoUser?.coursesCompleted || 0}%`, icon: Target, color: "bg-emerald-400" },
    ];

    const badges = [
        { name: "Early Bird", desc: "Start a session before 6 AM", earned: true },
        { name: "Consistency King", desc: "Maintain a 14-day streak", earned: true },
        { name: "Deep Diver", desc: "Watch 10+ generated videos", earned: true },
        { name: "Quiz Master", desc: "Score 100% on 5 quizzes", earned: false },
        { name: "Global Rank", desc: "Top 1% of Lumina learners", earned: false },
    ];

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-12">
            {/* Profile Header */}
            <div className="bg-white border-[4px] border-black p-10 shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                    <div className="w-40 h-40 rounded-2xl border-[4px] border-black overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-gray-100 relative">
                        <Image
                            src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName || 'User'}`}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <button
                        className="absolute -bottom-4 -right-4 p-3 bg-[#F4E361] border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:scale-110 transition-transform"
                        title="Edit Avatar"
                    >
                        <Edit3 size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-2">
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest border border-white">Lumina Pro</span>
                            <span className="px-3 py-1 bg-blue-100 text-black text-[10px] font-black uppercase tracking-widest border-2 border-black">Level {mongoUser?.level || 1}</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter text-black uppercase">{user.firstName} {user.lastName}</h1>
                        <p className="text-xl font-bold text-gray-500 max-w-xl">Self-taught developer and lifelong learner. Currently mastering Advanced Neural Networks and Matrix Algebra.</p>
                    </div>

                    <ProfileActionButtons />


                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((s) => (
                    <div key={s.label} className={`${s.color} border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] group hover:-translate-y-1 transition-all`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white border-2 border-black rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                <s.icon size={20} strokeWidth={3} />
                            </div>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter text-black">{s.value}</h3>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-black/60 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Badges & Achievements */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-end justify-between border-b-[4px] border-black pb-2">
                        <h2 className="text-4xl font-black tracking-tighter text-black uppercase flex items-center gap-3">
                            <Award size={32} />
                            Achievements
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {badges.map((badge) => (
                            <div key={badge.name} className={`p-6 border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex gap-4 ${badge.earned ? 'bg-white' : 'bg-gray-100 grayscale'}`}>
                                <div className={`w-12 h-12 border-2 border-black rounded-lg flex items-center justify-center shrink-0 ${badge.earned ? 'bg-[#F4E361]' : 'bg-gray-200'}`}>
                                    <Award size={24} strokeWidth={3} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-sm uppercase truncate">{badge.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 leading-tight">{badge.desc}</p>
                                    {!badge.earned && <p className="text-[9px] font-black text-red-500 uppercase mt-1">Locked</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-8">
                    <div className="flex items-end border-b-[4px] border-black pb-2">
                        <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Recent</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: "Completed Quiz", item: "Cell Biology", time: "2h ago" },
                            { title: "Generated Video", item: "Mitochondria", time: "5h ago" },
                            { title: "Gained Badge", item: "Consistency King", time: "1d ago" },
                        ].map((act, i) => (
                            <div key={i} className="bg-white border-[3px] border-black p-4 flex items-center justify-between shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#F4E361] transition-colors cursor-pointer group">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black/60">{act.title}</p>
                                    <h4 className="font-black text-sm uppercase">{act.item}</h4>
                                </div>
                                <span className="text-[10px] font-black uppercase text-blue-600">{act.time}</span>
                            </div>
                        ))}

                        <button className="w-full py-4 border-[3px] border-black font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-2">
                            View Study Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

