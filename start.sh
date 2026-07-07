#!/usr/bin/env bash
# AnyStl launcher — installs deps if needed, builds, and starts the production server.

set -e
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
URL="http://localhost:$PORT"

REBUILD=0
NO_OPEN=0
for arg in "$@"; do
  case "$arg" in
    --rebuild)  REBUILD=1 ;;
    --no-open)  NO_OPEN=1 ;;
    -h|--help)
      cat <<EOF
Usage: ./start.sh [--rebuild] [--no-open]

  --rebuild   Force a fresh production build before starting.
  --no-open   Don't auto-open the browser.

Environment:
  PORT        Port to listen on (default: 3000).
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 20+ from https://nodejs.org" >&2
  exit 1
fi

if [ ! -x node_modules/.bin/next ]; then
  echo "→ Installing dependencies (first run, ~1 min)..."
  npm install
fi

if [ ! -x node_modules/.bin/playwright ]; then
  echo "→ Playwright missing from node_modules, reinstalling deps..."
  npm install
fi

echo "→ Ensuring Playwright Chromium is installed..."
./node_modules/.bin/playwright install chromium

if [ "$REBUILD" = "1" ] || [ ! -f .next/BUILD_ID ]; then
  echo "→ Building for production..."
  npm run build
fi

echo
echo "AnyStl is starting at $URL"
echo "Press Ctrl+C to stop (browser will close too)."
echo

export PORT
if [ "$NO_OPEN" = "1" ]; then
  export ANYSTL_NO_OPEN=1
fi

exec node ./scripts/launch.mjs
