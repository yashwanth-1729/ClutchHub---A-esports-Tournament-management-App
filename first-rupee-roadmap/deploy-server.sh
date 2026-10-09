#!/usr/bin/env bash
# Run through deploy-vps.sh on the target Ubuntu VPS.
set -euo pipefail
test "$(id -u)" = 0 || { echo "Run this server setup with sudo." >&2; exit 1; }
ROADMAP_USER=ubuntu
ROADMAP_HOME="$(getent passwd "$ROADMAP_USER" | cut -d: -f6)"
test -n "$ROADMAP_HOME" || { echo "The ubuntu account was not found." >&2; exit 1; }
ROADMAP_STAGE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROADMAP_ROOT="$ROADMAP_HOME/sites/first-rupee-roadmap"
ROADMAP_UNIT=/etc/systemd/system/first-rupee-roadmap.service
ROADMAP_PORT=8097
command -v python3 >/dev/null || { echo "Python 3 is required." >&2; exit 1; }
command -v systemctl >/dev/null || { echo "systemd is required." >&2; exit 1; }
command -v ss >/dev/null || { echo "ss is required to check the port." >&2; exit 1; }
if test -e "$ROADMAP_UNIT" || test -e "$ROADMAP_ROOT"; then
  echo "A roadmap service or directory already exists. Stopping for review; existing content has been kept." >&2
  exit 1
fi
if test -n "$(ss -H -ltn "sport = :$ROADMAP_PORT")"; then
  echo "Port $ROADMAP_PORT is already in use. Stopping for review." >&2
  exit 1
fi
for ROADMAP_FILE in index.html styles.css content.js app.js; do
  test -f "$ROADMAP_STAGE/$ROADMAP_FILE" || { echo "Missing upload: $ROADMAP_FILE" >&2; exit 1; }
done
install -d -m 755 -o "$ROADMAP_USER" -g "$ROADMAP_USER" "$ROADMAP_ROOT"
for ROADMAP_FILE in index.html styles.css content.js app.js; do
  install -m 644 -o "$ROADMAP_USER" -g "$ROADMAP_USER" "$ROADMAP_STAGE/$ROADMAP_FILE" "$ROADMAP_ROOT/$ROADMAP_FILE"
done
cat > "$ROADMAP_UNIT" <<EOF
[Unit]
Description=First Rupee student earning roadmap
After=network.target

[Service]
Type=simple
User=$ROADMAP_USER
Group=$ROADMAP_USER
WorkingDirectory=$ROADMAP_ROOT
ExecStart=$(command -v python3) -m http.server $ROADMAP_PORT --bind 0.0.0.0 --directory $ROADMAP_ROOT
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
EOF
chmod 644 "$ROADMAP_UNIT"
systemd-analyze verify "$ROADMAP_UNIT"
systemctl daemon-reload
systemctl enable --now first-rupee-roadmap.service
if command -v ufw >/dev/null && ufw status | head -n 1 | grep -q '^Status: active'; then
  ufw allow "$ROADMAP_PORT/tcp" comment 'First Rupee roadmap'
fi
python3 - "$ROADMAP_PORT" <<'PY'
import sys, time, urllib.request
url = 'http://127.0.0.1:' + sys.argv[1] + '/'
for attempt in range(20):
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            body = response.read()
            assert response.status == 200 and b'First' in body
        print('Local HTTP health check passed.')
        break
    except Exception:
        if attempt == 19:
            raise
        time.sleep(0.25)
PY
echo 'Website: http://YOUR_VPS_IP:8097/'
echo 'If the URL is blocked externally, allow inbound TCP 8097 in the VPS provider firewall.'
echo 'Manage it with: sudo systemctl status first-rupee-roadmap.service'
