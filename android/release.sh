#!/usr/bin/env bash
#
# One command, one signed release.
#
#   pnpm android:release            # versionCode + 1, patch + 1 (1.0.0 → 1.0.1)
#   pnpm android:release 1.2.0      # versionCode + 1, versionName set to 1.2.0
#
# First run: finds the Android SDK, mints the upload key (android/keystore/, never
# committed) and writes android/keystore.properties. Every run: versionCode + 1 and
# the patch of versionName + 1 in android/version.properties (commit it), then
# `bundleRelease assembleRelease`.
# Outputs: android/dist/breeq-<versionName>-<versionCode>.aab (Play) and .apk (sideload).
set -euo pipefail
cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

# ---- 1. SDK ---------------------------------------------------------------------------
if [ ! -f local.properties ]; then
  for candidate in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Library/Android/sdk" \
                   /opt/homebrew/share/android-commandlinetools "$HOME/Android/Sdk"; do
    if [ -n "$candidate" ] && [ -d "$candidate/platforms" ]; then
      echo "sdk.dir=$candidate" > local.properties
      break
    fi
  done
  if [ ! -f local.properties ]; then
    echo "Android SDK not found. Install it (brew install --cask android-commandlinetools) or set ANDROID_HOME." >&2
    exit 1
  fi
fi

# ---- 2. Upload key ----------------------------------------------------------------------
if [ ! -f keystore.properties ]; then
  mkdir -p keystore
  store="keystore/breeq-upload.jks"
  if [ -f "$store" ]; then
    echo "$store exists but keystore.properties is missing; restore it from your backup." >&2
    exit 1
  fi
  password="$(openssl rand -base64 36 | tr -dc 'A-Za-z0-9' | cut -c1-32)"
  keytool -genkeypair -keystore "$store" -alias breeq -keyalg RSA -keysize 4096 -validity 10000 \
    -storepass "$password" -keypass "$password" -dname "CN=Breeq, O=Breeq, C=FR" >/dev/null 2>&1
  cat > keystore.properties <<EOF
storeFile=keystore/breeq-upload.jks
storePassword=$password
keyAlias=breeq
keyPassword=$password
EOF
  chmod 600 keystore.properties "$store"
  bold "New upload key: android/keystore/breeq-upload.jks + android/keystore.properties"
  echo "   Back both up somewhere safe (password manager). Play App Signing can reset a lost upload key, but only by ticket."
fi

# ---- 3. Version -------------------------------------------------------------------------
# 1.0.4 → 1.0.5. Anything that is not major.minor.patch is left as written.
bump_patch() {
  local v="$1"
  if [[ "$v" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "$((BASH_REMATCH[3] + 1))"
  elif [[ "$v" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.1\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  else
    printf '%s\n' "$v"
  fi
}

code="$(sed -n 's/^versionCode=//p' version.properties)"
name="$(sed -n 's/^versionName=//p' version.properties)"
code=$(( ${code:-0} + 1 ))
if [ $# -ge 1 ]; then
  name="$1"
else
  name="$(bump_patch "${name:-1.0.0}")"
fi
cat > version.properties <<EOF
# Bumped by android/release.sh on every release build. Commit it with the release.
versionCode=$code
versionName=$name
EOF
bold "Building Breeq $name ($code)"

# ---- 3b. OneSignal App ID (public; baked so a cold start from a notification works) ----
onesignal_id=""
if [ -f ../.env ]; then
  onesignal_id="$(grep -E '^NEXT_PUBLIC_ONESIGNAL_APP_ID=' ../.env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')"
fi
if printf '%s' "$onesignal_id" | grep -Eq '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
  bold "OneSignal App ID is baked into this build."
else
  onesignal_id=""
  echo "OneSignal App ID is not set. The SDK is included; put NEXT_PUBLIC_ONESIGNAL_APP_ID in .env and build again before Play."
fi

# ---- 4. Build -----------------------------------------------------------------------------
./gradlew --quiet --console=plain bundleRelease assembleRelease -Pbreeq.onesignalAppId="$onesignal_id"

# ---- 5. Collect ---------------------------------------------------------------------------
mkdir -p dist
aab="dist/breeq-$name-$code.aab"
apk="dist/breeq-$name-$code.apk"
cp app/build/outputs/bundle/release/app-release.aab "$aab"
cp app/build/outputs/apk/release/app-release.apk "$apk"

sha256="$(keytool -list -v -keystore keystore/breeq-upload.jks -alias breeq \
  -storepass "$(sed -n 's/^storePassword=//p' keystore.properties)" 2>/dev/null \
  | sed -n 's/.*SHA256: //p' | head -1)"

echo
bold "Done."
echo "  Play Console (Production → Create release):  android/$aab"
echo "  Sideload / test device:                       adb install -r android/$apk"
echo
echo "  Upload certificate SHA-256: $sha256"
echo "  App Links: set ANDROID_CERT_SHA256 to that value on the site so https://breeq.space/.well-known/assetlinks.json"
echo "  lists this key; the app then opens breeq.space links (referrals included)."
echo
echo "  Remember: git add android/version.properties"
