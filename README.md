---
title: Dronacharya API
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🎓 Dronacharya v3 — AI Tutor & Video Generator

This is the backend and video generation engine for Dronacharya v3.

## Deployment Details

- **Backend**: Hosted on Hugging Face Spaces (Docker SDK)
- **Video Engine**: Manim + FFmpeg (inside Docker)
- **Frontend**: Hosted on Vercel

## Configuration

Make sure to set the following Environment Variables in your Hugging Face Space settings:

- `GROQ_API_KEY`
- `MONGODB_URI`
- `MUX_TOKEN_ID`
- `MUX_SECRET_KEY`
- `GOOGLE_API_KEY`
- `PLANNER_MODEL`
- `CODER_MODEL`

For deployment instructions, see [deployment_guide.md](./deployment_guide.md).
