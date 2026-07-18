import { MonitorSmartphone, Apple, Smartphone, Laptop, Tv, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

const icons = {
    apple: <Apple size={24} />,
    mobile: <Smartphone size={24} />,
    desktop: <Monitor size={24} />,
    laptop: <Laptop size={24} />,
    tv: <Tv size={24} />,
    default: <MonitorSmartphone size={24} />
};

export default function DeviceCard({ device, isMe, onRemove, index }) {
    const isOnline = (Date.now() - device.last_seen) < 120000;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="interactive-card p-6 flex flex-col justify-between overflow-hidden relative group h-full"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 rounded-full transition-opacity duration-500 ${isOnline ? 'bg-accent/20 opacity-50' : 'bg-white/5 opacity-30'}`} />

            <div className="flex items-start gap-4 z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${isOnline ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-white/5 text-foreground/40 border border-white/5'}`}>
                    {icons[device.device_type] || icons.default}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-sans font-bold text-lg text-foreground truncate">{device.name}</h3>
                        {isMe && <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold text-foreground">Current</span>}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-foreground/70 capitalize">{device.device_type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className={`font-medium flex items-center gap-1.5 ${isOnline ? 'text-accent' : 'text-foreground/40'}`}>
                            {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button 
                    onClick={() => onRemove(device.id)} 
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors btn-tactile"
                >
                    Disconnect
                </button>
            </div>
        </motion.div>
    );
}
