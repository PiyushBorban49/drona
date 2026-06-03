# Deployment Guide — Dronacharya v3

Follow these steps to deploy your full-stack application for free.

## 1. Prerequisites

* A [GitHub](https://github.com) account.
* A [Vercel](https://vercel.com) account (for Frontend).
* A [Hugging Face](https://huggingface.co) account (for Backend + Video Generator).
* Your project should be pushed to a GitHub repository.

## 2. Deploy the Backend (Hugging Face Spaces)

Hugging Face Spaces is the best free option for your backend because it provides enough RAM and CPU to run the Manim video generator.

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. **Name**: `dronacharya-api`.
3. **SDK**: Select **Docker**.
4. **Template**: Choose **Blank**.
5. **Visibility**: Public (or Private if you have secrets).
6. Once created, go to **Settings** > **Variables and Secrets**.
7. Add all variables from your `backend/.env`:
    * `GROQ_API_KEY`
    * `MONGODB_URI`
    * `MUX_TOKEN_ID`
    * `MUX_SECRET_KEY`
    * ...and any others.
8. Push your code to the Space (either via Git or by connecting your GitHub repo). The `Dockerfile` I created in the root will automatically build and start the server.

## 3. Deploy the Frontend (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. **Root Directory**: Set to `frontend`.
4. **Framework Preset**: Next.js.
5. **Environment Variables**:
    * Add all variables from your `frontend/.env`.
    * **CRITICAL**: Add `NEXT_PUBLIC_API_URL` and set it to your Hugging Face Space URL (e.g., `https://your-username-dronacharya-api.hf.space`).
6. Click **Deploy**.

## 4. Final Verification

* Open your Vercel URL.
* Try a chat or video generation.
* If the video generation fails, check the Hugging Face Space logs to ensure Manim is rendering correctly.

---

### ⚡ Tip: Local Speed Fix

I have already updated `backend/run.py` to stop scanning `venv` and `media`. Your local server should now restart much faster!
