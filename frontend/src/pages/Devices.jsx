import { useState } from 'react';
import DeviceCard from '../components/DeviceCard';
import { Plus } from 'lucide-react';

export default function Devices({ devices, myDeviceId, addDevice, removeDevice }) {
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('desktop');

    const handleAdd = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            addDevice(newName.trim(), newType);
            setNewName('');
            setNewType('desktop');
        }
    };

    return (
        <div id="devices-view">
            <div className="view-header">
                <h2>Connected Devices</h2>
                <p className="view-subtitle">Manage the devices currently synced to your universal clipboard.</p>
            </div>
            
            <form className="add-device-form premium-form" onSubmit={handleAdd}>
                <div className="input-group">
                    <input 
                        type="text" 
                        placeholder="Manually add a device..." 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                    />
                    <select 
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                    >
                        <option value="desktop">Desktop</option>
                        <option value="laptop">Laptop</option>
                        <option value="mobile">Mobile</option>
                        <option value="apple">Apple</option>
                        <option value="tv">TV</option>
                    </select>
                    <button type="submit" className="btn-icon-primary">
                        <Plus size={20} />
                    </button>
                </div>
            </form>

            <div className="devices-grid">
                {devices.map((device, index) => (
                    <DeviceCard 
                        key={device.id} 
                        device={device} 
                        isMe={device.id === myDeviceId}
                        onRemove={removeDevice}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}
