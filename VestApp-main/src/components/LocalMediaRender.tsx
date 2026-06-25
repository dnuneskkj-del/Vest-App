import React, { useState, useEffect } from 'react';
import { Music, Play, Bot, ExternalLink, HelpCircle } from 'lucide-react';
import { getMediaLocal } from '../lib/idb';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface LocalMediaRenderProps {
    videoURL: string;
    postId: string;
}

// Global cache for generated blob: Object URLs to guarantee Safari/Chrome range-seeking and continuous playback.
// Prevents premature revocation of blob URLs during rapid parent re-renders or StrictMode double-mount lifecycle.
const blobUrlCache = new Map<string, string>();

// Global list of posts currently in the process of background migration to avoid redundant operations.
const migratingPostIds = new Set<string>();

const convertBase64ToBlob = (base64Data: string): Blob | null => {
    try {
        const parts = base64Data.split(';base64,');
        if (parts.length < 2) return null;
        const contentType = parts[0].split(':')[1] || 'video/mp4';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
        console.error("Base64 conversion failed:", e);
        return null;
    }
};

const convertBase64ToBlobUrl = (base64Data: string): string | null => {
    const blob = convertBase64ToBlob(base64Data);
    return blob ? URL.createObjectURL(blob) : null;
};

const triggerBackgroundMigration = async (blob: Blob, name: string, postId: string) => {
    if (!postId || migratingPostIds.has(postId)) return;
    migratingPostIds.add(postId);
    
    console.log(`[Auto-Sincronização] Iniciando migração para nuvem do post ${postId}...`);
    try {
        let finalPublicURL = '';
        
        // 1. Try Firebase Storage if initialized
        if (storage) {
            try {
                const storageRef = ref(storage, `posts_media_migrated/${postId}_${Date.now()}_${name}`);
                const uploadTask = uploadBytesResumable(storageRef, blob);
                
                finalPublicURL = await new Promise<string>((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        null, 
                        (error) => reject(error), 
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(downloadURL);
                            } catch (err) {
                                reject(err);
                            }
                        }
                    );
                });
                console.log(`[Auto-Sincronização] Sucesso no upload Firebase para o post ${postId}: ${finalPublicURL}`);
            } catch (storageErr) {
                console.warn('[Auto-Sincronização] Falha no Firebase Storage, tentando fallback do servidor:', storageErr);
            }
        }
        
        // 2. Fall back to local server upload in case Firebase Storage is unconfigured
        if (!finalPublicURL) {
            const formData = new FormData();
            const file = new File([blob], name, { type: blob.type });
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const resData = await response.json();
                finalPublicURL = resData.url;
                console.log(`[Auto-Sincronização] Sucesso no upload servidor local para o post ${postId}: ${finalPublicURL}`);
            } else {
                throw new Error('Falha no upload de redundância do servidor.');
            }
        }
        
        // 3. Update Firestore metadata with the public URL
        if (finalPublicURL && db) {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                videoURL: finalPublicURL
            });
            console.log(`[Auto-Sincronização] Firestore atualizado para o post ${postId}!`);
        }
    } catch (err) {
        console.error(`[Auto-Sincronização] Falha crítica ao sincronizar post ${postId}:`, err);
    } finally {
        migratingPostIds.delete(postId);
    }
};

export const LocalMediaRender: React.FC<LocalMediaRenderProps> = ({ videoURL, postId }) => {
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isLocalMedia = videoURL.startsWith('local-media:');
    const isBase64 = videoURL.startsWith('data:');

    // Parse metadata if we have local-media format
    // Format: local-media:${mediaId}:${fileSize}:${fileName}:${mediaType}
    const parts = isLocalMedia ? videoURL.split(':') : [];
    const mediaId = isLocalMedia ? (parts[1] || '') : '';
    const fileSize = isLocalMedia ? (parts[2] || 'Aprox. 30MB') : 'Base64 Video';
    const mediaType = isLocalMedia 
        ? (parts[parts.length - 1] === 'audio' ? 'audio' : 'video') 
        : (videoURL.startsWith('data:audio/') ? 'audio' : 'video');
    
    const fileName = isLocalMedia 
        ? (parts.slice(3, parts.length - 1).join(':') || 'videoaula.mp4') 
        : 'videoaula_pequena.mp4';

    useEffect(() => {
        let active = true;
        const cacheKey = isLocalMedia ? mediaId : `${postId}-base64`;

        if (!cacheKey) {
            setIsLoading(false);
            return;
        }

        // Check cache first to avoid re-creating Blob URLs which forces the <video> tag to reset
        if (blobUrlCache.has(cacheKey)) {
            setMediaUrl(blobUrlCache.get(cacheKey)!);
            setIsLoading(false);
            return;
        }

        async function fetchMediaAndPrepare() {
            try {
                if (isLocalMedia) {
                    const data = await getMediaLocal(mediaId);
                    if (!active) return;

                    if (data) {
                        let finalBlobUrl = '';
                        let mediaBlob: Blob | null = null;
                        
                        if (data instanceof Blob) {
                            mediaBlob = data;
                            finalBlobUrl = URL.createObjectURL(data);
                        } else if (typeof data === 'string') {
                            if (data.startsWith('data:')) {
                                mediaBlob = convertBase64ToBlob(data);
                                if (mediaBlob) {
                                    finalBlobUrl = URL.createObjectURL(mediaBlob);
                                }
                            } else {
                                finalBlobUrl = data;
                            }
                        }

                        if (finalBlobUrl) {
                            blobUrlCache.set(cacheKey, finalBlobUrl);
                            setMediaUrl(finalBlobUrl);
                            
                            // Auto-migrate offline media file to public URL in background
                            if (mediaBlob && postId) {
                                triggerBackgroundMigration(mediaBlob, fileName, postId);
                            }
                        }
                    }
                } else if (isBase64) {
                    const decoded = convertBase64ToBlobUrl(videoURL);
                    if (active && decoded) {
                        blobUrlCache.set(cacheKey, decoded);
                        setMediaUrl(decoded);
                    }
                } else {
                    // Fallback to directly setting standard public URLs
                    setMediaUrl(videoURL);
                }
            } catch (err) {
                console.error("Erro ao preparar arquivo local de mídia:", err);
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        fetchMediaAndPrepare();

        return () => {
            active = false;
        };
    }, [mediaId, videoURL, isLocalMedia, isBase64, postId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-2xl w-full text-center border border-white/5 animate-pulse min-h-[160px]">
                <div className="w-8 h-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin mb-3"></div>
                <p className="text-xs text-zinc-400 font-black uppercase tracking-wider">Carregando Mídia do Corvo...</p>
            </div>
        );
    }

    if (mediaUrl) {
        if (mediaType === 'audio') {
            return (
                <div className="flex flex-col items-center p-6 bg-slate-900/95 dark:bg-black/95 border border-white/10 rounded-2xl w-full text-center">
                    <div className="w-12 h-12 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-3">
                        <Music size={24} />
                    </div>
                    <p className="text-sm font-black mb-1 text-slate-200">{fileName}</p>
                    <p className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-wider">Áudio Local ({fileSize})</p>
                    <audio src={mediaUrl} controls className="w-full max-w-sm" />
                </div>
            );
        } else {
            return (
                <div className="rounded-3xl overflow-hidden border border-white/5 bg-black relative">
                    <video 
                        src={mediaUrl} 
                        controls 
                        playsInline 
                        preload="metadata"
                        className="w-full h-auto max-h-[600px] object-contain block bg-black"
                    ></video>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-accent-1 border border-white/10 uppercase tracking-widest pointer-events-none">
                        Vídeo Local ({fileSize})
                    </div>
                </div>
            );
        }
    }

    // Classroom placeholder when mediaData is NOT found (other users on other clients)
    return (
        <div className="flex flex-col items-stretch p-6 bg-slate-950 border-2 border-dashed border-accent-1/20 rounded-[2rem] w-full text-left relative overflow-hidden group">
            {/* Ambient subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-1/5 rounded-full blur-2xl group-hover:bg-accent-1/10 transition-colors duration-500"></div>
            
            <div className="flex items-start gap-4 z-10">
                <div className="w-12 h-12 bg-accent-1/5 border-2 border-accent-1/30 text-accent-1 rounded-2xl flex items-center justify-center shrink-0">
                    <Bot size={24} className="animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="inline-block bg-accent-1/20 text-accent-1 text-[9px] font-black uppercase tracking-[1.5px] px-2.5 py-1 rounded-md mb-2">
                        DICA DO CORVO ESTUDIOSO
                    </span>
                    <h5 className="text-sm font-black text-white leading-snug mb-1">
                        Videoaula de 30 a 40 min ({fileSize})
                    </h5>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-4">
                        Arquivo correspondente: <span className="font-mono text-accent-1 italic">{fileName}</span>
                    </p>
                </div>
            </div>

            <div className="mt-2 bg-accent-1/5 border border-accent-1/10 rounded-[1.2rem] p-4 text-xs font-semibold leading-relaxed text-zinc-300 relative">
                <p className="italic">
                    "Opa! Esta é uma aula longa carregada diretamente como arquivo pelo autor. Como o limite de sincronização de banco de dados por post é de 1MB, arquivos gigantes como videoaulas de 30 a 40 minutos ficam salvos de forma offline e super veloz no dispositivo do autor!"
                </p>
                <p className="mt-3 text-accent-1 font-black leading-normal">
                    💡 Recomendação do Corvo: Para que todos no Ninho consigam assistir de qualquer celular ou computador perfeitamente, hospede em plataformas como YouTube ou Google Drive e cole o link ao postar!
                </p>
            </div>
        </div>
    );
};
