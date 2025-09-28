#!/bin/bash

set -e

echo "Building curse for multiple targets..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Array of targets
targets=(
  "bun-linux-x64"
  "bun-linux-arm64"
  "bun-darwin-x64"
  "bun-darwin-arm64"
)

# Build for each target
for target in "${targets[@]}"; do
  echo "Building for $target..."
  bun build --minify src/index.ts --compile --target=$target --outfile dist/curse-$target
  echo "✓ Built curse-$target"
done

# Clean up temporary build files
rm -f .*.bun-build

echo "All builds completed successfully!"
echo "Built targets:"
for target in "${targets[@]}"; do
  echo "  - dist/curse-$target"
done

