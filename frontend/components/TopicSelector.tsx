"use client";
import React from "react";
import { Subject } from "@/lib/api";

interface TopicSelectorProps {
    classes: string[];
    selectedClass: string;
    onClassChange: (c: string) => void;
    subjects: Subject[];
    selectedSubject: string;
    selectedChapter: number;
    onSubjectChange: (subject: string) => void;
    onChapterChange: (chapter: number) => void;
    isLoading?: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
    classes,
    selectedClass,
    onClassChange,
    subjects,
    selectedSubject,
    selectedChapter,
    onSubjectChange,
    onChapterChange,
    isLoading = false,
}) => {
    const currentSubject = subjects.find(s => s.name === selectedSubject);
    const maxChapters = currentSubject?.chapters || 15;

    return (
        <div className="flex flex-row items-center gap-2 text-sm">
            {/* Class Dropdown */}
            <select
                value={selectedClass}
                onChange={(e) => onClassChange(e.target.value)}
                disabled={isLoading}
                className="p-1.5 border border-black font-bold bg-white text-sm focus:outline-none hover:bg-gray-50 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
                {classes.map((c) => (
                    <option key={c} value={c}>
                        Class {c}
                    </option>
                ))}
            </select>

            <span className="text-gray-400">/</span>

            {/* Subject Dropdown */}
            <select
                value={selectedSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                disabled={isLoading}
                className="p-1.5 border border-black font-bold bg-white text-sm focus:outline-none hover:bg-gray-50 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
                {subjects.map((subject) => (
                    <option key={subject.name} value={subject.name}>
                        {subject.name}
                    </option>
                ))}
            </select>

            <span className="text-gray-400">/</span>

            {/* Chapter Dropdown */}
            <select
                value={selectedChapter}
                onChange={(e) => onChapterChange(Number(e.target.value))}
                disabled={isLoading}
                className="p-1.5 border border-black font-bold bg-white text-sm focus:outline-none hover:bg-gray-50 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map((ch) => (
                    <option key={ch} value={ch}>
                        Chapter {ch}
                    </option>
                ))}
            </select>

            {isLoading && (
                <div className="ml-2 w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            )}
        </div>
    );
};

export default TopicSelector;
