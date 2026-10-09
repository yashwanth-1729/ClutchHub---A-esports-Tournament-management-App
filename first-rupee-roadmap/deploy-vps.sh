#!/usr/bin/env bash
set -euo pipefail
ROADMAP_TARGET="${ROADMAP_VPS_TARGET:-ubuntu@YOUR_VPS_IP}"
ROADMAP_SOURCE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
for ROADMAP_FILE in index.html styles.css content.js app.js deploy-server.sh; do
  test -f "$ROADMAP_SOURCE/$ROADMAP_FILE" || { echo "Missing $ROADMAP_FILE. Extract the entire ZIP first." >&2; exit 1; }
done
command -v ssh >/dev/null || { echo "Install an OpenSSH client first." >&2; exit 1; }
command -v scp >/dev/null || { echo "Install an OpenSSH client first." >&2; exit 1; }
echo "Uploading First₹ to $ROADMAP_TARGET. SSH will request your password if needed."
ssh "$ROADMAP_TARGET" 'umask 077; mkdir -p first-rupee-roadmap-upload'
scp "$ROADMAP_SOURCE/index.html" "$ROADMAP_SOURCE/styles.css" "$ROADMAP_SOURCE/content.js" "$ROADMAP_SOURCE/app.js" "$ROADMAP_SOURCE/deploy-server.sh" "$ROADMAP_TARGET:first-rupee-roadmap-upload/"
ssh -t "$ROADMAP_TARGET" 'sudo bash first-rupee-roadmap-upload/deploy-server.sh'
