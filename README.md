# AskRosie — Crystal Bridges Art Companion

AskRosie is an image-aware museum companion for Crystal Bridges Museum of American Art. Visitors can use a live camera or upload a photo, receive a catalog-constrained artwork suggestion, confirm or correct the title in a kid-friendly flow, and chat with Rosie using official collection records and project research.

## Highlights

- Live browser camera preview, shutter capture, and device-photo upload
- Crystal Bridges collection sync (`data/crystal-bridges-works.json`)
- Catalog-constrained visual classification with visitor confirmation
- LLM-assisted title/artist spelling help against official records
- Official-record-grounded, streamed artwork chat
- Groq-first with NVIDIA NIM failover
- LLM moderation before visitor words enter the local community cloud
- Mobile-friendly UI; live camera requires HTTPS on a deployed site

## Setup

```bash
npm install
cp .env.example .env.local
```

Set server-only values in `.env.local`:

```dotenv
GROQ_API_KEY=your-groq-key
NVIDIA_API_KEY=your-nvidia-key
# Optional model overrides
GROQ_MODEL=qwen/qwen3.6-27b
NVIDIA_NIM_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
```

Never commit `.env.local` or API keys. `.env.example` contains placeholders only.

## Run locally

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

Open <http://127.0.0.1:4173>.

## Refresh official collection data

```bash
node scripts/sync_crystal_bridges_collection.mjs
```

## Verification

```bash
npm run verify:live
```

This starts a temporary API server if needed, builds the app, tests official-image classification, verifies an official-record chat response, and pressure-tests four concurrent streamed chat requests.

## Camera and deployment

The browser camera uses `getUserMedia`, displays a live preview, and captures the shutter frame into the existing classifier flow. A real phone camera prompt needs an HTTPS URL. See [CAMERA_TESTING.md](CAMERA_TESTING.md) for local and phone testing details.

## Deployment and AI-key security

Use the included [DEPLOYMENT.md](DEPLOYMENT.md) and `render.yaml` to deploy the React app and its server-side `/api/*` routes as one HTTPS service. Provider keys belong only in the host’s encrypted environment secrets; they must never use a `VITE_` prefix.

## Project layout

- `src/` — React visitor experience and artwork catalog
- `vite.config.js` — server-side API middleware, classification, retrieval, provider failover
- `data/` — synchronized official Crystal Bridges collection records
- `knowledge/` — in-repository Markdown research corpus used for grounded responses
- `public/` — visitor-facing art companion assets and maps
- `scripts/` — sync, integration, failover, and pressure-test utilities
