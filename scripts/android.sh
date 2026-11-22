#!/usr/bin/env bash
# APK debug dla arm64 na runnerze z Android SDK i NDK (macOS w CI taśmy). Build pomija zmiany, które nie dotykają
# Rusta, zależności ani projektu Androida, bo trwa kilka-kilkanaście minut.
set -euo pipefail

fail() {
  echo "android: $1" >&2
  exit 1
}

# Sprawdza zbudowany APK i manifest źródłowy: identyfikator, nazwę, minimalne API, arm64 i uprawnienia.
verify_apk() {
  local apk_root=src-tauri/gen/android/app/build/outputs/apk
  local sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  local apk aapt2 badging manifest permissions
  apk=$(find "$apk_root" -name '*.apk' -path '*debug*' 2>/dev/null | head -n 1)
  [ -n "$apk" ] || fail "brak APK debug w $apk_root"

  aapt2=$(ls -d "$sdk_root"/build-tools/*/aapt2 2>/dev/null | sort -V | tail -n 1)
  [ -n "$aapt2" ] || fail "brak aapt2 w build-tools Android SDK"
  badging=$("$aapt2" dump badging "$apk")

  grep -q "^package: name='com.gibkigonzo.factorydashboard'" <<<"$badging" ||
    fail "identyfikator: oczekiwano com.gibkigonzo.factorydashboard, znaleziono: $(grep '^package:' <<<"$badging")"
  grep -q "^application-label:'Factory Dashboard'" <<<"$badging" ||
    fail "nazwa aplikacji: oczekiwano 'Factory Dashboard', znaleziono: $(grep '^application-label:' <<<"$badging")"
  # Nowsze aapt2 wypisuje minSdkVersion, starsze sdkVersion.
  grep -qE "^(min)?[sS]dkVersion:'24'" <<<"$badging" ||
    fail "minimalne API: oczekiwano 24, znaleziono: $(grep -iE '^(min)?sdkVersion:' <<<"$badging" || echo brak)"
  grep -q "^native-code: 'arm64-v8a'$" <<<"$badging" ||
    fail "architektura: oczekiwano samego arm64-v8a, znaleziono: $(grep '^native-code:' <<<"$badging")"

  manifest=src-tauri/gen/android/app/src/main/AndroidManifest.xml
  [ -f "$manifest" ] || fail "brak manifestu $manifest"
  permissions=$(grep -oE '<uses-permission[^>]*android:name="[^"]+"' "$manifest" |
    grep -oE 'android:name="[^"]+"' | sed -E 's/android:name="([^"]+)"/\1/' | sort -u)
  [ "$permissions" = "android.permission.INTERNET" ] ||
    fail "uprawnienia: oczekiwano samego android.permission.INTERNET, znaleziono: ${permissions:-brak}"

  echo "android: APK $apk"
  grep -E '^(package:|application-label:|sdkVersion:|minSdkVersion:|native-code:)' <<<"$badging" | sed 's/^/android: /'
  echo "android: uprawnienia: $permissions"
}

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

verify_apk
