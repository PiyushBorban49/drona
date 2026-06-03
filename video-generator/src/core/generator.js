import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { CODER_PROMPT } from '../prompts/prompts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Absolute path to the video-generator project root (two levels up from src/core/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Stage 4: Code Generator (Smart Fallback Edition)
 * Tries Google Gemini first, falls back to Groq on rate limits.
 */
export async function generateManimCode(scenePlan, config, lastError = null, lastCode = null) {
    const userModel = process.env.USER_MODEL || config.model;
    const userApiKey = process.env.USER_API_KEY || config.apiKey;
    const groqKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    const isCustomRequest = !!userModel && !!userApiKey;

    const displayModel = userModel || 'gemini-3.5-flash';
    console.log(`[Generator] 🚀 Attempting Scene ${scenePlan.scene_number} with ${displayModel}`);


    let inputPrompt = `${CODER_PROMPT}\n\n[SCENE PLAN]:\n${JSON.stringify(scenePlan)}`;

    if (lastError && lastCode) {
        console.log(`[Generator] ⚠️ Injecting previous render error for self-correction...`);
        inputPrompt += `\n\n[PREVIOUS CODE]:\n${lastCode}\n\n[CRITICAL ERROR DURING RENDERING]:\n${lastError}\n\nFIX THIS ERROR. Output only the corrected Python code. Use only standard Manim Community classes. Do not use custom classes like 'Gear' unless you define them.`;
    }

    try {
        let fullCode = "";

        if (isCustomRequest) {
            console.log(`[Generator] Using Custom User Config -> Model: ${userModel}`);

            // OpenAI Support
            if (userModel.startsWith('gpt')) {
                const res = await axios.post("https://api.openai.com/v1/chat/completions", {
                    model: userModel,
                    messages: [{ role: "user", content: inputPrompt }],
                    temperature: 0.2
                }, { headers: { "Authorization": `Bearer ${userApiKey}` } });
                fullCode = res.data.choices[0].message.content;
            }
            // Anthropic Support
            else if (userModel.startsWith('claude')) {
                // frontend has "claude-opus-4", real API name might be claude-3-opus-20240229, etc. Let's support Anthropic's message format
                const anthropicModel = userModel.includes('opus') ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20240620';
                const res = await axios.post("https://api.anthropic.com/v1/messages", {
                    model: anthropicModel,
                    max_tokens: 4096,
                    messages: [{ role: "user", content: inputPrompt }],
                    temperature: 0.2
                }, {
                    headers: {
                        "x-api-key": userApiKey,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    }
                });
                fullCode = res.data.content[0].text;
            }
            // Google Gemini Support 
            else if (userModel.startsWith('gemini')) {
                const client = new GoogleGenAI({ apiKey: userApiKey });
                const interaction = await client.interactions.create({
                    model: userModel,
                    input: inputPrompt,
                });
                fullCode = interaction.outputs[interaction.outputs.length - 1].text;
            }
            // OpenRouter / Generic OpenAI-Compatible Support (for hy3-preview, etc)
            else {
                console.log(`[Generator] Routing through OpenRouter/Generic API for model: ${userModel}`);
                const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: userModel,
                    messages: [{ role: "user", content: inputPrompt }],
                    temperature: 0.2
                }, {
                    headers: {
                        "Authorization": `Bearer ${userApiKey}`,
                        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                        "X-Title": process.env.SITE_NAME || "Dronacharya"
                    }
                });
                fullCode = res.data.choices[0].message.content;
            }

        } else {
            // --- ATTEMPT 1: Native DEFAULT Google Gemini 3 Flash Preview ---
            const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
            const interaction = await client.interactions.create({
                model: 'gemini-3.5-flash',
                input: inputPrompt,
            });
            fullCode = interaction.outputs[interaction.outputs.length - 1].text;
        }

        if (!fullCode || fullCode.trim().length < 100) {
            throw new Error(`Response too short — likely truncated.`);
        }

        return saveCode(scenePlan.scene_number, fullCode);

    } catch (apiError) {
        // --- FALLBACK: Groq ---
        console.warn(`[Generator] ⚠️ Primary API failed (${apiError.message}). Falling back to standard Groq qwen3-32b...`);

        const MAX_API_RETRIES = 3;
        let apiRetries = 0;

        while (apiRetries < MAX_API_RETRIES) {
            try {
                const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                    model: "llama-3.3-70b-versatile",

                    messages: [{ role: "user", content: inputPrompt }],
                    temperature: 0.2
                }, {
                    headers: { "Authorization": `Bearer ${groqKey}` }
                });

                const fullCode = response.data.choices[0].message.content;

                if (!fullCode || fullCode.trim().length < 100) {
                    throw new Error(`Response too short — likely truncated by safety filters or token limits.`);
                }

                return saveCode(scenePlan.scene_number, fullCode);

            } catch (groqError) {
                if (groqError.response?.status === 429) {
                    console.warn(`[Generator] ⚠️ Groq Rate limit hit. Waiting 15 seconds before retrying (Attempt ${apiRetries + 1}/${MAX_API_RETRIES})...`);
                    await new Promise(r => setTimeout(r, 15000));
                    apiRetries++;
                    continue;
                }
                console.error('[Generator] ❌ Groq API Error:', groqError.response?.data || groqError.message);
                throw groqError;
            }
        }
        throw new Error("Max API Retries exceeded for Groq API");
    }
}

/**
 * Utility to clean and save generated code
 */
function saveCode(sceneNumber, fullCode) {
    let cleanedCode = fullCode;

    // Extract code from triple backticks if they exist
    const codeBlockRegex = /```python\s*([\s\S]*?)\s*```/i;
    const match = fullCode.match(codeBlockRegex);

    if (match && match[1]) {
        cleanedCode = match[1].trim();
    } else {
        // Fallback for simple backticks without 'python' label
        const simpleBlockRegex = /```\s*([\s\S]*?)\s*```/;
        const simpleMatch = fullCode.match(simpleBlockRegex);
        if (simpleMatch && simpleMatch[1]) {
            cleanedCode = simpleMatch[1].trim();
        } else {
            // Last resort: just strip backticks if they exist anywhere
            cleanedCode = fullCode.replace(/```python|```/g, '').trim();
        }
    }

    // Remove any leftover <think> blocks if they somehow persisted
    cleanedCode = cleanedCode.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const scenesDir = path.join(PROJECT_ROOT, 'scenes');
    if (!fs.existsSync(scenesDir)) fs.mkdirSync(scenesDir);

    const filePath = path.join(scenesDir, `scene_${sceneNumber}.py`);
    fs.writeFileSync(filePath, cleanedCode);

    console.log(`[Generator] ✅ Saved Scene ${sceneNumber} to ${filePath}`);
    return filePath;
}
