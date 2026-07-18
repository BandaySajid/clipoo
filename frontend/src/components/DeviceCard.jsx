import { MonitorSmartphone, Apple, Smartphone, Laptop, Tv, Monitor } from 'lucide-react';

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
        <div className="device-card premium-card" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="device-header">
                <div className="device-info">
                    <div className={`device-icon-wrapper ${isOnline ? 'glow-online' : ''}`}>
                        {icons[device.device_type] || icons.default}
                    </div>
                    <div className="device-details">
                        <div className="device-name">
                            {device.name}
                            {isMe && <span className="badge-you">Current</span>}
                        </div>
                        <div className="device-meta">
                            <span className="type-label">{device.device_type}</span>
                            <span className="dot-divider">•</span>
                            <span className={`status-text ${isOnline ? 'text-online' : 'text-offline'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
