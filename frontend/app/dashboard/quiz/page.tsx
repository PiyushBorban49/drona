"use client";
import React, { useState } from "react";

import { getQuiz, Question, rewardXP } from "@/lib/api";
import { useStudy } from "@/context/StudyContext";
import { useUser } from "@clerk/nextjs";
import {
    BrainCircuit, CheckCircle2, RefreshCw,
    ChevronRight, Lightbulb
} from "lucide-react";

export default function QuizPage() {
    const { user } = useUser();
    const { activeSubtopic } = useStudy();
    const [query, setQuery] = useState(activeSubtopic?.title || "Cell Biology");
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizDone, setQuizDone] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const [prevSubtopicId, setPrevSubtopicId] = useState(activeSubtopic?.id);
    if (activeSubtopic?.id !== prevSubtopicId) {
        setPrevSubtopicId(activeSubtopic?.id);
        setQuery(activeSubtopic?.title || "Cell Biology");
    }


    const startQuiz = async () => {
        setLoading(true);
        try {
            const data = await getQuiz(query);
            if (data.success && data.quiz) {
                setQuestions(data.quiz.questions);
                setCurrentQ(0); setScore(0); setSelected(null); setAnswered(false); setQuizDone(false);
                setShowHint(false);
            }
        } catch (err) {
            console.error("Quiz error:", err);
        }
        setLoading(false);
    };

    const resetQuiz = () => {
        setQuestions([]);
        setQuizDone(false);
        setScore(0);
        setCurrentQ(0);
        setSelected(null);
        setAnswered(false);
    };

    const submitAnswer = () => {
        if (selected === null || !questions[currentQ]) return;
        setAnswered(true);
        if (selected === questions[currentQ].correct_option_index) setScore((s) => s + 1);
    };

    const nextQuestion = async () => {
        if (currentQ + 1 >= questions.length) {
            setQuizDone(true);
            // Awards XP: 10 XP per correct answer
            if (user?.id && score > 0) {
                try {
                    await rewardXP(user.id, score * 10);
                } catch (err) {
                    console.error("Failed to reward XP:", err);
                }
            }
        }
        else { setCurrentQ((c) => c + 1); setSelected(null); setAnswered(false); setShowHint(false); }
    };

    const q = questions[currentQ];
    const pct = questions.length > 0 ? Math.round(((currentQ + 1) / questions.length) * 100) : 0;

    if (questions.length === 0 && !quizDone) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-32 h-32 bg-[#F4E361] border-[4px] border-black rounded-full flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-8">
                    <BrainCircuit size={64} className="text-black" strokeWidth={3} />
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-black uppercase mb-4">Quiz Mastery</h1>
                <p className="text-xl font-bold text-gray-600 mb-12 max-w-lg">Generate dynamic MCQ sets for any topic. Strictly grounded in NCERT guidelines.</p>

                <div className="w-full max-w-xl bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-2 flex">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter topic..."
                        className="flex-1 bg-transparent px-6 py-4 text-xl font-bold focus:outline-none"
                    />
                    <button
                        onClick={startQuiz}
                        disabled={loading}
                        className="bg-[#2F58EE] text-white border-[3px] border-black px-12 font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : "Start"}
                    </button>
                </div>
            </div>
        );
    }

    if (quizDone) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center">
                <div className="w-24 h-24 bg-[#F7CAD0] border-[4px] border-black rounded-full flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] mx-auto mb-8">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-black uppercase mb-12">Quiz Complete!</h1>
                <div className="bg-white border-[4px] border-black p-12 shadow-[10px_10px_0_0_rgba(0,0,0,1)] mb-12">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">You Scored</div>
                    <div className="text-8xl font-black tracking-tighter text-black mb-4">{score} / {questions.length}</div>
                    <div className="w-full h-8 bg-gray-100 border-[3px] border-black p-1 mt-8">
                        <div className="h-full bg-[#BE003F]" style={{ width: `${(score / questions.length) * 100}%` }} />
                    </div>
                </div>
                <button
                    onClick={resetQuiz}
                    className="w-full bg-[#2F58EE] text-white border-[4px] border-black py-5 font-black uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-black transition-all"
                >
                    Next Subject
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto h-auto flex flex-col pt-2">
            {/* Header Area */}
            <div className="mb-2 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-4">
                        <span className="bg-[#F4E361] text-black text-[8px] font-black uppercase px-2 py-0.5 border-[1px] border-black">Topic 04</span>
                        <h1 className="text-xl font-black tracking-tighter text-black uppercase leading-none">{query} Mastery</h1>
                    </div>
                    <div className="flex border-[2px] border-black overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <button className="bg-[#2F58EE] text-white px-3 py-1 font-black text-[8px] uppercase tracking-widest border-r-[2px] border-black">Quiz Mode</button>
                        <button className="bg-[#f3f4f6] text-gray-500 hover:text-black px-3 py-1 font-black text-[8px] uppercase tracking-widest transition-colors">Flashcards</button>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black tracking-tighter text-black">Question {currentQ + 1} of {questions.length}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#2F58EE]">{pct}% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 border-[2px] border-black">
                        <div className="h-full bg-[#2F58EE] border-r-[2px] border-black transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>

            {/* Question Card Area */}
            <div className="flex-1 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative p-4 mb-2 flex flex-col overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-[-8px] right-[-8px] w-4 h-4 bg-[#BE003F] border-[3px] border-black rounded-full" />

                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 border-[1px] border-black bg-blue-50 flex items-center justify-center">
                        <BrainCircuit size={12} className="text-[#2F58EE]" strokeWidth={3} />
                    </div>
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Multiple Choice</span>
                </div>

                <h2 className="text-lg font-black tracking-tighter text-black leading-tight mb-4">
                    {q.question_text}
                </h2>

                <div className="space-y-2 flex-1">
                    {q.options.map((opt, i) => {
                        const isSelected = selected === i;
                        return (
                            <button
                                key={i}
                                onClick={() => !answered && setSelected(i)}
                                disabled={answered}
                                className={`w-full h-25 text-left p-2 border-[2px] border-black flex items-center gap-3 transition-all group ${isSelected
                                    ? "bg-blue-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                                    : "bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                                    } ${answered && i === q.correct_option_index ? "bg-green-100 border-green-600 border-[2px]" : ""} ${answered && i === selected && i !== q.correct_option_index ? "bg-red-50 border-red-600 border-[2px]" : ""}`}
                            >
                                <div className={`w-3 h-3 rounded-full border-[1px] border-black flex items-center justify-center shrink-0 ${isSelected ? "bg-white" : "bg-transparent"}`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                </div>
                                <span className="text-sm font-bold text-black">{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {showHint && !answered && (
                    <div className="mt-2 p-2 bg-yellow-50 border-[1px] border-black border-dashed flex items-start gap-2">
                        <Lightbulb className="text-yellow-600 shrink-0" size={14} />
                        <p className="text-[25px] font-medium text-black italic">Hint: {q.hint}</p>
                    </div>
                )}

                {answered && (
                    <div className={`mt-2 p-2 border-[2px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${selected === q.correct_option_index ? "bg-green-50" : "bg-red-50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {selected === q.correct_option_index ? (
                                <CheckCircle2 size={14} className="text-green-600" />
                            ) : (
                                <div className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center text-white text-[6px] font-black">X</div>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {selected === q.correct_option_index ? "Correct!" : "Incorrect"}
                            </span>
                        </div>
                        <p className="text-[25px] font-bold text-black leading-tight">
                            {q.explanation}
                        </p>
                    </div>
                )}

                <div className="mt-4 flex justify-end">
                    {!answered ? (
                        <button
                            onClick={submitAnswer}
                            disabled={selected === null || loading}
                            className={`px-4 py-1.5 bg-[#2F58EE] text-white border-[2px] border-black font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-1 transition-all ${selected === null ? "opacity-30 grayscale cursor-not-allowed" : "hover:bg-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"}`}
                        >
                            Submit Answer <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            className="px-4 py-1.5 bg-[#F4E361] text-black border-[2px] border-black font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-1 hover:bg-black hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                            Next Question <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="flex items-center justify-between px-4 pb-2">
                <button
                    className="flex items-center gap-1 group disabled:opacity-30"
                    onClick={() => setShowHint(true)}
                    disabled={answered || showHint}
                >
                    <Lightbulb size={12} className={`transition-colors ${showHint ? "text-[#F4E361]" : "text-gray-400 group-hover:text-[#F4E361]"}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black border-b-[1px] border-gray-400 border-dashed pb-0.5">Show Hint</span>
                </button>
                <button className="text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors" onClick={nextQuestion}>
                    Skip Question
                </button>
            </div>
        </div>
    );
}
