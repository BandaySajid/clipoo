import { Copy, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ClipCard({ clip, onDelete }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const isLongText = clip.type === 'TEXT' && clip.content.length > 250;

    const handleCopy = async () => {
        try {
            if (clip.type === 'TEXT') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(clip.content);
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = clip.content;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    textArea.remove();
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else if (clip.type === 'IMAGE') {
                if (navigator.clipboard && navigator.clipboard.write) {
                    const res = await fetch(clip.content);
                    const blob = await res.blob();
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
                    alert("Image copying is only supported over HTTPS.");
                }
            }
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <div className="clip-card">
            <div className="clip-meta">
                <span className="clip-type">{clip.type}</span>
                <span>
                    {new Date(clip.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                    <span className="device-type-badge" style={{marginLeft: 8}}>{clip.device}</span>
                </span>
            </div>

            <div className="clip-content">
                {clip.type === 'TEXT' ? (
                    <div>
                        <div className={`clip-text ${expanded ? 'expanded' : ''}`}>{clip.content}</div>
                        {isLongText && (
                            <button className="btn-secondary" onClick={() => setExpanded(!expanded)} style={{marginTop: 8, fontSize: '0.8rem', padding: '4px 8px', border: 'none', cursor: 'pointer', background: 'rgba(255, 218, 185, 0.1)', color: 'var(--clr-accent)', borderRadius: '4px'}}>
                                {expanded ? 'View Less' : 'View More'}
                            </button>
                        )}
                    </div>
                ) : (
                    <img src={clip.content} alt="Clipped image" className="clip-image" />
                )}
            </div>
            
            <div className="clip-actions">
                <div style={{display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end'}}>
                    <button className="btn-icon" onClick={handleCopy} title="Copy">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button className="btn-icon delete" onClick={() => onDelete(clip.id)} title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
