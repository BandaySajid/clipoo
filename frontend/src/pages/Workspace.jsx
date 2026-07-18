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
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-32">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5 pointer-events-none" />
                <input 
                    type="text" 
                    placeholder="Search clips..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-foreground placeholder-foreground/40 outline-none focus:border-accent focus:bg-zinc-900/80 transition-all duration-200"
                />
            </div>
            
            <DropZone onClipAdd={addClip} />
            
            <div className="flex flex-col gap-6">
                {filteredClips.map((clip, index) => (
                    <ClipCard key={clip.id} clip={clip} onDelete={deleteClip} isLatest={index === 0} />
                ))}
                
                {filteredClips.length === 0 && clips.length > 0 && (
                    <div className="text-center text-foreground/50 py-12 border border-dashed border-white/10 rounded-2xl">
                        No clips match your search.
                    </div>
                )}
                
                {clips.length === 0 && (
                    <div className="text-center text-foreground/50 py-20 border border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center gap-2">
                        <p className="text-xl font-sans font-medium text-foreground">Your clipboard is empty</p>
                        <p className="text-sm">Copy and paste text or images to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
