import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import ReactFlow, {
    Node,
    Edge,
    Background,
    useNodesState,
    useEdgesState,
    NodeProps,
    Handle,
    Position,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
    BrainCircuit, Zap, Layers, Activity
} from "lucide-react";
import { Chapter } from "@/lib/api";

export interface MindmapRef {
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
}

interface ChapterMindmapProps {
    chapter?: Chapter;
    nodes?: Node[];
    edges?: Edge[];
    onSubtopicSelect: (data: Record<string, unknown>) => void;
    onGenerateVideo: (data: Record<string, unknown>) => void;
}

// ... ExplorerNode, TopicNode, ChapterNode definitions remain same ...
const ExplorerNode: React.FC<NodeProps> = ({ data }) => {
    const isSelected = data.isSelected;

    // Defensive string coercion — a malformed node must never white-screen the app
    const rawLabel = typeof data.label === "string" ? data.label : String(data.label ?? "Subtopic");
    const description = typeof data.description === "string" ? data.description : "";

    // Map labels to specific colors/icons as in the screenshot
    const getStyle = () => {
        const label = rawLabel.toLowerCase();
        if (label.includes("protein")) return { bg: "bg-[#F4E361]", icon: <BrainCircuit size={18} /> };
        if (label.includes("energy")) return { bg: "bg-[#F7CAD0]", icon: <Zap size={18} className="text-[#BE003F]" /> };
        if (label.includes("membrane")) return { bg: "bg-white", icon: <Layers size={18} className="text-blue-600" />, accent: "text-blue-600" };
        return { bg: "bg-white", icon: <Activity size={18} /> };
    };

    const style = getStyle();

    return (
        <div
            className={`group relative p-6 border-[4px] border-black ${style.bg} min-w-[260px] shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-transform hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none ${isSelected ? "ring-4 ring-blue-500/50" : ""}`}
        >
            <Handle type="target" position={Position.Top} className="!w-4 !h-4 !bg-black border-2 border-white" />

            <div className="space-y-4">
                <div className={`${style.accent || "text-black"}`}>
                    {style.icon}
                </div>

                <div>
                    <h4 className={`font-black text-2xl uppercase tracking-tighter leading-none ${style.accent || "text-black"}`}>
                        {rawLabel}
                    </h4>
                    {description && (
                        <p className="text-[10px] font-bold text-gray-500 mt-2 leading-snug line-clamp-2 uppercase tracking-wide">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-4 !h-4 !bg-black border-2 border-white" />
        </div>
    );
};

const TopicNode: React.FC<NodeProps> = ({ data }) => {
    return (
        <div className="p-4 border-[3px] border-black bg-white min-w-[200px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center">
            <Handle type="target" position={Position.Top} className="!bg-black" />
            <div className="font-black text-sm uppercase tracking-widest">{data.label}</div>
            <Handle type="source" position={Position.Bottom} className="!bg-black" />
        </div>
    );
};

const ChapterNode: React.FC<NodeProps> = ({ data }) => {
    return (
        <div className="p-10 border-[5px] border-black bg-[#2F58EE] text-white min-w-[360px] text-center shadow-[15px_15px_0_0_rgba(0,0,0,1)] relative group hover:scale-[1.02] transition-transform">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F4E361] text-black border-[3px] border-black px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                Core Concept
            </div>
            <div className="font-black text-6xl tracking-tighter uppercase leading-[0.8] mb-2">{data.label}</div>
            <div className="mt-8 flex justify-center">
                <div className="w-24 h-2 bg-white/20" />
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-6 !h-6 !bg-white !border-4 !border-black" />
        </div>
    );
};

const nodeTypes = {
    chapter: ChapterNode,
    topic: TopicNode,
    explorer: ExplorerNode,
    subtopic: ExplorerNode,
};

const MindmapInner = forwardRef<MindmapRef, ChapterMindmapProps>(({
    chapter,
    nodes: initialNodes,
    edges: initialEdges,
    onSubtopicSelect,
    onGenerateVideo,
}, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    useImperativeHandle(ref, () => ({
        zoomIn: () => zoomIn(),
        zoomOut: () => zoomOut(),
        fitView: () => fitView({ padding: 0.2 }),
    }));

    useEffect(() => {
        if (initialNodes && initialEdges) {
            const mappedNodes = initialNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    isSelected: selectedSubtopicId === node.id,
                }
            }));
            const resolveClustering = (nodes: Node[]) => {
                const PADDING = 280;
                const spreadNodes = [...nodes];
                for (let i = 0; i < spreadNodes.length; i++) {
                    for (let j = i + 1; j < spreadNodes.length; j++) {
                        const n1 = spreadNodes[i];
                        const n2 = spreadNodes[j];
                        const dx = n2.position.x - n1.position.x;
                        const dy = n2.position.y - n1.position.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < PADDING) {
                            const angle = distance === 0 ? Math.random() * 2 * Math.PI : Math.atan2(dy, dx);
                            n2.position.x = n1.position.x + Math.cos(angle) * PADDING;
                            n2.position.y = n1.position.y + Math.sin(angle) * PADDING;
                        }
                    }
                }
                return spreadNodes;
            };

            const refinedNodes = resolveClustering(mappedNodes);
            setNodes(refinedNodes);
            const boldEdges = initialEdges.map(edge => ({
                ...edge,
                style: { ...edge.style, strokeWidth: 4, stroke: edge.style?.stroke || "#6366f1" },
                animated: true
            }));
            setEdges(boldEdges);
            return;
        }

        if (!chapter) return;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        newNodes.push({
            id: chapter.id,
            type: "chapter",
            position: { x: 400, y: 50 },
            data: { label: chapter.title },
        });

        const topicSpacing = 300;
        const topicStartX = 400 - ((chapter.topics.length - 1) * topicSpacing) / 2;

        chapter.topics.forEach((topic, topicIdx) => {
            const topicX = topicStartX + topicIdx * topicSpacing;

            newNodes.push({
                id: topic.id,
                type: "topic",
                position: { x: topicX, y: 220 },
                data: { label: topic.title },
            });

            newEdges.push({
                id: `e-${chapter.id}-${topic.id}`,
                source: chapter.id,
                target: topic.id,
                style: { stroke: "#000", strokeWidth: 5 },
            });

            const subtopicSpacing = 280;
            const subtopicStartX = topicX - ((topic.subtopics.length - 1) * subtopicSpacing) / 2;

            topic.subtopics.forEach((subtopic, subIdx) => {
                const subX = subtopicStartX + subIdx * subtopicSpacing;

                newNodes.push({
                    id: subtopic.id,
                    type: "explorer",
                    position: { x: subX, y: 400 + (subIdx % 2) * 120 },
                    data: {
                        ...subtopic,
                        label: subtopic.title,
                        isSelected: selectedSubtopicId === subtopic.id,
                    },
                });

                newEdges.push({
                    id: `e-${topic.id}-${subtopic.id}`,
                    source: topic.id,
                    target: subtopic.id,
                    style: { stroke: "#6366f1", strokeWidth: 4 },
                    animated: true,
                });
            });
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [chapter, initialNodes, initialEdges, selectedSubtopicId, onSubtopicSelect, onGenerateVideo, setNodes, setEdges]);

    const handleNodeClick = (event: React.MouseEvent, node: Node) => {
        if (node.type === 'explorer' || node.type === 'subtopic' || node.type === 'topic') {
            setSelectedSubtopicId(node.id);
            onSubtopicSelect({
                ...node.data,
                id: node.id
            });
        }
    };

    return (
        <div className="w-full h-full border-[4px] border-black bg-white">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
            >
                <Background color="#000" gap={50} size={1.5} variant={BackgroundVariant.Dots} />
            </ReactFlow>
        </div>
    );
});

MindmapInner.displayName = "MindmapInner";

/** Guarantees a render crash shows a readable panel instead of a white screen. */
class MindmapErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[mindmap] render crash:", error, info.componentStack);
    }
    render() {
        if (this.state.error) {
            return (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="max-w-lg bg-red-50 border-[4px] border-red-600 p-8 shadow-[8px_8px_0_0_rgba(220,38,38,0.4)]">
                        <h3 className="font-black text-xl uppercase tracking-tight text-red-700 mb-2">Mindmap failed to render</h3>
                        <p className="text-sm font-bold text-red-600 break-words">{this.state.error.message}</p>
                        <button
                            onClick={() => this.setState({ error: null })}
                            className="mt-4 px-6 py-2 bg-red-600 text-white font-black uppercase tracking-widest text-sm border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const ChapterMindmap = forwardRef<MindmapRef, ChapterMindmapProps>((props, ref) => {
    return (
        <ReactFlowProvider>
            <MindmapErrorBoundary>
                <MindmapInner {...props} ref={ref} />
            </MindmapErrorBoundary>
        </ReactFlowProvider>
    );
});

ChapterMindmap.displayName = "ChapterMindmap";

export default ChapterMindmap;
