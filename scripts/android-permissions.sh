#!/usr/bin/env bash
# Sprawdza uprawnienia zbudowanego APK: czyta wyjście `aapt2 dump permissions` ze standardowego wejścia
# i porównuje je z listą dozwolonych. Listę dozwolonych zmienia tylko właściciel.
set -euo pipefail

allowed="android.permission.INTERNET"

permissions=$(grep -E "^uses-permission(-sdk-23)?: name='" |
  sed -E "s/^uses-permission(-sdk-23)?: name='([^']+)'.*/\2/" | sort -u || true)

if [ "$permissions" != "$allowed" ]; then
  echo "android: uprawnienia: oczekiwano samego $allowed, znaleziono: ${permissions:-brak}" >&2
  exit 1
fi

echo "android: uprawnienia: $permissions"
