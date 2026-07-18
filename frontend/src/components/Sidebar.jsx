import { NavLink, Link } from 'react-router-dom';
import { Copy, MonitorSmartphone, Wifi, WifiOff, X } from 'lucide-react';

export default function Sidebar({ connected, isOpen, close }) {
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
                </div>
                
                <div className={`status-indicator ${connected ? 'status-online' : 'status-offline'}`}>
                    {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span>{connected ? 'Sync Active' : 'Offline'}</span>
                </div>
            </aside>
        </>
    );
}
