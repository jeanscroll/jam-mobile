#!/bin/bash
set -e

echo "Installing CocoaPods dependencies..."
cd ios/App
pod install --repo-update
cd ../..

echo "iOS build preparation complete!"
