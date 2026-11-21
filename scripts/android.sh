#!/usr/bin/env bash
# APK debug dla arm64 na runnerze z Android SDK i NDK (macOS w CI taśmy). Build pomija zmiany, które nie dotykają
# Rusta, zależności ani projektu Androida, bo trwa kilka-kilkanaście minut.
set -euo pipefail

base=$(git merge-base origin/main HEAD 2>/dev/null || true)
if [ -n "$base" ]; then
  changed=$({ git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u)
  if ! grep -qE '^(src-tauri/|package\.json$|package-lock\.json$|scripts/android\.sh$)' <<<"$changed"; then
    echo "android: zmiana nie dotyka Rusta, zależności ani projektu Androida; build pominięty"
    exit 0
  fi
fi

export NDK_HOME="${NDK_HOME:-${ANDROID_NDK_LATEST_HOME:-${ANDROID_NDK_HOME:-}}}"
[ -d src-tauri/gen/android ] || npx tauri android init --ci
# Android nie przyjmuje wersji 0.0.0 z repo (prawdziwą wersję wpisuje dopiero workflow wydania), więc build debug
# dostaje tymczasową wersję tylko na czas budowania.
npx tauri android build --debug --apk --target aarch64 --ci --config '{"version":"0.0.1"}'
