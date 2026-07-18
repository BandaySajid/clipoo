import { Hono } from 'hono';
import { getClipsFromCache, getDevicesFromCache } from '../lib/redis.js';
import { addClient, removeClient } from '../lib/broadcast.js';

const app = new Hono();

app.get('/', async (c) => {
    const room = c.req.query('room') || 'default';

    const [clips, devices] = await Promise.all([
        getClipsFromCache(room),
        getDevicesFromCache(room),
    ]);

    const stream = new ReadableStream({
        start(controller) {
            const initMsg = `data: ${JSON.stringify({ type: 'init', clips, devices })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initMsg));

            addClient(room, controller);

            c.req.raw.signal.addEventListener('abort', () => {
                removeClient(room, controller);
                try { controller.close(); } catch {}
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
});

export default app;
