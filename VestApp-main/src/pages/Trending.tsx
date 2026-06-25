import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth, onAuthStateChanged } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDoc, setDoc, deleteDoc, increment, serverTimestamp, updateDoc, getDocs, addDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import KnowledgeSidebar from '../components/KnowledgeSidebar';
import TrendsSidebar from '../components/TrendsSidebar';
import { useTrendingData } from '../hooks/useTrendingData';
import { TrendingUp, Heart, MessageSquare, Search, Zap, LayoutGrid, ChevronDown, Feather, Bot, Star, Hash, ArrowUpRight, Flame, Award, Film, Tv, Music, Book, Info, Feather as FeatherIcon, Zap as ZapIcon, LayoutGrid as LayoutGridIcon, MessageSquare as MessageSquareIcon, Heart as HeartIcon, Search as SearchIcon, Send, Share2, MoreVertical, FileText, Video as VideoIcon, ImageIcon, X, Play, Award as AwardIcon, Info as InfoIcon, Book as BookIcon, Users, Layers, ExternalLink } from 'lucide-react';
import { Post as PostType, UserProfile, Comment as CommentType } from '../types';
import UserAvatar from '../components/UserAvatar';
import { knowledgeAreas, getPhraseOfTheDay } from '../constants';
// import Post from '../components/Post'; // Removing Post component to use inline version for total consistency with Feed.tsx
import { Link, useNavigate } from 'react-router-dom';
import { LocalMediaRender } from '../components/LocalMediaRender';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShareModal } from '../components/ShareModal';
import { safeLocalStorage } from '../lib/storage';

const Trending = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
    const { trendingSubjects: tSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers: oUsers } = useTrendingData(currentUser);
    const [selectedPostInModal, setSelectedPostInModal] = useState<PostType | null>(null);
    const [postCommentsInModal, setPostCommentsInModal] = useState<any[]>([]);

    const openPostModalGlobal = (post: PostType) => {
        setSelectedPostInModal(post);
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
        onSnapshot(q, (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostCommentsInModal(commentList);
        });
    };

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [topPosts, setTopPosts] = useState<PostType[]>([]);
    const [topSubjects, setTopSubjects] = useState<{name: string, score: number, category: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [isLoadingLikers, setIsLoadingLikers] = useState(false);
    const [likersModalPostId, setLikersModalPostId] = useState<string | null>(null);
    const [likers, setLikers] = useState<any[]>([]);
    const [filter, setFilter] = useState('Todos');

    // New states for matching Feed.tsx functionality
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [openComments, setOpenComments] = useState<Set<string>>(new Set());
    const [comments, setComments] = useState<Record<string, any[]>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [commentMentionPostId, setCommentMentionPostId] = useState<string | null>(null);
    const [mentionSearchTerm, setMentionSearchTerm] = useState("");
    const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
    const [postViewMode, setPostViewMode] = useState<Record<string, 'text' | 'image' | 'video'>>({});
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [trendingSubjects, setTrendingSubjects] = useState<any[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState({ url: '', title: '', text: '' });

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserProfile(userSnap.data() as UserProfile);
                }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PostType[];
            
            const sortedPosts = [...posts].sort((a, b) => 
                ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0))
            );
            setTopPosts(sortedPosts);

            const subjectScores: Record<string, number> = {};
            posts.forEach(post => {
                if (post.subject) {
                    const score = (post.likesCount || 0) + (post.commentsCount || 0);
                    subjectScores[post.subject] = (subjectScores[post.subject] || 0) + score + 10;
                }
            });

            const trends = Object.entries(subjectScores)
                .map(([name, score]) => {
                    const area = knowledgeAreas.find(a => a.subjects.includes(name));
                    return { name, score, category: area?.name || 'Geral' };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 8);
            
            setTopSubjects(trends);
            setLoading(false);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'posts');
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setLikedPosts(new Set());
            return;
        }

        const q = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
        const unsubscribeLikes = onSnapshot(q, (snapshot) => {
            const likedIds = new Set<string>();
            snapshot.docs.forEach(doc => {
                likedIds.add(doc.data().postId);
            });
            setLikedPosts(likedIds);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'likes');
        });

        return () => unsubscribeLikes();
    }, [currentUser]);

    useEffect(() => {
        const fetchMentionUsers = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const list = snap.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() }) as any,
                );

                const rawTerm = mentionSearchTerm.trim().toLowerCase();
                const clean = rawTerm.startsWith("@") ? rawTerm.slice(1) : rawTerm;

                if (clean.length > 0) {
                    const filtered = list.filter((u) => {
                        const name = (u.displayName || "").toLowerCase();
                        const handle = (u.handle || "").toLowerCase();
                        return name.includes(clean) || handle.includes(clean);
                    });
                    setMatchingUsers(filtered.slice(0, 10));
                } else {
                    setMatchingUsers(list.slice(0, 10));
                }
            } catch (e) {
                console.error("Erro ao buscar usuários para menção:", e);
            }
        };
        fetchMentionUsers();
    }, [mentionSearchTerm]);

    const handleLike = async (postId: string) => {
        if (!currentUser) {
            toast.error('Faça login para curtir publicações! 🚀');
            return;
        }

        const isLiked = likedPosts.has(postId);
        const likeId = `${currentUser.uid}_${postId}`;
        const likeRef = doc(db, 'likes', likeId);
        const postRef = doc(db, 'posts', postId);

        // Optimistic UI update
        setLikedPosts(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });

        // Optimistic posts count update
        setTopPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? -1 : 1) } 
                : p
        ));

        // Update selectedPost if open in modal
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + (isLiked ? -1 : 1) } : null);
        }

        try {
            if (isLiked) {
                try {
                    await deleteDoc(likeRef);
                } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `likes/${likeId}`);
                }
                try {
                    await updateDoc(postRef, { likesCount: increment(-1) });
                } catch (error) {
                    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
                }
            } else {
                try {
                    await setDoc(likeRef, {
                        userId: currentUser.uid,
                        postId: postId,
                        createdAt: serverTimestamp()
                    });
                } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, `likes/${likeId}`);
                }
                try {
                    await updateDoc(postRef, { likesCount: increment(1) });
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, { xp: increment(5) });
                } catch (error) {
                    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
                }
            }
        } catch (error) {
            // Revert changes on error
            setLikedPosts(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(postId);
                else next.delete(postId);
                return next;
            });
            setTopPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? 1 : -1) } 
                    : p
            ));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + (isLiked ? 1 : -1) } : null);
            }
        }
    };

    const openLikersModal = async (postId: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setLikersModalPostId(postId);
        setIsLoadingLikers(true);
        setLikers([]);

        try {
            const likesQ = query(collection(db, 'likes'), where('postId', '==', postId), limit(100));
            const likesSnap = await getDocs(likesQ);
            
            const userPromises = likesSnap.docs.map(async (likeDoc) => {
                const likeData = likeDoc.data();
                const userSnap = await getDoc(doc(db, 'users', likeData.userId));
                return userSnap.exists() ? { id: likeData.userId, ...userSnap.data() } : null;
            });

            const resolvedUsers = (await Promise.all(userPromises)).filter(u => u !== null);
            setLikers(resolvedUsers);
        } catch (error) {
            console.error("Erro ao carregar curtidas:", error);
            toast.error("Não foi possível carregar quem curtiu.");
        } finally {
            setIsLoadingLikers(false);
        }
    };

    const handleShare = (post: PostType) => {
        const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
        setShareData({
            url: shareUrl,
            title: `VestApp - Post de ${post.authorName}`,
            text: post.content,
        });
        setIsShareModalOpen(true);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'agora';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        } catch (e) {
            return 'recentemente';
        }
    };

    const getTagClass = (subject: string) => {
        if (!subject) return 'tag-geral';
        const area = knowledgeAreas.find(a => a.subjects.includes(subject));
        if (area?.id === 'linguagens') return 'tag-port';
        if (area?.id === 'humanas') return 'tag-hist';
        if (area?.id === 'natureza') return 'tag-bio';
        if (area?.id === 'matematica') return 'tag-mat';
        return 'tag-geral';
    };

    const toggleComments = async (postId: string) => {
        const newOpenComments = new Set(openComments);
        if (newOpenComments.has(postId)) {
            newOpenComments.delete(postId);
        } else {
            newOpenComments.add(postId);
            if (!comments[postId]) {
                const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
                onSnapshot(q, (snapshot) => {
                    const postCommentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setComments(prev => ({ ...prev, [postId]: postCommentsData }));
                }, (error) => {
                    handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
                });
            }
        }
        setOpenComments(newOpenComments);
    };

    const handleSendComment = async (postId: string, text: string) => {
        if (!text.trim() || !currentUser) return;

        const temporaryId = `temp_${Date.now()}`;
        const newComment: any = {
            id: temporaryId,
            authorId: currentUser.uid,
            authorName: userProfile?.displayName || currentUser.displayName || 'Estudante',
            authorHandle: userProfile?.handle || currentUser.email?.split('@')[0] || 'estudante',
            authorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
            text: text,
            createdAt: new Date()
        };

        // Optimistic UI updates
        setPostComments(prev => [newComment, ...prev]);
        setComments(prev => ({
            ...prev,
            [postId]: [newComment, ...(prev[postId] || [])]
        }));
        setTopPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } 
                : p
        ));
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
        }

        try {
            await addDoc(collection(db, 'posts', postId, 'comments'), {
                text,
                authorId: currentUser.uid,
                authorName: userProfile?.displayName || currentUser.displayName || 'Estudante',
                authorHandle: userProfile?.handle || currentUser.email?.split('@')[0] || 'estudante',
                authorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { xp: increment(10) });
            toast.success("Comentário enviado! +10 XP obtidos. 💬");
        } catch (error) {
            // Revert on error
            setPostComments(prev => prev.filter(c => c.id !== temporaryId));
            setComments(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => c.id !== temporaryId)
            }));
            setTopPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, commentsCount: (p.commentsCount || 0) - 1 } 
                    : p
            ));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) - 1 } : null);
            }
            handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/comments`);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPostToDelete(null);
            toast.success("Movimento removido do ninho! 🦅");
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
        }
    };

    const openPostModal = async (post: PostType) => {
        setSelectedPost(post);
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'desc'));
        onSnapshot(q, (snapshot) => {
            setPostComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/comments`);
        });
    };

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'users'), where('isOnline', '==', true), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOnlineUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'users');
        });
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (topPosts.length > 0) {
            // Calculate recent activity from top posts locally
            const activity = topPosts.slice(0, 10).map(post => ({
                id: post.id,
                user: post.authorName,
                action: post.type === 'video' ? 'compartilhou um vídeo' : post.type === 'image' ? 'postou uma foto' : 'escreveu uma nota',
                subject: post.subject,
                time: post.createdAt
            }));
            setRecentActivity(activity);
        }
    }, [topPosts]);

    useEffect(() => {
        if (topSubjects.length > 0) {
            setTrendingSubjects(topSubjects.slice(0, 5));
        }
    }, [topSubjects]);

    return (
        <Layout>
            <div className="glass-bg"></div>
            
            {/* Floating Feathers */}
            <div className="feather" style={{ left: '5%', top: '20%', animationDelay: '0s' }}><Feather size={24} /></div>
            <div className="feather" style={{ right: '10%', top: '40%', animationDelay: '5s' }}><Feather size={20} /></div>
            <div className="feather" style={{ left: '15%', bottom: '15%', animationDelay: '12s' }}><Feather size={28} /></div>

            <main id="main-layout" className="feed-grid">
                <KnowledgeSidebar />

                {/* Main Content Area */}
                <div id="feed-container">
                    <header style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-1)', marginBottom: '15px' }}>
                            <TrendingUp size={24} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Trends</span>
                        </div>
                        <h1 style={{ fontFamily: 'Anton', fontSize: '3.5rem', textTransform: 'uppercase', lineHeight: 1, marginBottom: '20px', letterSpacing: '-0.01em', fontStyle: 'italic' }}>
                            Assuntos <br /> <span style={{ color: 'var(--accent-1)' }}>Em Alta</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', fontWeight: 500 }}>
                            O que a comunidade está estudando agora. Fique por dentro dos tópicos mais quentes para o ENEM.
                        </p>
                    </header>

                    <div className="search-area glass-card detailed-border" style={{ padding: '15px 25px', borderRadius: '30px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)' }}>
                        <Search size={20} style={{ opacity: 0.4 }} />
                        <input 
                            type="text" 
                            placeholder="Buscar tendências no ninho..." 
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', width: '100%', outline: 'none', fontWeight: 500 }}
                        />
                    </div>

                    <div className="crow-tip-card glass-card detailed-border" style={{ padding: '24px', borderRadius: '24px', marginBottom: '30px', background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(112, 0, 255, 0.05))', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent-1)', color: 'black' }}>
                                    <Bot size={18} />
                                </div>
                                <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--accent-1)' }}>Dica do Corvo</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.4, color: 'white' }}>
                                "{getPhraseOfTheDay()}"
                            </p>
                        </div>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                            <TrendingUp size={150} />
                        </div>
                    </div>

                    {/* Top Topics Bento - Re-styled to match general UI */}
                    <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginBottom: '40px' }}>
                        {topSubjects.map((subject, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => navigate(`/feed?filter=${subject.name}`)}
                                className="glass-card detailed-border bento-card"
                                style={{ cursor: 'pointer', padding: '24px !important' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-1)' }}>
                                        <Hash size={20} />
                                    </div>
                                    <ArrowUpRight size={18} style={{ opacity: 0.3 }} />
                                </div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>{subject.name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>
                                    <Flame size={12} style={{ color: '#ff4400' }} />
                                    {Math.round(subject.score)} Pontos de Calor
                                </div>
                            </motion.div>
                        ))}
                    </section>

                    <div className="flex items-center justify-between mb-8">
                        <h3 style={{ fontFamily: 'Anton', fontSize: '2rem', textTransform: 'uppercase' }}>Movimentações do Ninho</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.4 }}>
                            <Star size={14} style={{ color: 'var(--accent-3)' }} /> TOP 50 POSTS
                        </div>
                    </div>

                    {loading ? (
                        <div className="post-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                            <Bot size={48} className="animate-bounce" style={{ margin: '0 auto 20px', opacity: 0.3 }} />
                            <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', fontWeight: 800 }}>Sincronizando com o Ninho...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {topPosts.map((post, index) => {
                                const currentViewMode = postViewMode[post.id] || (post.type === 'video' && post.videoURL ? 'video' : post.type === 'image' && post.imageURL ? 'image' : 'text');
                                return (
                                    <article key={post.id} className="post-card" style={{ position: 'relative', paddingLeft: '45px' }}>
                                    <div className="line-number-gutter" style={{ 
                                        position: 'absolute', 
                                        left: 0, 
                                        top: 0, 
                                        bottom: 0, 
                                        width: '35px', 
                                        background: 'rgba(0,0,0,0.1)', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        paddingTop: '20px',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        borderRight: '1px solid var(--glass-border)',
                                        fontFamily: 'var(--f-mono)',
                                        userSelect: 'none'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div className="post-header">
                                        <div className="post-info">
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: { uid: post.authorId } }))} className="post-link" style={{ background: 'none', border: 'none', padding: 0 }}>
                                                <UserAvatar 
                                                    uid={post.authorId}
                                                    fallbackPhoto={post.authorPhoto || ""}
                                                    fallbackName={post.authorName || "Estudante"}
                                                    size={40}
                                                    className="post-avatar"
                                                />
                                            </button>
                                            <div>
                                                <button onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: { uid: post.authorId } }))} className="post-link" style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', display: 'block' }}>
                                                    <span className="post-author">{post.authorName}</span>
                                                </button>
                                                <span className="post-time">
                                                    {formatDate(post.createdAt)} • 
                                                    <span className={`tag-mat ${getTagClass(post.subject)}`}>{post.subject || 'Geral'}</span>
                                                </span>
                                            </div>
                                        </div>
                                        {post.authorId === currentUser?.uid && (
                                            <div className="post-options" style={{ position: 'relative' }}>
                                                <button 
                                                    onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)} 
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px' }}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {activeMenu === post.id && (
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        right: 0, 
                                                        top: '100%', 
                                                        background: 'var(--menu-bg)', 
                                                        border: '1px solid var(--glass-border)', 
                                                        borderRadius: '8px', 
                                                        zIndex: 100, 
                                                        minWidth: '120px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                        backdropFilter: 'blur(10px)'
                                                    }}>
                                                        <button 
                                                            onClick={() => setPostToDelete(post.id)}
                                                            style={{ 
                                                                width: '100%', 
                                                                padding: '10px 15px', 
                                                                textAlign: 'left', 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                color: '#ff4444', 
                                                                fontSize: '0.85rem', 
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                                     <div className="post-body">
                                        <div className="post-tab-content" onClick={() => openPostModal(post)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {post.content && (
                                                <p className={`post-text-content ${(!post.imageURL && !post.videoURL) ? (post.type === 'text' ? 'large-text' : '') : ''}`} style={{ fontSize: (!post.imageURL && !post.videoURL) ? undefined : '1rem', fontWeight: (!post.imageURL && !post.videoURL) ? undefined : 500 }}>{post.content}</p>
                                            )}
                                            
                                            {post.imageURL && (
                                                <div className="post-media-container image-type" style={{ marginTop: 0 }}>
                                                    <img src={post.imageURL} alt="Post" referrerPolicy="no-referrer" />
                                                </div>
                                            )}
                                            
                                            {post.videoURL && (
                                                <div className="post-media-container video-type" style={{ marginTop: 0 }}>
                                                    {(post.videoURL.startsWith('local-media:') || (post.videoURL.startsWith('data:') && !post.videoURL.startsWith('data:audio/') && !post.videoURL.includes('audio'))) ? (
                                                        <LocalMediaRender videoURL={post.videoURL} postId={post.id} />
                                                    ) : post.videoURL.includes('youtube.com') || post.videoURL.includes('youtu.be') ? (
                                                        <div className="video-wrapper">
                                                            <iframe 
                                                                src={`https://www.youtube.com/embed/${post.videoURL.split('v=')[1] || post.videoURL.split('/').pop()}`}
                                                                title="YouTube video player" 
                                                                frameBorder="0" 
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    ) : (
                                                        (post.videoURL && (post.videoURL.startsWith('data:audio/') || post.videoURL.includes('audio') || post.videoURL.endsWith('.mp3') || post.videoURL.endsWith('.wav') || post.videoURL.endsWith('.ogg') || post.videoURL.endsWith('.m4a') || post.videoURL.startsWith('data:application/octet-stream'))) ? (
                                                             <div className="flex flex-col items-center p-6 bg-slate-900/95 dark:bg-black/95 border border-white/10 rounded-2xl w-full text-center">
                                                                 <div className="w-12 h-12 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-3">
                                                                     <Music size={24} />
                                                                 </div>
                                                                 <p className="text-sm font-black mb-3 text-slate-200">Arquivo de Áudio (MP3)</p>
                                                                 <audio src={post.videoURL} controls className="w-full max-w-sm" />
                                                             </div>
                                                         ) : (
                                                             <video src={post.videoURL} controls poster="https://picsum.photos/seed/video/800/450"></video>
                                                         )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>                       </div>
                                    <div className="post-actions">
                                        <button 
                                            className={`action-btn crow-like ${likedPosts.has(post.id) ? 'active' : ''}`} 
                                            onClick={() => handleLike(post.id)}
                                        >
                                            <div className="crow-icon-wrapper">
                                                <img 
                                                    src="https://picsum.photos/seed/crow-icon/100/100" 
                                                    className="crow-mini-icon" 
                                                    alt="Crow"
                                                />
                                                <div className="crow-glow"></div>
                                            </div>
                                            <span 
                                                className="like-count hover:underline"
                                                onClick={(e) => openLikersModal(post.id, e)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {formatNumber(post.likesCount || 0)}
                                            </span>
                                        </button>
                                        <button className={`action-btn comment-toggle ${openComments.has(post.id) ? 'active' : ''}`} onClick={() => toggleComments(post.id)}>
                                            <MessageSquare size={18} /> {post.commentsCount || 0}
                                        </button>
                                        <button className="action-btn" onClick={() => handleShare(post)}>
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                    {openComments.has(post.id) && (
                                        <div className="comment-section" style={{ display: 'block', padding: '15px', borderTop: '1px solid var(--glass-border)' }}>
                                            <div className="comments-list" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(comments[post.id] || []).length === 0 ? (
                                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '10px' }}>Nenhum comentário ainda. Seja o primeiro!</p>
                                                ) : (
                                                    comments[post.id].slice().reverse().map(comment => (
                                                        <div key={comment.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="group/comment-item">
                                                            <button 
                                                                onClick={() => navigate(`/feed?search=${comment.authorHandle || comment.authorName}`)}
                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                            >
                                                                <UserAvatar 
                                                                    uid={comment.authorId}
                                                                    size="32px"
                                                                    fallbackPhoto={comment.authorPhoto}
                                                                    fallbackName={comment.authorName}
                                                                />
                                                            </button>
                                                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '15px', position: 'relative' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <strong 
                                                                        style={{ color: 'var(--accent-1)', fontSize: '0.8rem', cursor: 'pointer' }}
                                                                        onClick={() => navigate(`/feed?search=${comment.authorHandle || comment.authorName}`)}
                                                                    >
                                                                        {comment.authorName}
                                                                    </strong>
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatDate(comment.createdAt)}</span>
                                                                </div>
                                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'white' }}>{comment.text}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="comment-input-area" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <UserAvatar 
                                                    uid={currentUser?.uid || ''}
                                                    size="32px"
                                                    className="border border-accent-1"
                                                    fallbackPhoto={userProfile?.photoURL || currentUser?.photoURL || ''}
                                                    fallbackName={userProfile?.displayName || currentUser?.displayName || 'User'}
                                                />
                                                <input 
                                                    type="text"
                                                    placeholder="Escreva um comentário..." 
                                                    className="comment-input" 
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '8px 15px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && commentInputs[post.id]) {
                                                            handleSendComment(post.id, commentInputs[post.id]);
                                                            setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                                        }
                                                    }}
                                                />
                                                <div className="relative flex items-center">
                                                    <button
                                                        onClick={() => {
                                                            setCommentMentionPostId(
                                                                commentMentionPostId === post.id ? null : post.id
                                                            );
                                                            setMentionSearchTerm("");
                                                        }}
                                                        type="button"
                                                        className="text-accent-1 hover:bg-accent-1/10 p-1.5 rounded-full transition-all font-black text-xs min-h-0"
                                                        title="Mencionar colega"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-1)', fontSize: '1rem', padding: '5px' }}
                                                    >
                                                        @
                                                    </button>
                                                    {commentMentionPostId === post.id && (
                                                        <div className="absolute bottom-9 right-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xl z-50 w-64 max-h-56 overflow-y-auto text-left">
                                                            <div className="text-[10px] font-black text-accent-1 uppercase mb-1.5" style={{ color: 'var(--accent-1)' }}>
                                                                Marcar Colega
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar colega..."
                                                                value={mentionSearchTerm}
                                                                onChange={(e) => setMentionSearchTerm(e.target.value)}
                                                                className="w-full bg-slate-950/10 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 text-[10px] font-bold text-black dark:text-white outline-none mb-2"
                                                                style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', color: 'inherit', outline: 'none', width: '100%' }}
                                                            />
                                                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar">
                                                                {matchingUsers.length === 0 ? (
                                                                    <div className="text-[11px] text-zinc-500 py-1 text-center font-bold">
                                                                        Nenhum colega encontrado
                                                                    </div>
                                                                ) : (
                                                                    matchingUsers.map((u) => (
                                                                        <div
                                                                            key={u.id}
                                                                            onClick={() => {
                                                                                const handle =
                                                                                    u.handle ||
                                                                                    u.displayName
                                                                                        ?.toLowerCase()
                                                                                        .replace(/\s+/g, "") ||
                                                                                    "estudante";
                                                                                setCommentInputs((prev) => ({
                                                                                    ...prev,
                                                                                    [post.id]:
                                                                                        (prev[post.id] || "") +
                                                                                        `@${handle} `,
                                                                                }));
                                                                                setCommentMentionPostId(null);
                                                                            }}
                                                                            className="flex items-center gap-2 p-1 rounded hover:bg-zinc-100 dark:hover:bg-slate-900 cursor-pointer text-left transition-colors"
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    u.photoURL ||
                                                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "Estudante")}&background=random`
                                                                                }
                                                                                className="w-5 h-5 rounded-full"
                                                                                referrerPolicy="no-referrer"
                                                                                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                                                            />
                                                                            <div className="flex flex-col min-w-0" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                                <span className="text-[10px] font-bold text-black dark:text-white truncate leading-tight" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                                                                    {u.displayName}
                                                                                </span>
                                                                                <span className="text-[8px] text-accent-1" style={{ fontSize: '8px', color: 'var(--accent-1)' }}>
                                                                                    @{u.handle || "estudante"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    className="send-comment-btn" 
                                                    style={{ background: 'var(--accent-1)', border: 'none', borderRadius: '50%', width: '35px', height: '35px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => {
                                                        if (commentInputs[post.id]) {
                                                            handleSendComment(post.id, commentInputs[post.id]);
                                                            setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                                        }
                                                    }}
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                            })}`
                        </div>
                    )}
                </div>

                <TrendsSidebar 
                    userProfile={userProfile}
                    currentUser={currentUser}
                    trendingSubjects={tSubjects}
                    topTrendingPhotos={topTrendingPhotos}
                    topTrendingPosts={topTrendingPosts}
                    onlineUsers={oUsers}
                    openPostModal={openPostModalGlobal}
                />
            </main>

                {/* Modals matching Feed.tsx */}
                {selectedPost && (
                    <div id="post-modal" className="modal" style={{ display: 'flex', zIndex: 2000 }}>
                        <div className="modal-content glass-card" style={{ maxWidth: '900px', width: '95%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'row', height: '80vh' }}>
                            <X size={24} onClick={() => setSelectedPost(null)} style={{ position: 'absolute', right: '15px', top: '15px', zIndex: 10, cursor: 'pointer', color: 'white' }} />
                            
                            <div style={{ flex: 1.5, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--glass-border)' }}>
                                {(selectedPost.type === 'video' || selectedPost.videoURL) ? (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedPost.videoURL && (selectedPost.videoURL.startsWith('local-media:') || (selectedPost.videoURL.startsWith('data:') && !selectedPost.videoURL.startsWith('data:audio/') && !selectedPost.videoURL.includes('audio'))) ? (
                                            <div style={{ width: '100%', maxWidth: '600px', padding: '20px' }}>
                                                <LocalMediaRender videoURL={selectedPost.videoURL} postId={selectedPost.id} />
                                            </div>
                                        ) : selectedPost.videoURL?.includes('youtube.com') || selectedPost.videoURL?.includes('youtu.be') ? (
                                            <iframe 
                                                src={`https://www.youtube.com/embed/${selectedPost.videoURL.split('v=')[1] || selectedPost.videoURL.split('/').pop()}`}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                allowFullScreen
                                            ></iframe>
                                        ) : (selectedPost.videoURL && (selectedPost.videoURL.startsWith('data:audio/') || selectedPost.videoURL.includes('audio') || selectedPost.videoURL.endsWith('.mp3') || selectedPost.videoURL.endsWith('.wav') || selectedPost.videoURL.endsWith('.ogg') || selectedPost.videoURL.endsWith('.m4a') || selectedPost.videoURL.startsWith('data:application/octet-stream'))) ? (
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 w-full h-full text-center">
                                                <div className="w-16 h-16 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-4">
                                                    <Music size={32} />
                                                </div>
                                                <p className="text-sm font-black mb-4 text-white">Arquivo de Áudio (MP3)</p>
                                                <audio src={selectedPost.videoURL} controls className="w-full max-w-sm" />
                                            </div>
                                        ) : (
                                            <video src={selectedPost.videoURL} controls style={{ width: '100%', height: '100%' }}></video>
                                        )}
                                    </div>
                                ) : (selectedPost.imageURL) ? (
                                    <img src={selectedPost.imageURL} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" />
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)', width: '100%' }}>
                                        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>{selectedPost.content}</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <UserAvatar 
                                        uid={selectedPost.authorId}
                                        fallbackPhoto={selectedPost.authorPhoto || ""}
                                        fallbackName={selectedPost.authorName || "Estudante"}
                                        size={32}
                                        className="rounded-full shrink-0"
                                    />
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedPost.authorName}</div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                        <UserAvatar 
                                            uid={selectedPost.authorId}
                                            fallbackPhoto={selectedPost.authorPhoto || ""}
                                            fallbackName={selectedPost.authorName || "Estudante"}
                                            size={32}
                                            className="rounded-full shrink-0"
                                        />
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 700, marginRight: '8px' }}>{selectedPost.authorName}</span>
                                            {selectedPost.content}
                                        </div>
                                    </div>

                                    {postComments.map((comment) => (
                                        <div key={comment.id} style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start' }}>
                                            <UserAvatar 
                                                uid={comment.authorId}
                                                fallbackPhoto={comment.authorPhoto || ""}
                                                fallbackName={comment.authorName || "Estudante"}
                                                size={32}
                                                className="rounded-full shrink-0"
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    <span style={{ fontWeight: 800, marginRight: '8px' }}>{comment.authorName}</span>
                                                    {comment.content || (comment as any).text}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    {formatDate(comment.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                        <button 
                                            onClick={() => handleLike(selectedPost.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            className={likedPosts.has(selectedPost.id) ? 'text-accent-1' : 'text-zinc-500'}
                                        >
                                            <HeartIcon size={24} className={likedPosts.has(selectedPost.id) ? 'fill-current' : ''} />
                                        </button>
                                        <MessageSquareIcon size={24} className="text-zinc-500" />
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} className="text-zinc-500">
                                            <Share2 size={24} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                        <span 
                                            style={{ cursor: 'pointer' }}
                                            className="hover:underline"
                                            onClick={() => openLikersModal(selectedPost.id)}
                                        >
                                            {formatNumber(selectedPost.likesCount || 0)}
                                        </span> curtidas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {postToDelete && (
                    <div className="modal" style={{ display: 'flex', zIndex: 2000 }}>
                        <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ marginBottom: '15px' }}>Excluir Publicação?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                                Esta ação não pode ser desfeita. A publicação será removida permanentemente.
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="chip" 
                                    style={{ flex: 1, border: '1px solid var(--glass-border)', background: 'none' }}
                                    onClick={() => setPostToDelete(null)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    className="chip active" 
                                    style={{ flex: 1, background: '#ff4444', border: 'none' }}
                                    onClick={() => handleDeletePost(postToDelete)}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            {likersModalPostId && (
                <div className="modal" style={{ display: 'flex', zIndex: 3000 }}>
                    <div className="modal-content glass-card" style={{ maxWidth: '400px', width: '90%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '60vh' }}>
                        <div className="flex items-center justify-between p-4 border-b border-white/10" style={{ background: 'var(--bg-secondary)' }}>
                            <h3 className="font-black text-lg text-white">Curtidas</h3>
                            <button onClick={() => setLikersModalPostId(null)} className="text-zinc-500 hover:text-white p-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--bg-main)' }}>
                            {isLoadingLikers ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <div className="w-8 h-8 border-4 border-accent-1/20 border-t-accent-1 rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Carregando...</p>
                                </div>
                            ) : likers.length === 0 ? (
                                <div className="text-center py-10">
                                    <HeartIcon size={40} className="mx-auto text-zinc-800 mb-3" />
                                    <p className="text-zinc-500 font-bold">Ninguém curtiu ainda.</p>
                                </div>
                            ) : (
                                likers.map(liker => (
                                    <div key={liker.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserAvatar 
                                                uid={liker.id}
                                                fallbackPhoto={liker.photoURL || ""}
                                                fallbackName={liker.displayName || "Estudante"}
                                                size={40}
                                                className="rounded-full object-cover shrink-0"
                                            />
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{liker.displayName}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--text-secondary)' }}>@{liker.handle || liker.displayName?.toLowerCase().replace(/\s+/g, '')}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setLikersModalPostId(null);
                                                navigate(`/perfil?uid=${liker.id}`);
                                            }}
                                            className="chip"
                                            style={{ fontSize: '10px', padding: '5px 12px' }}
                                        >
                                            Ver Perfil
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                url={shareData.url}
                title={shareData.title}
                text={shareData.text}
                theme={theme}
            />
        </Layout>
    );
};

export default Trending;
