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
    const content = body.content;
    const type = body.type;

    const clip = {
        id,
        type,
        content, // data URL for images initially
        r2_key: null,
        device: body.device,
        created_at,
        room,
        uploading: type === 'IMAGE' && content?.startsWith('data:'),
    };

    // 1. Push to cache and broadcast immediately — all devices see it NOW
    await pushClipToCache(room, clip);
    broadcast(room, { type: 'new_clip', clip });

    // 2. If it's an image with a data URL, upload to R2 in the background
    if (type === 'IMAGE' && content?.startsWith('data:')) {
        (async () => {
            try {
                const [, meta, b64] = content.match(/^data:([^;]+);base64,(.+)$/) || [];
                if (!meta || !b64) return;

                const ext = meta.split('/')[1] || 'png';
                const r2_key = `images/${id}.${ext}`;
                const buffer = Buffer.from(b64, 'base64');

                const r2Url = await uploadToR2(r2_key, buffer, meta);

                // 3. Update the clip with the real R2 URL — broadcast the swap
                const updatedClip = { ...clip, content: r2Url, r2_key, uploading: false };
                await updateClipInCache(room, updatedClip);
                broadcast(room, { type: 'update_clip', clip: updatedClip });

                // 4. Persist to D1 with final R2 URL
                d1Query(
                    'INSERT INTO clips (id, type, content, r2_key, device, created_at, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [id, type, r2Url, r2_key, body.device, created_at, room]
                ).catch(e => console.error('[D1] clip insert error:', e.message));

            } catch (e) {
                console.error('[R2] Background upload failed:', e.message);
                // Mark as failed so clients know
                broadcast(room, { type: 'update_clip', clip: { ...clip, uploading: false, failed: true } });
            }
        })();
    } else {
        // Text clip — persist to D1 immediately
        d1Query(
            'INSERT INTO clips (id, type, content, r2_key, device, created_at, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, type, content, null, body.device, created_at, room]
        ).catch(e => console.error('[D1] clip insert error:', e.message));
    }

    return c.json({ success: true, clip });
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
