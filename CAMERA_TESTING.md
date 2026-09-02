# AskRosie camera testing and deployment

## Local laptop testing

```bash
cd ~/AskRosie/ask-rosie-experience
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`, choose **Take a photo**, and allow camera access when the browser asks. The live preview appears before the shutter button. Select the shutter to capture a still image and run classification.

## Phone testing

Browser camera APIs require a secure context. `http://localhost` is allowed on the same device, but a phone opening a laptop's LAN address such as `http://192.168.x.x:4173` is normally **not** secure and cannot obtain camera permission.

Test live phone camera only through an **HTTPS** URL—for example, the deployed app URL or an HTTPS development tunnel. On the deployed site, the visitor selects **Take a photo**, grants the browser camera permission, sees the rear-camera preview where available, then taps the shutter.

**Choose from device** remains available on desktop and mobile as a fallback.

## Deployment gate

Before publishing the QR code, deploy behind HTTPS, configure the server-side `GROQ_API_KEY` and `NVIDIA_API_KEY` only in the hosting provider's secret/environment settings, refresh the official collection catalog, and run:

```bash
node scripts/sync_crystal_bridges_collection.mjs
npm run verify:live
```
