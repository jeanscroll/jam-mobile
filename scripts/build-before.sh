#!/bin/bash
set -e

echo "=== Pre-build hook ==="

# Build Next.js for Capacitor
echo "Building Next.js..."
npm run build:capacitor

# Sync Capacitor
echo "Syncing Capacitor..."
npx cap sync

# Install CocoaPods for iOS
if [ -f "ios/App/Podfile" ]; then
  echo "Installing CocoaPods..."
  cd ios/App
  pod install --repo-update
  cd ../..
fi

echo "=== Pre-build complete ==="
