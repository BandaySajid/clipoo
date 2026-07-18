import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';

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
            // User denied clipboard permission — silently ignore
            console.warn('Clipboard read denied:', err.message);
        }
    };

    return (
        <div className="dropzone-wrapper">
            {/* Hidden file input — triggered by the mobile button */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Main drop area — no click handler here so mobile paste text works */}
            <div
                ref={dropRef}
                className={`drop-target ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="drop-content">
                    <Upload size={40} className="drop-icon" />
                    <h2 className="drop-text">Drop or Paste</h2>
                    <p className="drop-subtext">Text and images sync instantly to all devices.</p>
                </div>
            </div>

            {/* Separate upload button — always visible, especially useful on mobile */}
            <button
                className="upload-file-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image from device"
            >
                <Upload size={18} />
                <span>Upload Image</span>
            </button>
        </div>
    );
}
