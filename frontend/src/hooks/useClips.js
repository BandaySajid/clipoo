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
                setClips(prev => [sseData.clip, ...prev].slice(0, 100)); // Keep latest 100
                break;
            case 'delete_clip':
                setClips(prev => prev.filter(c => c.id !== sseData.id));
                break;
        }
    }, [sseData]);

    const addClip = async (content, type = 'TEXT') => {
        const tempId = 'temp_' + Date.now();
        const newClip = {
            id: tempId,
            type,
            content,
            device: localStorage.getItem('clipoo_device_name') || 'Unknown',
            created_at: Date.now(),
            pending: true
        };
        setClips(prev => [newClip, ...prev]);
        try {
            await apiFetch('/api/clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type, device: localStorage.getItem('clipoo_device_name') || 'Unknown' }),
            });
        } catch (e) {
            console.error('Failed to add clip', e);
        } finally {
            setClips(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const deleteClip = async (id) => {
        await apiFetch(`/api/clip/${id}`, { method: 'DELETE' });
    };

    return { clips, addClip, deleteClip };
}
