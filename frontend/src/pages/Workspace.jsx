import { useState } from 'react';
import { Search } from 'lucide-react';
import DropZone from '../components/DropZone';
import ClipCard from '../components/ClipCard';

export default function Workspace({ clips, addClip, deleteClip }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClips = clips.filter(clip => {
        if (clip.type === 'TEXT') {
            return clip.content.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    return (
        <div id="workspace-view">
            <div className="search-bar">
                <Search className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search clips..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <DropZone onClipAdd={addClip} />
            
            <div className="clips-grid">
                {filteredClips.map(clip => (
                    <ClipCard key={clip.id} clip={clip} onDelete={deleteClip} />
                ))}
                {filteredClips.length === 0 && clips.length > 0 && (
                    <div style={{gridColumn: '1/-1', textAlign: 'center', opacity: 0.5}}>
                        No clips match your search.
                    </div>
                )}
                {clips.length === 0 && (
                    <div style={{gridColumn: '1/-1', textAlign: 'center', opacity: 0.5, padding: '40px 0'}}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your clipboard is empty.</p>
                        <p style={{ fontSize: '0.9rem' }}>Copy and paste text or images to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
