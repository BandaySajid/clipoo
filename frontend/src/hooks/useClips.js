import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useClips(sseData) {
    const [clips, setClips] = useState([]);

    useEffect(() => {
        if (!sseData) return;
        
        switch (sseData.type) {
            case 'init':
                setClips(sseData.clips || []);
                break;

            case 'clip_uploading':
                // Another device started uploading — show a loading placeholder immediately
                // Also handles the uploader's own placeholder if SSE beats the HTTP return
                setClips(prev => {
                    // Don't duplicate
                    if (prev.some(c => c.id === sseData.clip.id)) return prev;
                    // Remove any pending local optimistic placeholder and add the server one
                    return [sseData.clip, ...prev.filter(c => !c.pending)].slice(0, 100);
                });
                break;

            case 'new_clip':
                // Upload finished — swap loading placeholder for the real clip
                setClips(prev => {
                    const exists = prev.some(c => c.id === sseData.clip.id);
                    if (exists) {
                        // Replace the placeholder in-place
                        return prev.map(c => c.id === sseData.clip.id ? sseData.clip : c);
                    }
                    // Clip wasn't in the list yet (e.g. text clip from another device)
                    // Remove any local pending optimistic entry and prepend
                    return [sseData.clip, ...prev.filter(c => !c.pending)].slice(0, 100);
                });
                break;

            case 'clip_upload_failed':
                setClips(prev => prev.map(c =>
                    c.id === sseData.id ? { ...c, uploading: false, failed: true } : c
                ));
                break;

            case 'update_clip':
                setClips(prev => prev.map(c => c.id === sseData.clip.id ? sseData.clip : c));
                break;

            case 'delete_clip':
                setClips(prev => prev.filter(c => c.id !== sseData.id));
                break;
        }
    }, [sseData]);

    const addClip = async (content, type = 'TEXT') => {
        const device = localStorage.getItem('clipoo_device_name') || 'Unknown';

        if (type === 'IMAGE') {
            // For images: show local preview immediately while server uploads to R2.
            // The server will broadcast clip_uploading to other devices,
            // and new_clip when the R2 URL is ready.
            const tempId = 'temp_' + Date.now();
            const localPreview = {
                id: tempId,
                type: 'IMAGE',
                content, // local data URL for immediate preview on uploader's device
                device,
                created_at: Date.now(),
                pending: true,
                uploading: true,
            };
            setClips(prev => [localPreview, ...prev]);

            try {
                const { clip } = await apiFetch('/api/clip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type, device }),
                });
                // API returned the real R2 clip. Remove local preview — 
                // SSE new_clip will have already swapped the server placeholder.
                setClips(prev => prev
                    .filter(c => c.id !== tempId)
                    .map(c => c.id === clip.id ? clip : c)
                );
            } catch (e) {
                console.error('Failed to upload image', e);
                setClips(prev => prev.map(c =>
                    c.id === tempId ? { ...c, uploading: false, failed: true } : c
                ));
            }
        } else {
            // Text: simple optimistic add — SSE new_clip from server will replace
            const tempId = 'temp_' + Date.now();
            setClips(prev => [{
                id: tempId, type, content, device,
                created_at: Date.now(), pending: true,
            }, ...prev]);
            try {
                await apiFetch('/api/clip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type, device }),
                });
                setClips(prev => prev.filter(c => c.id !== tempId));
            } catch (e) {
                console.error('Failed to add clip', e);
                setClips(prev => prev.filter(c => c.id !== tempId));
            }
        }
    };

    const deleteClip = async (id) => {
        setClips(prev => prev.filter(c => c.id !== id));
        await apiFetch(`/api/clip/${id}`, { method: 'DELETE' });
    };

    return { clips, addClip, deleteClip };
}
