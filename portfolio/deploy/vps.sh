#!/usr/bin/env bash
# Build the portfolio on an Ubuntu VPS and serve it with nginx on port 80.
# Run from inside the cloned repo:  bash portfolio/deploy/vps.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v nginx >/dev/null || sudo apt-get install -y nginx

npm ci
npm run build

sudo mkdir -p /var/www/voidbyte
sudo rsync -a --delete dist/ /var/www/voidbyte/

sudo tee /etc/nginx/sites-available/voidbyte >/dev/null <<'NGINX'
server {
  listen 80;
  server_name _;
  root /var/www/voidbyte;
  index index.html;
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location / { try_files $uri $uri/ /index.html; }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/voidbyte /etc/nginx/sites-enabled/voidbyte
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "Live on http://$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
