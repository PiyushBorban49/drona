"use client";
import React from "react";
import { FaQuestionCircle, FaVideo, FaBrain, FaLayerGroup } from "react-icons/fa";

interface ActionButtonsProps {
    onQuiz: () => void;
    onVideo: () => void;
    onMindmap: () => void;
    onFlashcards: () => void;
    isLoading?: boolean;
    disabled?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onQuiz,
    onVideo,
    onMindmap,
    onFlashcards,
    isLoading = false,
    disabled = false,
}) => {
    const buttons = [
        { label: "Quiz", icon: <FaQuestionCircle />, onClick: onQuiz, color: "bg-green-50 hover:bg-green-100" },
        { label: "Video", icon: <FaVideo />, onClick: onVideo, color: "bg-red-50 hover:bg-red-100" },
        { label: "Mindmap", icon: <FaBrain />, onClick: onMindmap, color: "bg-yellow-50 hover:bg-yellow-100" },
        { label: "Flashcards", icon: <FaLayerGroup />, onClick: onFlashcards, color: "bg-purple-50 hover:bg-purple-100" },
    ];

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {buttons.map((btn) => (
                <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={disabled || isLoading}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold text-sm transition-all 
                        ${btn.color} 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]`}
                >
                    <span className="text-lg">{btn.icon}</span>
                    <span>{btn.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ActionButtons;
