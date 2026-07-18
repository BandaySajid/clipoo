import { NavLink, Link } from 'react-router-dom';
import { Copy, MonitorSmartphone, Wifi, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Sidebar({ connected, isOpen, close, installPrompt, setInstallPrompt }) {
    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
                        onClick={close}
                    />
                )}
            </AnimatePresence>

            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 glass-panel border-r border-white/5
                flex flex-col justify-between p-6 pt-24 md:pt-6
                transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div>
                    <div className="hidden md:flex items-center justify-between mb-12">
                        <Link to="/" onClick={close} className="flex items-center gap-3 decoration-none group">
                            <img src="/logo.svg" alt="clipoo logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(0,229,255,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all" />
                            <span className="font-mono font-bold text-2xl tracking-tighter text-foreground drop-shadow-sm">clipoo</span>
                        </Link>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <NavLink to="/" onClick={close} className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                            ${isActive ? 'bg-white/10 text-accent' : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'}
                        `}>
                            <Copy size={18} /> Clips
                        </NavLink>
                        <NavLink to="/devices" onClick={close} className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                            ${isActive ? 'bg-white/10 text-accent' : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'}
                        `}>
                            <MonitorSmartphone size={18} /> Devices
                        </NavLink>
                    </nav>

                    {installPrompt && (
                        <div className="mt-8 px-2">
                            <button
                                onClick={async () => {
                                    installPrompt.prompt();
                                    const { outcome } = await installPrompt.userChoice;
                                    if (outcome === 'accepted') {
                                        setInstallPrompt(null);
                                    }
                                }}
                                className="w-full py-3 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent rounded-xl font-semibold flex items-center justify-center gap-2 btn-tactile"
                            >
                                <MonitorSmartphone size={16} /> Install App
                            </button>
                        </div>
                    )}
                </div>
                
                <div className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl ${connected ? 'bg-accent/10 text-accent' : 'bg-white/5 text-foreground/50'}`}>
                    <div className="relative flex items-center justify-center w-4 h-4">
                        {connected ? (
                            <>
                                <div className="absolute inset-0 rounded-full bg-accent animate-pulse-ring"></div>
                                <div className="w-2 h-2 rounded-full bg-accent relative z-10"></div>
                            </>
                        ) : (
                            <WifiOff size={14} />
                        )}
                    </div>
                    <span>{connected ? 'Sync Active' : 'Offline'}</span>
                </div>
            </aside>
        </>
    );
}
