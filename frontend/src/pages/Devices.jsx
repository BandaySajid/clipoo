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
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-10 pb-32">
            <div>
                <h2 className="text-3xl font-sans font-bold text-foreground mb-2">Connected Devices</h2>
                <p className="text-foreground/50 text-base max-w-2xl">Manage the devices currently synced to your universal clipboard. Devices are automatically added when they connect.</p>
            </div>
            
            <form onSubmit={handleAdd} className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    placeholder="Manually add a device..." 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="flex-1 bg-transparent border-none text-foreground placeholder-foreground/40 px-4 py-3 outline-none min-w-[200px]"
                />
                <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="bg-white/5 border border-white/10 text-foreground rounded-xl px-4 py-3 outline-none focus:border-accent appearance-none min-w-[120px] cursor-pointer"
                >
                    <option value="desktop" className="bg-zinc-900">Desktop</option>
                    <option value="laptop" className="bg-zinc-900">Laptop</option>
                    <option value="mobile" className="bg-zinc-900">Mobile</option>
                    <option value="apple" className="bg-zinc-900">Apple</option>
                    <option value="tv" className="bg-zinc-900">TV</option>
                </select>
                <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-xl font-bold transition-all btn-tactile cursor-pointer">
                    <Plus size={20} className="text-foreground/70" />
                    <span className="sm:hidden text-foreground/70">Add Device</span>
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]">
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
