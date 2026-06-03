"use client";
import React, { useState, useRef, useEffect } from "react";
import { startScenario, respondToScenario, Scenario, ChatMessage, ScenarioResponse } from "@/lib/api";
import {
    Gamepad, User, Sword,
    Loader2, Scroll, MapPin, Target,
    BrainCircuit, AlertTriangle,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";

export default function ScenarioPage() {
    const [topic, setTopic] = useState("");
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<ScenarioResponse["evaluation"] | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleStart = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const res = await startScenario(topic);
            if (res.success) {
                setScenario(res.scenario);
                setHistory([{ role: "assistant", content: res.scenario.opening_narrative }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !scenario || loading) return;

        const userMsg = input;
        setInput("");
        const newHistory: ChatMessage[] = [...history, { role: "user" as const, content: userMsg }];
        setHistory(newHistory);
        setLoading(true);

        try {
            const res = await respondToScenario(
                scenario.scenario_id,
                scenario.setting,
                userMsg,
                history
            );

            if (res.success) {
                setHistory([...newHistory, { role: "assistant" as const, content: res.character_response }]);
                setEvaluation(res.evaluation);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 min-h-screen pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[8px] border-black pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#BE003F] text-white border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                            <Gamepad size={32} strokeWidth={3} />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-black">
                            Boss Fight
                        </h1>
                    </div>
                    <p className="text-xl font-bold text-gray-500 max-w-xl leading-tight">
                        Apply your knowledge in high-stakes immersive scenarios. Convince historical figures, solve scientific crises, and earn your mastery.
                    </p>
                </div>
            </div>

            {!scenario ? (
                /* Initial Topic Input */
                <div className="bg-white border-[4px] border-black p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-2xl mx-auto space-y-8 mt-12">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-black/60">Choose your battlefield (Topic)</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleStart()}
                            placeholder="e.g. The French Revolution"
                            className="w-full px-8 py-6 bg-gray-50 border-[4px] border-black text-2xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[-4px] focus:translate-y-[-4px] focus:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all"
                        />
                    </div>
                    <button
                        onClick={handleStart}
                        disabled={loading || !topic}
                        className="w-full py-6 bg-[#BE003F] text-white border-[4px] border-black text-xl font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:bg-gray-400"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Sword fill="currentColor" size={24} /> Enter Scenario</>}
                    </button>
                </div>
            ) : (
                /* Active Scenario View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Mission Intel */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] space-y-6">
                            <div className="space-y-4 pb-4 border-b-2 border-black/10">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                    <Scroll size={12} /> The Quest
                                </h3>
                                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{scenario.title}</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <MapPin size={10} /> Setting
                                    </h4>
                                    <p className="text-xs font-bold leading-tight">{scenario.setting}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={10} /> You Are
                                    </h4>
                                    <p className="text-xs font-bold leading-tight">{scenario.student_role}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Target size={10} /> Objective
                                    </h4>
                                    <p className="text-xs font-bold leading-tight italic text-[#BE003F]">{scenario.objective}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black text-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                <span className="text-[8px] font-black uppercase tracking-widest block mb-1">Health</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(h => (
                                        <div key={h} className={`w-3 h-3 ${(evaluation?.accuracy_score ?? 10) < 4 ? 'bg-red-600' : 'bg-red-500'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#00FF47] p-4 border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                <span className="text-[8px] font-black uppercase tracking-widest block mb-1">Knowledge</span>
                                <span className="text-xl font-black">{evaluation?.accuracy_score || 0}/10</span>
                            </div>
                        </div>

                        {/* Topics Detected */}
                        <div className="bg-gray-50 border-[3px] border-black p-4 space-y-3">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-black/40">Knowledge Nodes</h4>
                            <div className="flex flex-wrap gap-2">
                                {scenario.topics_tested.map(tag => (
                                    <span key={tag} className="text-[8px] font-black uppercase bg-white border-[2px] border-black px-2 py-1">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Narrative View */}
                    <div className="lg:col-span-6 flex flex-col h-[70vh] bg-white border-[4px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] overflow-hidden relative">
                        {/* Static Texture Overlay */}
                        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-5 z-20"></div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                            {history.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end text-right' : 'items-start'}`}
                                >
                                    <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center mb-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-white' : 'bg-[#BE003F] text-white'}`}>
                                        {msg.role === 'user' ? <User size={18} /> : <Gamepad size={18} />}
                                    </div>
                                    <div className={`p-6 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-[90%] text-xl font-bold leading-tight ${msg.role === 'user' ? 'bg-[#BE003F] text-white rounded-3xl rounded-tr-none' : 'bg-white text-black rounded-3xl rounded-tl-none tabular-nums italic'}`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="p-4 border-[3px] border-black bg-white flex items-center gap-3 animate-pulse">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Character is responding...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Section */}
                        <div className="p-6 border-t-[4px] border-black bg-gray-50 flex gap-4">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                                placeholder="Your response (Use your knowledge to proceed)..."
                                className="flex-1 bg-white border-[4px] border-black p-4 text-lg font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0_0_rgba(190,0,63,1)] transition-all resize-none h-16"
                            />
                            <button
                                onClick={handleSend}
                                title="Send Response"
                                disabled={loading || !input.trim()}
                                className="w-16 h-16 bg-black text-white border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(190,0,63,1)] hover:bg-[#BE003F] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:bg-gray-400"
                            >
                                <ChevronRight size={32} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Right: Master's Evaluation */}
                    <div className="lg:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            {evaluation ? (
                                <motion.div
                                    key="eval"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] space-y-6"
                                >
                                    <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
                                        <BrainCircuit className="text-[#BE003F]" size={24} />
                                        <h3 className="text-lg font-black uppercase tracking-tighter">Real-time Check</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-[#BE003F]/10 border-2 border-[#BE003F] p-4">
                                            <p className="text-xs font-bold leading-tight text-gray-700 italic">
                                                &quot;{evaluation.feedback}&quot;
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Accuracy Rating</span>
                                            <ProgressBar
                                                progress={(evaluation?.accuracy_score ?? 0) * 10}
                                                title="Accuracy Rating"
                                                className="h-4 border-2 shadow-none"
                                                barClassName="bg-black border-r-2"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Concepts Used</span>
                                            <div className="flex flex-wrap gap-1">
                                                {evaluation.concepts_demonstrated.map((c: string) => (
                                                    <span key={c} className="text-[10px] font-black px-2 py-1 bg-[#00FF47]/20 border border-black">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-gray-100 border-[4px] border-black border-dashed p-12 text-center flex flex-col items-center gap-4 opacity-40">
                                    <AlertTriangle size={32} />
                                    <p className="text-xs font-black uppercase tracking-widest">Awaiting Knowledge Input</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
