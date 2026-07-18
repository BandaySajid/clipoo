import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useDevices(sseData) {
    const [devices, setDevices] = useState([]);
    const [myDeviceId, setMyDeviceId] = useState(null);

    // Auto-ping logic, but NO auto-register of generic names
    useEffect(() => {
        let did = localStorage.getItem('clipoo_device_id');
        if (!did) return; // Wait for Setup.jsx to set it up
        
        setMyDeviceId(did);

        const ping = async () => {
            try {
                await apiFetch(`/api/devices/${did}/ping`, { method: 'POST' });
            } catch (e) {
                if (e.message.includes('404')) {
                    // Device lost on server, re-register with the name we chose in Setup.
                    const name = localStorage.getItem('clipoo_device_name') || 'Recovered Device';
                    const type = 'desktop';
                    try {
                        await apiFetch('/api/devices', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: did, name, device_type: type })
                        });
                    } catch(err) { console.error(err); }
                }
            }
        };
        ping();
        const intv = setInterval(ping, 60000); // every 1 min
        return () => clearInterval(intv);
    }, []);

    // Handle SSE updates
    useEffect(() => {
        if (!sseData) return;
        
        switch (sseData.type) {
            case 'init':
                setDevices(sseData.devices || []);
                break;
            case 'device_added':
                setDevices(prev => [...prev.filter(d => d.id !== sseData.device.id), sseData.device]);
                break;
            case 'device_removed':
                setDevices(prev => prev.filter(d => d.id !== sseData.id));
                break;
            case 'device_ping':
                setDevices(prev => {
                    const exists = prev.find(d => d.id === sseData.device.id);
                    if (exists) {
                        return prev.map(d => d.id === sseData.device.id ? { ...d, last_seen: sseData.device.last_seen } : d);
                    }
                    return [...prev, sseData.device];
                });
                break;
        }
    }, [sseData]);

    const addDevice = async (name, type) => {
        await apiFetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, device_type: type })
        });
    };

    const removeDevice = async (id) => {
        await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
    };

    return { devices, myDeviceId, addDevice, removeDevice };
}
