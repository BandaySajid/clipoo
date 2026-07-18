import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { motion } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';

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
            
            const did = generateDeviceId();
            localStorage.setItem('clipoo_device_id', did);
            localStorage.setItem('clipoo_device_name', name.trim());
            
            await apiFetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Room-ID': room },
                body: JSON.stringify({
                    id: did,
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
        <div className="w-full h-[100dvh] flex items-center justify-center p-6 bg-background text-foreground relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-accent/40 blur-[120px]"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[2rem] z-10 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent to-accent/0 opacity-50" />
                
                <div className="flex items-center gap-4 mb-8">
                    <img src="/logo.svg" alt="clipoo logo" className="w-12 h-12 drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
                    <h1 className="font-mono font-bold text-4xl tracking-tighter text-foreground drop-shadow-sm">clipoo</h1>
                </div>

                <div className="mb-10">
                    <h2 className="text-xl font-bold text-foreground mb-2">Welcome</h2>
                    <p className="text-foreground/50 text-sm leading-relaxed">Create a secure room or join an existing one to sync your universal clipboard instantly.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-foreground/70 ml-1">Device Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. My MacBook" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            autoFocus
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-foreground placeholder-foreground/30 outline-none focus:border-accent focus:bg-black/40 transition-all font-medium"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-foreground/70 ml-1">Sync PIN (Room ID)</label>
                        <input 
                            type="password" 
                            placeholder="A secret PIN to isolate your clips" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            required 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-foreground placeholder-foreground/30 outline-none focus:border-accent focus:bg-black/40 transition-all font-medium font-mono"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-accent/10 border border-accent/20 text-accent rounded-xl font-bold text-base transition-all hover:bg-accent/20 hover:border-accent/40 shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] btn-tactile disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <><Loader2 size={20} className="animate-spin" /> Connecting...</>
                        ) : (
                            <>Start Syncing <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
