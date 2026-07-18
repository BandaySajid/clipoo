import { Hono } from 'hono';
import { nanoId } from '../lib/nano.js';
import { uploadToR2, deleteFromR2 } from '../lib/r2.js';
import { pushClipToCache, removeClipFromCache, updateClipInCache } from '../lib/redis.js';
import { d1Query } from '../lib/d1.js';
import { broadcast } from '../lib/broadcast.js';

const app = new Hono();

app.post('/', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const body = await c.req.json();
    const id = nanoId();
    const created_at = Date.now();
    const type = body.type;
    const content = body.content;
    const device = body.device;

    if (type === 'IMAGE' && content?.startsWith('data:')) {
        // Step 1: Broadcast a lightweight "uploading" placeholder to all devices immediately.
        // NO image data goes through SSE — just metadata.
        const placeholder = { id, type: 'IMAGE', content: null, device, created_at, room, uploading: true };
        broadcast(room, { type: 'clip_uploading', clip: placeholder });

        // Step 2: Upload to R2 (this is the slow part — happens server-side, not client-side)
        try {
            const [, meta, b64] = content.match(/^data:([^;]+);base64,(.+)$/) || [];
            if (!meta || !b64) return c.json({ success: false, error: 'Invalid image data' }, 400);

            const ext = meta.split('/')[1] || 'png';
            const r2_key = `images/${id}.${ext}`;
            const buffer = Buffer.from(b64, 'base64');
            const r2Url = await uploadToR2(r2_key, buffer, meta);

            // Step 3: R2 upload done. Broadcast the real clip with the CDN URL.
            const clip = { id, type: 'IMAGE', content: r2Url, r2_key, device, created_at, room, uploading: false };
            await pushClipToCache(room, clip);
            broadcast(room, { type: 'new_clip', clip });

            d1Query(
                'INSERT INTO clips (id, type, content, r2_key, device, created_at, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, type, r2Url, r2_key, device, created_at, room]
            ).catch(e => console.error('[D1] clip insert error:', e.message));

            return c.json({ success: true, clip });

        } catch (e) {
            console.error('[R2] Upload failed:', e.message);
            // Tell all clients the upload failed
            broadcast(room, { type: 'clip_upload_failed', id });
            return c.json({ success: false, error: 'Upload failed' }, 500);
        }

    } else {
        // Text clip — fast path
        const clip = { id, type, content, r2_key: null, device, created_at, room };
        await pushClipToCache(room, clip);
        broadcast(room, { type: 'new_clip', clip });

        d1Query(
            'INSERT INTO clips (id, type, content, r2_key, device, created_at, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, type, content, null, device, created_at, room]
        ).catch(e => console.error('[D1] clip insert error:', e.message));

        return c.json({ success: true, clip });
    }
});

app.delete('/:id', async (c) => {
    const room = c.req.header('X-Room-ID') || 'default';
    const id = c.req.param('id');

    await removeClipFromCache(room, id);
    broadcast(room, { type: 'delete_clip', id });

    d1Query('SELECT r2_key FROM clips WHERE id = ? AND room = ?', [id, room])
        .then(async (result) => {
            const row = result.results[0];
            if (row?.r2_key) await deleteFromR2(row.r2_key).catch(() => {});
            await d1Query('DELETE FROM clips WHERE id = ?', [id]);
        })
        .catch(e => console.error('[D1] clip delete error:', e.message));

    return c.json({ success: true });
});

export default app;
