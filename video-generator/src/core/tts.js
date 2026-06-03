import fs from 'fs';
import path from 'path';
import * as googleTTS from 'google-tts-api';

/**
 * Stage 3.5: Text-to-Speech Engine
 * Generates an MP3 file from the scene narration using Google Translate TTS.
 * Handles long text by automatically splitting it securely.
 */
export async function generateTTS(text, sceneNumber) {
    if (!text || text.trim() === '') return null;

    // Ensure output directory exists
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    const filePath = path.join(audioDir, `scene_${sceneNumber}.mp3`);

    try {
        console.log(`[TTS] Synthesizing narration for Scene ${sceneNumber}...`);

        // Fetch base64 audio chunks (handles > 200 character text automatically)
        const audioData = await googleTTS.getAllAudioBase64(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });

        // Convert base64 to binary MP3 and concatenate
        const buffers = audioData.map(chunk => Buffer.from(chunk.base64, 'base64'));
        const finalBuffer = Buffer.concat(buffers);

        fs.writeFileSync(filePath, finalBuffer);

        console.log(`[TTS] ✅ Saved narration audio to ${filePath}`);

        // Return absolute path formatted safely for Python string injection (forward slashes)
        return filePath.replace(/\\/g, '/');
    } catch (error) {
        console.error(`[TTS] ❌ Error generating audio for scene ${sceneNumber}:`, error.message);
        return null;
    }
}
