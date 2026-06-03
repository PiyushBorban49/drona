"use client";
import React, { useState, useRef, useEffect } from "react";
import { sendChat, sendSubtopicChat, ChatMessage, MasteryData, trackStudyTime } from "@/lib/api";
import { useStudy } from "@/context/StudyContext";
import { useUser } from "@clerk/nextjs";
import {
    Send, Sparkles, Bot, User,
    Flame
} from "lucide-react";

export default function ChatPage() {
    const { user } = useUser();
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: "assistant",
        content: "I'm your AI tutor powered by Lumina Learning. Ask me anything about your courses, let's break down complex topics together!"
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const { activeSubtopic } = useStudy();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [socraticMode] = useState(false);
    const [, setMasteryData] = useState<MasteryData | null>(null);
    const [, setShowSmartAids] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Track study time (1 minute every message for simplicity, or we can use a timer)
    const logStudyActivity = async () => {
        if (user?.id) {
            try {
                await trackStudyTime(user.id, 1); // Log 1 minute of activity
            } catch (e) {
                console.error("Failed to log study time:", e);
            }
        }
    };

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input;
        setInput("");

        const newMsgs: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
        setMessages(newMsgs);
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
            let res;
            if (activeSubtopic) {
                res = await sendSubtopicChat(activeSubtopic, "topic_id", "chapter_id", userMsg, history, socraticMode, true);
            } else {
                if (!user?.id) throw new Error("No user found");
                res = await sendChat(user.id, userMsg, "10", "Science", 1, history, socraticMode, true);
            }

            // Log 1 minute of study time per interaction
            logStudyActivity();

            setMessages([...newMsgs, { role: "assistant", content: res.response }]);
            if (res.mastery_data) {
                setMasteryData(res.mastery_data);
                if (res.mastery_data.glossary.length > 0 || res.mastery_data.formulas.length > 0) {
                    setShowSmartAids(true);
                }
            }
        } catch (error) {
            console.error(error);
            setMessages([...newMsgs, { role: "assistant", content: "Sorry, I had trouble connecting to the mastery hub." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto relative px-4">
            {/* Header - only show when no conversation yet */}
            {messages.length <= 1 && (
                <div className="flex flex-col items-center mb-12 pt-8">
                    <div className="w-24 h-24 rounded-full bg-[#F4E361] border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative mb-6">
                        <Bot size={48} className="text-black" strokeWidth={3} />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-black uppercase">Hi, I&apos;m Lumi</h1>
                    <div className="mt-6 bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-2xl text-center">
                        <p className="text-xl font-bold text-gray-700 leading-tight">
                            I&apos;m your AI tutor powered by Lumina Learning. Ask me anything about your courses, let&apos;s break down complex topics together!
                        </p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-12 pb-32 pt-4 px-4 scrollbar-hide">
                {messages.slice(1).map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        {/* Avatar Tags */}
                        <div className={`flex items-center gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-10 h-10 rounded-xl border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${msg.role === "user" ? "bg-white" : "bg-[#F4E361]"}`}>
                                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                            </div>
                        </div>

                        {/* Bubble */}
                        <div className={`relative max-w-[85%] border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] ${msg.role === "user"
                            ? "bg-[#2F58EE] text-white rounded-3xl rounded-tr-none"
                            : "bg-white text-black rounded-3xl rounded-tl-none"
                            }`}>
                            {msg.role === "assistant" && (
                                <div className="border-b-[4px] border-[#2F58EE] pb-4 mb-6 flex items-center gap-3">
                                    <Sparkles size={24} className="text-[#2F58EE]" />
                                    <h3 className="text-2xl font-black tracking-tighter uppercase">Concept Breakdown</h3>
                                </div>
                            )}
                            <p className="text-xl font-bold leading-tight">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="w-10 h-10 rounded-xl border-[3px] border-black bg-[#F4E361] flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-bounce">
                            <Bot size={20} />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Bottom Fixed Area */}
            <div className="fixed bottom-0 left-64 right-0 p-6 bg-white/80 backdrop-blur-sm z-20">
                <div className="max-w-5xl mx-auto">
                    {/* Suggested Chips */}
                    <div className="flex items-center gap-3 mb-4 overflow-x-auto scrollbar-hide">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Suggested:</span>
                        {["Cellular Respiration", "Chloroplast Structure", "ATP Cycle"].map(chip => (
                            <button key={chip} className="px-4 py-2 bg-white border-[3px] border-black text-[10px] font-black uppercase tracking-wider hover:bg-[#F4E361] transition-all whitespace-nowrap shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                                {chip}
                            </button>
                        ))}
                        <button className="px-4 py-2 bg-white border-[3px] border-black text-[10px] font-black uppercase tracking-wider text-[#BE003F] flex items-center gap-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                            <Flame size={12} fill="currentColor" /> Hot Topic
                        </button>
                    </div>

                    {/* Input */}
                    <div className="relative flex items-end gap-4">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                                placeholder="Ask Lumi anything..."
                                className="w-full bg-white border-[4px] border-black p-6 pr-20 text-xl font-bold shadow-[6px_6px_0_0_rgba(0,0,0,1)] focus:outline-none focus:shadow-[8px_8px_0_0_rgba(47,88,238,1)] transition-all resize-none min-h-[80px]"
                                rows={1}
                            />
                        </div>
                        <button
                            onClick={send}
                            aria-label="Send message"
                            title="Send message"
                            className="bg-[#2F58EE] text-white w-20 h-20 border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                        >
                            <Send size={32} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
