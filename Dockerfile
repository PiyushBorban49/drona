# Use the official Manim Community image which includes Python, FFmpeg, and Manim
FROM manimcommunity/manim:latest

# Switch to root to install Node.js and other system deps
USER root

# Install Node.js (needed for the video generator)
RUN apt-get update && apt-get install -y curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements first for caching
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy video-generator package.json first for caching
COPY video-generator/package.json ./video-generator/package.json
RUN cd video-generator && npm install

# Copy the rest of the application
COPY backend ./backend
COPY video-generator ./video-generator

# Ensure media directories exist
RUN mkdir -p backend/media/videos backend/media/keyframes video-generator/output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Start the backend server
# We run from the backend directory to ensure relative paths work as expected locally
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
