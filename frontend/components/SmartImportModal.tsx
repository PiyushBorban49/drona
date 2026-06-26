"use client";
import React, { useState } from "react";
import { X, Rss, RefreshCw, CheckCircle2, AlertCircle, Upload, LucideIcon } from "lucide-react";
import { ingestRSS, ingestSearch, IngestResponse } from "@/lib/api";

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: IngestResponse) => void;
    onViewInGalaxy?: (topic: string) => void;
}

type ImportSource = "rss" | "search";

export default function SmartImportModal({ isOpen, onClose, onSuccess, onViewInGalaxy }: SmartImportModalProps) {
    const [activeSource, setActiveSource] = useState<ImportSource>("rss");
    const [url, setUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ title: string, metadata?: { author: string } } | null>(null);

    if (!isOpen) return null;

    const handleImport = async () => {
        setIsLoading(true);
        setError(null);
        setStatus("Connecting to source...");

        try {
            if (["rss", "search"].includes(activeSource) && !url.trim()) {
                throw new Error("Please enter a valid source URL.");
            }

            if (activeSource === "rss") {
                setStatus("Parsing Feed & Indexing Updates...");
                const result = await ingestRSS("default", url);
                if (result.success) {
                    setStatus("Synchronizing Knowledge...");
                    const adaptedResult = {
                        title: `Feed: ${result.feed_title}`,
                        metadata: { author: "RSS Source" }
                    };
                    setSuccessData(adaptedResult);
                    if (onSuccess) onSuccess(result as IngestResponse);
                }
            } else if (activeSource === "search") {
                setStatus("Surfing Live Web...");
                const result = await ingestSearch("default", url);
                if (result.success) {
                    setStatus("Grounding Truth...");
                    const adaptedResult = {
                        title: `Search: ${url}`,
                        metadata: { author: "Live Web" }
                    };
                    setSuccessData(adaptedResult);
                    if (onSuccess) onSuccess(result as IngestResponse);
                }


            } else {
                setError("This ingestion source is coming soon!");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ingestion failed. Please check the URL.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSourceChange = (sourceId: ImportSource) => {
        setActiveSource(sourceId);
        setError(null);
        setStatus("");
        setSuccessData(null);
    };

    const sources: { id: ImportSource; label: string; icon: LucideIcon; color: string }[] = [
        { id: "rss", label: "RSS Feed", icon: Rss, color: "bg-[#EE802F]" },
        { id: "search", label: "Live Search", icon: RefreshCw, color: "bg-[#003BFF]" },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white border-[4px] border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b-[4px] border-black bg-[#F4E361] flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Smart Ingest</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-1">Multi-Source Neural Onboarding</p>
                    </div>
                    <button onClick={onClose} title="Close" className="p-2 hover:bg-black/5 transition-colors border-2 border-transparent hover:border-black">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-8">
                    {/* Source Selector */}
                    {!successData && (
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {sources.map((source) => (
                                <button
                                    key={source.id}
                                    onClick={() => handleSourceChange(source.id)}
                                    className={`flex flex-col items-center justify-center p-4 border-[3px] border-black transition-all ${activeSource === source.id
                                        ? `${source.color} text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1`
                                        : 'bg-gray-50 text-gray-400 hover:bg-white hover:text-black'
                                        }`}
                                >
                                    <source.icon size={24} strokeWidth={activeSource === source.id ? 3 : 2} />
                                    <span className="text-[9px] font-black uppercase mt-2">{source.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    {!successData ? (
                        <div className="space-y-6">
                            {(["rss", "search"].includes(activeSource)) ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-black">Source URL</label>
                                    <div className="flex gap-4">
                                        <input
                                            key={`url-input-${activeSource}`}
                                            aria-label="Source URL"
                                            type="text"
                                            value={url || ""}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder={
                                                activeSource === "search" ? "What do you want to research?" :
                                                    "Enter Source URL..."
                                            }
                                            className="flex-1 px-6 py-4 bg-white border-[4px] border-black text-lg font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[10px_10px_0_0_rgba(0,0,0,1)] transition-all uppercase placeholder:text-gray-300"
                                        />
                                        <button
                                            onClick={handleImport}
                                            disabled={isLoading || !url.trim()}
                                            className="px-8 bg-black text-white font-black uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 border-[4px] border-black flex items-center gap-3"
                                        >
                                            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : "Ingest"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-black">Knowledge Payload (Upload)</label>
                                    <div
                                        className={`p-10 border-[4px] border-dashed border-black bg-gray-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white transition-all ${selectedFile ? 'border-solid bg-green-50' : ''}`}
                                        onClick={() => document.getElementById("file-upload")?.click()}
                                    >
                                        <input
                                            key={`file-input-${activeSource}`}
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            title="Upload Knowledge Payload"
                                            placeholder="Upload file..."
                                        />
                                        {selectedFile ? (
                                            <>
                                                <CheckCircle2 size={48} className="text-green-500" />
                                                <p className="font-black uppercase tracking-tighter text-xl">{selectedFile.name}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Target for Neural Mapping</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={48} />
                                                <p className="font-black uppercase tracking-tight text-xl">Drag & Drop or Click to Upload</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {selectedFile && !isLoading && (
                                        <button
                                            onClick={handleImport}
                                            className="w-full mt-4 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-gray-800 shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 border-[4px] border-black flex items-center justify-center gap-3"
                                        >
                                            Merge Payload
                                        </button>
                                    )}
                                </div>
                            )}

                            {isLoading && (
                                <div className="p-6 bg-blue-50 border-[3px] border-[#003BFF] flex items-center gap-4 animate-pulse">
                                    <RefreshCw className="animate-spin text-[#003BFF]" size={24} strokeWidth={3} />
                                    <p className="font-black text-[#003BFF] uppercase italic">{status}</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-6 bg-red-50 border-[3px] border-[#FF0000] flex items-center gap-4 text-[#FF0000]">
                                    <AlertCircle size={24} strokeWidth={3} />
                                    <p className="font-black uppercase tracking-tight">{error}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500 space-y-6 text-center py-4">
                            <div className="flex justify-center">
                                <div className="p-6 bg-green-50 border-[4px] border-[#00FF47] rounded-full shadow-[8px_8px_0_0_rgba(0,255,71,0.2)]">
                                    <CheckCircle2 size={64} className="text-[#00FF47]" strokeWidth={3} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-3xl font-black uppercase tracking-tighter">Neural Link Established</h4>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                    &quot;{successData.title}&quot; has been merged into your workspace.
                                </p>
                            </div>
                            <div className="flex justify-center gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        if (onViewInGalaxy && successData) {
                                            onViewInGalaxy(successData.title);
                                        }
                                        onClose();
                                    }}
                                    className="px-8 py-3 border-[3px] border-black font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                                >
                                    View in Galaxy
                                </button>
                                <button
                                    onClick={() => { setSuccessData(null); setUrl(""); }}
                                    className="px-8 py-3 bg-[#003BFF] text-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:shadow-none active:translate-x-1 active:translate-y-1"
                                >
                                    Ingest More
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-gray-50 border-t-[3px] border-black flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Status: System Operational</p>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-[#00FF47] rounded-full animate-ping" />
                        <div className="w-2 h-2 bg-[#00FF47] rounded-full shadow-[0_0_8px_rgba(0,255,71,0.5)]" />
                    </div>
                </div>
            </div>
        </div >
    );
}
