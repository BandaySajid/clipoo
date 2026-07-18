import { useState } from 'react';
import { apiFetch } from '../lib/api';

function getAgentInfo() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/mac/i.test(ua)) return 'apple';
    if (/win/i.test(ua)) return 'desktop';
    return 'desktop';
}

function generateDeviceId() {
    return 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function Setup({ onComplete }) {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !pin.trim()) return;
        
        setLoading(true);
        try {
            const room = pin.trim();
            localStorage.setItem('clipoo_room', room);
            
            // Register this device to the room immediately
            const did = generateDeviceId();
            localStorage.setItem('clipoo_device_id', did);
            localStorage.setItem('clipoo_device_name', name.trim());
            
            await apiFetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Room-ID': room },
                body: JSON.stringify({
                    id: did, // The backend generates it if not provided, but we can't force it easily unless we change backend.
                    name: name.trim(),
                    device_type: getAgentInfo()
                })
            });
            
            onComplete(room);
        } catch (err) {
            console.error('Setup failed:', err);
            alert('Could not connect to server.');
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="brand logo setup-logo">clipoo</div>
                <h2>Welcome to Clipoo</h2>
                <p>Create a secure room or join an existing one.</p>
                
                <form onSubmit={handleSubmit} className="setup-form">
                    <div className="form-group">
                        <label>Device Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. My MacBook" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Sync PIN (Room ID)</label>
                        <input 
                            type="password" 
                            placeholder="A secret PIN to isolate your clips" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-setup" disabled={loading}>
                        {loading ? 'Connecting...' : 'Start Syncing'}
                    </button>
                </form>
            </div>
        </div>
    );
}
