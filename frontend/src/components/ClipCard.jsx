import { Copy, Check, Trash2, ImageIcon, Loader } from 'lucide-react';
import { useState } from 'react';

export default function ClipCard({ clip, onDelete, isLatest }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [imageRevealed, setImageRevealed] = useState(isLatest); // auto-show latest image

    const isLongText = clip.type === 'TEXT' && clip.content.length > 250;
    const isDataUrl = clip.content?.startsWith('data:');

    const handleCopy = async () => {
        try {
            if (clip.type === 'TEXT') {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(clip.content);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = clip.content;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else if (clip.type === 'IMAGE') {
                if (navigator.clipboard?.write) {
                    const res = await fetch(clip.content);
                    const blob = await res.blob();
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const renderImageContent = () => {
        // While uploading, show a shimmer with the data URL preview
        if (clip.uploading || (clip.pending && isDataUrl)) {
            return (
                <div className="image-upload-preview">
                    <img src={clip.content} alt="Uploading..." className="clip-image uploading-img" />
                    <div className="upload-overlay">
                        <Loader size={20} className="spin" />
                        <span>Uploading to cloud...</span>
                    </div>
                </div>
            );
        }

        if (clip.failed) {
            return <div className="upload-failed">Upload failed. Image shown locally only.</div>;
        }

        // Older images: show a "View Image" button instead of loading immediately
        if (!imageRevealed) {
            return (
                <button className="reveal-image-btn" onClick={(e) => { e.stopPropagation(); setImageRevealed(true); }}>
                    <ImageIcon size={16} />
                    <span>View Image</span>
                </button>
            );
        }

        return <img src={clip.content} alt="Clipped image" className="clip-image" />;
    };

    return (
        <div className={`clip-card ${clip.pending ? 'clip-pending' : ''}`}>
            <div className="clip-meta">
                <span className="clip-type">{clip.type}</span>
                <span>
                    {new Date(clip.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                    <span className="device-type-badge" style={{ marginLeft: 8 }}>{clip.device}</span>
                </span>
            </div>

            <div
                className="clip-content"
                onClick={clip.type === 'TEXT' ? handleCopy : undefined}
                style={clip.type === 'TEXT' ? { cursor: 'pointer' } : undefined}
                title={clip.type === 'TEXT' ? 'Click to copy' : undefined}
            >
                {clip.type === 'TEXT' ? (
                    <div>
                        <div className={`clip-text ${expanded ? 'expanded' : ''}`}>{clip.content}</div>
                        {isLongText && (
                            <button
                                className="btn-secondary"
                                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                style={{ marginTop: 8, fontSize: '0.8rem', padding: '4px 8px', border: 'none', cursor: 'pointer', background: 'rgba(255, 218, 185, 0.1)', color: 'var(--clr-accent)', borderRadius: '4px' }}
                            >
                                {expanded ? 'View Less' : 'View More'}
                            </button>
                        )}
                    </div>
                ) : renderImageContent()}
            </div>

            <div className="clip-actions">
                <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
                    {!clip.uploading && !clip.failed && (
                        <button className="btn-icon" onClick={handleCopy} title="Copy">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    )}
                    <button className="btn-icon delete" onClick={() => onDelete(clip.id)} title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
