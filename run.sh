#!/bin/bash

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   SHINKU 神紅 EDITOR - Starting App...  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo ""
fi

# Start Tauri dev server
echo "Starting Tauri development server..."
npm run tauri dev
