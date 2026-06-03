"use client";
import React from "react";
import { Wrench, Download, Sparkles, Brain, Lightbulb } from "lucide-react";

export function MindmapTools() {
    return (
        <div className="w-[280px] bg-white border-[3px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <h3 className="font-black text-blue-700 uppercase tracking-tight text-lg">Mind Map Tools</h3>
                <Wrench size={20} className="text-black" />
            </div>

            <div className="space-y-3">
                <button className="w-full py-4 bg-[#2F58EE] text-white border-[3px] border-black font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 group hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[2px]">
                    Auto-Generate
                    <Sparkles size={20} className="text-white" />
                </button>

                <button className="w-full py-4 bg-[#F4E361] text-black border-[3px] border-black font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[2px]">
                    AI Suggestions
                    <Brain size={20} />
                </button>

                <button className="w-full py-4 bg-white text-black border-[3px] border-black font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 hover:bg-gray-100 transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[2px]">
                    Export PDF
                    <Download size={20} className="text-black" />
                </button>
            </div>

            <div className="space-y-6 pt-6 border-t-2 border-black">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Visual Density</span>
                        <span className="bg-black text-white text-[8px] px-2 py-0.5 font-black">65%</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                        <div className="w-full h-2 bg-white border-2 border-black" />
                        <div className="absolute w-[65%] h-2 bg-blue-600 border-r-2 border-black" />
                        <div className="absolute left-[65%] w-5 h-5 bg-blue-600 border-2 border-black rounded-full -translate-x-1/2 cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]" />
                    </div>
                </div>

                <div className="bg-[#F7CAD0] border-[3px] border-black p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative space-y-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-[#BE003F]" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Quick Tip</span>
                    </div>
                    <p className="text-[10px] font-black text-black leading-relaxed">
                        Drag nodes to reorganize your neural path. Lumina AI learns from your arrangement style!
                    </p>
                </div>
            </div>
        </div>
    );
}
