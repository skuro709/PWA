#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/wasm/dist
em++ src/wasm/simulation.cpp -O3 -std=c++17 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web \
  -s FILESYSTEM=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_jw_init","_jw_reset","_jw_step","_jw_paint","_jw_world","_jw_width","_jw_height","_jw_active_count"]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAPU8"]' \
  -o src/wasm/dist/simulation.js