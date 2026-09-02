# Production deployment and AI-key security

AskRosie is deployed as one HTTPS Node web service. The React browser application calls same-origin `/api/*` routes; only the server calls Groq and NVIDIA. Provider credentials never enter the browser bundle.

## Deploy with Render

1. In Render, select **New → Blueprint** and connect `Aveek-Sahana/AskRosie-Repo-Team-13-Demo`.
2. Render reads `render.yaml`. Do **not** add any API key to GitHub, `render.yaml`, a browser variable, or the build command.
3. In the service’s **Environment** settings, enter these as encrypted secrets:
   - `GROQ_API_KEY`
   - `NVIDIA_API_KEY`
4. Deploy once. Copy the HTTPS service URL, such as `https://askrosie-team-13-demo.onrender.com`.
5. Set `ALLOWED_ORIGIN` to that exact HTTPS URL and redeploy. This allows browser API calls only from the public AskRosie origin.
6. Test on a phone using the HTTPS URL. The live-camera permission prompt will not work reliably from an `http://` Wi-Fi address.

## Required environment variables

| Variable | Where it belongs | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | Render encrypted environment secret | Primary model provider; server only |
| `NVIDIA_API_KEY` | Render encrypted environment secret | Failover provider; server only |
| `ALLOWED_ORIGIN` | Render encrypted environment secret | Exact final `https://...` site URL |
| `GROQ_MODEL` | Render environment setting | Optional, non-secret |
| `NVIDIA_NIM_MODEL` | Render environment setting | Optional, non-secret |
| `API_MAX_REQUEST_BYTES` | Render environment setting | Defaults to 2,500,000 bytes |

Never use names beginning with `VITE_` for secrets. Vite intentionally exposes `VITE_*` values to browser JavaScript.

## Built-in public-demo protections

- The browser sends images to AskRosie only; it never sends provider credentials.
- Images are resized to 1600px maximum and JPEG-compressed before upload.
- API requests are capped at 2.5 MB, including chunked requests.
- Same-origin enforcement uses `ALLOWED_ORIGIN` in production.
- Per-address endpoint rate limits reduce public-QR abuse.
- Server responses do not reveal provider keys or raw upstream credentials.
- `.env.local`, all `.env*` variants except `.env.example`, build output, and dependencies are Git-ignored.

## Operations

- Create separate **development** and **production** keys. Do not reuse a key between environments.
- Rotate any key that was previously copied into a backup, chat, screenshot, or terminal output.
- Turn on usage/spend alerts in Groq and NVIDIA dashboards.
- Do not log request bodies, image data URLs, provider `Authorization` headers, or `process.env`.
- Keep rate limits intentionally conservative for the public QR demo. They protect costs but are not a substitute for provider spend limits.

## Local production-style test

```bash
npm run build
PORT=4175 ALLOWED_ORIGIN=http://127.0.0.1:4175 npm run start
```

For actual phone camera testing, use the deployed HTTPS URL.
