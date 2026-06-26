"use client";
import React, { useState } from "react";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBrain, FaComments, FaQuestionCircle, FaBars, FaTimes, FaLayerGroup, FaHome, FaChevronLeft, FaChevronRight, FaPlayCircle, FaGamepad } from "react-icons/fa";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const pathname = usePathname();

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        if (pathname?.includes("/chat")) {
            setIsOpen(false);
        }
    }


    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const menuItems = [
        {
            name: "Dashboard",
            icon: <FaHome />,
            path: "/dashboard",
        },
        {
            name: "Explorer",
            icon: <FaBrain />,
            path: "/dashboard/explorer",
        },
        {
            name: "Chat Tutor",
            icon: <FaComments />,
            path: "/dashboard/chat",
        },
        {
            name: "Quiz",
            icon: <FaQuestionCircle />,
            path: "/dashboard/quiz",
        },
        {
            name: "Flashcards",
            icon: <FaLayerGroup />,
            path: "/dashboard/flashcards",
        },
        {
            name: "Video Studio",
            icon: <FaPlayCircle />,
            path: "/dashboard/video",
        },

        {
            name: "Boss Fight",
            icon: <FaGamepad />,
            path: "/dashboard/scenario",
        },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-md"
                onClick={toggleSidebar}
            >
                {isOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Sidebar Container */}
            <motion.div
                animate={{ width: isOpen ? "250px" : "80px" }}
                transition={{ duration: 0.5, type: "spring", damping: 10 }}
                className={`h-screen bg-white text-black sticky top-0 left-0 hidden md:flex flex-col border-r-4 border-black shadow-none overflow-hidden relative`}
            >
                {/* Desktop Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full z-10"
                    title={isOpen ? "Collapse" : "Expand"}
                >
                    {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
                </button>

                {/* Logo / Brand */}
                <div className="flex items-center justify-center h-24 border-b-4 border-black pt-8">
                    <motion.h1
                        animate={{ scale: isOpen ? 1 : 0.8, opacity: isOpen ? 1 : 0 }}
                        className={`font-bold text-2xl text-black whitespace-nowrap ${!isOpen && "hidden"}`}
                    >
                        DRONACHARYA
                    </motion.h1>
                    {!isOpen && <span className="text-xl font-bold text-black border-2 border-black w-8 h-8 flex items-center justify-center rounded-full">D</span>}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-4">
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.path;

                        return (
                            <Link href={item.path} key={index}>
                                <motion.div
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 border-2 ${isActive
                                        ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                                        : "bg-white text-black border-transparent hover:border-black hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="text-xl min-w-[24px]">{item.icon}</div>
                                    {isOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="ml-4 font-bold whitespace-nowrap"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t-4 border-black">
                    {isOpen ? (
                        <div className="flex items-center gap-3 p-2 rounded-lg border-2 border-transparent transition-colors">
                            <div className="w-8 h-8 rounded-full bg-black border border-black"></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">NCERT AI Tutor</span>
                                <span className="text-xs text-gray-600">Class 10</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-black mx-auto"></div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
