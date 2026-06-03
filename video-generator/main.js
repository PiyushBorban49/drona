import dotenv from 'dotenv';
import { planScenes } from './src/core/planner.js';
import { generateManimCode } from './src/core/generator.js';
import { validateManimCode } from './src/core/validator.js';
import { renderScene } from './src/core/renderer.js';
import { concatenateVideos } from './src/core/post_processor.js';
import { generateTTS } from './src/core/tts.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MAX_RETRIES = 4; // Max times to regenerate on validation failure

/**
 * MAIN ORCHESTRATOR
 */
async function main() {
  const topic = process.argv[2] || "Explain black holes in Kurzgesagt style";

  // Provider Configs (both use OpenRouter now)
  const apiKey = process.env.LLM_API_KEY;
  const plannerModel = process.env.PLANNER_MODEL || "openrouter/free";
  const coderModel = process.env.CODER_MODEL || "google/gemma-4-26b-a4b-it:free";

  console.log("🚀 Starting Manim Production Pipeline...");
  console.log(`[Pipeline] Planner  : ${plannerModel}`);
  console.log(`[Pipeline] Coder    : ${coderModel}`);
  console.log(`[Pipeline] Validator: enabled (${MAX_RETRIES} retries)\n`);


  try {
    // Stage 2: Planning (OpenRouter)
    const scenePlan = await planScenes(topic, apiKey, plannerModel);
    const scenes = scenePlan.scenes || scenePlan;

    console.log(`\n[Pipeline] Planned ${scenes.length} scenes.`);

    const generatorConfig = {
      apiKey: process.env.LLM_API_KEY,
      model: process.env.CODER_MODEL || "google/gemma-4-26b-a4b-it:free",
      ollamaUrl: process.env.OLLAMA_API_URL || "http://localhost:11434/api/chat",
      fallbackModel: process.env.FALLBACK_MODEL || "qwen2.5-coder:7b"
    };

    // Stage 4-6 Parallel Processing: Prepare all scenes in parallel (TTS + Code Gen + Initial Render attempt)
    // Optimized for 16-core CPU: increasing BATCH_SIZE to 6
    const BATCH_SIZE = 6;
    const renderedVideos = new Array(scenes.length).fill(null);

    for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
      const batch = scenes.slice(i, i + BATCH_SIZE);
      console.log(`\n--- [Pipeline] Processing Batch: Scenes ${i + 1} to ${i + batch.length} (Parallel) ---`);

      await Promise.all(batch.map(async (scene, index) => {
        const sceneNum = scene.scene_number || scene.scene || (i + index + 1);
        const sceneIdx = i + index;
        let renderSuccess = false;
        let attempts = 0;
        let lastRenderError = null;
        let lastCode = null;

        // Add a staggered delay (e.g. 5 seconds per index) to avoid smashing 
        // the APIs concurrently and blowing past rate limits instantly.
        if (index > 0) {
          await new Promise(r => setTimeout(r, index * 5000));
        }

        try {
          // TTS Generation
          if (scene.narration) {
            const audioPath = await generateTTS(scene.narration, sceneNum);
            if (audioPath) scene.audio_path = audioPath;
          }

          // Render Loop
          do {
            attempts++;
            const pythonFile = await generateManimCode(scene, generatorConfig, lastRenderError, lastCode);
            const validationResult = validateManimCode(pythonFile);

            if (!validationResult.valid) {
              lastRenderError = validationResult.error;
              lastCode = fs.readFileSync(pythonFile, 'utf-8');
              continue;
            }

            const className = scene.class_name || `Scene${sceneNum}`;
            try {
              // RENDERING: Use 'm' (Medium resolution) for 3-4x speed gain
              const mp4Path = await renderScene(pythonFile, className, 'm');
              if (fs.existsSync(mp4Path)) {
                renderedVideos[sceneIdx] = mp4Path;
                renderSuccess = true;
                console.log(`[Pipeline] ✅ Scene ${sceneNum} rendered successfully.`);
              }
            } catch (renderError) {
              console.error(`[Pipeline] ❌ Scene ${sceneNum} failed render attempt ${attempts}.`);
              lastRenderError = renderError.message || renderError.stderr || String(renderError);
              lastCode = fs.readFileSync(pythonFile, 'utf-8');
            }
          } while (!renderSuccess && attempts <= MAX_RETRIES);
        } catch (sceneError) {
          console.error(`[Pipeline] ❌ Fatal error in Scene ${sceneNum}:`, sceneError.message);
        }
      }));
    }


    const finalRenderedVideos = renderedVideos.filter(v => v !== null);

    if (finalRenderedVideos.length > 0) {
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
      const finalFileName = `final_${slug}.mp4`;
      console.log(`\n[Pipeline] 🎬 Concatenating ${finalRenderedVideos.length} scenes with FFmpeg...`);
      try {
        const finalPath = await concatenateVideos(finalRenderedVideos, finalFileName);
        console.log(`\n🎉 Final video saved: ${finalPath}`);
      } catch (concatError) {
        console.error('[Pipeline] ❌ FFmpeg concat failed:', concatError.message);
      }
    } else {
      console.log('[Pipeline] ⚠️  No scenes were successfully rendered. Skipping concat.');
    }

  } catch (error) {
    console.error("❌ Pipeline failed:", error.stack);
  }
}

main();