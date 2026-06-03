"use client";
import React from "react";
import { FaTimes, FaVideo, FaQuestionCircle, FaChartLine, FaInfoCircle, FaCheckCircle, FaChevronRight } from "react-icons/fa";
import { Subtopic, generateSubtopicQuiz, Quiz } from "@/lib/api";
import VideoPlayer from "./VideoPlayer";

interface TopicDetailsSidebarProps {
    subtopic: Subtopic & { progress?: number; key_points?: string[] };
    onClose: () => void;
    onGenerateVideo: () => void;
}


const TopicDetailsSidebar: React.FC<TopicDetailsSidebarProps> = ({
    subtopic,
    onClose,
    onGenerateVideo,
}) => {
    const [isCompleted, setIsCompleted] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'overview' | 'quiz'>('overview');
    const [quizData, setQuizData] = React.useState<Quiz | null>(null);
    const [quizLoading, setQuizLoading] = React.useState(false);

    // We can use random progress if not provided
    const progress = isCompleted ? 100 : (subtopic.progress || 0);


    const handleTakeQuiz = async () => {
        setQuizLoading(true);
        setActiveTab('quiz');
        try {
            const res = await generateSubtopicQuiz(subtopic);
            if (res.success) {
                setQuizData(res.quiz);
            } else {
                alert("Failed to generate quiz.");
                setActiveTab('overview');
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to quiz agent.");
            setActiveTab('overview');
        } finally {
            setQuizLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r-4 border-black shadow-[8px_0_0_0_rgba(0,0,0,0.1)]">
            {/* Header */}
            <div className="p-6 border-b-4 border-black bg-[#2D5BFF] text-white relative">
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={onClose}
                        title="Close Sidebar"
                        className="w-10 h-10 flex items-center justify-center bg-black border-2 border-white rounded-lg hover:bg-gray-900 transition-all shadow-[2px_2px_0_0_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="mt-4">
                    <div className="inline-block px-2 py-1 bg-[#F4E361] text-black text-[10px] font-black rounded mb-2 uppercase tracking-widest border-2 border-black">
                        NEURO-INSIGHT
                    </div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{subtopic.title}</h3>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Completion Checkbox */}
                <button
                    onClick={() => setIsCompleted(!isCompleted)}
                    className={`w-full flex items-center justify-between p-4 border-[3px] border-black rounded-xl transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${isCompleted ? 'bg-emerald-400' : 'bg-white'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 border-2 border-black rounded flex items-center justify-center ${isCompleted ? 'bg-black text-white' : 'bg-white'}`}>
                            {isCompleted && <FaCheckCircle size={14} />}
                        </div>
                        <span className="font-black uppercase tracking-tight text-sm">Mark as Completed</span>
                    </div>
                    <FaChevronRight className={`${isCompleted ? 'rotate-90' : ''} transition-transform`} />
                </button>

                {subtopic.video_url && activeTab === 'overview' && (
                    <div className="border-[3px] border-black rounded-xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-black aspect-video relative group">
                        <VideoPlayer
                            url={subtopic.video_url}
                            title={subtopic.title}
                            onClose={() => { }} // No close within sidebar list
                        />
                    </div>
                )}

                {activeTab === 'overview' ? (
                    <>
                        {/* Description */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FaInfoCircle className="text-[#2D5BFF]" />
                                <h4 className="font-black text-sm uppercase tracking-wider text-gray-400">Overview</h4>
                            </div>
                            <p className="font-bold text-gray-700 leading-relaxed bg-gray-50 p-4 border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
                                {subtopic.description}
                            </p>
                        </section>

                        {/* Progress Tracking */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FaChartLine className="text-emerald-500" />
                                <h4 className="font-black text-sm uppercase tracking-wider text-gray-400">Mastery Level</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between font-black text-xs">
                                    <span className="text-gray-500 uppercase">Current Phase</span>
                                    <span className="text-black">{progress}% COMPLETE</span>
                                </div>
                                <div className="w-full h-8 bg-gray-100 border-[3px] border-black rounded-xl overflow-hidden relative">
                                    <div
                                        className="h-full bg-emerald-400 transition-all duration-1000 border-r-[3px] border-black"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] text-black mix-blend-overlay">
                                        COMPREHENSION MATRIX
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-sm uppercase tracking-wider text-gray-400">Mastery Quiz</h4>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="text-xs font-black text-[#2D5BFF] hover:underline"
                            >
                                Back to Overview
                            </button>
                        </div>
                        {quizLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12">
                                <div className="w-12 h-12 border-4 border-black border-t-blue-600 rounded-full animate-spin" />
                                <p className="mt-4 font-black uppercase text-xs">Calibrating Questions...</p>
                            </div>
                        ) : quizData ? (
                            <div className="space-y-4">
                                {quizData.questions.map((q, i) => (
                                    <div key={i} className="p-4 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                        <p className="font-black text-sm mb-3">{q.question_text}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt: string, oi: number) => (
                                                <button key={oi} className="w-full text-left p-2 border-2 border-gray-100 hover:border-black rounded text-xs font-bold transition-all">
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </section>
                )}

                {/* Key Concepts (Subtopic info usually has these) */}
                {(subtopic.key_points?.length ?? 0) > 0 && (
                    <section>
                        <h4 className="font-black text-xs uppercase tracking-wider text-gray-400 mb-3">Core Pillars</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {subtopic.key_points?.map((point, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                    <span className="text-xs font-black text-black">{point}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Action Footer */}
            <div className="p-6 border-t-4 border-black bg-slate-50 space-y-3">
                <button
                    onClick={onGenerateVideo}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase tracking-tighter"
                >
                    <FaVideo size={18} />
                    Synthesize Concept Video
                </button>
                <button
                    onClick={handleTakeQuiz}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase tracking-tighter"
                >
                    <FaQuestionCircle size={18} />
                    Initialize Mastery Quiz
                </button>
            </div>
        </div>
    );
};

export default TopicDetailsSidebar;
