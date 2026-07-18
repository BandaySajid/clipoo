# Clipoo

Clipoo is a lightning-fast universal clipboard. It lets you instantly sync text, links, and images across all your devices in real-time. No accounts required. Just create a room with a secret PIN, connect your devices, and start copying.

## How it works

The architecture relies heavily on Server-Sent Events (SSE) for real-time data streaming and a combination of Redis and Cloudflare D1 to keep the cache warm and data persistent.

Rooms are completely isolated. The PIN acts as a workspace key, meaning your data is strictly partitioned in both the database and the in-memory cache. 

## Features

* **Sub-second sync:** Powered by an active SSE pipeline, clips show up instantly on all connected devices.
* **Room isolation:** Secure your clipboard with a unique PIN. Only devices with the PIN can read or write to the room.
* **Auto-healing connections:** Devices automatically ping the server to stay alive. If a connection drops, the frontend self-heals and re-registers seamlessly.
* **No signups:** Completely frictionless onboarding.

## Tech Stack

**Frontend:**
* React 19 + Vite
* Vanilla CSS with a bespoke Yves Klein Blue aesthetic
* React Router for navigation

**Backend:**
* Bun + Hono
* Cloudflare D1 (SQLite database for persistence)
* Redis (In-memory cache for speed)
* Server-Sent Events (Real-time broadcasting)

## Running Locally

### 1. Start the Backend
The backend runs on Bun. Make sure you have your `.env` configured with your Cloudflare API credentials and local Redis URL.

```bash
cd backend
bun install
npm run dev
```

### 2. Start the Frontend
The frontend runs via Vite. It proxies `/api` requests to the local backend automatically.

```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Frontend (Cloudflare Pages, Vercel, Netlify)
You can build the frontend as a static site. Pass your production backend URL via `VITE_API_URL` during the build step.

```bash
cd frontend
VITE_API_URL=https://api.yourdomain.com npm run build
```

### Backend (Linux VM, VPS)
To deploy the backend on a server, clone the repository, install Bun, and start the index script. You can pass environment variables inline.

```bash
cd backend
bun install
PORT=8001 D1_DB_ID=your-db-id REDIS_URL=redis://localhost:6379 npm run start
```
