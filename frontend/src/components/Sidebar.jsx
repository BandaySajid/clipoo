import { NavLink, Link } from 'react-router-dom';
import { Copy, MonitorSmartphone, Wifi, WifiOff, X } from 'lucide-react';

export default function Sidebar({ connected, isOpen, close, installPrompt, setInstallPrompt }) {
    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={close}></div>}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-top">
                    <div className="brand logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to="/" onClick={close} style={{ textDecoration: 'none', color: 'inherit' }}>clipoo</Link>
                        <button className="mobile-close-btn" onClick={close} style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="nav-menu">
                        <NavLink to="/" onClick={close} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Copy size={18} /> Clips
                        </NavLink>
                        <NavLink to="/devices" onClick={close} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <MonitorSmartphone size={18} /> Devices
                        </NavLink>
                    </div>
                    {installPrompt && (
                        <div style={{ marginTop: 24, padding: '0 16px' }}>
                            <button
                                onClick={async () => {
                                    installPrompt.prompt();
                                    const { outcome } = await installPrompt.userChoice;
                                    if (outcome === 'accepted') {
                                        setInstallPrompt(null);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'var(--clr-accent)',
                                    color: 'var(--clr-bg)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily: 'var(--font-display)'
                                }}
                            >
                                <MonitorSmartphone size={16} /> Install App
                            </button>
                        </div>
                    )}
                </div>
                
                <div className={`status-indicator ${connected ? 'status-online' : 'status-offline'}`}>
                    {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span>{connected ? 'Sync Active' : 'Offline'}</span>
                </div>
            </aside>
        </>
    );
}
