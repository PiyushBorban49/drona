"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection
} from "reactflow";

import "reactflow/dist/style.css";
import { Loader2 } from "lucide-react";

export default function ChapterMindMap() {
    const params = useParams();
    const id = params.id as string; // format: class/subject/chapter
    const [loading, setLoading] = useState(true);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        // In a real implementation, fetch from backend:
        // POST /generate-mind-map { class_name, subject, chapter }
        // Using mock data for visual test

        // Parse ID
        // const [className, subject, chapter] = id.split('-');



        // Simulate API delay
        const timer = setTimeout(() => {
            const initialNodes: Node[] = [
                {
                    id: "root",
                    position: { x: 400, y: 100 },
                    data: { label: "Chapter Root" },
                    type: "input",
                    style: { background: "#eee", color: "#333", border: "1px solid #777", width: 180 }
                },
                {
                    id: "c1",
                    position: { x: 200, y: 300 },
                    data: { label: "Concept 1" },
                    style: { background: "#fff", color: "#333", border: "1px solid #777", width: 180 }
                },
                {
                    id: "c2",
                    position: { x: 600, y: 300 },
                    data: { label: "Concept 2" },
                    style: { background: "#fff", color: "#333", border: "1px solid #777", width: 180 }
                }
            ];

            const initialEdges: Edge[] = [
                { id: "e1", source: "root", target: "c1", animated: true },
                { id: "e2", source: "root", target: "c2", animated: true }
            ];

            setNodes(initialNodes);
            setEdges(initialEdges);
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [id, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                <span className="ml-2 text-gray-600">Generating Mind Map...</span>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-gray-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
