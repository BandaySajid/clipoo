import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Workspace from './pages/Workspace';
import Devices from './pages/Devices';
import Setup from './pages/Setup';
import { useSSE } from './hooks/useSSE';
import { useClips } from './hooks/useClips';
import { useDevices } from './hooks/useDevices';
import { Menu, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function App() {
    const [room, setRoom] = useState(localStorage.getItem('clipoo_room') || null);
    
    if (!room) {
        return <Setup onComplete={(r) => setRoom(r)} />;
    }

    return <MainApp room={room} />;
}

function MainApp({ room }) {
    const { clips, handleSSE: handleClipsSSE, addClip, deleteClip } = useClips();
    const { devices, myDeviceId, handleSSE: handleDevicesSSE, addDevice, removeDevice } = useDevices();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [autoCopied, setAutoCopied] = useState(false);

    const { connected } = useSSE(room, (data) => {
        handleClipsSSE(data);
        handleDevicesSSE(data);
    });

    // Listen for PWA install prompt
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault(); // Prevent automatic Chrome mini-infobar
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Auto-copy on text selection
    useEffect(() => {
        const handleSelectionEnd = () => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText && selectedText.length > 0) {
                // Check if user is actually selecting text (not just clicking)
                navigator.clipboard.writeText(selectedText).then(() => {
                    setAutoCopied(true);
                    setTimeout(() => setAutoCopied(false), 2000);
                }).catch(err => {
                    console.error('Auto-copy failed:', err);
                });
            }
        };

        document.addEventListener('mouseup', handleSelectionEnd);
        document.addEventListener('touchend', handleSelectionEnd);

        return () => {
            document.removeEventListener('mouseup', handleSelectionEnd);
            document.removeEventListener('touchend', handleSelectionEnd);
        };
    }, []);

    return (
        <Router>
            <div className="flex w-full h-[100dvh] relative overflow-hidden bg-background text-foreground">
                <Sidebar 
                    connected={connected} 
                    isOpen={sidebarOpen} 
                    close={() => setSidebarOpen(false)} 
                    installPrompt={installPrompt}
                    setInstallPrompt={setInstallPrompt}
                />
                
                <div className="flex-1 relative overflow-y-auto bg-background selection:bg-accent selection:text-background">
                    {/* Abstract tech glow background */}
                    <div className="fixed inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/30 blur-[120px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[100px]"></div>
                    </div>

                    <header className="md:hidden flex justify-between items-center p-4 border-b border-white/10 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
                        <Link to="/" className="flex items-center gap-2 decoration-none">
                            <img src="/logo.svg" alt="clipoo logo" className="w-6 h-6 drop-shadow-[0_0_10px_rgba(0,229,255,0.2)]" />
                            <span className="font-mono font-bold text-xl tracking-tighter text-foreground drop-shadow-sm">clipoo</span>
                        </Link>
                        <button className="text-foreground/80 hover:text-accent transition-colors btn-tactile" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </header>

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20" onClick={() => setSidebarOpen(false)}>
                        <Routes>
                            <Route path="/" element={
                                <Workspace 
                                    clips={clips} 
                                    addClip={addClip} 
                                    deleteClip={deleteClip} 
                                />
                            } />
                            <Route path="/devices" element={
                                <Devices 
                                    devices={devices} 
                                    myDeviceId={myDeviceId} 
                                    addDevice={addDevice} 
                                    removeDevice={removeDevice} 
                                />
                            } />
                        </Routes>
                    </div>
                </div>

                <AnimatePresence>
                    {autoCopied && (
                        <motion.div 
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-accent/30 text-foreground px-6 py-3 rounded-full font-sans font-semibold text-sm shadow-[0_10px_40px_rgba(0,229,255,0.2)] z-[10000] flex items-center gap-2 pointer-events-none"
                        >
                            <Check size={16} className="text-accent" /> Selection copied!
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Router>
    );
}

export default App;
