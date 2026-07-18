import { Hono } from 'hono';
import { nanoId } from '../lib/nano.js';
import { getDevicesFromCache, setDeviceInCache, removeDeviceFromCache, redis, getDevicesKey } from '../lib/redis.js';
import { d1Query } from '../lib/d1.js';
import { broadcast } from '../lib/broadcast.js';

const app = new Hono();
const REDIS_TTL = 86400;

app.get('/', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const devices = await getDevicesFromCache(room);
    return c.json({ success: true, devices });
});

app.post('/', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const body = await c.req.json();
    const id = body.id || nanoId();
    const now = Date.now();
    const device = {
        id,
        name: body.name || 'Unnamed Device',
        device_type: body.device_type || 'desktop',
        last_seen: now,
        created_at: now,
        room
    };

    await setDeviceInCache(room, device);
    broadcast(room, { type: 'device_added', device });

    d1Query(
        'INSERT INTO devices (id, name, device_type, last_seen, created_at, room) VALUES (?, ?, ?, ?, ?, ?)',
        [device.id, device.name, device.device_type, device.last_seen, device.created_at, room]
    ).catch(e => console.error('[D1] device insert error:', e.message));

    return c.json({ success: true, device });
});

app.delete('/:id', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const id = c.req.param('id');

    await removeDeviceFromCache(room, id);
    broadcast(room, { type: 'device_removed', id });

    d1Query('DELETE FROM devices WHERE id = ? AND room = ?', [id, room])
        .catch(e => console.error('[D1] device delete error:', e.message));

    return c.json({ success: true });
});

app.post('/:id/ping', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const id = c.req.param('id');
    const now = Date.now();
    const key = getDevicesKey(room);

    let device;
    const raw = await redis.hget(key, id);
    if (raw) {
        device = JSON.parse(raw);
        device.last_seen = now;
        await redis.hset(key, id, JSON.stringify(device));
        await redis.expire(key, REDIS_TTL);
    } else {
        try {
            const { results } = await d1Query('SELECT * FROM devices WHERE id = ? AND room = ?', [id, room]);
            if (results && results.length > 0) {
                device = results[0];
                device.last_seen = now;
                await redis.hset(key, id, JSON.stringify(device));
                await redis.expire(key, REDIS_TTL);
                broadcast(room, { type: 'device_added', device });
            } else {
                return c.json({ success: false, error: 'Not found' }, 404);
            }
        } catch (e) {
            return c.json({ success: false, error: 'DB error' }, 500);
        }
    }

    broadcast(room, { type: 'device_ping', device });

    d1Query('UPDATE devices SET last_seen = ? WHERE id = ?', [now, id])
        .catch(e => console.error('[D1] ping update error:', e.message));

    return c.json({ success: true });
});

export default app;
