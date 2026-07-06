#!/usr/bin/env bash
# Discord requires DAVE (E2EE) voice since March 2026 — Lavalink 4.2+ is required.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/lavalink" && pwd)"
VERSION="${1:-4.2.2}"
URL="https://github.com/lavalink-devs/Lavalink/releases/download/${VERSION}/Lavalink.jar"

echo "Upgrading Lavalink in ${DIR} to ${VERSION} (DAVE support)..."
if [[ -f "${DIR}/Lavalink.jar" ]]; then
  cp "${DIR}/Lavalink.jar" "${DIR}/Lavalink.jar.bak"
fi
curl -fsSL -o "${DIR}/Lavalink.jar" "${URL}"
java -jar "${DIR}/Lavalink.jar" --version
echo "Done. Restart Lavalink: cd server/lavalink && java -jar Lavalink.jar"
