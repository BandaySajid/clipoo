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
            case 'new_clip':
                setClips(prev => {
                    // Replace optimistic placeholder if it exists, otherwise prepend
                    const hasOptimistic = prev.some(c => c.pending);
                    if (hasOptimistic) {
                        return [sseData.clip, ...prev.filter(c => !c.pending)].slice(0, 100);
                    }
                    return [sseData.clip, ...prev].slice(0, 100);
                });
                break;
            case 'delete_clip':
                setClips(prev => prev.filter(c => c.id !== sseData.id));
                break;
        }
    }, [sseData]);

    const addClip = async (content, type = 'TEXT') => {
        const tempId = 'temp_' + Date.now();
        const device = localStorage.getItem('clipoo_device_name') || 'Unknown';

        if (type === 'IMAGE') {
            // Show the data URL immediately — instant preview, no waiting for R2
            const optimisticClip = {
                id: tempId,
                type: 'IMAGE',
                content, // data URL — shown right away
                device,
                created_at: Date.now(),
                pending: true,
                uploading: true,
            };
            setClips(prev => [optimisticClip, ...prev]);

            try {
                const result = await apiFetch('/api/clip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type, device }),
                });
                // Swap data URL for the real R2 URL in the local state
                // The SSE broadcast will also come in and replace, but this makes it instant
                setClips(prev => prev.map(c =>
                    c.id === tempId ? { ...result.clip, pending: false, uploading: false } : c
                ));
            } catch (e) {
                console.error('Failed to upload image', e);
                // Mark as failed but keep showing the preview
                setClips(prev => prev.map(c =>
                    c.id === tempId ? { ...c, uploading: false, failed: true } : c
                ));
            }
        } else {
            // Text: optimistic add, then remove temp when SSE comes back
            const newClip = {
                id: tempId,
                type,
                content,
                device,
                created_at: Date.now(),
                pending: true,
            };
            setClips(prev => [newClip, ...prev]);
            try {
                await apiFetch('/api/clip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type, device }),
                });
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
