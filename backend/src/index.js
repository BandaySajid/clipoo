import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    for (const line of envFile.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (!process.env[key]) process.env[key] = value;
        }
    }
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { initDB } from './lib/d1.js';
import { initRedis } from './lib/redis.js';
import { broadcast } from './lib/broadcast.js';

import clipsRoute from './routes/clips.js';
import devicesRoute from './routes/devices.js';
import streamRoute from './routes/stream.js';

const PORT = process.env.PORT || 8001;

const app = new Hono();

app.use('*', cors({
    origin: (origin) => {
        if (!origin) return 'https://clip.sajidbanday.me';
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.includes('sajidbanday.me')) {
            return origin;
        }
        return 'https://clip.sajidbanday.me';
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Room-ID', 'Accept'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
    exposeHeaders: ['Content-Length', 'X-Room-ID'],
    maxAge: 600,
}));

// Routes
app.route('/api/clip', clipsRoute);
app.route('/api/devices', devicesRoute);
app.route('/api/stream', streamRoute);

// Boot
await initRedis();
await initDB();

console.log(`🚀 Clipoo Backend on http://0.0.0.0:${PORT}`);

Bun.serve({
    port: PORT,
    hostname: '0.0.0.0',
    idleTimeout: 0,
    fetch: app.fetch,
});
