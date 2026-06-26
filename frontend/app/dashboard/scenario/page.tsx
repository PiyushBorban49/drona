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
                <div className="flex flex-col gap-8">
                    {/* TOP INFO BAR: Mission Intel & Stats */}
                    <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-8 items-stretch transform transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
                        {/* Section 1: Quest & Setting */}
                        <div className="flex-1 space-y-4 pr-0 lg:pr-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black/10 pb-6 lg:pb-0">
                            <div className="flex items-center gap-3">
                                <Scroll className="text-[#BE003F]" size={20} />
                                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{scenario.title}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <MapPin size={12} /> Setting
                                    </h4>
                                    <p className="text-sm font-bold leading-tight">{scenario.setting}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} /> Role
                                    </h4>
                                    <p className="text-sm font-bold leading-tight">{scenario.student_role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Objective & Knowledge Nodes */}
                        <div className="flex-[1.5] space-y-4 pr-0 lg:pr-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black/10 pb-6 lg:pb-0 text-left">
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Target size={12} className="text-[#BE003F]" /> Primary Objective
                                </h4>
                                <p className="text-lg font-black leading-tight italic text-black/80">{scenario.objective}</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Knowledge Nodes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {scenario.topics_tested.map(tag => (
                                        <span key={tag} className="text-[10px] font-black uppercase bg-gray-50 border-[2px] border-black px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Status Bars */}
                        <div className="flex flex-row lg:flex-col justify-center gap-4 min-w-[200px]">
                            <div className="bg-black text-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex-1 flex flex-col justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest block mb-2">Battle Health</span>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map(h => (
                                        <div key={h} className={`w-4 h-4 ${(evaluation?.accuracy_score ?? 10) < 4 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#00FF47] p-4 border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex-1 flex flex-col justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Knowledge Sync</span>
                                <span className="text-3xl font-black tabular-nums">{evaluation?.accuracy_score || 0}/10</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 items-stretch">
                        {/* Expanded Chat Area: Full Width */}
                        <div className="w-full flex flex-col min-h-screen bg-white border-[4px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] overflow-hidden relative">
                            {/* Static Texture Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-5 z-20"></div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide bg-[#f9fafb]">
                                {history.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end text-right' : 'items-start'}`}
                                    >
                                        <div className={`flex items-center gap-3 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-12 h-12 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-[#F4E361]' : 'bg-[#BE003F] text-white'}`}>
                                                {msg.role === 'user' ? <User size={24} /> : <Gamepad size={24} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                                                {msg.role === 'user' ? 'Strategist' : 'Scenario AI'}
                                            </span>
                                        </div>
                                        <div className={`p-8 border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-[85%] text-2xl font-bold leading-tight ${msg.role === 'user' ? 'bg-[#BE003F] text-white rounded-3xl rounded-tr-none' : 'bg-white text-black rounded-3xl rounded-tl-none tabular-nums italic'}`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="p-6 border-[3px] border-black bg-white flex items-center gap-4 animate-pulse shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                            <Loader2 className="animate-spin text-[#BE003F]" size={24} />
                                            <span className="text-[12px] font-black uppercase tracking-widest">Character is responding...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Section */}
                            <div className="p-8 border-t-[4px] border-black bg-white flex gap-6">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                                    placeholder="Execute your plan (Use your knowledge to proceed)..."
                                    className="flex-1 bg-gray-50 border-[4px] border-black p-6 text-xl font-bold shadow-[6px_6px_0_0_rgba(0,0,0,1)] focus:outline-none focus:shadow-[8px_8px_0_0_rgba(190,0,63,1)] focus:bg-white transition-all resize-none h-24"
                                />
                                <button
                                    onClick={handleSend}
                                    title="Send Response"
                                    disabled={loading || !input.trim()}
                                    className="w-24 h-24 bg-black text-white border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(190,0,63,1)] hover:bg-[#BE003F] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_0_rgba(190,0,63,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:bg-gray-400 group"
                                >
                                    <ChevronRight size={48} strokeWidth={4} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom: Tactical Feedback */}
                        <AnimatePresence mode="wait">
                            {evaluation ? (
                                <motion.div
                                    key="eval"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-12 items-center"
                                >
                                    <div className="flex items-center gap-4 min-w-[250px] border-b-4 lg:border-b-0 lg:border-r-4 border-black pb-4 lg:pb-0 lg:pr-8 h-full">
                                        <div className="w-16 h-16 bg-[#00FF47] border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                            <BrainCircuit className="text-black" size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Tactical Feedback</h3>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 block">Real-time Analysis</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full">
                                        <div className="flex-[2] bg-[#BE003F]/10 border-2 border-[#BE003F] p-6 relative">
                                            <div className="absolute -top-3 -left-3 bg-[#BE003F] text-white px-2 py-1 text-[8px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">Intelligence</div>
                                            <p className="text-base font-bold leading-tight text-black italic">
                                                &quot;{evaluation.feedback}&quot;
                                            </p>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Execution Accuracy</span>
                                                <span className="text-xl font-black">{(evaluation?.accuracy_score ?? 0) * 10}%</span>
                                            </div>
                                            <ProgressBar
                                                progress={(evaluation?.accuracy_score ?? 0) * 10}
                                                title="Accuracy Rating"
                                                className="h-8 border-3 shadow-none border-black"
                                                barClassName="bg-[#00FF47] border-r-3 border-black"
                                            />
                                        </div>

                                        <div className="flex-1 space-y-3 lg:border-l-2 border-black/10 lg:pl-8">
                                            <span className="text-[12px] font-black uppercase tracking-widest text-black/60 block">Demonstrated Concepts</span>
                                            <div className="flex flex-wrap gap-2">
                                                {evaluation.concepts_demonstrated.map((c: string) => (
                                                    <span key={c} className="text-[11px] font-black px-3 py-1.5 bg-[#F4E361] border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-gray-50 border-[4px] border-black border-dashed p-12 text-center flex flex-row items-center justify-center gap-8 opacity-30">
                                    <AlertTriangle size={32} className="text-gray-400" />
                                    <div className="text-left">
                                        <p className="text-sm font-black uppercase tracking-widest">Waiting for Tactical Intel</p>
                                        <p className="text-[10px] font-bold text-gray-500">Execution feedback will appear here after your next move.</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
