#!/bin/sh
# Build dist/peel-<version>.zip for the Chrome Web Store. Includes only what the extension loads.
set -e
cd "$(dirname "$0")/.."
python3 scripts/bundle-css.py >/dev/null
V=$(node -e "console.log(require('./manifest.json').version)")
mkdir -p dist
rm -f "dist/peel-$V.zip"
zip -qr "dist/peel-$V.zip" manifest.json src icons/peel16.png icons/peel48.png icons/peel128.png -x 'src/**/.DS_Store'
echo "dist/peel-$V.zip ($(du -h "dist/peel-$V.zip" | cut -f1))"
