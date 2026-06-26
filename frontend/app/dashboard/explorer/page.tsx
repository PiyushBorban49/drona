"use client";
import React, { useState, useRef } from "react";
import ChapterMindmap, { MindmapRef } from "@/components/ChapterMindmap";
import { useStudy } from "@/context/StudyContext";
import TopicDetailsSidebar from "@/components/TopicDetailsSidebar";
import VideoPlayer from "@/components/VideoPlayer";
import SmartImportModal from "@/components/SmartImportModal";
import { Compass, RefreshCw, Plus, Minus, Maximize, Database } from "lucide-react";
import {
    getMindMapByTopic,
    generateSubtopicVideo,
    MindMapNode,
    MindMapEdge,
    Subtopic,
} from "@/lib/api";


export default function ChapterExplorerPage() {
    const { setActiveTopic, setActiveSubtopic } = useStudy();
    const [searchQuery, setSearchQuery] = useState("Cell Biology");
    const [mindmapData, setMindmapData] = useState<{ nodes: MindMapNode[], edges: MindMapEdge[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const mindmapRef = useRef<MindmapRef>(null);

    // Video state
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);

    const handleSearch = async (e?: React.FormEvent, overrideTopic?: string) => {
        if (e) e.preventDefault();
        const topicToSearch = overrideTopic || searchQuery;
        if (!topicToSearch.trim()) return;

        setIsLoading(true);
        setError(null);
        setSelectedSubtopic(null);
        setActiveSubtopic(null);
        setVideoUrl(null);
        setActiveTopic(topicToSearch);

        try {
            const response = await getMindMapByTopic(topicToSearch);
            if (response.success && response.mindmap) {
                setMindmapData(response.mindmap);
            } else {
                setError("Failed to generate mindmap. Please try again.");
            }
        } catch (e) {
            setError("Failed to connect to API");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubtopicSelect = (nodeData: MindMapNode["data"] & { id: string }) => {
        const subtopic: Subtopic = {
            id: nodeData.id,
            title: nodeData.label,
            description: nodeData.description || "",
            key_points: nodeData.key_points || [],
            video_url: nodeData.video_url,
            video_status: (nodeData.video_status || (nodeData.video_url ? 'done' : 'pending')) as Subtopic["video_status"]
        };
        setSelectedSubtopic(subtopic);
        setActiveSubtopic(subtopic);
        setVideoUrl(null);
    };

    const handleGenerateVideo = async (subtopic: {
        id: string;
        title: string;
        description: string;
    }) => {
        setVideoLoading(true);
        setVideoUrl(null);

        try {
            const response = await generateSubtopicVideo({
                id: subtopic.id,
                title: subtopic.title,
                description: subtopic.description,
                key_points: [],
                video_status: 'generating'
            });

            if (response.success && response.video_url) {
                setVideoUrl(response.video_url);
                // Update node in mindmap
                if (mindmapData) {
                    const updatedNodes: MindMapNode[] = mindmapData.nodes.map(n => {
                        if (n.id === subtopic.id) {
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    video_url: response.video_url,
                                    video_status: 'done' as const
                                }
                            };
                        }
                        return n;
                    });
                    setMindmapData({ ...mindmapData, nodes: updatedNodes });
                }
            } else {
                alert(`Video generation failed: ${response.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Video generation failed");
        } finally {
            setVideoLoading(false);
        }
    };

    return (
        <div className="fixed top-20 left-64 right-0 bottom-0 bg-white flex flex-col overflow-hidden z-50">

            {/* Main Content Area */}
            <div className="flex-1 relative bg-white min-h-0">
                <div className="absolute inset-0">

                    <div className="h-full w-full">
                        {!mindmapData && !isLoading && !error && (
                            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-500">
                                <div className="p-8 bg-[#F4E361] border-[4px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] -rotate-3">
                                    <Compass size={80} className="text-black" strokeWidth={2.5} />
                                </div>
                                <div className="text-center space-y-4">
                                    <h3 className="text-5xl font-black uppercase tracking-tighter italic">Neuro-Mapper</h3>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Enter a topic to generate a holographic mindmap</p>
                                </div>

                                <form onSubmit={handleSearch} className="flex gap-4 w-full max-w-2xl px-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Enter Topic (e.g. Quantum Physics)..."
                                        className="flex-1 px-6 py-4 bg-white border-[4px] border-black text-xl font-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[10px_10px_0_0_rgba(0,0,0,1)] transition-all uppercase placeholder:text-gray-300"
                                    />
                                    <button
                                        type="submit"
                                        className="px-10 py-4 bg-[#003BFF] text-white font-black text-xl hover:bg-blue-700 transition-all shadow-[8px_8px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest border-[4px] border-black"
                                    >
                                        Explore
                                    </button>
                                </form>
                            </div>
                        )}

                        {mindmapData && (
                            <>
                                {/* Floating Top Search Bar */}
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
                                    <form onSubmit={handleSearch} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-white border-[3px] border-black py-3 px-6 pr-12 text-sm font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] focus:outline-none transition-all uppercase placeholder:text-gray-300"
                                                placeholder="Explore New Concept..."
                                            />
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                <RefreshCw size={18} className={`text-black ${isLoading ? 'animate-spin' : ''}`} strokeWidth={3} />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsImportModalOpen(true)}
                                            className="px-6 bg-[#F4E361] border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:bg-yellow-400 group relative"
                                            title="Smart Import"
                                        >
                                            <Database size={18} className="text-black group-hover:scale-110 transition-transform" strokeWidth={3} />
                                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Smart Ingest</span>
                                        </button>
                                    </form>
                                </div>

                                <ChapterMindmap
                                    ref={mindmapRef}
                                    nodes={mindmapData.nodes}
                                    edges={mindmapData.edges}
                                    onSubtopicSelect={(data) => handleSubtopicSelect(data as MindMapNode["data"] & { id: string })}
                                    onGenerateVideo={(data) => handleGenerateVideo(data as unknown as Subtopic)}
                                />
                            </>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                <div className="text-center p-12 bg-white border-[4px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col items-center">
                                    <RefreshCw size={56} className="animate-spin text-[#003BFF] mb-6" strokeWidth={4} />
                                    <p className="font-black text-3xl text-black tracking-tight uppercase">Mapping Matrix...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Canvas Controls (Bottom Left) */}
                    <div className="absolute bottom-8 left-8 flex gap-3 z-10">
                        <button
                            onClick={() => mindmapRef.current?.zoomIn()}
                            title="Zoom In"
                            className="p-3 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors"
                        >
                            <Plus size={24} className="text-black" strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => mindmapRef.current?.zoomOut()}
                            title="Zoom Out"
                            className="p-3 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors"
                        >
                            <Minus size={24} className="text-black" strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => mindmapRef.current?.fitView()}
                            title="Fit View"
                            className="p-3 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors"
                        >
                            <Maximize size={24} className="text-black" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>


            {/* Video Modal */}
            {
                (videoUrl || videoLoading) && (
                    <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[100] p-4 md:p-8 transition-all">
                        <div className="max-w-4xl w-full">
                            {videoLoading ? (
                                <div className="bg-white border-[4px] border-black p-12 text-center shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-3xl">
                                    <RefreshCw size={56} className="animate-spin text-[#003BFF] mx-auto mb-6" strokeWidth={4} />
                                    <p className="font-black text-3xl text-black tracking-tight uppercase">Synthesizing Neuro-Video...</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border-[4px] border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] bg-white p-2">
                                    <VideoPlayer
                                        url={videoUrl!}
                                        title={selectedSubtopic?.title}
                                        onClose={() => setVideoUrl(null)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Right Side Info Panel (Explorer Sidebar) */}
            {
                selectedSubtopic && (
                    <div className="fixed right-0 top-20 h-[calc(100vh-4.5rem)] w-[450px] bg-white border-l-[4px] border-black shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[60] animate-in slide-in-from-right duration-300">
                        <TopicDetailsSidebar
                            subtopic={selectedSubtopic}
                            onClose={() => setSelectedSubtopic(null)}
                            onGenerateVideo={() => handleGenerateVideo(selectedSubtopic)}
                        />
                    </div>
                )
            }

            {/* Smart Import Modal */}
            <SmartImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onViewInGalaxy={(topic) => {
                    setSearchQuery(topic);
                    handleSearch(undefined, topic);
                }}
                onSuccess={() => {
                    // Success callback
                }}
            />
        </div >
    );
}
