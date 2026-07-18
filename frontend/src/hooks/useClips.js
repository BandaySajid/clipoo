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
            case 'update_clip':
                // Swap data URL for R2 URL once background upload finishes
                setClips(prev => prev.map(c => c.id === sseData.clip.id ? sseData.clip : c));
                break;
            case 'delete_clip':
                setClips(prev => prev.filter(c => c.id !== sseData.id));
                break;
        }
    }, [sseData]);

    const addClip = async (content, type = 'TEXT') => {
        const tempId = 'temp_' + Date.now();
        const device = localStorage.getItem('clipoo_device_name') || 'Unknown';

        // Optimistically show immediately — for images this is the data URL
        const optimisticClip = {
            id: tempId,
            type,
            content,
            device,
            created_at: Date.now(),
            pending: true,
            uploading: type === 'IMAGE',
        };
        setClips(prev => [optimisticClip, ...prev]);

        try {
            await apiFetch('/api/clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type, device }),
            });
            // Remove optimistic entry — SSE new_clip will replace it
            setClips(prev => prev.filter(c => c.id !== tempId));
        } catch (e) {
            console.error('Failed to add clip', e);
            setClips(prev => prev.map(c => c.id === tempId ? { ...c, uploading: false, failed: true } : c));
        }
    };

    const deleteClip = async (id) => {
        setClips(prev => prev.filter(c => c.id !== id));
        await apiFetch(`/api/clip/${id}`, { method: 'DELETE' });
    };

    return { clips, addClip, deleteClip };
}
