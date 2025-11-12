#!/bin/bash
set -e

# Function to wait for Ollama to be ready
wait_for_ollama() {
    echo "Waiting for Ollama to start..."
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "Ollama is ready!"
            return 0
        fi
        echo "Attempt $i/30: Ollama not ready yet, waiting..."
        sleep 2
    done
    echo "Warning: Ollama may not be fully ready, continuing anyway..."
    return 1
}

# Start Ollama in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
wait_for_ollama

# Pull the model if not already present
MODEL=${LLM_MODEL:-llama3.2}
echo "Ensuring model $MODEL is available..."
ollama pull $MODEL || echo "Warning: Model pull failed, continuing anyway..."

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $OLLAMA_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Flask app in foreground
echo "Starting Flask application..."
exec python app.py

