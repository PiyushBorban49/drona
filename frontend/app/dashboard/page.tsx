import React from "react";
import Link from "next/link";
import {
  Flame, GraduationCap, Star,
  PlayCircle, BrainCircuit, Library, ChevronRight
} from "lucide-react";

import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import clientPromise from "@/lib/mongodb";
import { update_streak } from "@/lib/user_service";
import ProgressBar from "@/components/ProgressBar";

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

import QuickStartComponent from "@/components/QuickStartComponent";

export default async function DashboardPage() {
  const user = await currentUser();

  let mongoUser = null;
  if (user) {
    try {
      const client = await clientPromise;
      if (client) {
        const db = client.db();
        // Sync streak on load
        await update_streak(user.id);

        const email = user.emailAddresses[0]?.emailAddress;

        // Sync basic info and initialize stats if they don't exist
        const result = await db.collection("users").findOneAndUpdate(
          { clerkId: user.id },
          {
            $set: {
              email: email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "User",
              updatedAt: new Date()
            },
            $setOnInsert: {
              clerkId: user.id,
              createdAt: new Date(),
              streak: 0,
              xp: 0,
              hoursLearned: 0,
              coursesCompleted: 0,
              level: 1,
              continueLearning: [
                {
                  id: "course-1",
                  title: "Introduction to Cellular Biology",
                  category: "Biology 101",
                  image: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop",
                  progress: 65,
                  timeLeft: "12 mins left"
                }
              ]
            }
          },
          { upsert: true, returnDocument: 'after' }
        );

        // MongoDB driver version compatibility fix
        // In v6+, findOneAndUpdate returns the document directly or a ModifyResult if specified
        mongoUser = (result && 'value' in result) ? result.value : result;

        if (mongoUser) {
          console.log(`[Dashboard] User sync successful for ${email} (Clerk ID: ${user.id})`);
        } else {
          console.warn(`[Dashboard] User sync failed or returned no document for ${email}`);
        }
      } else {
        console.warn("[Dashboard] MongoDB client is null — skipping user sync.");
      }
    } catch (error) {
      console.error("Failed to sync/fetch user from MongoDB:", error);
    }
  }

  // Fallback to defaults if DB fails or mongoUser is null
  const stats = {
    streak: mongoUser?.streak ?? 0,
    coursesCompleted: mongoUser?.coursesCompleted ?? 0,
    xp: mongoUser?.xp ?? 0,
    level: mongoUser?.level ?? 1,
    xpToNextLevel: 500,
    continueLearning: mongoUser?.continueLearning ?? [],
  };
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
              <span className="text-7xl font-black tracking-tighter">{stats.streak}</span>
              <span className="text-xl font-black uppercase">Days</span>
            </div>
            <p className="text-xs font-bold text-black mt-4 max-w-[150px]">
              {stats.streak > 0 ? "You're on fire! Keep it up." : "Start your streak today!"}
            </p>
          </div>
          <Flame size={120} className="absolute -bottom-4 -right-4 text-black opacity-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
        </div>

        {/* Courses Card */}
        <div className="bg-[#D1D5FF] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-60">Courses Completed</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-7xl font-black tracking-tighter">{stats.coursesCompleted}</span>
            </div>
            <p className="text-xs font-bold text-black mt-4 max-w-[180px]">Keep learning to reach the top!</p>
          </div>
          <GraduationCap size={120} className="absolute -bottom-8 -right-4 text-black opacity-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
        </div>

        {/* XP Card */}
        <div className="bg-[#F7CAD0] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-60">Total XP</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-black tracking-tighter">{stats.xp.toLocaleString()}</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-8 relative">
              <ProgressBar
                progress={(stats.xp % stats.xpToNextLevel) / stats.xpToNextLevel * 100}
                title="XP Progress"
                barClassName="bg-[#BE003F]"
              />
              <div className="text-[10px] font-black uppercase tracking-widest mt-4">Level {stats.level} • {stats.xpToNextLevel - (stats.xp % stats.xpToNextLevel)} XP to Next Level</div>
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
            {stats.continueLearning.map((course: Course) => (
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
