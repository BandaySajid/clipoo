import { useState, useRef, useEffect } from 'react';
import { Upload, Plus } from 'lucide-react';

export default function DropZone({ onClipAdd }) {
    const [isDragging, setIsDragging] = useState(false);
    const dropRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handlePaste = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
                    reader.readAsDataURL(blob);
                    return;
                }
            }
            
            const text = e.clipboardData.getData('text');
            if (text) onClipAdd(text, 'TEXT');
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [onClipAdd]);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
            reader.readAsDataURL(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file?.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleClick = async () => {
        try {
            if (!navigator.clipboard) return;

            // Try reading full clipboard (images + text)
            if (navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    // Image first
                    const imageType = item.types.find(t => t.startsWith('image/'));
                    if (imageType) {
                        const blob = await item.getType(imageType);
                        const reader = new FileReader();
                        reader.onload = (e) => onClipAdd(e.target.result, 'IMAGE');
                        reader.readAsDataURL(blob);
                        return;
                    }
                    // Text
                    if (item.types.includes('text/plain')) {
                        const blob = await item.getType('text/plain');
                        const text = await blob.text();
                        if (text.trim()) { onClipAdd(text, 'TEXT'); return; }
                    }
                }
            } else if (navigator.clipboard.readText) {
                // Fallback: text only
                const text = await navigator.clipboard.readText();
                if (text.trim()) onClipAdd(text, 'TEXT');
            }
        } catch (err) {
            console.warn('Clipboard read denied:', err.message);
        }
    };

    return (
        <div className="flex flex-col gap-4 relative w-full group">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
            />

            <div
                ref={dropRef}
                className={`
                    w-full min-h-[160px] rounded-3xl border-2 border-dashed 
                    flex flex-col items-center justify-center p-8 text-center cursor-pointer
                    transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isDragging ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                    ${isDragging ? 'bg-accent/20 text-accent border border-accent/40 scale-110 shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'bg-white/10 text-foreground group-hover:bg-white/20 group-hover:scale-110'}
                `}>
                    <Plus size={24} />
                </div>
                <h2 className="text-xl font-sans font-bold text-foreground mb-2">Drop or Paste</h2>
                <p className="text-foreground/50 text-sm max-w-[200px] leading-relaxed">Text and images sync instantly to all devices.</p>
            </div>

            <button
                className="self-start md:self-center flex items-center gap-2 px-6 py-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-medium text-sm transition-all btn-tactile w-full md:w-auto justify-center"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image from device"
            >
                <Upload size={16} />
                <span>Upload Image</span>
            </button>
        </div>
    );
}
