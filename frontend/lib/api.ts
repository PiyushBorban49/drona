// API Configuration and fetch wrappers

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let errorMsg = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.detail) {
                errorMsg = errorData.detail;
            }
        } catch {
            // Not a JSON response or doesn't have detail
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

// Subject/Chapter Types
export interface Subject {
    name: string;
    chapters: number;
}

export interface SubjectsResponse {
    class: string;
    subjects: Subject[];
}

export interface ClassesResponse {
    classes: string[];
}

// ============ CHAPTER HIERARCHY TYPES ============

export interface Subtopic {
    id: string;
    title: string;
    description: string;
    key_points: string[];
    video_url?: string;
    video_status: 'pending' | 'generating' | 'done' | 'error';
}

export interface Topic {
    id: string;
    title: string;
    description: string;
    subtopics: Subtopic[];
    video_url?: string;
    video_status: 'pending' | 'generating' | 'done' | 'error';
}

export interface Chapter {
    id: string;
    class_name: string;
    subject: string;
    chapter_num: number;
    title: string;
    topics: Topic[];
    video_url?: string;
    video_status: 'pending' | 'generating' | 'done' | 'error';
}

export interface ChapterStructureResponse {
    success: boolean;
    chapter?: Chapter;
    cached?: boolean;
    error?: string;
}

export interface SubtopicChatResponse {
    response: string;
    chat_history: ChatMessage[];
    suggested_actions: string[];
    mastery_data?: MasteryData;
}

export interface MasteryData {
    glossary: { term: string; definition: string }[];
    formulas: { name: string; formula: string }[];
}

export interface SubtopicVideoResponse {
    success: boolean;
    video_url?: string;
    mux?: {
        success: boolean;
        upload_id?: string;
        asset_id?: string;
        playback_id?: string;
        status: string;
    };
    error?: string;
}

// Mind Map Types
export interface MindMapNode {
    id: string;
    data: {
        label: string;
        description?: string;
        key_points?: string[];
        video_url?: string;
        video_status?: 'pending' | 'generating' | 'done' | 'error';
    };
    position: { x: number; y: number };
    type: string;
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
}

export interface MindMapResponse {
    success: boolean;
    mindmap: {
        nodes: MindMapNode[];
        edges: MindMapEdge[];
    };
}

// Quiz Types
export interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
    difficulty: string;
}

export interface Quiz {
    title: string;
    questions: Question[];
}

export interface QuizResponse {
    success: boolean;
    quiz: Quiz;
}

// Flashcard Types
export interface Flashcard {
    front: string;
    back: string;
}

export interface FlashcardSet {
    topic: string;
    cards: Flashcard[];
}

export interface FlashcardResponse {
    success: boolean;
    flashcards: FlashcardSet;
}

// Chat Types
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
    chat_history: ChatMessage[];
    next_step: string;
    mastery_data?: MasteryData;
}

// Debate Types
export interface DebateRound {
    round_num: number;
    argument_a: string;
    argument_b: string;
    moderator_question: string;
}

export interface Debate {
    topic: string;
    stance_a: string;
    stance_b: string;
    rounds: DebateRound[];
    status: 'ready' | 'active' | 'judged';
}

export interface DebateStartResponse {
    success: boolean;
    debate: Debate;
}

export interface DebateRoundResponse {
    success: boolean;
    round: DebateRound;
}

export interface DebateJudgeResponse {
    success: boolean;
    feedback: string;
}

// Scenario Types
export interface Scenario {
    scenario_id: string;
    title: string;
    setting: string;
    character: string;
    student_role: string;
    objective: string;
    opening_narrative: string;
    max_turns: number;
    topics_tested: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScenarioStartResponse {
    success: boolean;
    scenario: Scenario;
}

export interface ScenarioResponse {
    success: boolean;
    character_response: string;
    evaluation: {
        accuracy_score: number;
        concepts_demonstrated: string[];
        feedback: string;
    };
}

export interface ScenarioTurn {
    role: 'user' | 'assistant';
    content: string;
}

// Ingestion Types
export interface RSSIngestResponse {
    success: boolean;
    message: string;
    feed_title: string;
    analysis: {
        summary: string;
        concepts: { title: string; description: string }[];
        key_points: string[];
    };
}

export interface SearchIngestResponse {
    success: boolean;
    message: string;
    analysis: {
        summary: string;
        concepts: { title: string; description: string }[];
        key_points: string[];
    };
}

export interface AudioIngestResponse {
    success: boolean;
    message: string;
    analysis: {
        summary: string;
        concepts: { title: string; description: string }[];
    };
}

export interface OCRIngestResponse {
    success: boolean;
    message: string;
    analysis: {
        summary: string;
        concepts: { title: string; description: string }[];
    };
}

export interface DatasetIngestResponse {
    success: boolean;
    message: string;
    analysis: {
        summary: string;
        concepts: { title: string; description: string }[];
    };
}

export type IngestResponse =
    RSSIngestResponse |
    SearchIngestResponse |
    AudioIngestResponse |
    OCRIngestResponse |
    DatasetIngestResponse;

// ============ API FUNCTIONS ============

export async function getClasses(): Promise<ClassesResponse> {
    return fetchAPI<ClassesResponse>('/classes');
}

export async function getSubjects(className?: string): Promise<SubjectsResponse> {
    const query = className ? `?class_name=${className}` : '';
    return fetchAPI<SubjectsResponse>(`/subjects${query}`);
}

export async function getChapterStructure(
    class_name: string,
    subject: string,
    chapter: number
): Promise<ChapterStructureResponse> {
    return fetchAPI<ChapterStructureResponse>('/chapter/structure', {
        method: 'POST',
        body: JSON.stringify({ class_name, subject, chapter }),
    });
}

export async function sendSubtopicChat(
    subtopic: Subtopic,
    topicId: string,
    chapterId: string,
    message: string,
    chatHistory: ChatMessage[],
    socraticMode: boolean = false,
    extractMastery: boolean = false
): Promise<SubtopicChatResponse> {
    return fetchAPI<SubtopicChatResponse>('/chat/subtopic', {
        method: 'POST',
        body: JSON.stringify({
            subtopic_id: subtopic.id,
            topic_id: topicId,
            chapter_id: chapterId,
            subtopic_title: subtopic.title,
            subtopic_description: subtopic.description,
            key_points: subtopic.key_points,
            message,
            chat_history: chatHistory,
            socratic_mode: socraticMode,
            extract_mastery: extractMastery
        }),
    });
}

export async function generateTopicVideo(
    topic: string,
    model?: string,
    apiKey?: string
): Promise<SubtopicVideoResponse> {
    return fetchAPI<SubtopicVideoResponse>('/video', {
        method: 'POST',
        body: JSON.stringify({
            workspace_id: 'default',
            topic,
            ...(model && { model }),
            ...(apiKey && { api_key: apiKey }),
        }),
    });
}

export async function generateSubtopicVideo(subtopic: {
    id: string;
    title: string;
    description: string;
    key_points: string[];
    video_status?: string;
}): Promise<SubtopicVideoResponse> {
    return fetchAPI<SubtopicVideoResponse>('/video/subtopic', {
        method: 'POST',
        body: JSON.stringify({
            subtopic_id: subtopic.id,
            title: subtopic.title,
            description: subtopic.description,
            key_points: subtopic.key_points,
        }),
    });
}




export async function generateSubtopicQuiz(subtopic: Subtopic): Promise<QuizResponse> {
    return fetchAPI<QuizResponse>('/curriculum/subtopic/quiz', {
        method: 'POST',
        body: JSON.stringify({
            subtopic_id: subtopic.id,
            title: subtopic.title,
            description: subtopic.description,
            key_points: subtopic.key_points,
        }),
    });
}

export async function combineVideos(
    parentId: string,
    videoPaths: string[],
    outputType: 'topic' | 'chapter'
): Promise<SubtopicVideoResponse> {
    return fetchAPI<SubtopicVideoResponse>('/videos/combine', {
        method: 'POST',
        body: JSON.stringify({
            parent_id: parentId,
            video_paths: videoPaths,
            output_type: outputType,
        }),
    });
}

export async function getMindMap(class_name: string, subject: string, chapter: number): Promise<MindMapResponse> {
    const topic = `Class ${class_name} ${subject} Chapter ${chapter}`;
    return fetchAPI<MindMapResponse>('/mindmap', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic }),
    });
}

export async function getMindMapByTopic(topic: string): Promise<MindMapResponse> {
    return fetchAPI<MindMapResponse>('/mindmap', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic }),
    });
}

export async function getQuiz(query: string): Promise<QuizResponse> {
    const topic = query;
    return fetchAPI<QuizResponse>('/quiz', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic: topic }),
    });
}

export async function getFlashcards(query: string): Promise<FlashcardResponse> {
    const topic = query;
    return fetchAPI<FlashcardResponse>('/flashcards', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic }),
    });
}

export async function sendChat(
    user_id: string,
    message: string,
    class_name: string,
    subject: string,
    chapter: number,
    chat_history: ChatMessage[],
    socraticMode: boolean = false,
    extractMastery: boolean = false
): Promise<ChatResponse> {
    return fetchAPI<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify({
            user_id,
            message,
            workspace_id: 'default',
            chat_history,
            socratic_mode: socraticMode,
            extract_mastery: extractMastery
        }),
    });
}


export async function rewardXP(user_id: string, amount: number): Promise<{ success: boolean; new_xp: number; new_level: number }> {
    return fetchAPI('/user/stats/reward', {
        method: 'POST',
        body: JSON.stringify({ user_id, amount }),
    });
}

export async function trackStudyTime(user_id: string, minutes: number): Promise<{ success: boolean }> {
    return fetchAPI('/user/activity/study', {
        method: 'POST',
        body: JSON.stringify({ user_id, minutes }),
    });
}

export async function syncStreak(user_id: string): Promise<{ success: boolean; streak: number }> {
    return fetchAPI<{ success: boolean; streak: number }>('/user/streak/sync', {
        method: 'POST',
        body: JSON.stringify({ user_id }),
    });
}

export async function saveToContinueLearning(user_id: string, item: { title: string; category: string;[key: string]: unknown }): Promise<{ success: boolean }> {

    return fetchAPI('/user/continue-learning', {
        method: 'POST',
        body: JSON.stringify({ user_id, item }),
    });
}



export async function ingestRSS(workspace_id: string, url: string): Promise<RSSIngestResponse> {
    return fetchAPI<RSSIngestResponse>('/ingest/rss', {
        method: 'POST',
        body: JSON.stringify({ workspace_id, url }),
    });
}

export async function ingestSearch(workspace_id: string, query: string): Promise<SearchIngestResponse> {
    return fetchAPI<SearchIngestResponse>('/ingest/search', {
        method: 'POST',
        body: JSON.stringify({ workspace_id, query }),
    });
}

async function fetchWithFile<T>(endpoint: string, workspace_id: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    // Manual fetch because fetchAPI might be tuned for JSON
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}${endpoint}?workspace_id=${workspace_id}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

export async function ingestAudio(workspace_id: string, file: File): Promise<AudioIngestResponse> {
    return fetchWithFile<AudioIngestResponse>('/ingest/audio', workspace_id, file);
}

export async function ingestOCR(workspace_id: string, file: File): Promise<OCRIngestResponse> {
    return fetchWithFile<OCRIngestResponse>('/ingest/ocr', workspace_id, file);
}

export async function ingestDataset(workspace_id: string, file: File): Promise<DatasetIngestResponse> {
    return fetchWithFile<DatasetIngestResponse>('/ingest/dataset', workspace_id, file);
}

export interface VideoFromFileResponse {
    success: boolean;
    video_url?: string;
    topic?: string;
    playback_id?: string;
    error?: string;
}

export async function generateVideoFromFile(workspace_id: string, file: File): Promise<VideoFromFileResponse> {
    return fetchWithFile<VideoFromFileResponse>('/video/generate-from-file', workspace_id, file);
}

// ============ DEBATE FUNCTIONS ============

export async function startDebate(topic: string, stance_a: string = "", stance_b: string = ""): Promise<DebateStartResponse> {
    return fetchAPI<DebateStartResponse>('/debate/start', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic, stance_a, stance_b }),
    });
}

export async function getDebateRound(topic: string, stance_a: string, stance_b: string, round_num: number): Promise<DebateRoundResponse> {
    return fetchAPI<DebateRoundResponse>(`/debate/round?round_num=${round_num}`, {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', topic, stance_a, stance_b }),
    });
}

export async function judgeDebate(topic: string, argument_a: string, argument_b: string, user_verdict: 'a' | 'b' | 'draw'): Promise<DebateJudgeResponse> {
    return fetchAPI<DebateJudgeResponse>('/debate/judge', {
        method: 'POST',
        body: JSON.stringify({ debate_id: 'default', round_num: 1, topic, argument_a, argument_b, user_verdict }),
    });
}

// ============ SCENARIO FUNCTIONS ============

export async function startScenario(topic: string): Promise<ScenarioStartResponse> {
    return fetchAPI<ScenarioStartResponse>('/scenario/start', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'default', user_id: 'default', topic }),
    });
}

export async function respondToScenario(
    scenario_id: string,
    scenario_context: string,
    user_response: string,
    turn_history: ScenarioTurn[]
): Promise<ScenarioResponse> {
    return fetchAPI<ScenarioResponse>('/scenario/respond', {
        method: 'POST',
        body: JSON.stringify({
            user_id: 'default',
            scenario_id,
            scenario_context,
            user_response,
            turn_history,
        }),
    });
}
