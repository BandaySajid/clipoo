import { Copy, Check, Trash2, ImageIcon, Loader, Download, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClipCard({ clip, onDelete, isLatest }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [imageRevealed, setImageRevealed] = useState(isLatest);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const isLongText = clip.type === 'TEXT' && clip.content?.length > 250;
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
                    const blobPromise = fetch(clip.content + '?cors=1')
                        .then(r => r.blob())
                        .then(blob => new Promise((resolve, reject) => {
                            if (blob.type === 'image/png') return resolve(blob);
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                canvas.getContext('2d').drawImage(img, 0, 0);
                                canvas.toBlob(resolve, 'image/png');
                            };
                            img.onerror = reject;
                            img.src = URL.createObjectURL(blob);
                        }));

                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blobPromise })
                    ]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
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
        if (clip.uploading || (!clip.content && !clip.failed)) {
            return (
                <div className="flex items-center gap-3 p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-foreground/70 text-sm font-medium">
                    <Loader size={20} className="animate-spin text-accent" />
                    <span>Uploading image...</span>
                </div>
            );
        }

        if (clip.failed) {
            return (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                    Upload failed. Try again.
                </div>
            );
        }

        if (!imageRevealed) {
            return (
                <button 
                    className="w-full flex items-center justify-center gap-2 p-6 rounded-xl bg-white/5 border border-dashed border-white/20 text-accent font-medium hover:bg-white/10 transition-colors btn-tactile"
                    onClick={(e) => { e.stopPropagation(); setImageRevealed(true); }}
                >
                    <ImageIcon size={18} />
                    <span>View Image</span>
                </button>
            );
        }

        return (
            <div className="relative group rounded-xl overflow-hidden bg-black/40">
                <img
                    src={clip.content + '?v=1'}
                    alt="Clipped"
                    className="max-h-[300px] w-auto max-w-full rounded-xl cursor-zoom-in transition-transform duration-500 ease-out group-hover:scale-105"
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                    title="Click to view full size"
                    crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 pointer-events-none transition-colors duration-300" />
            </div>
        );
    };

    return (
        <>
            <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`interactive-card p-6 flex flex-col gap-4 overflow-hidden relative ${clip.pending ? 'opacity-70 grayscale-[0.2]' : ''}`}
            >
                {/* Accent strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="clip-type-badge">{clip.type}</span>
                    <div className="flex items-center gap-2 text-xs font-mono text-foreground/50">
                        <span>{new Date(clip.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase">{clip.device}</span>
                    </div>
                </div>

                <div
                    className={`text-base leading-relaxed ${clip.type === 'TEXT' ? 'cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors' : ''}`}
                    onClick={clip.type === 'TEXT' ? handleCopy : undefined}
                    title={clip.type === 'TEXT' ? 'Click to copy' : undefined}
                >
                    {clip.type === 'TEXT' ? (
                        <div>
                            <div className={`whitespace-pre-wrap break-words ${!expanded && isLongText ? 'line-clamp-5' : ''}`}>
                                {clip.content}
                            </div>
                            {isLongText && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                    className="mt-2 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded transition-colors"
                                >
                                    {expanded ? 'View Less' : 'View More'}
                                </button>
                            )}
                        </div>
                    ) : renderImageContent()}
                </div>

                <div className="flex justify-end gap-1 pt-3 border-t border-white/5 mt-auto">
                    {isReady && imageRevealed && (
                        <>
                            <button className="p-2 text-foreground/50 hover:text-accent transition-colors btn-tactile rounded-lg hover:bg-white/5" onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }} title="View full size">
                                <Maximize2 size={16} />
                            </button>
                            <button className="p-2 text-foreground/50 hover:text-accent transition-colors btn-tactile rounded-lg hover:bg-white/5" onClick={(e) => { e.stopPropagation(); handleDownload(); }} title="Download">
                                <Download size={16} />
                            </button>
                            <button className="p-2 text-foreground/50 hover:text-accent transition-colors btn-tactile rounded-lg hover:bg-white/5" onClick={(e) => { e.stopPropagation(); handleCopy(); }} title="Copy image">
                                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </>
                    )}
                    {clip.type === 'TEXT' && (
                        <button className="p-2 text-foreground/50 hover:text-accent transition-colors btn-tactile rounded-lg hover:bg-white/5" onClick={handleCopy} title="Copy">
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                    )}
                    <button className="p-2 text-foreground/50 hover:text-danger transition-colors btn-tactile rounded-lg hover:bg-danger/10" onClick={() => onDelete(clip.id)} title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && isReady && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-6" 
                        onClick={() => setLightboxOpen(false)}
                    >
                        <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                            <button className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors btn-tactile" onClick={() => setLightboxOpen(false)}>
                                <X size={24} />
                            </button>
                            
                            <motion.img 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                src={clip.content + '?v=1'} 
                                alt="Full size" 
                                className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain" 
                                crossOrigin="anonymous" 
                            />
                            
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-medium transition-colors btn-tactile" onClick={handleDownload}>
                                    <Download size={16} /> Download
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-accent/20 hover:bg-accent/30 border border-accent/20 text-accent rounded-xl font-medium transition-colors btn-tactile" onClick={handleCopy}>
                                    {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Image</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {copied && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-accent/30 text-foreground px-6 py-3 rounded-full font-sans font-semibold text-sm shadow-[0_10px_40px_rgba(0,229,255,0.2)] z-[10000] flex items-center gap-2"
                    >
                        <Check size={16} className="text-accent" /> Copied to clipboard!
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
