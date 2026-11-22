#!/usr/bin/env bash
# Sprawdza uprawnienia zbudowanego APK: czyta wyjście `aapt2 dump permissions` ze standardowego wejścia
# i porównuje je z listą dozwolonych. Listę dozwolonych zmienia tylko właściciel.
set -euo pipefail

required="android.permission.INTERNET"
# Własne uprawnienie aplikacji (poziom signature), które dopisuje AndroidX Core.
allowed="$required
com.gibkigonzo.factorydashboard.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"

permissions=$(grep -E "^uses-permission(-sdk-23)?: name='" |
  sed -E "s/^uses-permission(-sdk-23)?: name='([^']+)'.*/\2/" | sort -u || true)

unexpected=""
for permission in $permissions; do
  if ! printf '%s\n' "$allowed" | grep -qxF "$permission"; then
    unexpected="$unexpected $permission"
  fi
done

if [ -n "$unexpected" ] || ! printf '%s\n' "$permissions" | grep -qxF "$required"; then
  echo "android: uprawnienia: dozwolone: $(echo $allowed), znaleziono: $(echo ${permissions:-brak})" >&2
  exit 1
fi

echo "android: uprawnienia: $permissions"
