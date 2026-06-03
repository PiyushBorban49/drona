"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaPaperPlane, FaVideo, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import { Subtopic, ChatMessage, sendSubtopicChat } from "@/lib/api";

interface SubtopicChatProps {
    subtopic: Subtopic;
    topicId: string;
    chapterId: string;
    onClose: () => void;
    onGenerateVideo: () => void;
}

const SubtopicChat: React.FC<SubtopicChatProps> = ({
    subtopic,
    topicId,
    chapterId,
    onClose,
    onGenerateVideo,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        setMessages([
            {
                role: "assistant",
                content: `Hi! Let's learn about **${subtopic.title}**.\n\n${subtopic.description}\n\nWhat would you like to know?`,
            },
        ]);
    }, [subtopic]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await sendSubtopicChat(
                subtopic,
                topicId,
                chapterId,
                userMessage,
                messages
            );
            setMessages(response.chat_history);
            setSuggestedActions(response.suggested_actions);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l-4 border-black">
            {/* Header */}
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-yellow-50">
                <div>
                    <h3 className="font-bold text-lg uppercase">{subtopic.title}</h3>
                    <p className="text-sm text-gray-600">{subtopic.description.slice(0, 50)}...</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 border-2 border-black hover:bg-gray-100"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Key Points */}
            {subtopic.key_points.length > 0 && (
                <div className="p-3 bg-gray-50 border-b-2 border-gray-200 text-sm">
                    <span className="font-bold">Key Points: </span>
                    {subtopic.key_points.join(" • ")}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 text-sm ${msg.role === "user"
                                    ? "bg-black text-white"
                                    : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 border-2 border-black p-3 text-sm">
                            Thinking...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
                <div className="p-3 border-t-2 border-gray-200 flex gap-2">
                    {suggestedActions.includes("quiz") && (
                        <button className="px-3 py-1 text-sm border-2 border-black bg-green-50 hover:bg-green-100 flex items-center gap-1">
                            <FaQuestionCircle /> Quiz
                        </button>
                    )}
                    {suggestedActions.includes("video") && (
                        <button
                            onClick={onGenerateVideo}
                            className="px-3 py-1 text-sm border-2 border-black bg-red-50 hover:bg-red-100 flex items-center gap-1"
                        >
                            <FaVideo /> Video
                        </button>
                    )}
                    {suggestedActions.includes("next_subtopic") && (
                        <button className="px-3 py-1 text-sm border-2 border-black bg-blue-50 hover:bg-blue-100 flex items-center gap-1">
                            <FaArrowRight /> Next
                        </button>
                    )}
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t-4 border-black">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about this topic..."
                        className="flex-1 p-2 border-2 border-black text-sm focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-black text-white font-bold disabled:opacity-50"
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubtopicChat;
