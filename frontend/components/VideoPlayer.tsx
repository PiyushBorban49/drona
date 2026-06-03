"use client";
import React, { useState } from "react";

interface VideoPlayerProps {
    url: string;
    title?: string;
    onClose?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    // Ensure URL starts with API base
    const fullUrl = url.startsWith("http")
        ? url
        : url.startsWith("/")
            ? `${API_BASE}${url}`
            : `${API_BASE}/${url}`;

    console.log("VideoPlayer loading:", fullUrl);

    return (
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4">
            <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
                <h3 className="font-bold uppercase text-lg">{title || "Video"}</h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-3 py-1 border-2 border-black font-bold hover:bg-gray-100"
                    >
                        ✕
                    </button>
                )}
            </div>

            {isLoading && !error && (
                <div className="h-[300px] flex items-center justify-center bg-gray-100 border-2 border-black">
                    <p className="font-bold">Loading video...</p>
                </div>
            )}

            {error && (
                <div className="h-[300px] flex flex-col items-center justify-center bg-red-50 border-2 border-red-500 p-4">
                    <p className="font-bold text-red-600 mb-2">Failed to load video</p>
                    <p className="text-sm text-gray-600">{error}</p>
                    <p className="text-xs text-gray-500 mt-2">{fullUrl}</p>
                </div>
            )}

            <video
                src={fullUrl}
                controls
                className={`w-full max-h-[400px] border-2 border-black ${isLoading || error ? "hidden" : ""}`}
                autoPlay
                onLoadedData={() => setIsLoading(false)}
                onError={(e) => {
                    setIsLoading(false);
                    setError("Could not load video file");
                    console.error("Video load error:", e);
                }}
            >
                Your browser does not support video playback.
            </video>
        </div>
    );
};

export default VideoPlayer;

