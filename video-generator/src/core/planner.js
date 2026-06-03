import axios from 'axios';
import { PLANNER_PROMPT } from '../prompts/prompts.js';

/**
 * Stage 2: Scene Planner (Groq Version)
 * Uses Groq directly to plan scenes quickly and reliably.
 */
export async function planScenes(topic, apiKey, model = 'llama-3.3-70b-versatile') {
    const groqKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY || apiKey;
    console.log(`[Planner] Planning scenes for: ${topic} using Groq API`);

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: 'system', content: PLANNER_PROMPT },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            temperature: 0.2
        }, {
            headers: { "Authorization": `Bearer ${groqKey}` }
        });

        const fullContent = response.data.choices[0].message.content;
        console.log("\n[Planner] Request finished. Raw Content Length:", fullContent.length);

        if (!fullContent) {
            throw new Error("Model returned empty response. Check API key.");
        }

        const cleanedContent = fullContent.replace(/```json|```/g, '').trim();

        try {
            return JSON.parse(cleanedContent);
        } catch (e) {
            console.error("[Planner] JSON Parse Error. Content was:", cleanedContent);
            throw e;
        }
    } catch (error) {
        console.error('[Planner] SDK/API Error:', error.response?.data || error.message);
        throw error;
    }
}
