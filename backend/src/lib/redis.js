import Redis from 'ioredis';
import { d1Query } from './d1.js';

const { REDIS_URL = 'redis://127.0.0.1:6379' } = process.env;
const REDIS_TTL = 86400; // 24h in seconds

export const getClipsKey = (room) => `clipoo:clips:${room}`;
export const getDevicesKey = (room) => `clipoo:devices:${room}`;

export const redis = new Redis(REDIS_URL, { lazyConnect: true });
redis.on('error', err => console.error('[Redis] Error:', err.message));

export async function initRedis() {
    await redis.connect().catch(e => { console.error('[Redis] Could not connect:', e.message); process.exit(1); });
    console.log('✅ Redis connected');
}

export async function getClipsFromCache(room) {
    const key = getClipsKey(room);
    try {
        const exists = await redis.exists(key);
        if (!exists) {
            try {
                const result = await d1Query('SELECT * FROM clips WHERE room = ? ORDER BY created_at DESC LIMIT 100', [room]);
                if (result.results && result.results.length > 0) {
                    for (const clip of result.results) {
                        await redis.rpush(key, JSON.stringify(clip));
                    }
                    await redis.expire(key, REDIS_TTL);
                }
            } catch (e) {
                console.error('[Redis] D1 clips fetch error:', e.message);
            }
        }
        const raw = await redis.lrange(key, 0, 99);
        return raw.reduce((acc, r) => {
            try { acc.push(JSON.parse(r)); } catch(e) {}
            return acc;
        }, []);
    } catch (e) {
        console.error('[Redis] Cache error:', e.message);
        return [];
    }
}

export async function pushClipToCache(room, clip) {
    const key = getClipsKey(room);
    const json = JSON.stringify(clip);
    await redis.lpush(key, json);
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, REDIS_TTL);
}

export async function removeClipFromCache(room, id) {
    const key = getClipsKey(room);
    const all = await redis.lrange(key, 0, -1);
    for (const raw of all) {
        const c = JSON.parse(raw);
        if (c.id === id) {
            await redis.lrem(key, 1, raw);
            break;
        }
    }
}

export async function getDevicesFromCache(room) {
    const key = getDevicesKey(room);
    try {
        const exists = await redis.exists(key);
        if (!exists) {
            try {
                const result = await d1Query('SELECT * FROM devices WHERE room = ? ORDER BY created_at ASC', [room]);
                if (result.results && result.results.length > 0) {
                    for (const device of result.results) {
                        await redis.hset(key, device.id, JSON.stringify(device));
                    }
                    await redis.expire(key, REDIS_TTL);
                }
            } catch (e) {
                console.error('[Redis] D1 devices fetch error:', e.message);
            }
        }
        const raw = await redis.hgetall(key);
        if (!raw) return [];
        return Object.values(raw).reduce((acc, v) => {
            try { acc.push(JSON.parse(v)); } catch(e) {}
            return acc;
        }, []);
    } catch (e) {
        console.error('[Redis] Cache error:', e.message);
        return [];
    }
}

export async function setDeviceInCache(room, device) {
    const key = getDevicesKey(room);
    await redis.hset(key, device.id, JSON.stringify(device));
    await redis.expire(key, REDIS_TTL);
}

export async function removeDeviceFromCache(room, id) {
    await redis.hdel(getDevicesKey(room), id);
}
