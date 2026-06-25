import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    deleteDoc,
    updateDoc,
    increment,
    setDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    CheckCircle, 
    Award, 
    CalendarPlus, 
    LayoutGrid, 
    Heart, 
    MessageSquare, 
    Share2, 
    Star, 
    Feather, 
    Users, 
    BookOpen,
    Trash2,
    Calendar,
    Trophy,
    Crown,
    Check
} from 'lucide-react';
import { UserProfile, Post as PostType } from '../types';
import { toast } from 'sonner';
import UserAvatar from './UserAvatar';

interface ProfileOverlayProps {
    uid: string;
    onClose: () => void;
}

const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ uid, onClose }) => {
    const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'sobre'>('posts');
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [colorBlindMode, setColorBlindMode] = useState<string>('none');
    const currentUser = auth.currentUser;

    useEffect(() => {
        const saved = localStorage.getItem('colorblind') || 'none';
        setColorBlindMode(saved);
    }, []);

    useEffect(() => {
        if (!uid) return;

        setLoading(true);
        
        // Real-time listener for user data
        const userRef = doc(db, 'users', uid);
        const unsubscribeUser = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTargetUser({ 
                    id: snap.id, 
                    ...data,
                    photoURL: data.photoURL || data.avatarURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${snap.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                } as any);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching user:", err);
            setLoading(false);
        });

        // Real-time listener for posts
        const q = query(
            collection(db, 'posts'),
            where('authorId', '==', uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribePosts = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PostType[];
            setPosts(fetchedPosts);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'posts');
        });

        // Real-time listener for followers count
        const qFollowers = query(collection(db, 'follows'), where('followingId', '==', uid));
        const unsubscribeFollowers = onSnapshot(qFollowers, (snapshot) => {
            setFollowersCount(snapshot.size);
        }, (error) => {
            console.error("Error loading followers in ProfileOverlay:", error);
        });

        // Real-time listener for following count
        const qFollowing = query(collection(db, 'follows'), where('followerId', '==', uid));
        const unsubscribeFollowing = onSnapshot(qFollowing, (snapshot) => {
            setFollowingCount(snapshot.size);
        }, (error) => {
            console.error("Error loading following in ProfileOverlay:", error);
        });

        // Real-time listener for following status
        let unsubscribeFollow: (() => void) | undefined;
        if (currentUser && currentUser.uid !== uid) {
            const followId = `${currentUser.uid}_${uid}`;
            const followRef = doc(db, 'follows', followId);
            unsubscribeFollow = onSnapshot(followRef, (snap) => {
                setIsFollowing(snap.exists());
            });
        }

        return () => {
            unsubscribeUser();
            unsubscribePosts();
            unsubscribeFollowers();
            unsubscribeFollowing();
            if (unsubscribeFollow) unsubscribeFollow();
        };
    }, [uid, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || !uid || currentUser.uid === uid) return;

        const followId = `${currentUser.uid}_${uid}`;
        const followRef = doc(db, 'follows', followId);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const targetUserRef = doc(db, 'users', uid);

        try {
            if (isFollowing) {
                await deleteDoc(followRef);
                await updateDoc(currentUserRef, { followingCount: increment(-1) }).catch(e => console.warn("Failed updating followingCount", e));
                await updateDoc(targetUserRef, { followersCount: increment(-1) }).catch(e => console.warn("Failed updating followersCount", e));
                setIsFollowing(false);
                toast.success('Deixou de seguir');
            } else {
                await setDoc(followRef, {
                    followerId: currentUser.uid,
                    followingId: uid,
                    createdAt: serverTimestamp()
                });
                await updateDoc(currentUserRef, { followingCount: increment(1) }).catch(e => console.warn("Failed updating followingCount", e));
                await updateDoc(targetUserRef, { followersCount: increment(1) }).catch(e => console.warn("Failed updating followersCount", e));
                
                // Create notification
                await addDoc(collection(db, 'notifications'), {
                    recipientId: uid,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || 'Estudante',
                    senderPhoto: currentUser.photoURL || '',
                    type: 'follow',
                    message: 'começou a te seguir',
                    createdAt: serverTimestamp(),
                    read: false
                }).catch(e => console.warn("Failed creating notification", e));

                setIsFollowing(true);
                toast.success('Seguindo');
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'follows');
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    if (loading) {
        return (
            <div className={`fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm ${colorBlindMode !== 'none' ? `cb-${colorBlindMode}` : ''}`}>
                <div className="w-12 h-12 border-4 border-accent-1 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!targetUser) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${colorBlindMode !== 'none' ? `cb-${colorBlindMode}` : ''}`}
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header/Cover */}
                <div className="relative h-32 shrink-0 bg-gradient-to-r from-accent-1/20 to-accent-1/10">
                    {targetUser.coverURL && (
                        <img src={targetUser.coverURL} className="w-full h-full object-cover" />
                    )}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="relative px-4 sm:px-8 pb-4 shrink-0">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-[1.5rem] bg-zinc-900 border-4 border-[#0a0a0a] overflow-hidden shadow-xl ${
                                (() => {
                                    const h = (targetUser.handle || '').toLowerCase().trim();
                                    if (h === 'vestapp') return 'ring-4 ring-amber-500 ring-offset-2 ring-offset-zinc-950 animate-pulse';
                                    if (h === '_giu.conti') return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-zinc-950';
                                    if (h === 'victordossantos2103') return 'ring-4 ring-blue-500 ring-offset-2 ring-offset-zinc-950';
                                    if (h === 'giulia') return 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-zinc-950';
                                    if (h === 'dnuneskkj') return 'ring-4 ring-pink-500 ring-offset-2 ring-offset-zinc-950';
                                    return '';
                                })()
                            }`}>
                                <UserAvatar 
                                    uid={targetUser.uid}
                                    fallbackPhoto={targetUser.photoURL || ""}
                                    fallbackName={targetUser.displayName || "Estudante"}
                                    size="100%"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {(() => {
                                const h = (targetUser.handle || '').toLowerCase().trim();
                                let isVerified = targetUser.isVerified;
                                let badgeColorClass = 'bg-accent-1';
                                
                                if (h === 'vestapp') {
                                    isVerified = true;
                                    badgeColorClass = 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
                                } else if (h === '_giu.conti') {
                                    isVerified = true;
                                    badgeColorClass = 'bg-yellow-400 dark:bg-yellow-500 text-zinc-950 font-black';
                                } else if (h === 'victordossantos2103') {
                                    isVerified = true;
                                    badgeColorClass = 'bg-blue-500 text-white';
                                } else if (h === 'giulia') {
                                    isVerified = true;
                                    badgeColorClass = 'bg-emerald-500 text-white';
                                } else if (h === 'dnuneskkj') {
                                    isVerified = true;
                                    badgeColorClass = 'bg-pink-500 text-white';
                                }
                                
                                if (isVerified) {
                                    return (
                                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-xl shadow-lg border-2 border-[#0a0a0a] ${badgeColorClass}`}>
                                            <CheckCircle size={14} />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        {currentUser?.uid !== uid && (
                            <button 
                                onClick={handleFollow}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                                    isFollowing 
                                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                                    : 'bg-accent-1 text-[color:var(--btn-text-color,white)] hover:bg-accent-1/80'
                                }`}
                            >
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </button>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                            {targetUser.displayName}
                            {(() => {
                                const h = (targetUser.handle || '').toLowerCase().trim();
                                if (h === 'vestapp') {
                                    return (
                                        <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-[10px] px-2.5 py-1 rounded-full text-white font-black flex items-center gap-1 shadow-md shadow-orange-500/25 animate-pulse uppercase tracking-wider">
                                            <Crown size={10} className="fill-white" /> Mascote Oficial
                                        </span>
                                    );
                                }
                                if (h === '_giu.conti') {
                                    return (
                                        <span className="bg-yellow-400 text-[9px] px-2.5 py-1 rounded-full text-zinc-950 font-black flex items-center gap-1 shadow-md uppercase tracking-wider select-none">
                                            ⭐ Verificado
                                        </span>
                                    );
                                }
                                if (h === 'victordossantos2103') {
                                    return (
                                        <span className="bg-blue-500 text-[9px] px-2.5 py-1 rounded-full text-white font-black flex items-center gap-1 shadow-md uppercase tracking-wider select-none">
                                            💎 Verificado
                                        </span>
                                    );
                                }
                                if (h === 'giulia') {
                                    return (
                                        <span className="bg-emerald-500 text-[9px] px-2.5 py-1 rounded-full text-white font-black flex items-center gap-1 shadow-md uppercase tracking-wider select-none">
                                            ✨ Verificado
                                        </span>
                                    );
                                }
                                if (h === 'dnuneskkj') {
                                    return (
                                        <span className="bg-pink-500 text-[9px] px-2.5 py-1 rounded-full text-white font-black flex items-center gap-1 shadow-md uppercase tracking-wider select-none">
                                            🌸 Verificado
                                        </span>
                                    );
                                }
                                if (targetUser.isAmbassador) {
                                    return (
                                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] px-2 py-0.5 rounded-full text-black font-black flex items-center gap-0.5 shadow-sm uppercase tracking-wider">
                                            <Crown size={10} /> Embaixador
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                        </h2>
                        <p className="text-zinc-500 font-medium">@{targetUser.handle}</p>
                    </div>

                    <p className="mt-3 text-zinc-300 text-sm leading-relaxed max-w-lg">
                        {targetUser.bio || 'Sem biografia definida.'}
                    </p>

                    <div className="flex gap-10 mt-6 pt-6 border-t border-white/5">
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-black dark:text-white tracking-tighter">{formatNumber(posts.length)}</span>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black opacity-60">Posts</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-black dark:text-white tracking-tighter">{formatNumber(followersCount)}</span>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black opacity-60">Seguidores</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-black dark:text-white tracking-tighter">{formatNumber(followingCount)}</span>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black opacity-60">Seguindo</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 sm:px-8 border-b border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'posts' ? 'text-accent-1 border-accent-1' : 'text-zinc-500 border-transparent'
                        }`}
                    >
                        Posts
                    </button>
                    <button 
                        onClick={() => setActiveTab('sobre')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'sobre' ? 'text-accent-1 border-accent-1' : 'text-zinc-500 border-transparent'
                        }`}
                    >
                        Informações
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'posts' ? (
                        <div className="grid grid-cols-2 gap-3">
                            {posts.map(post => (
                                <div key={post.id} className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-square">
                                    {(post as any).imageUrl || (post as any).imageURL ? (
                                        <img src={(post as any).imageUrl || (post as any).imageURL} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full p-4 flex items-center justify-center text-zinc-500 text-xs text-center line-clamp-4">
                                            {post.content}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                                        <div className="flex items-center gap-1.5"><Heart size={16} fill="white" /> {formatNumber(post.likesCount)}</div>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <div className="col-span-2 py-12 text-center text-zinc-500">
                                    Nenhum post publicado ainda.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 text-sm text-left">
                            {targetUser.handle?.toLowerCase() === 'vestapp' && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 text-left">
                                    <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                                        <Award size={16} /> Painel Oficial VestApp 🦉
                                    </h4>
                                    <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                                        Fique por dentro das novidades do app e obtenha dicas exclusivas para o ENEM e stream de estudos!
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-left">
                                            <span className="text-[10px] text-amber-500 font-black block uppercase mb-1">Último Aviso</span>
                                            <span className="text-[11px] text-zinc-100 font-bold">Mencione colegas nos posts digitando @handle!</span>
                                        </div>
                                        <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-left">
                                            <span className="text-[10px] text-pink-500 font-black block uppercase mb-1">Dica de Hoje</span>
                                            <span className="text-[11px] text-zinc-100 font-bold">Use o simulador com temporizador Pomodoro.</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-zinc-400">
                                <Star size={18} className="text-accent-1" />
                                <span>Membro desde {(targetUser.createdAt as any)?.toDate ? (targetUser.createdAt as any).toDate().toLocaleDateString('pt-BR') : 'Recente'}</span>
                            </div>
                            {targetUser.studyGoal && (
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <BookOpen size={18} className="text-accent-1" />
                                    <span>Objetivo: <b className="text-white capitalize">{targetUser.studyGoal}</b></span>
                                </div>
                            )}
                            {targetUser.studentType && (
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Users size={18} className="text-accent-1" />
                                    <span>Tipo: <b className="text-white capitalize">{targetUser.studentType}</b></span>
                                </div>
                            )}
                            {targetUser.studyTime && (
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Calendar size={18} className="text-accent-1" />
                                    <span>Frequência: <b className="text-white capitalize">{targetUser.studyTime}</b></span>
                                </div>
                            )}
                            {targetUser.bio && (
                                <div className="mt-4 pt-4 border-t border-white/5 animate-pulse">
                                    <p className="text-zinc-400 leading-relaxed italic font-bold">"{targetUser.bio}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProfileOverlay;
