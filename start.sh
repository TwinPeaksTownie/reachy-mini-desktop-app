#!/bin/bash

# start.sh
# Single entry point for starting the Reachy Mini Desktop App development environment
# Handles sidecar building and dependency checks automatically

set -e

# Default settings
REBUILD_SIDECAR=false
SKIP_DEP_CHECK=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --rebuild) REBUILD_SIDECAR=true ;;
        --skip-deps) SKIP_DEP_CHECK=true ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "🚀 Starting Reachy Mini Desktop App..."

# 1. Dependency Check
if [ "$SKIP_DEP_CHECK" = false ]; then
    if [ ! -d "node_modules" ]; then
        echo "📦 node_modules missing. Installing dependencies..."
        yarn install
    else
        echo "✅ Dependencies found."
    fi
fi

# 2. Sidecar Check
SIDECAR_DIR="src-tauri/binaries"
# Check if directory exists and is not empty
if [ ! -d "$SIDECAR_DIR" ] || [ -z "$(ls -A $SIDECAR_DIR)" ] || [ "$REBUILD_SIDECAR" = true ]; then
    if [ "$REBUILD_SIDECAR" = true ]; then
        echo "🔄 Rebuild requested. Building sidecar..."
    else
        echo "⚠️  Sidecar binaries missing. Building sidecar..."
    fi
    
    # Detect OS to run correct script
    if [[ "$OSTYPE" == "darwin"* ]]; then
        yarn build:sidecar-macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        yarn build:sidecar-linux
    else
        echo "❌ Unsupported OS for automatic sidecar build: $OSTYPE"
        echo "Please run the appropriate build:sidecar command manually."
        exit 1
    fi
    
    echo "✅ Sidecar built successfully."
else
    echo "✅ Sidecar binaries present. Skipping build."
    echo "   (Run with --rebuild to force a fresh sidecar build)"
fi

# 3. Launch App
echo "✨ Launching Tauri Dev Server..."
# Pass remaining arguments to tauri:dev if any (currently none, but good practice)
yarn tauri:dev
