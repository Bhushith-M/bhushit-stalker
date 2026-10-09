#!/bin/zsh
export PATH="$(cd "$(dirname "$0")" && pwd)/.node-portable/bin:$PATH"
echo "Node: $(node -v) | npm: $(npm -v) | npx: $(npx -v)"
npm run dev
