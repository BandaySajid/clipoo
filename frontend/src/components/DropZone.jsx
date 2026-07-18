import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';

export default function DropZone({ onClipAdd }) {
    const [isDragging, setIsDragging] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        const handlePaste = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
                    reader.readAsDataURL(blob);
                    return; // prioritize image
                }
            }
            
            const text = e.clipboardData.getData('text');
            if (text) {
                onClipAdd(text, 'TEXT');
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [onClipAdd]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
                reader.readAsDataURL(file);
            }
        }
    };

    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => onClipAdd(event.target.result, 'IMAGE');
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div 
            ref={dropRef}
            className={`drop-target ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ cursor: 'pointer' }}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileSelect}
            />
            <div className="drop-content">
                <Upload size={48} className="drop-icon" />
                <h2 className="drop-text">Drop, Paste or Click</h2>
                <p className="drop-subtext">Images and text sync instantly across all devices.</p>
            </div>
        </div>
    );
}
