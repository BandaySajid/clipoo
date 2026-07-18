import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Workspace from './pages/Workspace';
import Devices from './pages/Devices';
import Setup from './pages/Setup';
import { useSSE } from './hooks/useSSE';
import { useClips } from './hooks/useClips';
import { useDevices } from './hooks/useDevices';
import { Menu } from 'lucide-react';

function App() {
    const [room, setRoom] = useState(localStorage.getItem('clipoo_room') || null);
    
    if (!room) {
        return <Setup onComplete={(r) => setRoom(r)} />;
    }

    return <MainApp room={room} />;
}

function MainApp({ room }) {
    const { connected, data: sseData } = useSSE(room);
    const { clips, addClip, deleteClip } = useClips(sseData);
    const { devices, myDeviceId, addDevice, removeDevice } = useDevices(sseData);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);

    // Listen for PWA install prompt
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault(); // Prevent automatic Chrome mini-infobar
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    return (
        <Router>
            <div id="app">
                <Sidebar 
                    connected={connected} 
                    isOpen={sidebarOpen} 
                    close={() => setSidebarOpen(false)} 
                    installPrompt={installPrompt}
                    setInstallPrompt={setInstallPrompt}
                />
                <div id="main-content">
                    <header className="mobile-header">
                        <Link to="/" className="brand logo" style={{ textDecoration: 'none' }}>clipoo</Link>
                        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                    </header>
                    <div className="workspace-container" onClick={() => setSidebarOpen(false)}>
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
            </div>
        </Router>
    );
}

export default App;
