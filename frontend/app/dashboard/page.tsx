"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame, GraduationCap, Star,
  PlayCircle, BrainCircuit, Library, ChevronRight
} from "lucide-react";

import Image from "next/image";
import { useUser } from "@/context/AuthContext";
import { fetchAPI } from "@/lib/api";
import ProgressBar from "@/components/ProgressBar";
import QuickStartComponent from "@/components/QuickStartComponent";

interface Course {
  id: string;
  title: string;
  category: string;
  image: string;
  progress: number;
  timeLeft: string;
  video_url?: string;
  playback_id?: string;
}

interface UserStats {
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  hours_learned: number;
  continue_learning: Course[];
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    let cancelled = false;

    async function load() {
      try {
        // Streak bump on dashboard visit (preserves the legacy behaviour).
        await fetchAPI("/user/activity/ping", { method: "POST", body: "{}" });

        const data = await fetchAPI<{ success: boolean; stats: UserStats }>("/user/stats");
        if (!cancelled) {
          setStats(data.stats);
          setStatsError(null);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
        if (!cancelled) setStatsError(err instanceof Error ? err.message : "Failed to load stats");
      }
    }

    void load();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded || (isSignedIn && !stats && !statsError)) {
    return (
      <div className="max-w-6xl mx-auto py-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Defaults when stats are missing or failed to load
  const view = {
    streak: stats?.streak ?? 0,
    lessonsSaved: stats?.continue_learning?.length ?? 0,
    xp: stats?.xp ?? 0,
    level: stats?.level ?? 1,
    hoursLearned: Math.round(stats?.hours_learned ?? 0),
    xpToNextLevel: 500,
    continueLearning: stats?.continue_learning ?? [],
  };

  const XP_PER_LEVEL = view.xpToNextLevel;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-black leading-none">
            Welcome back, {user?.firstName || 'Learner'}!
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <p className="text-xl font-bold text-gray-600 tracking-tight">
              Ready to crush your learning goals today?
            </p>
          </div>
          {statsError && (
            <p className="mt-3 text-sm font-bold text-red-600">{statsError}</p>
          )}
        </div>
        <QuickStartComponent />
      </div>


      {/* Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Streak Card */}
        <div className="bg-[#F4E361] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-60">Current Streak</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-7xl font-black tracking-tighter">{view.streak}</span>
              <span className="text-xl font-black uppercase">Days</span>
            </div>
            <p className="text-xs font-bold text-black mt-4 max-w-[150px]">
              {view.streak > 0 ? "You're on fire! Keep it up." : "Start your streak today!"}
            </p>
          </div>
          <Flame size={120} className="absolute -bottom-4 -right-4 text-black opacity-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
        </div>

        {/* Lessons Saved Card */}
        <div className="bg-[#D1D5FF] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-60">Lessons Saved</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-7xl font-black tracking-tighter">{view.lessonsSaved}</span>
              <span className="text-lg font-black uppercase mt-4">/ {view.hoursLearned}h studied</span>
            </div>
            <p className="text-xs font-bold text-black mt-4 max-w-[180px]">Every video you generate lands here.</p>
          </div>
          <GraduationCap size={120} className="absolute -bottom-8 -right-4 text-black opacity-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
        </div>

        {/* XP Card */}
        <div className="bg-[#F7CAD0] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-60">Total XP</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-black tracking-tighter">{view.xp.toLocaleString()}</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-8 relative">
              <ProgressBar
                progress={(view.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100}
                title="XP Progress"
                barClassName="bg-[#BE003F]"
              />
              <div className="text-[10px] font-black uppercase tracking-widest mt-4">Level {view.level} • {XP_PER_LEVEL - (view.xp % XP_PER_LEVEL)} XP to Next Level</div>
            </div>
          </div>
          <Star size={120} className="absolute -bottom-4 -right-4 text-black opacity-10 group-hover:rotate-12 transition-transform" strokeWidth={3} />
        </div>
      </div>

      {/* Grid: Continue Learning + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-end justify-between border-b-[4px] border-black pb-2">
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Continue Learning</h2>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">View All</button>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {view.continueLearning.length === 0 && (
              <p className="text-sm font-bold text-gray-500">
                Nothing here yet — generate your first AI video and it will show up.
              </p>
            )}
            {view.continueLearning.map((course: Course) => (
              <Link
                key={course.id}
                href={`/dashboard/video?topic=${encodeURIComponent(course.title)}${course.video_url ? `&video_url=${encodeURIComponent(course.video_url)}` : ''}${course.playback_id ? `&playback_id=${encodeURIComponent(course.playback_id)}` : ''}`}
                className="block"
              >
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden hover:translate-x-2 transition-transform cursor-pointer group">
                  <div className="w-full h-48 bg-black relative">
                    {course.playback_id ? (
                      <video
                        src={`https://stream.mux.com/${course.playback_id}.m3u8`}
                        className="w-full h-full object-cover opacity-60"
                        muted
                      />
                    ) : (
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                        <PlayCircle size={24} className="text-black ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="bg-[#BE003F] text-white text-[10px] font-black uppercase px-3 py-1 border-[2px] border-black">{course.category}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400">{course.timeLeft}</span>
                      </div>
                      <h3 className="text-2xl font-black tracking-tighter text-black leading-tight">{course.title}</h3>
                    </div>
                    <div className="mt-6">
                      <ProgressBar
                        progress={course.progress}
                        title={`Progress in ${course.title}`}
                        className="h-6"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="flex items-end border-b-[4px] border-black pb-2">
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Quick Actions</h2>
          </div>

          <div className="space-y-4">
            {[
              { icon: PlayCircle, label: "Create AI Video", desc: "Turn text into lecture", path: "/dashboard/video" },
              { icon: BrainCircuit, label: "New Quiz", desc: "Test your knowledge", path: "/dashboard/quiz" },
              { icon: Library, label: "Flashcards", desc: "Review key terms", path: "/dashboard/chat" },
            ].map((action) => (
              <Link key={action.label} href={action.path} className="block group">
                <div className="bg-white border-[4px] border-black p-6 flex items-center justify-between shadow-[6px_6px_0_0_rgba(0,0,0,1)] group-hover:bg-[#F4E361] transition-all group-active:translate-x-1 group-active:translate-y-1 hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                      <action.icon size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black leading-tight">{action.label}</h4>
                      <p className="text-xs font-bold text-gray-500 leading-tight">{action.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-black group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
