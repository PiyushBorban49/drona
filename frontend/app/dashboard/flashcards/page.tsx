"use client";
import React, { useState } from "react";

import { getFlashcards, Flashcard } from "@/lib/api";
import { useStudy } from "@/context/StudyContext";
import {
    RefreshCw, Layers, Flame, Trophy, X
} from "lucide-react";



export default function FlashcardsPage() {
    const { activeSubtopic } = useStudy();
    const [query, setQuery] = useState(activeSubtopic?.title || "Biology");
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const [prevSubtopicId, setPrevSubtopicId] = useState(activeSubtopic?.id);
    if (activeSubtopic?.id !== prevSubtopicId) {
        setPrevSubtopicId(activeSubtopic?.id);
        setQuery(activeSubtopic?.title || "Biology");
    }




    const generateCards = async () => {
        setLoading(true);
        try {
            const data = await getFlashcards(query);
            if (data.success && data.flashcards) {
                setCards(data.flashcards.cards);
                setCurrentIndex(0);
                setFlipped(false);
            }
        } catch (err) {
            console.error("Flashcard error:", err);
        }
        setLoading(false);
    };

    const q = cards[currentIndex];
    const pct = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

    if (cards.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-32 h-32 bg-[#F7CAD0] border-[4px] border-black rounded-full flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-8 rotate-3">
                    <Layers size={64} className="text-black" strokeWidth={3} />
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-black uppercase mb-4 text-center">Synthesis Cards</h1>
                <p className="text-xl font-bold text-gray-600 mb-12 max-w-lg">Generate a specialized active-recall deck for any topic in your curriculum.</p>

                <div className="w-full max-w-xl bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-2 flex">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Topic (e.g. Mitochondria)"
                        className="flex-1 bg-transparent px-6 py-4 text-xl font-bold focus:outline-none"
                    />
                    <button
                        onClick={generateCards}
                        disabled={loading}
                        className="bg-[#2F58EE] text-white border-[3px] border-black px-12 font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : "Deploy Deck"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col relative pb-20">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-12">
                <div className="space-y-4">
                    <span className="bg-[#BE003F] text-white text-[10px] font-black uppercase px-3 py-1 border-[2px] border-black">SRS Active</span>
                    <h1 className="text-6xl font-black tracking-tighter text-black uppercase leading-none">{query} Review</h1>
                </div>
                <div className="flex border-[4px] border-black overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <button className="bg-[#f3f4f6] text-gray-500 hover:text-black px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-colors border-r-[4px] border-black">Quiz Mode</button>
                    <button className="bg-[#2F58EE] text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest">Flashcards</button>
                </div>
            </div>

            {/* Progress / Stats Area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="md:col-span-3 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-3xl font-black tracking-tighter text-black">Card {currentIndex + 1} of {cards.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#BE003F]">{pct}% Session Complete</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 border-[3px] border-black">
                        <div className="h-full bg-[#BE003F] border-r-[3px] border-black transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                </div>
                <div className="bg-white border-[3px] border-black p-4 flex items-center gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <Flame size={24} className="text-[#F4E361]" fill="currentColor" strokeWidth={3} />
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase text-gray-400">Streak</span>
                        <span className="text-xl font-black">14 Days</span>
                    </div>
                </div>
            </div>

            {/* Flashcard Flipper */}
            <div className="flex-1 flex items-center justify-center perspective-1000 my-8 py-8">
                <div
                    onClick={() => setFlipped(!flipped)}
                    className={`relative w-full max-w-2xl aspect-[1.6/1] transition-all duration-700 preserve-3d cursor-pointer ${flipped ? "rotate-y-180" : ""} group`}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white border-[6px] border-black shadow-[15px_15px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center p-12 group-hover:scale-[1.02] transition-transform">
                        <div className="absolute top-8 left-8 w-16 h-3 bg-[#F4E361] border-[2px] border-black" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Concept Breakdown</span>
                        <h2 className="text-5xl font-black tracking-tighter text-black text-center leading-tight">
                            {q.front}
                        </h2>
                        <div className="absolute bottom-8 text-[10px] font-black uppercase tracking-widest text-[#2F58EE] flex items-center gap-2">
                            <RefreshCw size={14} /> Click to Flip Session
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-black border-[6px] border-black shadow-[15px_15px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center p-12 rotate-y-180 group-hover:scale-[1.02] transition-transform">
                        <div className="absolute top-8 left-8 w-16 h-3 bg-[#BE003F] border-[2px] border-black" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8">Mastery Insight</span>
                        <p className="text-3xl font-bold text-white text-center leading-snug">
                            {q.back}
                        </p>
                    </div>
                </div>
            </div>

            {/* SRS Controls */}
            {flipped && (
                <div className="flex items-center justify-center gap-8 mt-12 animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <button
                        onClick={() => { setCurrentIndex(i => (i + 1) % cards.length); setFlipped(false); }}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-20 h-20 bg-[#F7CAD0] border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] group-hover:bg-[#BE003F] group-hover:text-white transition-all group-active:translate-x-2 group-active:translate-y-2 group-active:shadow-none">
                            <X size={32} strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Forgot</span>
                    </button>

                    <button
                        onClick={() => { setCurrentIndex(i => (i + 1) % cards.length); setFlipped(false); }}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-24 h-24 bg-[#D1D5FF] border-[4px] border-black flex items-center justify-center shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:bg-[#2F58EE] group-hover:text-white transition-all group-active:translate-x-2 group-active:translate-y-2 group-active:shadow-none">
                            <RefreshCw size={40} strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Recall</span>
                    </button>

                    <button
                        onClick={() => { setCurrentIndex(i => (i + 1) % cards.length); setFlipped(false); }}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-20 h-20 bg-[#F4E361] border-[4px] border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all group-active:translate-x-2 group-active:translate-y-2 group-active:shadow-none">
                            <Trophy size={32} strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Mastered</span>
                    </button>
                </div>
            )}

            {!flipped && (
                <div className="flex items-center justify-center gap-6 mt-12 opacity-50">
                    <p className="text-xl font-bold uppercase tracking-widest text-gray-400">Reveal card to grade mastery</p>
                </div>
            )}
        </div>
    );
}
