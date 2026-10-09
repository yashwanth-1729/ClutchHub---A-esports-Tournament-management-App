# First₹ — College earning roadmap

A small static website for Indian college students: an India money/tax/scam-safety guide, 22 detailed earning playbooks (monthly tuition first), eight other business models, an INR income/deadline matrix, unit-economics calculator, a 90-day milestone map and 34 source links. It prioritises a first small paid job while supporting deeper engineering work.

## Deploy to your VPS now

Extract the complete ZIP. Open a terminal in the extracted first-rupee-roadmap folder and run:

```sh
ROADMAP_VPS_TARGET=ubuntu@YOUR_VPS_IP bash deploy-vps.sh
```

On Windows, use WSL or Git Bash; on macOS/Linux, use Terminal. SSH requests your VPS password normally; it is not stored in this package. The script uploads only the four public website files, sets up a dedicated systemd service on port 8097, checks for conflicts, and runs a local HTTP health check. If UFW is active, it permits that one port. It stops instead of replacing an existing roadmap directory/service or an occupied port. No packages are installed and existing web-server configuration is not edited.

After a successful run, open `http://YOUR_VPS_IP:8097/`. If the provider firewall blocks that port, allow inbound TCP 8097 there. This is basic static HTTP hosting; a domain and HTTPS can be added later. The browser checklist/income data stays local. The script was syntax-checked but could not be run on the VPS from this chat because SSH network access was unavailable and network escalation was disallowed.

For immediate use without hosting, open `standalone.html` in a browser. Export progress before changing device or URL: storage belongs to each browser origin.

## Run

No package install, build step, API key or backend is required.

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. Alternatively, open `index.html` directly. Local-file browser storage and clipboard behaviour can vary; the HTTP version is preferable.

## Deploy to Vercel

Use a new project called `first-rupee-roadmap` in your intended Vercel account. Do not link or overwrite an unrelated project.

- Framework preset: Other
- Build command: none
- Install command: none
- Output directory: project root
- Files served: `index.html`, `styles.css`, `content.js`, `app.js`

With an authorised Vercel CLI session, run from this directory:

```sh
vercel --scope YOUR_VERIFIED_TEAM_SLUG deploy --prod
```

The connected account must allow creating projects and deployments under that scope. An existing read-only connection is insufficient. No custom domain or paid service is required by this website. Any account-plan restrictions still apply.

## Use and edit

- `content.js`: original route briefs, readiness checks, skill/resource links, price experiments, level guidance and source register.
- `app.js`: six working views, validated browser-local progress, checklist actions, calculator and received-payment log.
- `styles.css`: responsive dashboard, diagrams and print styles.
- `index.html`: accessible navigation and static shell.

All amounts are INR. Prices, practice times and feasibility ratings are editorial experiments, not verified beginner income. The evidence page separates completed-contract evidence, buyer listings, advertised rates and estimates. Source verification date: 9 October 2026. Recheck time-sensitive platform rules when using them.

## Progress and privacy

Checklists, targets and income entries stay in this browser’s local storage. There is no cloud sync, authentication, analytics or server-side income database. Export progress to JSON before switching laptop/browser; import it on the new device. An import replaces the current local plan. Use anonymous labels and keep private client information out of this public website.

The calculator models retained income before tax and explicitly includes buyer-search time, revisions, fees and direct costs. It does not model a conversion rate or promise customers. Only completed jobs with received payment belong in the income log; advances are excluded.

## Optional browser integration

If a browser exposes WebMCP, the site registers three bounded tools: read progress, configure the goal and update checklist items. They share the UI’s validation and state. The website remains usable without this browser capability. These tools do not contact customers, deploy code or record invented income.
