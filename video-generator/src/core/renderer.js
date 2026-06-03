import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Absolute path to the video-generator project root (two levels up from src/core/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Stage 6: Manim Renderer
 * Runs the Manim CLI to render a Python script into an MP4 video.
 * Returns the path to the rendered MP4 file.
 */
export async function renderScene(pythonFilePath, sceneClassName, quality = 'l') {
    return new Promise((resolve, reject) => {
        const qualityMap = { l: '480p15', m: '720p30', h: '1080p60', k: '2160p60' };
        const qualityFlag = `-pq${quality}`;
        const outputDir = path.join(PROJECT_ROOT, 'output');
        const scriptName = path.basename(pythonFilePath, '.py');

        console.log(`[Renderer] Rendering ${sceneClassName} at ${qualityMap[quality] || quality}...`);

        const command = `python -m manim ${qualityFlag} "${pythonFilePath}" ${sceneClassName} --media_dir "${outputDir}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Renderer] Error rendering ${sceneClassName}:`, stderr);
                reject(error);
                return;
            }

            // Resolve the path to the rendered MP4
            const resolution = qualityMap[quality] || '480p15';
            const mp4Path = path.join(outputDir, 'videos', scriptName, resolution, `${sceneClassName}.mp4`);

            console.log(`[Renderer] ✅ Rendered: ${mp4Path}`);
            resolve(mp4Path);
        });
    });
}
