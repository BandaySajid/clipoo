import { Copy, Check, Trash2, ImageIcon, Loader, Download, Maximize2, X } from 'lucide-react';
import { useState } from 'react';

export default function ClipCard({ clip, onDelete, isLatest }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [imageRevealed, setImageRevealed] = useState(isLatest);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const isLongText = clip.type === 'TEXT' && clip.content?.length > 250;
    const isDataUrl = clip.content?.startsWith('data:');
    const isReady = clip.type === 'IMAGE' && !clip.uploading && !clip.failed && clip.content;

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
            } else if (clip.type === 'IMAGE' && isReady) {
                if (navigator.clipboard?.write) {
                    const res = await fetch(clip.content + '?cors=1');
                    const blob = await res.blob();
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
                    // Fallback: copy the URL as text
                    await navigator.clipboard.writeText(clip.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            }
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const handleDownload = async () => {
        try {
            // Append ?cors=1 to bust Cloudflare cache if it cached a non-CORS response previously
            const res = await fetch(clip.content + '?cors=1');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const ext = blob.type.split('/')[1] || 'png';
            a.href = url;
            a.download = `clipoo-${clip.id}.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const renderImageContent = () => {
        // While uploading — show spinner placeholder (no image yet)
        if (clip.uploading || (!clip.content && !clip.failed)) {
            return (
                <div className="image-uploading-placeholder">
                    <Loader size={22} className="spin" />
                    <span>Image uploading...</span>
                </div>
            );
        }

        if (clip.failed) {
            return <div className="upload-failed">Upload failed. Try again.</div>;
        }

        // Older images: lazy reveal
        if (!imageRevealed) {
            return (
                <button className="reveal-image-btn" onClick={(e) => { e.stopPropagation(); setImageRevealed(true); }}>
                    <ImageIcon size={16} />
                    <span>View Image</span>
                </button>
            );
        }

        return (
            <div className="clip-image-wrapper">
                <img
                    src={clip.content + '?v=1'}
                    alt="Clipped"
                    className="clip-image"
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                    title="Click to view full size"
                    crossOrigin="anonymous"
                />
            </div>
        );
    };

    return (
        <>
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
                        {isReady && imageRevealed && (
                            <>
                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }} title="View full size">
                                    <Maximize2 size={16} />
                                </button>
                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDownload(); }} title="Download">
                                    <Download size={16} />
                                </button>
                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleCopy(); }} title="Copy image">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </>
                        )}
                        {clip.type === 'TEXT' && (
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

            {/* Lightbox */}
            {lightboxOpen && isReady && (
                <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
                            <X size={24} />
                        </button>
                        <img src={clip.content + '?v=1'} alt="Full size" className="lightbox-img" crossOrigin="anonymous" />
                        <div className="lightbox-actions">
                            <button className="lightbox-btn" onClick={handleDownload}>
                                <Download size={16} /> Download
                            </button>
                            <button className="lightbox-btn" onClick={handleCopy}>
                                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Image</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
