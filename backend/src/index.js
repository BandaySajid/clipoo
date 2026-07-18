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

app.use('*', cors());

// Routes
app.route('/api/clip', clipsRoute);
app.route('/api/devices', devicesRoute);
app.route('/api/stream', streamRoute);

// Boot
await initRedis();
await initDB();

console.log(`🚀 Clipoo Backend on http://0.0.0.0:${PORT}`);

export default {
    port: PORT,
    hostname: '0.0.0.0',
    idleTimeout: 0,
    fetch: app.fetch,
};
