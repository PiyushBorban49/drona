"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStudy } from "@/context/StudyContext";
import { useUser } from "@clerk/nextjs";
import {
    Sparkles, X, ChevronDown,
    Download, AlertCircle, FileUp, Loader2, KeyRound, Eye, EyeOff
} from "lucide-react";
import { generateTopicVideo, generateVideoFromFile, saveToContinueLearning } from "@/lib/api";
import ColorDot from "@/components/ColorDot";
import ProgressBar from "@/components/ProgressBar";

const AI_MODELS = [
    { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", badge: "🏆 Best Quality", color: "#10a37f" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", badge: "⚡ Fast", color: "#10a37f" },
    { id: "claude-opus-4", label: "Claude Opus 4", provider: "Anthropic", badge: "🎨 Creative", color: "#d4a27f" },
    { id: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", badge: "🔥 Balanced", color: "#d4a27f" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "Google", badge: "⚡ Quality", color: "#4285f4" },
    { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", provider: "Google", badge: "🌐 Multimodal", color: "#4285f4" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", badge: "⚡ Fast", color: "#4285f4" },
    { id: "tencent/hy3-preview:free", label: "Hunyuan Video (L)", provider: "OpenRouter", badge: "🎬 Optimized", color: "#2B58EE" }
];



type VideoState = "idle" | "generating" | "done" | "error";

export default function VideoPage() {
    const { user } = useUser();
    const { activeTopic, setActiveTopic } = useStudy();
    const searchParams = useSearchParams();

    const [topic, setTopic] = useState(activeTopic || "");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [playbackId, setPlaybackId] = useState<string | null>(null);
    const [state, setState] = useState<VideoState>("idle");
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Model + Key state
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);

    // Load saved video from query params (when clicking from Dashboard)
    useEffect(() => {
        const qTopic = searchParams.get("topic");
        const qVideoUrl = searchParams.get("video_url");
        const qPlaybackId = searchParams.get("playback_id");

        if (qTopic) {
            setTopic(qTopic);
            setActiveTopic(qTopic);
        }
        if (qVideoUrl || qPlaybackId) {
            setVideoUrl(qVideoUrl);
            setPlaybackId(qPlaybackId);
            setState("done");
            setProgress(100);
        }
    }, [searchParams, setActiveTopic]);

    useEffect(() => {
        if (activeTopic) setTopic(activeTopic);
    }, [activeTopic]);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setState("generating");
        setError("");
        setProgress(10);
        setPlaybackId(null);

        try {
            // Simulated progress
            const interval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 2000);

            const result = await generateTopicVideo(topic, selectedModel, apiKey || undefined);

            clearInterval(interval);

            if (result.success) {
                setVideoUrl(result.video_url || null);

                // Handle Mux data
                if (result.mux && result.mux.playback_id) {
                    setPlaybackId(result.mux.playback_id);
                }

                setState("done");
                setProgress(100);

                // Save to Continue Learning (Persistence)
                if (user?.id) {
                    await saveToContinueLearning(user.id, {
                        id: `vid_${Date.now()}`,
                        title: topic,
                        category: "AI Video",
                        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
                        progress: 0,
                        timeLeft: "New",
                        video_url: result.video_url,
                        playback_id: result.mux?.playback_id
                    });
                }
            } else {
                throw new Error(result.error || "Failed to generate video");
            }
        } catch (err) {
            console.error("Video Generation Error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong during generation");
            setState("error");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setState("generating");
        setError("");
        setProgress(5);
        setTopic(file.name);
        setPlaybackId(null);

        try {
            const interval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 3 : prev));
            }, 3000);

            const result = await generateVideoFromFile("default", file);

            clearInterval(interval);

            if (result.success) {
                setVideoUrl(result.video_url || null);
                if (result.topic) setTopic(result.topic);
                if (result.playback_id) setPlaybackId(result.playback_id);

                setState("done");
                setProgress(100);

                if (user?.id) {
                    await saveToContinueLearning(user.id, {
                        id: `doc_${Date.now()}`,
                        title: result.topic || file.name,
                        category: "Document Video",
                        image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop",
                        progress: 0,
                        timeLeft: "New",
                        video_url: result.video_url,
                        playback_id: result.playback_id
                    });
                }
            } else {
                throw new Error(result.error || "Failed to process document");
            }
        } catch (err) {
            console.error("File Upload Error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload or process document");
            setState("error");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 scrollbar-hide">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-7xl font-black tracking-tighter text-black uppercase leading-none">
                    AI Video Generator
                </h1>
                <p className="text-xl font-bold text-gray-600 max-w-3xl leading-tight">
                    Transform text prompts or documents into engaging educational videos in seconds. The bolder the idea, the better the result.
                </p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative items-center">

                {/* Left: Topic/Prompt */}
                <div className="bg-white border-[4px] border-black p-10 shadow-[10px_10px_0_0_rgba(0,0,0,1)] relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-[#2F58EE] text-[10px] font-black uppercase tracking-widest">1. Topic or Prompt</span>
                    </div>
                    <div className="relative mb-8">
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="E.g., Explain the concept of black holes using a pizza metaphor..."
                            className="w-full h-48 bg-white border-[3px] border-black p-6 text-xl font-bold focus:outline-none placeholder-gray-400 scrollbar-hide resize-none"
                            disabled={state === "generating"}
                        />
                    </div>
                    {/* ── Model + API Key Row ── */}
                    <div className="mb-5 space-y-3">
                        {/* Model Selector */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setModelOpen(o => !o)}
                                disabled={state === "generating"}
                                className="w-full flex items-center justify-between bg-white border-[3px] border-black px-4 py-3 font-black text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                <span className="flex items-center gap-3">
                                    <ColorDot color={AI_MODELS.find(m => m.id === selectedModel)?.color} />
                                    <span className="uppercase tracking-widest text-[11px]">
                                        {AI_MODELS.find(m => m.id === selectedModel)?.label}
                                    </span>
                                    <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5">
                                        {AI_MODELS.find(m => m.id === selectedModel)?.badge}
                                    </span>
                                </span>
                                <ChevronDown size={16} strokeWidth={3} className={`transition-transform ${modelOpen ? "rotate-180" : ""}`} />
                            </button>

                            {modelOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] z-50">
                                    {AI_MODELS.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => { setSelectedModel(m.id); setModelOpen(false); setApiKey(""); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f3f4f6] transition-all border-b-[2px] border-black last:border-b-0 ${selectedModel === m.id ? "bg-[#eef1fd]" : ""
                                                }`}
                                        >
                                            <ColorDot color={m.color} className="flex-shrink-0" />
                                            <span className="flex-1">
                                                <span className="block font-black text-[11px] uppercase tracking-widest">{m.label}</span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase">{m.provider}</span>
                                            </span>
                                            <span className="text-[9px] font-black bg-black text-white px-1.5 py-0.5">{m.badge}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* API Key Input */}
                        <div className="relative flex items-center border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                            <KeyRound size={16} strokeWidth={3} className="absolute left-3 text-gray-500 flex-shrink-0" />
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder={`Paste your ${AI_MODELS.find(m => m.id === selectedModel)?.provider} API key…`}
                                disabled={state === "generating"}
                                className="w-full pl-9 pr-10 py-3 bg-white font-bold text-xs focus:outline-none placeholder-gray-400 disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(s => !s)}
                                className="absolute right-3 text-gray-400 hover:text-black transition-colors"
                                tabIndex={-1}
                            >
                                {showKey ? <EyeOff size={15} strokeWidth={3} /> : <Eye size={15} strokeWidth={3} />}
                            </button>
                        </div>
                    </div>

                    {/* ── Bottom Action Row ── */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                            <span className="bg-[#BE003F] text-white text-[10px] font-black uppercase px-2 py-1">Hot</span>
                            <button
                                className="bg-[#f3f4f6] border-[2px] border-black px-4 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                onClick={() => setTopic("Quantum Physics core principles explained simply.")}
                                disabled={state === "generating"}
                            >
                                Surprise Me
                            </button>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={state === "generating" || !topic.trim()}
                            className="bg-[#2F58EE] text-white border-[4px] border-black py-4 px-8 font-black uppercase tracking-widest text-sm shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center gap-3 hover:bg-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {state === "generating" ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} fill="currentColor" /> Generate
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* OR Divider (Desktop only) */}
                <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center pointer-events-none z-30">
                    <div className="h-full w-[4px] bg-black" />
                    <div className="w-16 h-16 bg-[#515100] border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] -my-8 z-20">
                        <span className="text-white font-black text-xl italic uppercase">OR</span>
                    </div>
                    <div className="h-full w-[4px] bg-black" />
                </div>

                {/* Right: Upload */}
                <div className="bg-[#F4E361] border-[4px] border-black border-dashed p-10 flex flex-col items-center justify-center text-center shadow-[10px_10px_0_0_rgba(0,0,0,1)] h-full min-h-[400px]">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.pptx,.docx"
                        onChange={handleFileUpload}
                        title="Document Upload"
                    />
                    <div className="w-20 h-20 bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-8">
                        <FileUp size={32} className="text-black" strokeWidth={3} />
                    </div>
                    <h2 className="text-4xl font-black text-black tracking-tighter uppercase mb-4 leading-none">Upload Document</h2>
                    <p className="text-xs font-black uppercase text-gray-700 tracking-widest max-w-[200px] leading-tight mb-12">PDF, PPTX, or DOCX up to 50MB</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border-[3px] border-black px-8 py-3 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#2F58EE] hover:text-white transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                        Browse Files
                    </button>
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="bg-[#F7CAD0] border-[4px] border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex items-center gap-4">
                    <AlertCircle className="text-[#BE003F]" size={32} strokeWidth={3} />
                    <div>
                        <h4 className="text-xl font-black uppercase">Generation Error</h4>
                        <p className="font-bold text-gray-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Currently Generating/Result Section */}
            {(state === "generating" || state === "done") && (
                <div className="space-y-6 pt-12">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {state === "generating" ? "Currently Generating" : "Generated Video"}
                    </h3>

                    <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-8 relative">
                        <div className="flex-1 space-y-6 w-full">
                            <div>
                                <h4 className="text-4xl font-black tracking-tighter text-[#2F58EE] leading-none mb-2 capitalize">
                                    {topic}
                                </h4>
                                <p className="text-sm font-bold text-gray-500">
                                    {state === "generating"
                                        ? "Rendering visuals and syncing AI voiceover..."
                                        : "Your video is ready to watch!"}
                                </p>
                            </div>

                            {state === "generating" && (
                                <div className="relative">
                                    <ProgressBar
                                        progress={progress}
                                        title="Generation Progress"
                                    />
                                    <span className="absolute right-0 -top-6 text-[10px] font-black text-gray-400">{progress}%</span>
                                </div>
                            )}

                            {state === "done" && (videoUrl || playbackId) && (
                                <div className="mt-4 border-[4px] border-black overflow-hidden bg-black aspect-video relative group">
                                    {playbackId ? (
                                        <video
                                            src={`https://stream.mux.com/${playbackId}.m3u8`}
                                            controls
                                            className="w-full h-full"
                                            autoPlay
                                        />
                                    ) : (
                                        <video
                                            src={`http://localhost:8000${videoUrl}`}
                                            controls
                                            className="w-full h-full"
                                        />
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : `http://localhost:8000${videoUrl}`}
                                            download
                                            className="bg-white border-[3px] border-black p-2 hover:bg-[#F4E361]"
                                            title="Download Video"
                                        >
                                            <Download size={20} strokeWidth={3} />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {state === "generating" && (
                            <button
                                onClick={() => setState("idle")}
                                aria-label="Cancel generation"
                                title="Cancel generation"
                                className="w-16 h-16 bg-[#F7CAD0] border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-[#BE003F] hover:text-white transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none"
                            >
                                <X size={28} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="pb-20" />
        </div>
    );
}
