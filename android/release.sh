#!/usr/bin/env bash
#
# One command, one signed release.
#
#   pnpm android:release            # bumps versionCode, builds, signs → android/dist/
#   pnpm android:release 1.2.0      # same, and sets versionName
#
# First run: finds the Android SDK, mints the upload key (android/keystore/, never
# committed) and writes android/keystore.properties. Every run: versionCode + 1 in
# android/version.properties (commit it), then `bundleRelease assembleRelease`.
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
code="$(sed -n 's/^versionCode=//p' version.properties)"
name="$(sed -n 's/^versionName=//p' version.properties)"
code=$(( ${code:-0} + 1 ))
name="${1:-${name:-1.0.0}}"
cat > version.properties <<EOF
# Bumped by android/release.sh on every release build. Commit it with the release.
versionCode=$code
versionName=$name
EOF
bold "Building Breeq $name ($code)"

# ---- 4. Build -----------------------------------------------------------------------------
./gradlew --quiet --console=plain bundleRelease assembleRelease

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
