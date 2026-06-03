import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Absolute path to the video-generator project root (two levels up from src/core/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Stage 8: Post Processing
 * Uses FFmpeg to concatenate multiple MP4 files into one.
 */
export async function concatenateVideos(videoFiles, outputFileName) {
    return new Promise((resolve, reject) => {
        const listFilePath = path.join(PROJECT_ROOT, 'temp_video_list.txt');
        const listContent = videoFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n');

        fs.writeFileSync(listFilePath, listContent);

        const outputDir = path.join(PROJECT_ROOT, 'output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const finalOutputPath = path.join(outputDir, outputFileName);
        const command = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${finalOutputPath}"`;

        console.log(`[Post-Processor] Concatenating ${videoFiles.length} videos into ${finalOutputPath}...`);

        exec(command, (error, stdout, stderr) => {
            // fs.unlinkSync(listFilePath); // Cleanup
            if (error) {
                console.error('[Post-Processor] Error:', stderr);
                reject(error);
                return;
            }
            console.log(`[Post-Processor] Successfully created final video: ${finalOutputPath}`);
            resolve(finalOutputPath);
        });
    });
}
