#!/bin/bash
set -e

echo "=== Pre-build hook ==="

# Build Next.js for Capacitor
echo "Building Next.js..."
npm run build:capacitor

# Sync Capacitor
echo "Syncing Capacitor..."
npx cap sync

echo "=== Pre-build complete ==="
