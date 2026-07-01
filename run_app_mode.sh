#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8501}"
URL="http://localhost:${PORT}"
STREAMLIT_PID=""

if ! curl -fsS "$URL" >/dev/null 2>&1; then
  streamlit run app.py --server.headless true --server.port "$PORT" &
  STREAMLIT_PID=$!
fi

cleanup() {
  if [ -n "$STREAMLIT_PID" ]; then
    kill "$STREAMLIT_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for _ in {1..60}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL"
else
  open "$URL"
fi

if [ -n "$STREAMLIT_PID" ]; then
  wait "$STREAMLIT_PID"
fi
