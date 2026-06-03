"use client";
import React, { useState, useRef, useEffect } from "react";
import { startDebate, getDebateRound, judgeDebate, Debate, DebateRound } from "@/lib/api";
import {
    Gavel, Sword, Shield, Trophy, ChevronRight, Loader2, Play
} from "lucide-react";

import { motion } from "framer-motion";


export default function DebatePage() {
    const [topic, setTopic] = useState("");
    const [debate, setDebate] = useState<Debate | null>(null);
    const [currentRound, setCurrentRound] = useState<DebateRound | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showJudgment, setShowJudgment] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleStart = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const res = await startDebate(topic);
            if (res.success) {
                setDebate(res.debate);
                // Start first round automatically
                const roundRes = await getDebateRound(topic, res.debate.stance_a, res.debate.stance_b, 1);
                if (roundRes.success) {
                    setCurrentRound(roundRes.round);
                    setDebate(prev => prev ? { ...prev, rounds: [roundRes.round] } : null);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNextRound = async () => {
        if (!debate) return;
        setLoading(true);
        setFeedback(null);
        setShowJudgment(false);
        const nextRoundNum = debate.rounds.length + 1;
        try {
            const roundRes = await getDebateRound(debate.topic, debate.stance_a, debate.stance_b, nextRoundNum);
            if (roundRes.success) {
                setCurrentRound(roundRes.round);
                setDebate(prev => prev ? { ...prev, rounds: [...prev.rounds, roundRes.round] } : null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleJudge = async (verdict: 'a' | 'b' | 'draw') => {
        if (!debate || !currentRound) return;
        setLoading(true);
        try {
            const res = await judgeDebate(debate.topic, currentRound.argument_a, currentRound.argument_b, verdict);
            if (res.success) {
                setFeedback(res.feedback);
                setShowJudgment(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debate?.rounds, currentRound]);

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[8px] border-black pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#F4E361] border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                            <Gavel size={32} strokeWidth={3} />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-black">
                            Socratic Debate
                        </h1>
                    </div>
                    <p className="text-xl font-bold text-gray-500 max-w-xl leading-tight">
                        Witness a clash of perspectives. Evaluate the arguments, bridge the gap, and master the concept through critical judgment.
                    </p>
                </div>
            </div>

            {!debate ? (
                /* Initial Topic Input */
                <div className="bg-white border-[4px] border-black p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-2xl mx-auto space-y-8 mt-12">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-black/60">What shall we debate today?</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleStart()}
                            placeholder="e.g. Is friction always useful?"
                            className="w-full px-8 py-6 bg-gray-50 border-[4px] border-black text-2xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[-4px] focus:translate-y-[-4px] focus:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all"
                        />
                    </div>
                    <button
                        onClick={handleStart}
                        disabled={loading || !topic}
                        className="w-full py-6 bg-black text-white border-[4px] border-black text-xl font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-[8px_8px_0_0_rgba(244,227,97,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_0_rgba(244,227,97,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:bg-gray-400"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" size={20} /> Initialize Arena</>}
                    </button>
                </div>
            ) : (
                /* Active Debate View */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar / Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#2F58EE] text-white border-[4px] border-black p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Active Arena</h3>
                            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{debate.topic}</h2>
                        </div>

                        <div className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest border-b-[2px] border-black pb-2">The Forces</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase text-red-500 tracking-widest">Stance A</span>
                                    <p className="text-xs font-black leading-tight">{debate.stance_a}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Stance B</span>
                                    <p className="text-xs font-black leading-tight">{debate.stance_b}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#F4E361] border-[4px] border-black p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Rounds</h3>
                                <span className="text-lg font-black">{debate.rounds.length}</span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(r => (
                                    <div key={r} className={`flex-1 h-3 border-[2px] border-black ${r <= debate.rounds.length ? 'bg-black' : 'bg-white'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Arena */}
                    <div className="lg:col-span-3 space-y-12">
                        {/* Debate History */}
                        <div className="space-y-12 pb-12 overflow-y-auto max-h-[70vh] px-4 scrollbar-hide">
                            {debate.rounds.map((round, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-[2px] bg-black opacity-20"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-black text-white px-4 py-1">Round {round.round_num}</span>
                                        <div className="flex-1 h-[2px] bg-black opacity-20"></div>
                                    </div>

                                    {/* Argument A */}
                                    <div className="flex flex-col items-start max-w-[90%]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                                <Sword className="text-red-500" size={24} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest italic text-red-500">Debater A</span>
                                        </div>
                                        <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-3xl rounded-tl-none">
                                            <p className="text-xl font-bold leading-tight italic">&quot;{round.argument_a}&quot;</p>
                                        </div>
                                    </div>

                                    {/* Argument B */}
                                    <div className="flex flex-col items-end w-full">
                                        <div className="flex items-center gap-3 mb-3 flex-row-reverse">
                                            <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                                <Shield className="text-blue-500" size={24} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest italic text-blue-500 text-right">Debater B</span>
                                        </div>
                                        <div className="bg-[#2F58EE] text-white border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-3xl rounded-tr-none max-w-[90%] ml-auto">
                                            <p className="text-xl font-bold leading-tight italic">&quot;{round.argument_b}&quot;</p>
                                        </div>
                                    </div>

                                    {/* Moderator and Selection (Only if current round) */}
                                    {idx === debate.rounds.length - 1 && (
                                        <div className="pt-12 space-y-8">
                                            <div className="flex flex-col items-center max-w-[80%] mx-auto">
                                                <div className="w-16 h-16 bg-[#F4E361] rounded-full border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4">
                                                    <Gavel size={32} strokeWidth={3} />
                                                </div>
                                                <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center relative">
                                                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-60 italic">Moderator&apos;s Probe</h3>
                                                    <p className="text-2xl font-black italic tracking-tighter leading-snug">&quot;{round.moderator_question}&quot;</p>
                                                </div>
                                            </div>

                                            {/* Judgment Controls */}
                                            {!showJudgment ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                                                    <button
                                                        onClick={() => handleJudge('a')}
                                                        className="group flex flex-col items-center gap-3 p-8 bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(239,68,68,1)] hover:bg-red-50 hover:translate-y-[-4px] transition-all"
                                                    >
                                                        <Sword size={40} className="text-red-500 group-hover:rotate-12 transition-transform" />
                                                        <span className="text-xs font-black uppercase tracking-widest">Support A</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleJudge('draw')}
                                                        className="group flex flex-col items-center gap-3 p-8 bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:bg-gray-50 hover:translate-y-[-4px] transition-all"
                                                    >
                                                        <Gavel size={40} className="text-black group-hover:scale-110 transition-transform" />
                                                        <span className="text-xs font-black uppercase tracking-widest">It&apos;s a Draw</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleJudge('b')}
                                                        className="group flex flex-col items-center gap-3 p-8 bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(47,88,238,1)] hover:bg-blue-50 hover:translate-y-[-4px] transition-all"
                                                    >
                                                        <Shield size={40} className="text-blue-500 group-hover:-rotate-12 transition-transform" />
                                                        <span className="text-xs font-black uppercase tracking-widest">Support B</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-[#00FF47]/20 border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] space-y-6"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[#00FF47] border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                                            <Trophy size={24} />
                                                        </div>
                                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">The Verdict Analysis</h3>
                                                    </div>
                                                    <p className="text-xl font-bold leading-tight">{feedback}</p>

                                                    <div className="pt-4">
                                                        <button
                                                            onClick={handleNextRound}
                                                            className="flex items-center gap-3 bg-black text-white px-8 py-4 font-black uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,255,71,1)] hover:-translate-y-1 transition-all"
                                                        >
                                                            Proceed to Next Round <ChevronRight size={20} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-center p-12">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-black" size={48} strokeWidth={3} />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Constructing Arguments...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
