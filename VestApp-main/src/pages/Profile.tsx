import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged } from '../firebase';
import { safeLocalStorage } from '../lib/storage';
import { updateProfile, updateEmail, User } from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    getDocs,
    setDoc,
    deleteDoc,
    increment,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import Layout from '../components/Layout';
import KnowledgeSidebar from '../components/KnowledgeSidebar';
import TrendsSidebar from '../components/TrendsSidebar';
import { useTrendingData } from '../hooks/useTrendingData';
import OnboardingQuiz from '../components/OnboardingQuiz';
import StudySchedule from '../components/StudySchedule';
import IntelligentScheduleGenerator from '../components/IntelligentScheduleGenerator';
import { UserProfile, Post as PostType } from '../types';
import UserAvatar from '../components/UserAvatar';
// @ts-ignore
import MascotImg from '../assets/images/study_mascot_1780079223096.png';
import { CheckCircle, MessageSquare, Share2, Award, CalendarPlus, LayoutGrid, Clapperboard, Heart, X, Loader2, Trophy, Lock, Star, Feather, Crown, Calendar, Moon, Sun, GraduationCap, Users, BookOpen, Trash2, Rocket, TrendingUp, Plus, Image as ImageIcon, Video, Send, ChevronDown, Search, Clock, Zap, Target, Sparkles, Play, Pause, RotateCcw, Volume2, HelpCircle, Lightbulb, ChevronRight, Music, Repeat, BarChart3, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { addDoc } from 'firebase/firestore';
import { useRef } from 'react';
import { ShareModal } from '../components/ShareModal';
import { playAmbientSound, stopAmbientSound } from '../lib/ambientAudio';

interface Message {
    text: string;
    type: 'ai' | 'user';
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    rarity: 'comum' | 'raro' | 'epico' | 'lendario';
    status: 'unlocked' | 'in-progress' | 'locked';
    progress: number;
    total: number;
    unlockDate?: string;
    xp: number;
    icon: React.ReactNode;
    colorClass: string;
}

// Mock datasets for default full profile to avoid empty spaces or empty states
const mockPosts: PostType[] = [
    {
        id: "mock-p1",
        authorId: "mock",
        authorName: "Giulia Silva",
        authorHandle: "giuliasilva",
        authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        content: "Foco total na revisão de Fisiologia Humana para o ENEM! Esse mapa mental salvou minha tarde de estudos hoje. 📝🩺 Vamos de aprovação! #ENEM #Medicina",
        imageURL: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600",
        likesCount: 148,
        commentsCount: 12,
        repostsCount: 0,
        createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
        id: "mock-p2",
        authorId: "mock",
        authorName: "Giulia Silva",
        authorHandle: "giuliasilva",
        authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        content: "Dica quente de Redação: No ENEM, lembre-se de que a proposta de intervenção não precisa resolver o problema por completo, mas deve dar os 5 elements (Agente, Ação, Meio/Modo, Detalhamento, Efeito) para diminuir seu impacto social. Nota 1000 tá vindo! ✍️🦅",
        imageURL: undefined,
        likesCount: 95,
        commentsCount: 8,
        repostsCount: 0,
        createdAt: new Date(Date.now() - 3600000 * 20)
    },
    {
        id: "mock-p3",
        authorId: "mock",
        authorName: "Giulia Silva",
        authorHandle: "giuliasilva",
        authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        content: "Aquele cappuccino de lei para aguentar a rodada noturna de Simulados de Ciências da Natureza. O cansaço é real, mas o sonho é maior! ☕️🦉",
        imageURL: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600",
        likesCount: 162,
        commentsCount: 14,
        repostsCount: 0,
        createdAt: new Date(Date.now() - 3600000 * 48)
    }
];

const mockEssays = [
    {
        id: "mock-e1",
        userId: "mock",
        theme: "Caminhos para combater a intolerância religiosa no Brasil",
        score: 920,
        submissionMethod: "text",
        createdAt: new Date(Date.now() - 3600000 * 24 * 7),
        competencies: [
            { score: 160, feedback: "Demonstra excelente domínio da modalidade escrita formal, com raros desvios gramaticais." },
            { score: 200, feedback: "Compreendeu perfeitamente a proposta, aplicando conceitos filosóficos com repertório de John Locke." },
            { score: 160, feedback: "Apresenta um projeto de texto claro, defendendo seu ponto de vista com argumentos sólidos." },
            { score: 200, feedback: "Articula as partes do texto de forma excelente, com repertório coesivo diversificado." },
            { score: 200, feedback: "Proposta de intervenção completa, detalhando com precisão o agente governamental." }
        ],
        evaluation: {
            generalFeedback: "Parabéns, Giulia! Sua redação está excelente, demonstrando um ótimo repertório sociocultural e rigor formal. Atente-se apenas à seleção de alguns argumentos na C3 para evitar trechos puramente expositivos.",
            strengths: ["Repertório de John Locke perfeitamente produtivo", "Conectivos de transição extremamente fluídos", "Proposta de intervenção nota máxima, contendo todos os 5 elementos"],
            weaknesses: ["Leve desvio de concordância nominal no segundo parágrafo", "Aprofundamento de autoria poderia ser ligeiramente mais denso no D2"]
        }
    },
    {
        id: "mock-e2",
        userId: "mock",
        theme: "Desafios para a valorização de comunidades e povos tradicionais",
        score: 960,
        submissionMethod: "text",
        createdAt: new Date(Date.now() - 3600000 * 24 * 5),
        competencies: [
            { score: 200, feedback: "Domínio impecável da língua escrita padrão, sem desvios estruturais ou sintáticos." },
            { score: 200, feedback: "Demonstra excelente repertório trazendo o conceito de 'Cidadãos de Papel' de Gilberto Dimenstein." },
            { score: 160, feedback: "Construção de tese forte, mas com leve falta de detalhamento em um dos argumentos secundários." },
            { score: 200, feedback: "Uso exemplar de recursos coesivos, com parágrafos bem de-limitados." },
            { score: 200, feedback: "Proposta de intervenção bem estruturada e viável, com agente, ação, modo." }
        ],
        evaluation: {
            generalFeedback: "Excelente desempenho acadêmico! Você demonstrou maturidade de escrita e compreensão do eixo temático de minorias sociais no cenário nacional contemporâneo.",
            strengths: ["Tese clara e marcante desde a introdução", "Vocabulário culto e excelente aplicação de Gilberto Dimenstein"],
            weaknesses: ["O desenvolvimento 1 ficou um pouco mais longo que o desenvolvimento 2"]
        }
    }
];

const mockSimulations = [
    {
        id: "mock-s1",
        userId: "mock",
        examTitle: "Ciências da Natureza - Nível Elite",
        category: "Ciências da Natureza",
        correctAnswers: 8,
        totalQuestions: 10,
        createdAt: new Date(Date.now() - 3600000 * 4)
    },
    {
        id: "mock-s2",
        userId: "mock",
        examTitle: "Matemática e suas Tecnologias",
        category: "Matemática",
        correctAnswers: 7,
        totalQuestions: 10,
        createdAt: new Date(Date.now() - 3600000 * 30)
    },
    {
        id: "mock-s3",
        userId: "mock",
        examTitle: "Ciências Humanas e Sociais",
        category: "Ciências Humanas",
        correctAnswers: 9,
        totalQuestions: 10,
        createdAt: new Date(Date.now() - 3600000 * 50)
    }
];

const Profile: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
    const { trendingSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers } = useTrendingData(currentUser);
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

    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [essays, setEssays] = useState<any[]>([]);
    const [simulations, setSimulations] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('publicacoes');
    const [postDisplayMode, setPostDisplayMode] = useState<'list' | 'grid'>('list');
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState({ url: '', title: '', text: '' });
    
    // Followers Modal State
    const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
    const [followModalUsers, setFollowModalUsers] = useState<any[]>([]);
    const [loadingFollows, setLoadingFollows] = useState<boolean>(false);

    const viewUid = searchParams.get('uid');

    const displayUser = {
        uid: targetUser?.uid || viewUid || currentUser?.uid || "guest-uid",
        displayName: targetUser?.displayName || (currentUser?.uid === (targetUser?.uid || viewUid || currentUser?.uid) ? (currentUser?.displayName || currentUser?.email?.split('@')[0] || "Estudante") : "Estudante"),
        email: targetUser?.email || (currentUser?.uid === (targetUser?.uid || viewUid || currentUser?.uid) ? (currentUser?.email || "") : ""),
        handle: targetUser?.handle || (currentUser?.uid === (targetUser?.uid || viewUid || currentUser?.uid) ? (currentUser?.email?.split('@')[0] || "estudante") : "estudante"),
        bio: targetUser?.bio || "Focado nos estudos! 🚀 Adicione uma biografia editando seu perfil.",
        photoURL: targetUser?.photoURL || (targetUser?.uid === currentUser?.uid ? (currentUser?.photoURL || "") : "") || "",
        coverURL: targetUser?.coverURL || "", // Empty default cover image for new accounts
        studentType: targetUser?.studentType || "vestibulando",
        studyGoal: targetUser?.studyGoal || "Geral",
        studyTime: targetUser?.studyTime || "Noite e Tarde",
        level: targetUser?.xp !== undefined ? Math.floor(targetUser.xp / 1000) + 1 : (targetUser?.level || 1),
        xp: targetUser?.xp !== undefined ? targetUser.xp : 0,
        followersCount: followersCount,
        followingCount: followingCount,
        isVerified: targetUser?.isVerified || false,
        createdAt: targetUser?.createdAt || null,
        totalFocusSeconds: targetUser?.totalFocusSeconds || 0
    };

    const isVestapp = (displayUser.handle || '').toLowerCase().trim() === 'vestapp';
    const displayPosts = posts; // No automatic fallback to mockPosts
    const displayEssays = essays; // No automatic fallback to mockEssays
    const displaySimulations = simulations; // No automatic fallback to mockSimulations

    // --- POMODORO TIMER & EXPANDED FOCUS STATS STATES ---
    const [focusDurationMin, setFocusDurationMin] = useState(25);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');

    // Ambient study sounds state and ref
    const [activeSoundId, setActiveSoundId] = useState<string | null>(null);

    const ambientSounds = [
        { id: 'chuva', name: '🌧️ Chuva na Janela', url: '' },
        { id: 'ondas', name: '🌊 Ondas de Verão', url: '' },
        { id: 'drone', name: '🌌 Espaço Sideral', url: '' },
        { id: 'lareira', name: '🔥 Lareira Relax', url: '' },
        { id: 'vento', name: '🌾 Brisa na Floresta', url: '' }
    ];

    useEffect(() => {
        // Stop any playing sound on unmount to prevent background leak
        return () => {
            stopAmbientSound();
        };
    }, []);

    useEffect(() => {
        if (searchParams.get('edit') === 'true' && currentUser) {
            setIsEditing(true);
        }
    }, [searchParams, currentUser]);

    const handleCloseEditing = () => {
        setIsEditing(false);
        setIsAutoEdit(false);
        if (searchParams.get('edit') === 'true') {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('edit');
            const queryString = newParams.toString();
            navigate(`/perfil${queryString ? `?${queryString}` : ''}`, { replace: true });
        }
    };

    useEffect(() => {
        let interval: any = null;
        if (pomodoroActive && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime(prev => prev - 1);
            }, 1000);
        } else if (pomodoroActive && pomodoroTime === 0) {
            setPomodoroActive(false);
            if (pomodoroMode === 'focus') {
                toast.success("Excelente! Sessão de foco concluída! Hora de relaxar um pouco. 🕒");
                setPomodoroMode('shortBreak');
                setPomodoroTime(5 * 60);

                // Persist the focus time session to the user's account in Firestore
                if (auth.currentUser) {
                    try {
                        const userRef = doc(db, 'users', auth.currentUser.uid);
                        updateDoc(userRef, {
                            totalFocusSeconds: increment(focusDurationMin * 60), // Add chosen minutes of focus
                            xp: increment(150) // Reward 150 XP for focusing!
                        }).then(() => {
                            toast.success("+150 XP acumulados! Seu tempo de foco foi vinculado à sua conta!");
                        }).catch(e => {
                            console.error("Erro focado ao salvar tempo no Firestore:", e);
                        });
                    } catch (e) {
                        console.error("Erro ao atualizar o tempo de progresso de foco:", e);
                    }
                }
            } else {
                toast.success("Descanso finalizado. Vamos voltar com tudo aos estudos? 💪");
                setPomodoroMode('focus');
                setPomodoroTime(focusDurationMin * 60);
            }
        }
        return () => clearInterval(interval);
    }, [pomodoroActive, pomodoroTime, pomodoroMode, focusDurationMin]);

    const selectPomodoroMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
        setPomodoroActive(false);
        setPomodoroMode(mode);
        if (mode === 'focus') setPomodoroTime(focusDurationMin * 60);
        else if (mode === 'shortBreak') setPomodoroTime(5 * 60);
        else setPomodoroTime(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    const [isEditing, setIsEditing] = useState(false);
    const [isAutoEdit, setIsAutoEdit] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({
        displayName: '',
        email: '',
        handle: '',
        avatarURL: '',
        coverURL: '',
        bio: '',
        studentType: '',
        studyTime: '',
        studyGoal: ''
    });
    const [activeMascotTip, setActiveMascotTip] = useState<number | null>(0);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [profileCommentInput, setProfileCommentInput] = useState("");
    const [commentMentionPostId, setCommentMentionPostId] = useState<string | null>(null);
    const [mentionSearchTerm, setMentionSearchTerm] = useState("");
    const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostImage, setNewPostImage] = useState('');
    const [newPostVideo, setNewPostVideo] = useState('');
    const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
    const [newPostSubject, setNewPostSubject] = useState('Geral');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [likersModalPostId, setLikersModalPostId] = useState<string | null>(null);
    const [likers, setLikers] = useState<any[]>([]);
    const [isLoadingLikers, setIsLoadingLikers] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [lightThemeColor, setLightThemeColor] = useState<string>(() => {
        return safeLocalStorage.getItem('light-theme-color') || 'default';
    });
    const [canScrollDown, setCanScrollDown] = useState(false);
    const [showEnemDashboard, setShowEnemDashboard] = useState(false);
    const [selectedEssayDetail, setSelectedEssayDetail] = useState<any | null>(null);

    useEffect(() => {
        const handleThemeChange = () => {
            const savedTheme = (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
            setTheme(savedTheme);
        };
        const handleColorChange = () => {
            setLightThemeColor(safeLocalStorage.getItem('light-theme-color') || 'default');
        };
        window.addEventListener('theme-changed', handleThemeChange);
        window.addEventListener('theme-color-changed', handleColorChange);
        return () => {
            window.removeEventListener('theme-changed', handleThemeChange);
            window.removeEventListener('theme-color-changed', handleColorChange);
        };
    }, []);

    useEffect(() => {
        const fetchMentionUsers = async () => {
            if (!mentionSearchTerm.trim()) {
                setMatchingUsers([]);
                return;
            }
            try {
                const rawTerm = mentionSearchTerm.trim().toLowerCase();
                const clean = rawTerm.startsWith("@") ? rawTerm.slice(1) : rawTerm;
                
                // Optimized query: only fetch a limited number of users that match the prefix
                const q = query(
                    collection(db, "users"),
                    where('handle', '>=', clean),
                    where('handle', '<=', clean + '\uf8ff'),
                    limit(10)
                );
                
                const snap = await getDocs(q);
                const list = snap.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() }) as any,
                );
                setMatchingUsers(list);
            } catch (e) {
                console.error("Erro ao buscar usuários para menção:", e);
                if (auth.currentUser) {
                    handleFirestoreError(e, OperationType.LIST, "users");
                }
            }
        };
        const timeoutId = setTimeout(fetchMentionUsers, 300); // Add debounce
        return () => clearTimeout(timeoutId);
    }, [mentionSearchTerm]);

    const changeLightThemeColor = (color: string) => {
        setLightThemeColor(color);
        if (color === 'default') {
            safeLocalStorage.removeItem('light-theme-color');
        } else {
            safeLocalStorage.setItem('light-theme-color', color);
        }
        window.dispatchEvent(new CustomEvent('theme-color-changed'));
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Agora';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return 'Agora';
        if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
        return date.toLocaleDateString();
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        safeLocalStorage.setItem('theme', newTheme);
        window.dispatchEvent(new CustomEvent('theme-changed'));
    };
    const postModalRef = useRef<HTMLDivElement>(null);

    const checkScroll = () => {
        if (postModalRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = postModalRef.current;
            setCanScrollDown(scrollHeight > scrollTop + clientHeight + 10);
        }
    };

    useEffect(() => {
        if (showPostModal) {
            setTimeout(checkScroll, 100);
        }
    }, [showPostModal, postType, newPostImage, newPostVideo]);

    const achievements: Achievement[] = [
        {
            id: 'first-flight',
            title: 'Primeiro Voo do Corvo',
            description: 'Abra suas asas e complete sua primeira nota de estudo no VestApp',
            rarity: 'comum',
            status: displayPosts.length > 0 ? 'unlocked' : 'locked',
            progress: displayPosts.length > 0 ? 1 : 0,
            total: 1,
            unlockDate: displayPosts.length > 0 ? 'Conquistado' : undefined,
            xp: 100,
            icon: <Rocket size={24} />,
            colorClass: 'comum'
        },
        {
            id: 'night-crow',
            title: 'Vigilante Noturno',
            description: 'O corvo não dorme. Estude por mais de 3 horas após a meia-noite',
            rarity: 'raro',
            status: (displayUser.studyTime || '').includes('Noite') ? 'unlocked' : 'in-progress',
            progress: (displayUser.studyTime || '').includes('Noite') ? 1 : 0,
            total: 1,
            xp: 250,
            icon: <Moon size={24} />,
            colorClass: 'raro'
        },
        {
            id: 'golden-quill',
            title: 'Pena Imperial',
            description: 'Escreva com a maestria de um corvo real. Envie 5 redações',
            rarity: 'epico',
            status: displayEssays.length >= 5 ? 'unlocked' : 'in-progress',
            progress: Math.min(displayEssays.length, 5),
            total: 5,
            xp: 500,
            icon: <Feather size={24} />,
            colorClass: 'epico'
        },
        {
            id: 'master-crow',
            title: 'Soberano do Ninho',
            description: 'Domine todo o território. Envie 20 redações para correção',
            rarity: 'lendario',
            status: displayEssays.length >= 20 ? 'unlocked' : 'locked',
            progress: Math.min(displayEssays.length, 20),
            total: 20,
            xp: 1000,
            icon: <Crown size={24} />,
            colorClass: 'lendario'
        },
        {
            id: 'simulated-master',
            title: 'Estrategista Nato',
            description: 'Complete 10 simulados para dominar a pressão do ENEM',
            rarity: 'raro',
            status: displaySimulations.length >= 10 ? 'unlocked' : 'locked',
            progress: Math.min(displaySimulations.length, 10),
            total: 10,
            xp: 300,
            icon: <Target size={24} />,
            colorClass: 'raro'
        },
        {
            id: 'top-score',
            title: 'Nota Mil',
            description: 'Alcance a pontuação máxima em uma redação',
            rarity: 'lendario',
            status: displayEssays.some(e => e.score >= 900) ? 'unlocked' : 'locked',
            progress: displayEssays.some(e => e.score >= 900) ? 1 : 0,
            total: 1,
            xp: 2000,
            icon: <Award size={24} />,
            colorClass: 'lendario'
        }
    ];

    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;
        let unsubscribeCurrentUser: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            const targetUid = viewUid || (user ? user.uid : null);
            
            if (user) {
                // Fetch logged in user profile in real-time
                const currentUserRef = doc(db, 'users', user.uid);
                unsubscribeCurrentUser = onSnapshot(currentUserRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setCurrentUserProfile(snapshot.data() as UserProfile);
                    }
                });
            }

            if (!targetUid) {
                // If no user and no viewUid, go to home
                if (!user) navigate('/');
                return;
            }
                
            // Ensure user profile exists
            await loadUserProfile(targetUid);
            
            // Real-time listener for the profile being viewed
            const userRef = doc(db, 'users', targetUid);
            unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.data();
                    setTargetUser(userData as UserProfile);
                    
                    // Only update editData if we're not currently editing
                    // or if it's the initial load
                    setEditData(prev => {
                        if (!isEditing || prev.displayName === '') {
                            return {
                                displayName: userData.displayName || '',
                                email: userData.email || auth.currentUser?.email || '',
                                handle: userData.handle || '',
                                avatarURL: userData.photoURL || '',
                                coverURL: userData.coverURL || '',
                                bio: userData.bio || '',
                                studentType: userData.studentType || '',
                                studyTime: userData.studyTime || '',
                                studyGoal: userData.studyGoal || ''
                            };
                        }
                        return prev;
                    });
                } else if (viewUid) {
                    navigate('/');
                }
            }, (error) => {
                if (auth.currentUser) {
                    handleFirestoreError(error, OperationType.GET, `users/${targetUid}`);
                }
            });

            loadUserPosts(targetUid);
            loadUserEssays(targetUid);
            loadUserSimulations(targetUid);
            
            if (viewUid && user && viewUid !== user.uid) {
                checkFollowing(user.uid, viewUid);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
            if (unsubscribeCurrentUser) unsubscribeCurrentUser();
        };
    }, [viewUid, navigate, isEditing]);

    useEffect(() => {
        const uid = viewUid || currentUser?.uid;
        if (!uid) return;

        const qFollowers = query(collection(db, 'follows'), where('followingId', '==', uid));
        const unsubscribeFollowers = onSnapshot(qFollowers, (snapshot) => {
            setFollowersCount(snapshot.size);
        }, (error) => {
            console.error("Error fetching real followers snapshot in profile:", error);
            if (auth.currentUser) {
                handleFirestoreError(error, OperationType.LIST, 'follows');
            }
        });

        const qFollowing = query(collection(db, 'follows'), where('followerId', '==', uid));
        const unsubscribeFollowing = onSnapshot(qFollowing, (snapshot) => {
            setFollowingCount(snapshot.size);
        }, (error) => {
            console.error("Error fetching real following snapshot in profile:", error);
            if (auth.currentUser) {
                handleFirestoreError(error, OperationType.LIST, 'follows');
            }
        });

        return () => {
            unsubscribeFollowers();
            unsubscribeFollowing();
        };
    }, [viewUid, currentUser?.uid]);

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
            if (auth.currentUser) {
                handleFirestoreError(error, OperationType.LIST, 'likes');
            }
        });

        return () => unsubscribeLikes();
    }, [currentUser]);

    const loadUserProfile = async (uid: string) => {
        const userRef = doc(db, 'users', uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setTargetUser(userData as UserProfile);
                setEditData(prev => {
                    if (!isEditing || prev.displayName === '') {
                        return {
                            displayName: userData.displayName || '',
                            email: userData.email || auth.currentUser?.email || '',
                            handle: userData.handle || '',
                            avatarURL: userData.photoURL || '',
                            coverURL: userData.coverURL || '',
                            bio: userData.bio || '',
                            studentType: userData.studentType || '',
                            studyTime: userData.studyTime || '',
                            studyGoal: userData.studyGoal || ''
                        };
                    }
                    return prev;
                });

                return userData;
            } else if (uid === auth.currentUser?.uid) {
                // Trigger onboarding quiz if it's the current user and profile doesn't exist
                setShowOnboarding(true);
                return null;
            }
        } catch (error) {
            if (auth.currentUser) {
                handleFirestoreError(error, OperationType.GET, `users/${uid}`);
            }
        }
        return null;
    };

    const loadUserPosts = (uid: string) => {
        const q = query(collection(db, 'posts'), where('authorId', '==', uid));
        onSnapshot(q, async (snapshot) => {
            const postList = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt || null
                };
            });
            
            // Only fetch original posts that we don't already have
            const enrichedPosts = await Promise.all(postList.map(async (p) => {
                 const post = p as any;
                 if (post.type === 'repost' && post.repostOfId && !post.originalPost) {
                     try {
                         const originalDoc = await getDoc(doc(db, 'posts', post.repostOfId));
                         if (originalDoc.exists()) {
                             const origData = originalDoc.data();
                             return {
                                 ...post,
                                 originalPost: { id: originalDoc.id, ...origData }
                             };
                         }
                     } catch (e) {
                         console.error("Could not fetch original post for repost", e);
                     }
                 }
                 return post;
            }));

            // Client-side sort: newer posts first
            enrichedPosts.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
                return timeB - timeA;
            });

            setPosts(enrichedPosts as any[]);
        }, (error) => {
            if (auth.currentUser) {
                handleFirestoreError(error, OperationType.LIST, 'posts');
            }
        });
    };

    const loadUserEssays = (uid: string) => {
        const q = query(collection(db, 'essay_submissions'), where('userId', '==', uid));
        onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            list.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return timeB - timeA;
            });
            setEssays(list);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'essay_submissions');
        });
    };

    const loadUserSimulations = (uid: string) => {
        const q = query(collection(db, 'simulado_results'), where('userId', '==', uid));
        onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            list.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return timeB - timeA;
            });
            setSimulations(list);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'simulado_results');
        });
    };

    const handleDeletePost = async (postId: string) => {
        console.log("Iniciando exclusão do post no perfil:", postId);
        try {
            await deleteDoc(doc(db, 'posts', postId));
            console.log("Post excluído com sucesso do perfil");
            toast.success('Publicação excluída com sucesso!');
            setSelectedPost(null);
            setPostToDelete(null);
        } catch (error) {
            console.error("Erro ao excluir post no perfil:", error);
            handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
            toast.error('Erro ao excluir a publicação.');
        }
    };

    const checkFollowing = (followerId: string, followingId: string) => {
        const followId = `${followerId}_${followingId}`;
        const followRef = doc(db, 'follows', followId);
        onSnapshot(followRef, (snapshot) => {
            setIsFollowing(snapshot.exists());
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
        });
    };

    const createNotification = async (recipientId: string, type: 'like' | 'comment' | 'follow', postId?: string, extraText?: string) => {
        if (!currentUser || currentUser.uid === recipientId) return;

        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Estudante',
                senderPhoto: currentUser.photoURL || '',
                type,
                postId: postId || null,
                message: extraText || (type === 'like' ? 'curtiu sua publicação' : 
                         type === 'comment' ? 'comentou na sua publicação' : 
                         'começou a te seguir'),
                createdAt: serverTimestamp(),
                read: false
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'notifications');
        }
    };

    const handlePopulateDemoProfile = async () => {
        if (!currentUser) {
            toast.error('Por favor, faça login para preencher seu perfil com dados de demonstração! 🚀');
            return;
        }

        const toastId = toast.loading("Sincronizando dados simulados de alto desempenho com o ENEM...");
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            
            // 1. Popula dados de perfil do usuário
            await setDoc(userRef, {
                displayName: "Giulia Silva",
                handle: "giuliasilva",
                bio: "Medibulanda obstinada! 🩺 Estudando incansavelmente para o ENEM, focada em Ciências da Natureza, Redação e Matemática. 'Seja mais forte que sua melhor desculpa.' 💪📖",
                photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                coverURL: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=1200",
                studentType: "vestibulando",
                studyGoal: "biologicas",
                studyTime: "Noite e Tarde",
                level: 4,
                xp: 3850,
                followersCount: 0,
                followingCount: 0,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 2. Cria posts de demonstração
            const postColl = collection(db, 'posts');
            
            // Post 1
            await addDoc(postColl, {
                authorId: currentUser.uid,
                authorName: "Giulia Silva",
                authorHandle: "giuliasilva",
                authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                content: "Foco total na revisão de Fisiologia Humana para o ENEM! Esse mapa mental salvou minha tarde de estudos hoje. 📝🩺 Vamos de aprovação!",
                mediaURL: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600",
                mediaType: "image",
                subject: "Biologia",
                likesCount: 48,
                commentsCount: 3,
                createdAt: serverTimestamp()
            });

            // Post 2
            await addDoc(postColl, {
                authorId: currentUser.uid,
                authorName: "Giulia Silva",
                authorHandle: "giuliasilva",
                authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                content: "Dica quente de Redação: No ENEM, lembre-se de que a proposta de intervenção não precisa resolver o problema por completo, mas deve dar os 5 elementos (Agente, Ação, Meio/Modo, Detalhamento, Efeito) para diminuir seu impacto social. Nota 1000 tá vindo! ✍️🦅",
                mediaURL: "",
                mediaType: "text",
                subject: "Redação",
                likesCount: 35,
                commentsCount: 2,
                createdAt: serverTimestamp()
            });

            // Post 3
            await addDoc(postColl, {
                authorId: currentUser.uid,
                authorName: "Giulia Silva",
                authorHandle: "giuliasilva",
                authorPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                content: "Aquele cappuccino de lei pra aguentar a rodada noturna de Simulados de Ciências da Natureza. O cansaço é real, mas o sonho é maior! ☕️🦉",
                mediaURL: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600",
                mediaType: "image",
                subject: "Geral",
                likesCount: 62,
                commentsCount: 4,
                createdAt: serverTimestamp()
            });

            // 3. Cria redações de demonstração
            const essaysColl = collection(db, 'essay_submissions');
            
            // Essay 1
            await addDoc(essaysColl, {
                userId: currentUser.uid,
                theme: "Caminhos para combater a intolerância religiosa no Brasil",
                score: 920,
                submissionMethod: "text",
                createdAt: serverTimestamp(),
                competencies: [
                    { score: 160, feedback: "Demonstra excelente domínio da modalidade escrita formal, com raros desvios gramaticais." },
                    { score: 200, feedback: "Compreendeu perfeitamente a proposta, aplicando conceitos filosóficos com repertório legitimado e produtivo de John Locke." },
                    { score: 160, feedback: "Apresenta um projeto de texto claro, defendendo seu ponto de vista com argumentos sólidos, embora haja pequenos trechos expositivos." },
                    { score: 200, feedback: "Articula as partes do texto de forma excelente, com repertório coesivo diversificado e uso correto de conectivos interparágrafos." },
                    { score: 200, feedback: "Proposta de intervenção completa, detalhando com precisão o agente governamental (Ministério da Educação) e o impacto social das ações." }
                ],
                evaluation: {
                    generalFeedback: "Parabéns, Giulia! Sua redação está excelente, demonstrando um ótimo repertório sociocultural e rigor formal. Atente-se apenas à seleção de alguns argumentos na C3 para evitar trechos puramente expositivos.",
                    strengths: ["Repertório de John Locke perfeitamente produtivo", "Conectivos de transição extremamente fluídos", "Proposta de intervenção nota máxima, contendo todos os 5 elementos"],
                    weaknesses: ["Leve desvio de concordância nominal no segundo parágrafo", "Aprofundamento de autoria poderia ser ligeiramente mais denso no D2"]
                }
            });

            // Essay 2
            await addDoc(essaysColl, {
                userId: currentUser.uid,
                theme: "Desafios para a valorização de comunidades e povos tradicionais",
                score: 960,
                submissionMethod: "text",
                createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
                competencies: [
                    { score: 200, feedback: "Domínio impecável da língua escrita padrão, sem desvios estruturais ou sintáticos." },
                    { score: 200, feedback: "Demonstra excelente repertório trazendo o conceito de 'Cidadãos de Papel' de Gilberto Dimenstein perfeitamente associado ao tema." },
                    { score: 160, feedback: "Construção de tese forte, mas com leve falta de detalhamento em um dos argumentos secundários." },
                    { score: 200, feedback: "Uso exemplar de recursos coesivos, com parágrafos bem delimitados e transições maduras." },
                    { score: 200, feedback: "Proposta de intervenção bem estruturada e viável, com agente, ação, modo, detalhamento e impacto exemplares." }
                ],
                evaluation: {
                    generalFeedback: "Excelente desempenho acadêmico! Você demonstrou maturidade de escrita e compreensão do eixo temático de minorias sociais no cenário nacional contemporâneo.",
                    strengths: ["Tese clara e marcante desde a introdução", "Vocabulário culto e excelente aplicação de Gilberto Dimenstein"],
                    weaknesses: ["O desenvolvimento 1 ficou um pouco mais longo que o desenvolvimento 2, gerando uma leve quebra visual de paralelismo"]
                }
            });

            // Essay 3
            await addDoc(essaysColl, {
                userId: currentUser.uid,
                theme: "O estigma associado às doenças mentais na sociedade brasileira",
                score: 880,
                submissionMethod: "upload",
                createdAt: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
                competencies: [
                    { score: 160, feedback: "Domínio satisfatório da modalidade formal, ocorrendo alguns truncamentos frasais na introdução." },
                    { score: 160, feedback: "Aborda o tema de forma direta, utilizando como repertório a obra de Machado de Assis (O Alienista), porém necessita articular melhor com a atualidade." },
                    { score: 160, feedback: "Argumentação consistente que comprova a tese, mas o projeto de texto poderia ser ligeiramente mais estratégico." },
                    { score: 200, feedback: "Coesão textual exemplar com conectivos variados e alta expressividade frasal." },
                    { score: 200, feedback: "Proposta detalhada e articulada adequadamente, contendo todos os cinco elementos estruturais do ENEM." }
                ],
                evaluation: {
                    generalFeedback: "Boa redação, evidenciando domínio satisfatório do tema. O uso da obra clássica agregou excelente valor, mas certifique-se de costurar o contexto ficcional com o problema real do Brasil atual na C2.",
                    strengths: ["Conectivos interparágrafos eficientes", "Excelente proposta de intervenção"],
                    weaknesses: ["Uso expositivo do repertório sociocultural sem a devida conexão argumentativa no D1"]
                }
            });

            // 4. Cria resultados de simulados de demonstração
            const simColl = collection(db, 'simulado_results');
            
            await addDoc(simColl, {
                userId: currentUser.uid,
                examTitle: "Ciências da Natureza - Nível Elite",
                category: "Ciências da Natureza",
                correctAnswers: 8,
                totalQuestions: 10,
                createdAt: serverTimestamp()
            });

            await addDoc(simColl, {
                userId: currentUser.uid,
                examTitle: "Matemática e suas Tecnologias",
                category: "Matemática",
                correctAnswers: 7,
                totalQuestions: 10,
                createdAt: new Date(Date.now() - 3600000 * 5)
            });

            await addDoc(simColl, {
                userId: currentUser.uid,
                examTitle: "Ciências Humanas e Sociais",
                category: "Ciências Humanas",
                correctAnswers: 9,
                totalQuestions: 10,
                createdAt: new Date(Date.now() - 3600000 * 25)
            });

            await addDoc(simColl, {
                userId: currentUser.uid,
                examTitle: "Linguagens, Códigos e suas Tecnologias",
                category: "Linguagens",
                correctAnswers: 8,
                totalQuestions: 10,
                createdAt: new Date(Date.now() - 3600000 * 48)
            });

            // Recarrega todos os dados localmente
            await loadUserProfile(currentUser.uid);
            loadUserPosts(currentUser.uid);
            loadUserEssays(currentUser.uid);
            loadUserSimulations(currentUser.uid);

            toast.success("Seu perfil foi totalmente alimentado com dados premium do ENEM! Divirta-se! 🔮✨", { id: toastId });
        } catch (error) {
            console.error("Erro ao popular perfil de demonstração:", error);
            handleFirestoreError(error, OperationType.WRITE, `populate_demo_profile`);
            toast.error("Erro ao popular perfil de demonstração. Verifique seu console.", { id: toastId });
        }
    };

    const handleFollow = async () => {
        if (!currentUser || !viewUid) {
            toast.error('Faça login para seguir outros estudantes! 🚀');
            return;
        }
        const followId = `${currentUser.uid}_${viewUid}`;
        const followRef = doc(db, 'follows', followId);
        const userRef = doc(db, 'users', currentUser.uid);
        const targetRef = doc(db, 'users', viewUid);

        try {
            if (isFollowing) {
                await deleteDoc(followRef);
                await updateDoc(userRef, { followingCount: increment(-1) });
                await updateDoc(targetRef, { followersCount: increment(-1) });
            } else {
                await setDoc(followRef, {
                    followerId: currentUser.uid,
                    followingId: viewUid,
                    createdAt: serverTimestamp()
                });
                await updateDoc(userRef, { 
                    followingCount: increment(1),
                    xp: increment(15)
                });
                await updateDoc(targetRef, { followersCount: increment(1) });
                toast.success('Seguindo novo estudante! +15 XP 🦅');

                // Create notification
                createNotification(viewUid, 'follow');
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
        }
    };

    const fetchFollowUsers = async (type: 'followers' | 'following') => {
        setFollowModalType(type);
        setLoadingFollows(true);
        setFollowModalUsers([]);
        
        try {
            const uidToQuery = displayUser.uid;
            let q;
            if (type === 'followers') {
                q = query(collection(db, 'follows'), where('followingId', '==', uidToQuery), limit(50));
            } else {
                q = query(collection(db, 'follows'), where('followerId', '==', uidToQuery), limit(50));
            }
            
            const snapshot = await getDocs(q);
            const userIds = snapshot.docs.map(doc => {
                 const data = doc.data() as { followerId: string, followingId: string };
                 return type === 'followers' ? data.followerId : data.followingId;
            });
            
            if (userIds.length > 0) {
                const userDocs = await Promise.all(userIds.map(id => getDoc(doc(db, 'users', id))));
                const users = userDocs.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() }));
                setFollowModalUsers(users);
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            toast.error(`Erro ao carregar lista. Tente novamente.`);
        } finally {
            setLoadingFollows(false);
        }
    };

    const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(event.target?.result as string);
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = () => {
                    resolve(event.target?.result as string);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handlePostFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (file) {
            const toastId = toast.loading(`Enviando ${type === 'image' ? 'foto' : 'vídeo'}...`);
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Falha no upload para o servidor.');
                }
                
                const resData = await response.json();
                if (type === 'image') {
                    setNewPostImage(resData.url);
                } else {
                    setNewPostVideo(resData.url);
                }
                toast.success(`${type === 'image' ? 'Foto' : 'Vídeo'} carregada com sucesso!`, { id: toastId });
            } catch (err: any) {
                console.warn("API de upload do post falhou, tentando compressão local base64:", err);
                if (type === 'image') {
                    try {
                        const compressedBase64 = await compressImage(file, 800, 800);
                        setNewPostImage(compressedBase64);
                        toast.success("Foto carregada localmente com sucesso! ✨", { id: toastId });
                    } catch (fallbackErr) {
                        console.error("Ambas as tentativas de post-upload falharam:", fallbackErr);
                        toast.error("Erro ao carregar arquivo. Tente novamente.", { id: toastId });
                    }
                } else {
                    toast.error("Erro ao carregar arquivo. Tente novamente.", { id: toastId });
                }
            }
        }
    };

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
        setPosts(prev => prev.map(p => 
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

                // Create notification
                try {
                    const postSnap = await getDoc(postRef);
                    if (postSnap.exists()) {
                        const postData = postSnap.data();
                        if (postData.authorId !== currentUser.uid) {
                            createNotification(postData.authorId, 'like', postId);
                        }
                    }
                } catch (error) {
                    console.error("Error creating notification:", error);
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
            setPosts(prev => prev.map(p => 
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

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsSaving(true);
        const toastId = toast.loading("Salvando alterações...");

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            
            // Filtra o payload para evitar campos undefined que podem quebrar o Firestore
            const updatePayload: any = {};
            if (editData.displayName !== undefined) updatePayload.displayName = editData.displayName;
            if (editData.email !== undefined) updatePayload.email = editData.email;
            if (editData.handle !== undefined) updatePayload.handle = editData.handle;
            if (editData.avatarURL !== undefined) {
                updatePayload.photoURL = editData.avatarURL;
                updatePayload.avatarEdited = editData.avatarURL !== '';
            }
            if (editData.coverURL !== undefined) updatePayload.coverURL = editData.coverURL;
            if (editData.bio !== undefined) updatePayload.bio = editData.bio;
            if (editData.studentType !== undefined) updatePayload.studentType = editData.studentType;
            if (editData.studyTime !== undefined) updatePayload.studyTime = editData.studyTime;
            if (editData.studyGoal !== undefined) updatePayload.studyGoal = editData.studyGoal;
            
            updatePayload.updatedAt = serverTimestamp();

            console.log("Tentando atualizar perfil com payload:", updatePayload);
            
            // Usando setDoc com merge: true é mais robusto que updateDoc caso o documento ainda não exista
            await setDoc(userRef, updatePayload, { merge: true });

            // Update Auth Profile (skip photoURL if it's a long base64 string)
            const authUpdate: { displayName?: string; photoURL?: string } = {
                displayName: editData.displayName
            };

            // Firebase Auth photoURL has a limit (approx 2048 chars). 
            // Base64 images easily exceed this. We only update Auth photoURL if it's a real URL.
            if (editData.avatarURL && !editData.avatarURL.startsWith('data:') && editData.avatarURL.length < 2000) {
                authUpdate.photoURL = editData.avatarURL;
            }

            await updateProfile(currentUser, authUpdate);

            if (editData.email !== currentUser.email) {
                try {
                    await updateEmail(currentUser, editData.email);
                } catch (emailError: any) {
                    if (emailError.code === 'auth/requires-recent-login') {
                        toast.error("Para alterar o e-mail, você precisa ter feito login recentemente. O e-mail foi salvo apenas no seu perfil público.", { id: toastId });
                    }
                }
            }

            handleCloseEditing();
            await loadUserProfile(currentUser.uid);
            toast.success("Perfil atualizado com sucesso! ✨", { id: toastId });
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            toast.error("Erro ao salvar alterações. Tente novamente.", { id: toastId });
            handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarURL' | 'coverURL') => {
        const file = e.target.files?.[0];
        if (file) {
            const toastId = toast.loading(`Enviando imagem de ${field === 'avatarURL' ? 'perfil' : 'capa'}...`);
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Falha no upload para o servidor.');
                }
                
                const resData = await response.json();
                setEditData(prev => ({ ...prev, [field]: resData.url }));
                toast.success("Imagem carregada com sucesso!", { id: toastId });
            } catch (err: any) {
                console.warn("API de upload do perfil falhou, tentando compressão local base64:", err);
                try {
                    const maxWidth = field === 'avatarURL' ? 400 : 1200;
                    const maxHeight = field === 'avatarURL' ? 400 : 600;
                    const compressedBase64 = await compressImage(file, maxWidth, maxHeight);
                    
                    setEditData(prev => ({ ...prev, [field]: compressedBase64 }));
                    toast.success("Imagem carregada localmente com sucesso! ✨", { id: toastId });
                } catch (fallbackErr) {
                    console.error("Ambas as tentativas de upload do perfil falharam:", fallbackErr);
                    toast.error(`Erro: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`, { id: toastId });
                }
            }
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    };

    const getRarityLabel = (rarity: string) => {
        return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    };

    const handleSendComment = async (postId: string, text: string) => {
        if (!currentUser || !text.trim()) return;

        const temporaryId = `temp_${Date.now()}`;
        const newComment: any = {
            id: temporaryId,
            authorId: currentUser.uid,
            authorName: currentUserProfile?.displayName || currentUser.displayName || 'Estudante',
            authorHandle: currentUserProfile?.handle || currentUser.email?.split('@')[0] || 'estudante',
            authorPhoto: currentUserProfile?.photoURL || currentUser.photoURL || '',
            text: text,
            createdAt: new Date()
        };

        // Optimistic UI updates
        setPostComments(prev => [...prev, newComment]);
        setPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } 
                : p
        ));
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
        }

        try {
            await addDoc(collection(db, 'posts', postId, 'comments'), {
                authorId: newComment.authorId,
                authorName: newComment.authorName,
                authorHandle: newComment.authorHandle,
                authorPhoto: newComment.authorPhoto,
                text: newComment.text,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'posts', postId), {
                commentsCount: increment(1)
            });
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { xp: increment(10) });
            toast.success('Comentário enviado! +10 XP obtidos. 💬');

            // Create notification
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const postData = postSnap.data();
                if (postData.authorId !== currentUser.uid) {
                    createNotification(postData.authorId, 'comment', postId, `comentou: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
                }
            }
        } catch (error) {
            // Revert on error
            setPostComments(prev => prev.filter(c => c.id !== temporaryId));
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, commentsCount: (p.commentsCount || 0) - 1 } 
                    : p
            ));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) - 1 } : null);
            }
            handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
        }
    };

    const openPostModal = (post: any) => {
        setSelectedPost(post);
        // Load real-time comments
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostComments(commentList);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/comments`);
        });
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!currentUser) return;

        const deletedComment = postComments.find(c => c.id === commentId);
        if (!deletedComment) return;

        // Optimistic UI updates
        setPostComments(prev => prev.filter(c => c.id !== commentId));
        setPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } 
                : p
        ));
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - 1) } : null);
        }

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await deleteDoc(commentRef);
            
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                commentsCount: increment(-1)
            });
        } catch (error: any) {
            // Revert changes on error
            setPostComments(prev => [...prev, deletedComment]);
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } 
                    : p
            ));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
            }
            
            handleFirestoreError(error, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
            toast.error('Erro ao excluir comentário');
        }
    };

    const handleShareProfile = () => {
        const shareUrl = window.location.href;
        setShareData({
            url: shareUrl,
            title: `VestApp - Perfil de ${targetUser?.displayName}`,
            text: `Confira o perfil de ${targetUser?.displayName} no VestApp!`,
        });
        setIsShareModalOpen(true);
    };

    return (
        <Layout>
            <div id="profile-container" className="w-full px-2 sm:px-4 lg:px-6 py-4">
                    {showOnboarding && (
                <OnboardingQuiz onComplete={(userData) => {
                    setShowOnboarding(false);
                    setTargetUser(userData);
                    setEditData({
                        displayName: userData.displayName || '',
                        email: userData.email || '',
                        handle: userData.handle || '',
                        avatarURL: userData.photoURL || '',
                        coverURL: userData.coverURL || '',
                        bio: userData.bio || '',
                        studentType: userData.studentType || '',
                        studyTime: userData.studyTime || '',
                        studyGoal: userData.studyGoal || ''
                    });
                }} />
            )}
            {/* Floating Feathers Background */}
            <div className="floating-feathers" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {[...Array(15)].map((_, i) => (
                    <div 
                        key={i} 
                        className="feather" 
                        style={{ 
                            left: `${Math.random() * 100}vw`, 
                            animationDelay: `${Math.random() * 20}s`,
                            fontSize: `${15 + Math.random() * 20}px`
                        }}
                    >
                        🪶
                    </div>
                ))}
            </div>
            <div className="profile-viewport" style={{ position: 'relative', zIndex: 1, paddingTop: 0 }}>
                <section className="hero-section">
                    <div className="hero-overlay"></div>
                    {displayUser.coverURL ? (
                        <img src={displayUser.coverURL} className="hero-img" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="hero-img w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 border-b border-white/10 opacity-70" />
                    )}
                </section>
                
                <div className="profile-summary flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 px-4 sm:px-10 pb-10" style={{ position: 'relative', zIndex: 5 }}>
                        <div className="avatar-container shrink-0">
                            <div className={`avatar-glow ${displayUser.handle?.toLowerCase() === 'vestapp' ? 'ring-4 ring-amber-500 ring-offset-4 ring-offset-zinc-950 animate-pulse' : ''}`}>
                                <UserAvatar 
                                    uid={displayUser.uid}
                                    fallbackPhoto={displayUser.photoURL || ""}
                                    fallbackName={displayUser.displayName || "Estudante"}
                                    size="100%"
                                    className="user-avatar"
                                />
                            </div>
                            <div className="level-badge" style={{ background: displayUser.handle?.toLowerCase() === 'vestapp' ? 'linear-gradient(45deg, #f59e0b, #ef4444)' : 'var(--accent-1)', color: displayUser.handle?.toLowerCase() === 'vestapp' ? 'white' : (lightThemeColor === '#fff461' ? '#1c1917' : 'white'), fontWeight: 950 }}>LVL {displayUser.level}</div>
                        </div>
                        <div className="user-meta flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start pb-2">
                            <h1 className="profile-name text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                {displayUser.displayName}
                                {(() => {
                                    const h = (displayUser.handle || '').toLowerCase().trim();
                                    if (h === 'vestapp') {
                                        return (
                                            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-xs px-3 py-1 rounded-full text-white font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/25 animate-pulse uppercase tracking-wider select-none">
                                                <Crown size={14} className="fill-white" /> Mascote Oficial
                                            </span>
                                        );
                                    }
                                    let badgeColor = 'var(--accent-1)';
                                    let isVerified = displayUser.isVerified;
                                    
                                    if (h === '_giu.conti') {
                                        badgeColor = '#fbbf24'; // Yellow
                                        isVerified = true;
                                    } else if (h === 'victordossantos2103') {
                                        badgeColor = '#3b82f6'; // Blue
                                        isVerified = true;
                                    } else if (h === 'giulia') {
                                        badgeColor = '#10b981'; // Green
                                        isVerified = true;
                                    } else if (h === 'dnuneskkj') {
                                        badgeColor = '#ec4899'; // Pink
                                        isVerified = true;
                                    }
                                    
                                    if (isVerified) {
                                        return <CheckCircle size={22} className="verify" style={{ display: 'inline', color: badgeColor, marginLeft: '6px' }} />;
                                    }
                                    return null;
                                })()}
                            </h1>
                            <p className="user-handle text-zinc-400 text-base font-bold">@{displayUser.handle}</p>
                            
                            {/* Rich fully-formed social statistics with ZERO empty spaces/holes */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 mb-1 text-xs select-none">
                                <span 
                                    className="px-2.5 py-1 bg-white/5 border border-white/5 text-[var(--text-secondary)] rounded-full font-bold cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => fetchFollowUsers('followers')}
                                >
                                    <strong className="text-white mr-1">{displayUser.followersCount}</strong> Seguidores
                                </span>
                                <span 
                                    className="px-2.5 py-1 bg-white/5 border border-white/5 text-[var(--text-secondary)] rounded-full font-bold cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => fetchFollowUsers('following')}
                                >
                                    <strong className="text-white mr-1">{displayUser.followingCount}</strong> Seguindo
                                </span>
                                <span className="px-2.5 py-1 bg-white/5 border border-white/5 text-[var(--text-secondary)] rounded-full font-bold uppercase tracking-wider text-[10px]">
                                    {displayUser.studentType}
                                </span>
                            </div>

                            <div className="xp-status w-full mt-3" style={{ maxWidth: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={12} fill="var(--accent-1)" className="text-accent-1" /> NÍVEL DE XP</span>
                                    <span>{displayUser.xp % 1000} / 1000 XP <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>(Total: {displayUser.xp})</span></span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', padding: '1px' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, ((displayUser.xp % 1000) / 1000) * 100)}%` }}
                                        style={{ height: '100%', background: 'linear-gradient(to right, var(--accent-1), var(--accent-2))', borderRadius: '10px', boxShadow: '0 0 10px rgba(255,107,0,0.3)' }}
                                    ></motion.div>
                                </div>
                            </div>
                        </div>
                        <div className="actions w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-3 pb-3 md:pb-5">
                            {(!viewUid || viewUid === currentUser?.uid) ? (
                                <>
                                    <button 
                                        className="btn-main font-black"
                                        onClick={() => setShowPostModal(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', color: lightThemeColor === '#fff461' ? '#1c1917' : 'white' }}
                                    >
                                        <Plus size={18} />
                                        <span>Publicar</span>
                                    </button>
                                    <button 
                                        className="btn-main font-black"
                                        onClick={() => setIsEditing(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', color: lightThemeColor === '#fff461' ? '#1c1917' : 'white' }}
                                    >
                                        <Feather size={18} />
                                        <span>Editar Perfil</span>
                                    </button>
                                    <button 
                                        className="btn-share" 
                                        onClick={toggleTheme} 
                                        title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
                                    >
                                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                    </button>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${theme === 'light' ? 'bg-black/5 hover:bg-black/10 border-glass-border/40' : 'bg-white/5 hover:bg-white/10 border-white/10'} rounded-full border transition-all mr-1 duration-200`} style={{ pointerEvents: 'auto', display: 'inline-flex', flexDirection: 'row', alignItems: 'center', height: '40px' }}>
                                        {[
                                            { id: 'default', color: '#3b82f6', name: 'Azul Real' },
                                            { id: '#fc77b2', color: '#fc77b2', name: 'Rosa Doce' },
                                            { id: '#00bef2', color: '#00bef2', name: 'Azul Piscina' },
                                            { id: '#fff461', color: '#fff461', name: 'Amarelo Sol' },
                                            { id: '#36ae68', color: '#36ae68', name: 'Verde Folha' },
                                        ].map((item) => {
                                            const isSelected = lightThemeColor === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => changeLightThemeColor(item.id)}
                                                    title={`Tema: ${item.name}`}
                                                    className="w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95"
                                                    style={{ 
                                                        backgroundColor: item.color, 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        borderRadius: '50%', 
                                                        border: isSelected 
                                                            ? (theme === 'light' ? '2px solid #0f172a' : '2px solid #ffffff') 
                                                            : (theme === 'light' ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.2)'),
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: 0
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ width: '6px', height: '6px', backgroundColor: theme === 'light' ? '#0f172a' : '#ffffff', borderRadius: '50%' }}></div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button className="btn-share" onClick={handleShareProfile} title="Compartilhar Perfil">
                                        <Share2 size={20} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className={`btn-follow ${isFollowing ? 'following' : ''}`} onClick={handleFollow}>
                                        {isFollowing ? 'Seguindo' : 'Seguir'}
                                    </button>
                                    <button className="btn-share" onClick={handleShareProfile} title="Compartilhar">
                                        <Share2 size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                {isEditing && (
                    <div id="edit-profile-modal" className="modal" style={{ display: 'flex' }}>
                        <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>
                                    {isAutoEdit ? (
                                        <>
                                            Complete seu Perfil! 🚀 <br />
                                            <small style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 1 }}>
                                                Personalize como os outros te veem no VestApp
                                            </small>
                                        </>
                                    ) : (
                                        'Editar Perfil'
                                    )}
                                </h3>
                                <X size={24} onClick={handleCloseEditing} style={{ cursor: 'pointer' }} />
                            </div>
                            
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="edit-images-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="edit-cover-container" style={{ position: 'relative', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                                        {editData.coverURL ? (
                                            <img 
                                                src={editData.coverURL} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
                                                alt="Cover Preview"
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom right, #312e81, #0f172a, #09090b)', opacity: 0.6 }} />
                                        )}
                                        <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.3)' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <CalendarPlus size={24} />
                                                <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Alterar Capa</p>
                                            </div>
                                            <input type="file" accept="image/*" hidden onChange={(e) => handleProfileFileChange(e, 'coverURL')} />
                                        </label>
                                    </div>

                                    <div className="edit-avatar-container" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '-40px', paddingLeft: '20px' }}>
                                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-main)', overflow: 'hidden', background: '#000' }}>
                                            <UserAvatar 
                                                uid={currentUser?.uid || "guest"}
                                                fallbackPhoto={editData.avatarURL || ""}
                                                size="100%"
                                                className="object-cover"
                                                style={{ opacity: 0.8 }}
                                            />
                                            <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.3)' }}>
                                                <CalendarPlus size={20} />
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleProfileFileChange(e, 'avatarURL')} />
                                            </label>
                                        </div>
                                        <div style={{ marginTop: '40px' }}>
                                            <h4 style={{ margin: 0 }}>Foto de Perfil</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Recomendado: 400x400px</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nome de Exibição</label>
                                        <input 
                                            type="text" 
                                            value={editData.displayName}
                                            onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600 }}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Handle (@)</label>
                                        <input 
                                            type="text" 
                                            value={editData.handle}
                                            onChange={(e) => setEditData({...editData, handle: e.target.value})}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600 }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>E-mail</label>
                                    <input 
                                        type="email" 
                                        value={editData.email}
                                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bio (Legenda)</label>
                                    <textarea 
                                        value={editData.bio}
                                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600, minHeight: '100px', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Foco de Estudo</label>
                                        <select 
                                            value={editData.studyGoal}
                                            onChange={(e) => setEditData({...editData, studyGoal: e.target.value})}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="exatas">Exatas</option>
                                            <option value="humanas">Humanas</option>
                                            <option value="linguagens">Linguagens</option>
                                            <option value="biologicas">Biológicas</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipo de Estudante</label>
                                        <select 
                                            value={editData.studentType}
                                            onChange={(e) => setEditData({...editData, studentType: e.target.value})}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="vestibulando">Vestibulando</option>
                                            <option value="concurseiro">Concurseiro</option>
                                            <option value="universitario">Universitário</option>
                                            <option value="curioso">Autodidata</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" className="btn-follow following" style={{ flex: 1 }} onClick={handleCloseEditing} disabled={isSaving}>Cancelar</button>
                                    <button type="submit" className="btn-follow" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isSaving}>
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <section className="profile-grid">
                    <aside className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {displayUser.handle?.toLowerCase() === 'vestapp' && (
                            <div className="bento-card border-2 border-amber-500/30" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ padding: '8px', background: 'linear-gradient(45deg, #f59e0b, #ef4444)', borderRadius: '12px', color: 'white' }}>
                                        <Crown size={20} className="fill-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white" style={{ margin: 0, lineHeight: 1 }}>Mural do VestApp</h3>
                                        <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">Mascote Oficial & Hub de Atualizações</span>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed font-bold mb-4">
                                    Olá, futuro aprovado! Sou o mascote oficial. Aqui você confere dicas exclusivas, atualizações do sistema e lembretes importantes para o Enem!
                                </p>

                                {/* Interactive Mascot Tips Accordion */}
                                <div className="space-y-2 mb-4">
                                    <div className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1 select-none">💡 Dicas do Mascotinho:</div>
                                    {[
                                        {
                                            title: "Ciclo de Estudo 50/10",
                                            desc: "Estude focado por 50 minutos seguidos sem distrações virtuais, e descanse 10. Durante a pausa, se alongue e beba água para manter o cérebro altamente produtivo! 🧠"
                                        },
                                        {
                                            title: "A Técnica da Redação Semanal",
                                            desc: "Mantenha o ritmo de 1 redação por semana. Use nosso Corretor com IA para obter sua nota instantaneamente e focar nas competências que precisam de atenção. 📝"
                                        },
                                        {
                                            title: "Caderno de Erros Eficaz",
                                            desc: "Sempre que errar uma questão em simulado, anote a matéria e faça um resumo do motivo do erro. Revisar o que errou é o mapa da aprovação em Medicina! 🎯"
                                        }
                                    ].map((tip, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setActiveMascotTip(idx === activeMascotTip ? null : idx)}
                                            className="p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer transition-all text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-white">{tip.title}</span>
                                                <span className="text-xs text-amber-500 font-black">{activeMascotTip === idx ? "▼" : "▶"}</span>
                                            </div>
                                            {activeMascotTip === idx && (
                                                <p className="text-xs text-zinc-300 font-bold mt-2 leading-relaxed border-t border-white/5 pt-2">
                                                    {tip.desc}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Official Info / Updates Section */}
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-left mb-2">
                                    <div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-sans">
                                        <Feather size={12} className="text-accent-1" /> Avisos & Novidades:
                                    </div>
                                    <ul className="space-y-2.5 text-xs font-bold text-zinc-300">
                                        <li className="flex items-start gap-2 leading-relaxed">
                                            <span style={{ color: 'var(--accent-1)' }}>•</span>
                                            <span><b>Novo Recurso:</b> Agora você pode marcar seus colegas de sala digitando <b>@handle</b> nos comentários e postagens do feed!</span>
                                        </li>
                                        <li className="flex items-start gap-2 leading-relaxed">
                                            <span style={{ color: 'var(--accent-1)' }}>•</span>
                                            <span><b>Salas de Estudo:</b> Acompanhe quem está ativo na barra lateral direita para estudar em grupo.</span>
                                        </li>
                                        <li className="flex items-start gap-2 leading-relaxed">
                                            <span style={{ color: 'var(--accent-1)' }}>•</span>
                                            <span><b>Lembrete do Enem 2026:</b> O cronograma de simulados já está ativo. Ganhe XP resolvendo desafios na aba simulados.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="bento-card">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                                <BookOpen size={22} className="text-accent-1" /> Sobre
                            </h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] font-semibold">
                                {displayUser.bio}
                            </p>
                            <div className="mt-6 pt-6 border-t border-[var(--glass-border)] flex flex-col gap-3">
                                {displayUser.studentType && (
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
                                        <div className="p-2 bg-accent-1/10 rounded-lg text-accent-1">
                                            <Users size={16} />
                                        </div>
                                        <span className="capitalize">{displayUser.studentType}</span>
                                    </div>
                                )}
                                {displayUser.studyGoal && (
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
                                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                                            <GraduationCap size={16} />
                                        </div>
                                        <span className="capitalize">Estudando {displayUser.studyGoal}</span>
                                    </div>
                                )}
                                {displayUser.studyTime && (
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                            <Clock size={16} />
                                        </div>
                                        <span className="capitalize">Frequência: {displayUser.studyTime}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Calendar size={16} />
                                    </div>
                                    <span>Entrou em {(displayUser.createdAt as any)?.toDate ? (displayUser.createdAt as any).toDate().toLocaleDateString('pt-BR') : 'Fevereiro de 2026'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bento-card">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)] uppercase italic tracking-tighter">
                                <TrendingUp size={22} className="text-accent-1" /> Desempenho
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="stats-grid-item bg-accent-1/5 border border-accent-1/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-white italic">{displaySimulations.length}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Simulados</span>
                                    </div>
                                    <div className="stats-grid-item bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-white italic">{displayUser.level}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nível</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('desempenho')} 
                                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-accent-1 to-accent-2 hover:brightness-110 text-white border border-accent-1/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg group italic"
                                >
                                    Abrir Painel de Mérito
                                </button>
                            </div>
                        </div>

                        {/* --- NEW BEAUTIFIED DYNAMIC SIDEBAR BENTO-CARD --- */}
                        <div className="bento-card">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                                <Award size={22} className="text-pink-500" /> Insígnias de Mérito
                            </h3>
                            <div className="space-y-3">
                                {achievements.slice(0, 3).map((ach) => {
                                    const isUnlocked = ach.status === 'unlocked';
                                    return (
                                        <div 
                                            key={ach.id} 
                                            onClick={() => setActiveTab('desempenho')}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                isUnlocked 
                                                    ? 'bg-gradient-to-br from-accent-1/10 to-accent-2/10 border-accent-1/20 hover:border-accent-1/45 shadow-sm' 
                                                    : 'bg-white/5 border-white/5 opacity-75 hover:opacity-100 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                                isUnlocked 
                                                    ? 'bg-gradient-to-tr from-accent-1 to-accent-2 text-white border-accent-2 shadow-[0_0_10px_rgba(255,107,0,0.3)]' 
                                                    : 'bg-bg-main text-slate-500 border-white/5'
                                            }`}>
                                                {React.cloneElement(ach.icon as any, { size: 16 })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{ach.title}</h4>
                                                    {isUnlocked ? (
                                                        <span className="text-[9px] font-black uppercase text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">Unlck</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-500">{ach.progress}/{ach.total}</span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-[var(--text-secondary)] leading-none truncate mt-0.5">{ach.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </aside>

                    <div className="feed-column flex flex-col gap-8">
                        <div className="flex justify-center w-full sticky top-4 z-10">
                            <nav className="tabs-nav-modern">
                                <button 
                                    className={`tab-btn-modern ${activeTab === 'publicacoes' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('publicacoes')}
                                >
                                    <LayoutGrid size={18} />
                                    <span className="hidden sm:inline">Posts</span>
                                </button>
                                <button 
                                    className={`tab-btn-modern ${activeTab === 'reposts' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('reposts')}
                                >
                                    <Repeat size={18} />
                                    <span className="hidden sm:inline">Reposts</span>
                                </button>
                                <button 
                                    className={`tab-btn-modern ${activeTab === 'desempenho' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('desempenho')}
                                >
                                    <BarChart3 size={18} />
                                    <span className="hidden sm:inline">Desempenho</span>
                                </button>
                                <button 
                                    className={`tab-btn-modern ${activeTab === 'cronograma-ia' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('cronograma-ia')}
                                >
                                    <Rocket size={18} />
                                    <span className="hidden sm:inline">IA</span>
                                </button>
                            </nav>
                        </div>


                        {activeTab === 'publicacoes' && (
                            <div className="tab-content active">
                                {displayPosts.filter(p => p.type !== 'repost').length === 0 ? (
                                    <div className="empty-feed-deck space-y-6" style={{ marginTop: '10px' }}>
                                        {/* Beautiful Hero Card of Empty State */}
                                        <div className="relative p-10 bg-gradient-to-br from-bg-secondary via-accent-1/5 to-accent-2/5 border border-[var(--glass-border)] rounded-[32px] overflow-hidden text-center space-y-4 shadow-xl">
                                            <div className="absolute top-0 right-0 w-60 h-60 bg-accent-1/5 rounded-full blur-[80px]" />
                                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/5 rounded-full blur-[60px]" />
                                            
                                            <div className="relative z-10 space-y-4">
                                                <div className="w-16 h-16 bg-accent-1/10 text-accent-1 rounded-[24px] flex items-center justify-center mx-auto border border-accent-1/20 animate-pulse">
                                                    <Sparkles size={32} />
                                                </div>
                                                <div className="max-w-md mx-auto space-y-2">
                                                    <h4 className="text-2xl font-black text-[var(--text-primary)] leading-tight italic uppercase tracking-tight">QG de Estudos do Vestibulando</h4>
                                                    <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
                                                        Este perfil ainda está intocado. Compartilhe suas fotos de caderno, resumos, metas batidas ou aproveite as nossas ferramentas premium de evolução acadêmica abaixo!
                                                    </p>
                                                </div>
                                                {(!viewUid || viewUid === currentUser?.uid) && (
                                                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                                                        <button 
                                                            onClick={() => setShowPostModal(true)}
                                                            className="btn-main font-black inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-1)] hover:bg-[var(--accent-2)] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                                        >
                                                            <Plus size={16} /> Compartilhar Primeiro Registro
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Links Hub / "Mais Coisinhas" Grid to occupy screen space elegantly */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bento-card hover:translate-y-[-2px] transition-all p-6 space-y-4 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center border border-pink-500/20 shadow-md">
                                                        <BookOpen size={24} />
                                                    </div>
                                                    <h5 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">Redação ENEM Nota 1000 AI</h5>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        Escreva e envie redações baseadas em eixos temáticos com avaliação baseada nas 5 competências oficiais do ENEM.
                                                    </p>
                                                </div>
                                                <Link to="/redacao" className="w-full text-center py-3 px-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-pink-500/20">
                                                    Ir para Redações
                                                </Link>
                                            </div>

                                            <div className="bento-card hover:translate-y-[-2px] transition-all p-6 space-y-4 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 bg-accent-1/10 text-accent-1 rounded-2xl flex items-center justify-center border border-accent-1/20 shadow-md">
                                                        <Trophy size={24} />
                                                    </div>
                                                    <h5 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">Simulado Realista de Questões</h5>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        Pratique simulados personalizados divididos por áreas do conhecimento e filtre por nível de dificuldade.
                                                    </p>
                                                </div>
                                                <Link to="/simulado" className="w-full text-center py-3 px-4 bg-accent-1/10 hover:bg-accent-1/20 text-accent-1 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-accent-1/20">
                                                    Iniciar Simulado
                                                </Link>
                                            </div>

                                            <div className="bento-card hover:translate-y-[-2px] transition-all p-6 space-y-4 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-md">
                                                        <Sparkles size={24} />
                                                    </div>
                                                    <h5 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">Desafios de Estações</h5>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        Participe dos desafios rápidos diários das estações temáticas da nossa comunidade do vestibular.
                                                    </p>
                                                </div>
                                                <Link to="/desafios" className="w-full text-center py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-emerald-500/20">
                                                    Ver Desafios Diários
                                                </Link>
                                            </div>

                                            <div className="bento-card hover:translate-y-[-2px] transition-all p-6 space-y-4 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-md">
                                                        <Clock size={24} />
                                                    </div>
                                                    <h5 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">Cronograma Inteligente</h5>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        Programe seus horários semanais e tenha seu plano personalizado sugerido automaticamente por IA.
                                                    </p>
                                                </div>
                                                <Link to="/schedule" className="w-full text-center py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-amber-500/20">
                                                    Abrir Cronograma
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Toggle View Mode for Posts */}
                                        <div className="flex justify-end items-center gap-2 pb-2 border-b border-white/5">
                                            <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mr-2">Visualização:</span>
                                            <div className="flex p-0.5 bg-bg-main rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setPostDisplayMode('list')}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${postDisplayMode === 'list' ? 'bg-accent-1 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    <List size={12} />
                                                    Lista
                                                </button>
                                                <button
                                                    onClick={() => setPostDisplayMode('grid')}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${postDisplayMode === 'grid' ? 'bg-accent-1 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    <LayoutGrid size={12} />
                                                    Grade
                                                </button>
                                            </div>
                                        </div>

                                        {postDisplayMode === 'grid' ? (
                                            <div className="insta-grid" style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                                gap: '4px',
                                                marginTop: '10px'
                                            }}>
                                                {displayPosts.filter(p => p.type !== 'repost').map(post => (
                                                    <div 
                                                        key={post.id} 
                                                        className="grid-item" 
                                                        onClick={() => openPostModal(post)}
                                                        style={{ 
                                                            aspectRatio: '1/1', 
                                                            position: 'relative', 
                                                            cursor: 'pointer',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {post.imageURL || post.videoURL || (post.imageURLs && post.imageURLs[0]) || (post.videoURLs && post.videoURLs[0]) ? (
                                                            <img 
                                                                src={post.imageURL || post.videoURL || (post.imageURLs && post.imageURLs[0]) || (post.videoURLs && post.videoURLs[0])} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                referrerPolicy="no-referrer" 
                                                            />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', padding: '10px', textAlign: 'center' }}>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                    {post.content}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="item-overlay" style={{ 
                                                            position: 'absolute', 
                                                            inset: 0, 
                                                            background: 'rgba(0,0,0,0.5)', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: '15px',
                                                            opacity: 0,
                                                            transition: '0.2s',
                                                            backdropFilter: 'blur(4px)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 900, color: 'white' }}><Heart size={18} fill="white" /> {formatNumber(post.likesCount || 0)}</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 900, color: 'white' }}><MessageSquare size={18} fill="white" /> {formatNumber(post.commentsCount || 0)}</span>
                                                        </div>
                                                        {(post.mediaType === 'video' || post.type === 'video' || post.videoURL) && (
                                                            <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white' }}>
                                                                <Clapperboard size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-6">
                                                {displayPosts.filter(p => p.type !== 'repost').map(post => (
                                                    <div key={post.id} className="bento-card p-6 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar uid={post.authorId} className="w-10 h-10 rounded-xl" />
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h5 className="text-sm font-black text-[var(--text-primary)]">{post.authorName}</h5>
                                                                        {post.authorHandle === 'vestapp' && (
                                                                            <span className="bg-blue-500 text-white rounded-full p-0.5">
                                                                                <CheckCircle size={8} />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">@{post.authorHandle} • Postado em {formatDate(post.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">
                                                            {post.content}
                                                        </p>

                                                        {(post.imageURL || post.videoURL || (post.imageURLs && post.imageURLs.length > 0) || (post.videoURLs && post.videoURLs.length > 0)) && (
                                                            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/10">
                                                                {(post.imageURL || (post.imageURLs && post.imageURLs[0])) && (
                                                                    <img src={post.imageURL || post.imageURLs[0]} className="w-full h-auto max-h-[500px] object-cover" />
                                                                )}
                                                                {(post.videoURL || (post.videoURLs && post.videoURLs[0])) && !post.imageURL && !(post.imageURLs && post.imageURLs[0]) && (
                                                                    <div className="bg-black/50 p-10 flex items-center justify-center relative">
                                                                        <Clapperboard size={40} className="opacity-50 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-6 pt-4 border-t border-white/5 text-[var(--text-secondary)]">
                                                            <button className="flex items-center gap-2 hover:text-rose-500 transition-colors text-xs font-bold">
                                                                <Heart size={16} />
                                                                <span>{formatNumber(post.likesCount || 0)}</span>
                                                            </button>
                                                            <button onClick={() => openPostModal(post)} className="flex items-center gap-2 hover:text-accent-1 transition-colors text-xs font-bold">
                                                                <MessageSquare size={16} />
                                                                <span>{formatNumber(post.commentsCount || 0)}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reposts' && (
                            <div className="tab-content active animate-fade-in space-y-6">
                                {displayPosts.filter(p => p.type === 'repost').length === 0 ? (
                                    <div className="empty-feed-deck text-center py-20 bg-bg-secondary/20 border border-white/5 rounded-[32px] space-y-4">
                                        <div className="w-16 h-16 bg-accent-1/10 text-accent-1 rounded-[24px] flex items-center justify-center mx-auto border border-accent-1/20">
                                            <Repeat size={32} />
                                        </div>
                                        <div className="max-w-xs mx-auto">
                                            <h4 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Sem republicações</h4>
                                            <p className="text-sm text-[var(--text-secondary)] font-medium">As publicações que você repostar do seu feed aparecerão organizadas aqui.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {displayPosts.filter(p => p.type === 'repost').map(post => (
                                            <div key={post.id} className="bento-card p-0 overflow-hidden border-accent-1/10">
                                                <div className="p-4 border-b border-white/5 bg-accent-1/5 flex items-center gap-2">
                                                    <Repeat size={14} className="text-accent-1" />
                                                    <span className="text-[10px] font-black text-accent-1 uppercase tracking-widest leading-none">Você Republicou</span>
                                                </div>
                                                <div 
                                                    className="p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                                    onClick={() => openPostModal(post)}
                                                >
                                                    {post.originalPost ? (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <UserAvatar uid={post.originalPost.authorId} className="w-10 h-10 rounded-xl" />
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h5 className="text-sm font-black text-[var(--text-primary)]">{post.originalPost.authorName}</h5>
                                                                        {post.originalPost.authorHandle === 'vestapp' && (
                                                                            <span className="bg-blue-500 text-white rounded-full p-0.5">
                                                                                <CheckCircle size={8} />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">@{post.originalPost.authorHandle} • Postado em {formatDate(post.originalPost.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">
                                                                {post.originalPost.content}
                                                            </p>
                                                            {(post.originalPost.imageURL || post.originalPost.videoURL || (post.originalPost.imageURLs && post.originalPost.imageURLs.length > 0) || (post.originalPost.videoURLs && post.originalPost.videoURLs.length > 0)) && (
                                                                <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                                                                    {(post.originalPost.imageURL || (post.originalPost.imageURLs && post.originalPost.imageURLs[0])) && (
                                                                        <img src={post.originalPost.imageURL || post.originalPost.imageURLs[0]} className="w-full h-auto max-h-[400px] object-cover" />
                                                                    )}
                                                                    {/* Simple fallback video presentation */}
                                                                    {(post.originalPost.videoURL || (post.originalPost.videoURLs && post.originalPost.videoURLs[0])) && !post.originalPost.imageURL && !(post.originalPost.imageURLs && post.originalPost.imageURLs[0]) && (
                                                                        <div className="bg-black/50 p-10 flex items-center justify-center relative">
                                                                            <Clapperboard size={40} className="opacity-50 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="w-10 h-10 rounded-xl bg-bg-main border border-white/5 flex items-center justify-center text-accent-1 font-black italic">
                                                                    P
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-black text-[var(--text-primary)]">Publicação Original</h5>
                                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Postado em {formatDate(post.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed italic opacity-80">
                                                                A publicação original não está disponível ou foi excluída.
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'desempenho' && (
                            <div className="tab-content active animate-fade-in space-y-12">
                                {/* 1. PERFORMANCE DASHBOARD HEADER */}
                                <div className="relative p-8 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-[40px] overflow-hidden group shadow-2xl">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-accent-1/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-accent-1/20 transition-all duration-1000" />
                                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] -ml-30 -mb-30 group-hover:bg-blue-500/20 transition-all duration-1000" />
                                    
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                        <div className="relative">
                                            <div className="w-28 h-28 rounded-[32px] bg-[var(--bg-main)] border-2 border-accent-1/30 flex items-center justify-center p-1 shadow-2xl">
                                                <div className="w-full h-full rounded-[26px] bg-gradient-to-tr from-accent-1 to-accent-2 flex flex-col items-center justify-center text-white">
                                                    <span className="text-[9px] font-black uppercase opacity-60">Nível</span>
                                                    <span className="text-3xl font-black italic">{targetUser?.level || 1}</span>
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-accent-3 rounded-xl flex items-center justify-center text-white shadow-xl">
                                                <Zap size={18} fill="currentColor" />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4 w-full text-center md:text-left">
                                            <div>
                                                <h3 className="text-2xl font-black text-[var(--text-primary)] italic mb-1 tracking-tight uppercase">Dashboard de Evolução</h3>
                                                <p className="text-[var(--text-secondary)] text-sm font-medium italic">Seu progresso acadêmico detalhado no Corvo VestApp</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-accent-1 uppercase tracking-[0.2em]">Experiência do Rank</span>
                                                        <div className="h-1 w-1 rounded-full bg-[var(--text-secondary)]" />
                                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{targetUser?.level || 1} • Estagiário do Corvo</span>
                                                    </div>
                                                    <span className="text-xl font-black text-[var(--text-primary)] italic">
                                                        {(targetUser?.xp || 0) % 1000}<span className="text-xs text-[var(--text-secondary)] ml-1">/ 1000 XP</span>
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-[var(--bg-main)]/40 rounded-full border border-[var(--glass-border)] p-1">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (((targetUser?.xp || 0) % 1000) / 1000) * 100)}%` }}
                                                        className="h-full bg-gradient-to-r from-accent-1 via-accent-2 to-blue-500 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                                                        transition={{ duration: 1.5, ease: "circOut" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
                                            <div className="bg-[var(--bg-main)]/20 border border-[var(--glass-border)] rounded-2xl p-5 text-center hover:bg-[var(--bg-main)]/40 transition-all">
                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Simulados</p>
                                                <span className="text-xl font-black text-[var(--text-primary)]">{displaySimulations.length}</span>
                                            </div>
                                            <div className="bg-[var(--bg-main)]/20 border border-[var(--glass-border)] rounded-2xl p-5 text-center hover:bg-[var(--bg-main)]/40 transition-all">
                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Redações</p>
                                                <span className="text-xl font-black text-[var(--text-primary)]">{displayEssays.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. MÉRITOS & CONQUISTAS (INSIGNIAS) */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-lg">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none mb-1">Insignias & Mérito</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sua galeria de honra e marcos alcançados</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {achievements.map((ach, idx) => (
                                            <motion.div 
                                                key={ach.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`relative bg-bg-secondary/40 border p-6 rounded-[32px] flex flex-col items-center text-center gap-4 transition-all group ${
                                                    ach.status === 'locked' 
                                                        ? 'opacity-40 grayscale border-white/5' 
                                                        : 'hover:border-accent-1/30 border-accent-1/10 shadow-xl bg-gradient-to-br from-bg-secondary to-accent-1/5'
                                                }`}
                                            >
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                                                    ach.status === 'locked'
                                                        ? 'bg-white/5 border-white/10 text-slate-500'
                                                        : ach.rarity === 'lendario' ? 'bg-amber-500/20 text-amber-400 border-amber-400/30' :
                                                          ach.rarity === 'epico' ? 'bg-purple-500/20 text-purple-400 border-purple-400/30' :
                                                          'bg-accent-1/20 text-accent-1 border-accent-1/30'
                                                } group-hover:scale-110 group-hover:rotate-3`}>
                                                    {ach.status === 'locked' ? <Lock size={20} /> : ach.icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <h5 className={`text-sm font-black italic uppercase tracking-tight ${ach.status === 'locked' ? 'text-slate-500' : 'text-white'}`}>{ach.title}</h5>
                                                    <p className="text-[10px] font-medium text-slate-500 leading-tight px-2">{ach.description}</p>
                                                </div>
                                                <div className="w-full mt-auto pt-4 border-t border-white/5">
                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest mb-1.5">
                                                        <span className={ach.status === 'locked' ? 'text-slate-600' : 'text-accent-1'}>{ach.rarity}</span>
                                                        <span className="text-slate-500">{ach.progress}/{ach.total}</span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${ach.status === 'locked' ? 'bg-slate-700' : 'bg-accent-1'}`}
                                                            style={{ width: `${(ach.progress / ach.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* INTEGRATED PLANILHA DE DESEMPENHO ENEM (REDAÇÃO) */}
                                <div id="planilha-enem-section" className={`border rounded-[40px] p-6 md:p-8 space-y-6 ${theme === 'light' ? 'bg-[#ffffff] border-slate-200' : 'bg-bg-secondary/40 border-white/5'}`}>
                                    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${theme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                <Feather size={22} />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-black uppercase tracking-tighter italic flex items-center gap-2 mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                                    Planilha de Desempenho ENEM
                                                </h3>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Histórico acadêmico e detonação das competências de redação
                                                </p>
                                            </div>
                                        </div>
                                        {/* Redacao statistics summary row embedded in the planilha card header with ZERO empty holes */}
                                        {displayEssays.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className={`border px-4 py-2 rounded-xl text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-bg-main border-white/5'}`}>
                                                    <p className="text-[8px] font-black uppercase text-slate-500">Média Geral</p>
                                                    <span className={`text-base font-black italic ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                                        {Math.round(displayEssays.reduce((sum, e) => sum + (e.score || 0), 0) / displayEssays.length)}
                                                    </span>
                                                </div>
                                                <div className={`border px-4 py-2 rounded-xl text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-bg-main border-white/5'}`}>
                                                    <p className="text-[8px] font-black uppercase text-slate-500">Melhor Nota</p>
                                                    <span className={`text-base font-black italic ${theme === 'light' ? 'text-pink-600' : 'text-pink-400'}`}>
                                                        {Math.max(...displayEssays.map(e => e.score || 0))}
                                                    </span>
                                                </div>
                                                <div className={`border px-4 py-2 rounded-xl text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-bg-main border-white/5'}`}>
                                                    <p className="text-[8px] font-black uppercase text-slate-500">Entregues</p>
                                                    <span className={`text-base font-black italic ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{displayEssays.length}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {displayEssays.length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl bg-bg-main/20 space-y-4 max-w-md mx-auto">
                                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-white font-black text-sm uppercase tracking-tight">Nenhuma redação avaliada</h4>
                                                <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                                                    Suas notas de redação aparecerão aqui em formato de planilha de registro acadêmico assim que suas redações forem submetidas e corrigidas por nossa IA.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/redacao')}
                                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                                            >
                                                Escrever Primeira Redação
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Table wrapper */}
                                            <div className={`border rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-[#ffffff] border-slate-200 shadow-sm' : 'border-white/5 bg-bg-main/20'}`}>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                             <tr className={`border-b text-[11px] font-extrabold uppercase md:text-xs select-none ${theme === 'light' ? 'border-slate-200 bg-slate-100/50 text-slate-700' : 'border-white/5 bg-white/[0.03] text-slate-300'}`}>
                                                                 <th className="p-5 pl-7">Tema da Redação / Prova</th>
                                                                 <th className="p-5 text-center">C1</th>
                                                                 <th className="p-5 text-center">C2</th>
                                                                 <th className="p-5 text-center">C3</th>
                                                                 <th className="p-5 text-center">C4</th>
                                                                 <th className="p-5 text-center">C5</th>
                                                                 <th className="p-5 text-center">Nota Final</th>
                                                                 <th className="p-5 text-center">Data</th>
                                                                 <th className="p-5 pr-7 text-center font-bold">Ações</th>
                                                              </tr>
                                                         </thead>
                                                         <tbody className={`divide-y text-xs md:text-sm font-semibold ${theme === 'light' ? 'divide-slate-200 text-slate-800' : 'divide-white/5 text-slate-200'}`}>
                                                              {displayEssays.map((essay) => {
                                                                 const getCompScore = (idx: number) => {
                                                                     return essay.competencies?.[idx]?.score ?? essay.evaluation?.competencies?.[idx]?.score ?? 0;
                                                                 };

                                                                 const scoreBadgeClass = (score: number) => {
                                                                     if (theme === 'light') {
                                                                         if (score >= 160) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
                                                                         if (score >= 120) return 'text-amber-700 bg-amber-50 border-amber-200';
                                                                         return 'text-rose-700 bg-rose-50 border-rose-200';
                                                                     } else {
                                                                         if (score >= 160) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                                                                         if (score >= 120) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                                                                         return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                                                                     }
                                                                 };

                                                                 const isSelected = selectedEssayDetail?.id === essay.id;

                                                                 return (
                                                                     <tr key={essay.id} className={`transition-colors ${theme === 'light' ? (isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/50') : (isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]')}`}>
                                                                         <td className="p-6 pl-7 max-w-sm md:max-w-md">
                                                                             <span className={`transition-colors block text-sm md:text-base font-extrabold tracking-tight mb-2 leading-snug ${theme === 'light' ? 'text-slate-900 hover:text-emerald-600' : 'text-white hover:text-accent-1'}`}>{essay.theme}</span>
                                                                             <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border select-none ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                                                                                 {essay.submissionMethod === 'upload' ? '📷 UPLOAD DE IMAGEM' : '✍️ ENVIADO POR TEXTO'}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`inline-block px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm transition-all text-center min-w-[42px] ${scoreBadgeClass(getCompScore(0))}`}>
                                                                                 {getCompScore(0)}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`inline-block px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm transition-all text-center min-w-[42px] ${scoreBadgeClass(getCompScore(1))}`}>
                                                                                 {getCompScore(1)}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`inline-block px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm transition-all text-center min-w-[42px] ${scoreBadgeClass(getCompScore(2))}`}>
                                                                                 {getCompScore(2)}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`inline-block px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm transition-all text-center min-w-[42px] ${scoreBadgeClass(getCompScore(3))}`}>
                                                                                 {getCompScore(3)}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`inline-block px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm transition-all text-center min-w-[42px] ${scoreBadgeClass(getCompScore(4))}`}>
                                                                                 {getCompScore(4)}
                                                                             </span>
                                                                         </td>
                                                                         <td className="p-6 text-center">
                                                                             <span className={`text-sm md:text-base font-black shadow-lg select-none font-mono inline-block min-w-[55px] text-center px-3.5 py-2.5 rounded-xl border ${theme === 'light' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'}`}>
                                                                                 {essay.score}
                                                                             </span>
                                                                         </td>
                                                                         <td className={`p-6 text-center text-xs md:text-sm font-semibold font-mono tracking-wide ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                                                                             {essay.createdAt?.toDate ? essay.createdAt.toDate().toLocaleDateString('pt-BR') : new Date(essay.createdAt).toLocaleDateString('pt-BR')}
                                                                         </td>
                                                                         <td className="p-6 pr-7 text-center">
                                                                             <button
                                                                                 onClick={() => setSelectedEssayDetail(isSelected ? null : essay)}
                                                                                 className={`px-4.5 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 min-w-[124px] ${
                                                                                     isSelected 
                                                                                     ? theme === 'light'
                                                                                         ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.25)]'
                                                                                         : 'bg-emerald-500 text-bg-main border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                                                                     : theme === 'light'
                                                                                         ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-emerald-700 hover:text-emerald-800 shadow-sm'
                                                                                         : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-emerald-400 hover:text-white shadow-sm'
                                                                                 }`}
                                                                             >
                                                                                 <span>{isSelected ? 'Ocultar' : 'Ver Detalhes'}</span>
                                                                                 <ChevronDown size={14} className={`transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`} />
                                                                             </button>
                                                                         </td>
                                                                     </tr>
                                                                 );
                                                             })}
                                                         </tbody>
                                                     </table>
                                                 </div>
                                             </div>

                                             {/* Expanded detailed feedback box - inside the Merit Tab */}
                                             <AnimatePresence mode="wait">
                                                 {selectedEssayDetail && (
                                                     <motion.div
                                                         key={selectedEssayDetail.id}
                                                         initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                                         exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                                         transition={{ duration: 0.2 }}
                                                         className={`border rounded-3xl p-6 ${theme === 'light' ? 'bg-[#ffffff] border-slate-200 shadow-sm' : 'border-white/5 bg-white/[0.01]'}`}
                                                     >
                                                         <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                                                             <div>
                                                                 <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block ${theme === 'light' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/85' : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'}`}>Histórico & Feedback Detalhado</span>
                                                                 <h4 className={`text-base font-black italic ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedEssayDetail.theme}</h4>
                                                             </div>
                                                             <div className="flex items-center gap-3">
                                                                 <div className="text-right">
                                                                     <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Avaliação Final</span>
                                                                     <span className={`text-2xl font-black italic tabular-nums leading-none ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>{selectedEssayDetail.score}</span>
                                                                 </div>
                                                                 <button 
                                                                     onClick={() => setSelectedEssayDetail(null)}
                                                                     className={`p-1 px-2.5 rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'}`}
                                                                 >
                                                                     Fechar
                                                                 </button>
                                                             </div>
                                                         </div>

                                                         {/* Competency indicators inside the expander */}
                                                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                             {[...Array(5)].map((_, idx) => {
                                                                 const comp = selectedEssayDetail.competencies?.[idx] ?? selectedEssayDetail.evaluation?.competencies?.[idx];
                                                                 if (!comp) return null;
                                                                 return (
                                                                     <div key={idx} className={`border rounded-2xl p-4 flex flex-col gap-1.5 transition-colors ${theme === 'light' ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm' : 'bg-bg-main/30 border-white/5 hover:border-slate-800'}`}>
                                                                         <div className={`flex justify-between items-center border-b pb-1.5 mb-1.5 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                                                                             <span className={`text-[8px] font-black uppercase tracking-wider font-mono ${theme === 'light' ? 'text-emerald-700' : 'text-accent-1'}`}>C{idx + 1}</span>
                                                                             <span className={`text-base font-black italic ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{comp.score}<span className={`text-[10px] font-normal ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>/200</span></span>
                                                                         </div>
                                                                         <p className={`text-[9px] leading-relaxed font-semibold ${theme === 'light' ? 'text-slate-650' : 'text-slate-400'}`}>
                                                                             {comp.feedback}
                                                                         </p>
                                                                     </div>
                                                                 );
                                                             })}
                                                         </div>

                                                         {/* General Feed & strengths/weaknesses right within the page card */}
                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                             <div className={`border rounded-2xl p-5 space-y-2 ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-bg-main/50 border-white/5'}`}>
                                                                 <h5 className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>Feedback Geral (Corvo AI)</h5>
                                                                 <p className={`text-xs font-medium leading-relaxed whitespace-pre-line ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                                                                     {selectedEssayDetail.evaluation?.generalFeedback ?? "Sem feedback geral cadastrado."}
                                                                 </p>
                                                             </div>
                                                             <div className="space-y-3">
                                                                 <div className={`border rounded-2xl p-5 ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-bg-main/50 border-white/5'}`}>
                                                                     <h5 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>Pontos Fortes</h5>
                                                                     <ul className={`list-disc pl-4 text-xs font-semibold space-y-1 list-inside ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                                                                         {selectedEssayDetail.evaluation?.strengths?.map((str: string, index: number) => (
                                                                             <li key={index} className="leading-relaxed">{str}</li>
                                                                         )) ?? <span className="text-[9px] text-slate-500">Sem registros.</span>}
                                                                     </ul>
                                                                 </div>
                                                                 <div className={`border rounded-2xl p-5 ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-bg-main/50 border-white/5'}`}>
                                                                     <h5 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-pink-600' : 'text-pink-400'}`}>Pontos a Melhorar</h5>
                                                                     <ul className={`list-disc pl-4 text-xs font-semibold space-y-1 list-inside ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                                                                         {selectedEssayDetail.evaluation?.weaknesses?.map((weak: string, index: number) => (
                                                                             <li key={index} className="leading-relaxed">{weak}</li>
                                                                         )) ?? <span className="text-[9px] text-slate-500">Sem registros.</span>}
                                                                     </ul>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </motion.div>
                                                 )}
                                             </AnimatePresence>
                                         </div>
                                     )}
                                </div>

                                {/* 4. HISTÓRICO DE SIMULADOS (NOVA PLANILHA) */}
                                <div id="historico-simulados-section" className={`border rounded-[40px] p-6 md:p-8 space-y-6 ${theme === 'light' ? 'bg-[#ffffff] border-slate-200' : 'bg-bg-secondary/40 border-white/5'}`}>
                                    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                <Target size={22} />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-black uppercase tracking-tighter italic flex items-center gap-2 mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                                    Histórico de Simulados
                                                </h3>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Relatório detalhado de desempenho nos testes cronometrados
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {displaySimulations.length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl bg-bg-main/20 space-y-4 max-w-md mx-auto">
                                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
                                                <Target size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-white font-black text-sm uppercase tracking-tight">Nenhum simulado registrado</h4>
                                                <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                                                    Seus resultados de simulados aparecerão aqui assim que você completar seu primeiro teste de campo.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/simulado')}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                                            >
                                                Iniciar Simulado Agora
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`border rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-[#ffffff] border-slate-200 shadow-sm' : 'border-white/5 bg-bg-main/20'}`}>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className={`border-b text-[11px] font-extrabold uppercase md:text-xs select-none ${theme === 'light' ? 'border-slate-200 bg-slate-100/50 text-slate-700' : 'border-white/5 bg-white/[0.03] text-slate-300'}`}>
                                                            <th className="p-5 pl-7">Simulado / Categoria</th>
                                                            <th className="p-5 text-center">Acertos</th>
                                                            <th className="p-5 text-center">Questões</th>
                                                            <th className="p-5 text-center">Precisão</th>
                                                            <th className="p-5 text-center">Data</th>
                                                            <th className="p-5 pr-7 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={`divide-y text-xs md:text-sm font-semibold ${theme === 'light' ? 'divide-slate-200 text-slate-800' : 'divide-white/5 text-slate-200'}`}>
                                                        {displaySimulations.map((sim) => {
                                                            const precision = Math.round((sim.correctAnswers / sim.totalQuestions) * 100);
                                                            const precisionClass = precision >= 70 ? 'text-emerald-400' : precision >= 50 ? 'text-amber-400' : 'text-rose-400';
                                                            
                                                            return (
                                                                <tr key={sim.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-white/[0.03]'}`}>
                                                                    <td className="p-6 pl-7">
                                                                        <span className={`block text-sm md:text-base font-extrabold tracking-tight mb-1 leading-snug ${theme === 'light' ? 'text-[var(--text-primary)] font-black' : 'text-[var(--text-primary)]'}`}>{sim.examTitle}</span>
                                                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[var(--bg-main)]/20 border-[var(--glass-border)] text-[var(--text-secondary)]'}`}>
                                                                            {sim.category || 'Geral'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-6 text-center font-black italic text-base text-[var(--text-primary)]">{sim.correctAnswers}</td>
                                                                    <td className="p-6 text-center text-[var(--text-secondary)] font-bold">{sim.totalQuestions}</td>
                                                                    <td className="p-6 text-center">
                                                                        <span className={`text-base font-black italic ${precisionClass}`}>
                                                                            {precision}%
                                                                        </span>
                                                                    </td>
                                                                    <td className={`p-6 text-center text-xs font-mono ${theme === 'light' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                                                                        {formatDate(sim.createdAt)}
                                                                    </td>
                                                                    <td className="p-6 pr-7 text-center">
                                                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase italic tracking-widest">
                                                                            Finalizado
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 5. CRÔNICA DE EVOLUÇÃO (LINHA DO TEMPO) */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/5 shadow-inner">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none mb-1">Linha do Tempo</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ações que construíram sua jornada</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {displaySimulations.length === 0 && displayEssays.length === 0 ? (
                                            <div className="p-20 border-2 border-dashed border-white/5 rounded-[48px] text-center bg-white/[0.01]">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                                                    <Rocket size={40} />
                                                </div>
                                                <h4 className="text-white font-black text-xl mb-2 italic">A Jornada Começa Aqui</h4>
                                                <p className="text-slate-500 font-bold max-w-xs mx-auto">Complete simulados para preencher sua crônica de mérito.</p>
                                            </div>
                                        ) : (
                                            [
                                                ...displaySimulations.map(s => ({ ...s, type: 'simulado' })),
                                                ...displayEssays.map(e => ({ ...e, type: 'redacao' }))
                                            ]
                                                .sort((a, b) => {
                                                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                                                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                                                    return dateB.getTime() - dateA.getTime();
                                                })
                                                .slice(0, 10)
                                                .map((item, idx) => (
                                                    <motion.div 
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="group relative bg-bg-secondary/40 hover:bg-bg-secondary/80 border border-white/5 hover:border-white/20 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 transition-all"
                                                    >
                                                        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform ${
                                                            item.type === 'redacao' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-accent-1/10 text-accent-1 border border-accent-1/20'
                                                        }`}>
                                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            {item.type === 'redacao' ? <Feather size={28} /> : <Target size={28} />}
                                                        </div>
                                                        
                                                        <div className="flex-1 text-center sm:text-left space-y-1">
                                                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border ${
                                                                    item.type === 'redacao' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-accent-1/10 text-accent-1/80 border-accent-1/20'
                                                                }`}>
                                                                    {item.type === 'redacao' ? 'Manuscrito' : 'Simulado'}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{formatDate(item.createdAt)}</span>
                                                            </div>
                                                            <h4 className="text-white font-black tracking-tight text-lg group-hover:text-accent-1 transition-colors leading-tight">
                                                                {item.type === 'redacao' ? item.theme : item.examTitle}
                                                            </h4>
                                                        </div>

                                                        <div className="flex flex-col items-center sm:items-end min-w-[100px]">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-3xl font-black text-white italic tabular-nums leading-none">
                                                                    {item.type === 'redacao' ? item.score : Math.round((item.correctAnswers / item.totalQuestions) * 100)}
                                                                    <span className="text-lg opacity-30 ml-0.5">{item.type === 'redacao' ? '' : '%'}</span>
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col items-center sm:items-end mt-1">
                                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                                                                    {item.type === 'redacao' ? 'Nota Final' : 'Precisão'}
                                                                </p>
                                                                <span className="text-[10px] font-black text-amber-500 italic bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                                                    +{item.type === 'redacao' ? Math.round(item.score / 10) : (item.correctAnswers * 50)} XP
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cronograma-ia' && (
                            <div className="tab-content active px-2 sm:px-4">
                                {displayUser && (
                                    <div className="space-y-12 sm:space-y-16">
                                        {/* Intelligent Schedule Generator - Only for the Profile Owner */}
                                        {!!currentUser && displayUser.uid === currentUser?.uid ? (
                                            <IntelligentScheduleGenerator 
                                                userId={displayUser.uid} 
                                                isOwner={true}
                                                onPlanGenerated={() => {
                                                    toast.success("Plano atualizado com sucesso!");
                                                }}
                                            />
                                        ) : (
                                            <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                                <Calendar className="mx-auto mb-4 text-slate-500" size={40} />
                                                <p className="text-slate-400 font-bold">Acesse seu próprio perfil para gerenciar seu Cronograma IA.</p>
                                            </div>
                                        )}

                                        <div className="pt-12 sm:pt-16 border-t border-slate-200 dark:border-white/10">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Cronograma Ativo</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Acompanhe seu progresso diário aqui</p>
                                                </div>
                                            </div>
                                            <StudySchedule 
                                                userId={displayUser.uid} 
                                                isOwner={!!currentUser && displayUser.uid === currentUser?.uid}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <aside className="profile-right-sidebar flex flex-col gap-6">
                        {/* --- CENTRO DE FOCO & PRODUTIVIDADE (TIMER RECONFIGURADO & ENLARGED) --- */}
                        <div className="bento-card pomo-card relative overflow-hidden group/pomo animate-fade-in" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(8, 10, 16, 0.9) 100%)', border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)' }}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF416C]/10 rounded-full blur-[60px]" />
                            <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />
                            
                            <div className="relative z-10 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-[#FF416C]/20 to-[#FF4B2B]/20 rounded-xl text-[#FF416C] border border-[#FF416C]/30 animate-pulse shadow-[0_0_12px_rgba(255,65,108,0.2)]">
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`text-base font-black uppercase tracking-tight mb-0 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} style={{ margin: 0 }}>Central de Foco</h3>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} style={{ margin: 0 }}>Timer de Foco & Alto Rendimento</p>
                                        </div>
                                    </div>

                                    {pomodoroActive && (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            pomodoroMode === 'focus' 
                                                ? 'bg-[#FF416C]/15 text-[#FF416C] border border-[#FF416C]/30 shadow-[0_0_10px_rgba(255,65,108,0.15)]' 
                                                : pomodoroMode === 'shortBreak' 
                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                                                    : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                        }`}>
                                            <span className="relative flex h-2 w-2">
                                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                  pomodoroMode === 'focus' ? 'bg-[#FF416C]' : pomodoroMode === 'shortBreak' ? 'bg-[#059669]' : 'bg-[#7c3aed]'
                                              }`}></span>
                                              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                  pomodoroMode === 'focus' ? 'bg-[#FF416C]' : pomodoroMode === 'shortBreak' ? 'bg-[#059669]' : 'bg-[#7c3aed]'
                                              }`}></span>
                                            </span>
                                            Focado
                                        </span>
                                    )}
                                </div>

                                {/* Custom Duration Presets Selector */}
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Duração da Sessão de Foco:</label>
                                    <div className="grid grid-cols-4 gap-1.5 w-full">
                                        {[15, 25, 45, 60].map((mins) => (
                                            <button
                                                key={mins}
                                                disabled={pomodoroMode !== 'focus'}
                                                onClick={() => {
                                                    setFocusDurationMin(mins);
                                                    setPomodoroActive(false);
                                                    setPomodoroTime(mins * 60);
                                                    toast.success(`Duração de Foco alterada para ${mins} minutos! 🕒`);
                                                }}
                                                className={`py-2 px-1.5 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    focusDurationMin === mins && pomodoroMode === 'focus'
                                                        ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-[0_0_15px_rgba(255,75,43,0.45)] scale-105 border border-transparent'
                                                        : theme === 'light'
                                                            ? 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                            : 'bg-zinc-950/40 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10'
                                                } ${pomodoroMode !== 'focus' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {mins}'
                                            </button>
                                        ))}
                                    </div>
                                    {pomodoroMode !== 'focus' && (
                                        <p className="text-[9px] text-amber-500 font-bold italic mb-0" style={{ marginTop: '2px', marginBottom: 0 }}>Termine a pausa atual para trocar a duração do foco.</p>
                                    )}
                                </div>

                                {/* Enormously styled interface for circular visual HUD and status tracking */}
                                <div className={`flex flex-col items-center rounded-3xl p-6 backdrop-blur-sm shadow-xl relative w-full ${theme === 'light' ? 'bg-slate-50/85 border border-slate-200/80' : 'bg-zinc-950/55 border border-white/10'}`}>
                                    {/* Modes segmented buttons */}
                                    <div className={`grid grid-cols-3 gap-1.5 w-full p-1.5 rounded-2xl mb-5 shadow-inner ${theme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-slate-950/80 border border-white/5'}`}>
                                        <button 
                                            onClick={() => selectPomodoroMode('focus')} 
                                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                                                pomodoroMode === 'focus' 
                                                    ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white font-black shadow-[0_4px_12px_rgba(255,75,43,0.45)]' 
                                                    : theme === 'light'
                                                        ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            Foco
                                        </button>
                                        <button 
                                            onClick={() => selectPomodoroMode('shortBreak')} 
                                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                                                pomodoroMode === 'shortBreak' 
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-[0_4px_12px_rgba(16,185,129,0.35)]' 
                                                    : theme === 'light'
                                                        ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            Intervalo
                                        </button>
                                        <button 
                                            onClick={() => selectPomodoroMode('longBreak')} 
                                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                                                pomodoroMode === 'longBreak' 
                                                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-black shadow-[0_4px_12px_rgba(168,85,247,0.35)]' 
                                                    : theme === 'light'
                                                        ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            Pausa Longa
                                        </button>
                                    </div>

                                    {/* Radial Progress */}
                                    <div className="relative flex items-center justify-center w-40 h-40 my-2 scale-[1.05] transition-transform duration-500">
                                        <div className={`absolute inset-2 rounded-full bg-gradient-to-tr opacity-15 blur-2xl transition-all duration-1000 ${
                                            pomodoroMode === 'focus' ? 'from-[#FF416C] to-[#FF4B2B]' : pomodoroMode === 'shortBreak' ? 'from-emerald-400 to-teal-400' : 'from-purple-400 to-pink-400'
                                        }`} />

                                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                            <defs>
                                                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#FF416C" />
                                                    <stop offset="100%" stopColor="#FF4B2B" />
                                                </linearGradient>
                                                <linearGradient id="shortGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#34d399" />
                                                    <stop offset="100%" stopColor="#059669" />
                                                </linearGradient>
                                                <linearGradient id="longGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#c084fc" />
                                                    <stop offset="100%" stopColor="#7c3aed" />
                                                </linearGradient>
                                            </defs>
                                            <circle 
                                                cx="80" 
                                                cy="80" 
                                                r="68" 
                                                stroke="currentColor" 
                                                strokeWidth="6" 
                                                fill="transparent"
                                                className={theme === 'light' ? 'text-slate-200/60' : 'text-white/5'} 
                                            />
                                            <circle 
                                                cx="80" 
                                                cy="80" 
                                                r="68" 
                                                stroke={
                                                    pomodoroMode === 'focus' 
                                                        ? 'url(#focusGrad)' 
                                                        : pomodoroMode === 'shortBreak' 
                                                            ? 'url(#shortGrad)' 
                                                            : 'url(#longGrad)'
                                                } 
                                                strokeWidth="7" 
                                                strokeLinecap="round"
                                                fill="transparent" 
                                                strokeDasharray="427.25"
                                                strokeDashoffset={(427.25 - (427.25 * pomodoroTime) / (pomodoroMode === 'focus' ? focusDurationMin * 60 : pomodoroMode === 'shortBreak' ? 5 * 60 : 15 * 60)) || 0}
                                                style={{
                                                    transition: 'stroke-dashoffset 0.3s ease, stroke 1s ease',
                                                    filter: `drop-shadow(0px 0px 8px ${
                                                        pomodoroMode === 'focus' 
                                                            ? 'rgba(255,65,108,0.5)' 
                                                            : pomodoroMode === 'shortBreak' 
                                                                ? 'rgba(16,185,129,0.45)' 
                                                                : 'rgba(168,85,247,0.45)'
                                                    })`
                                                }}
                                            />
                                        </svg>

                                        {/* Core Digital HUD */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <span className={`text-3xl font-black font-mono tracking-wider leading-none ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                                {formatTime(pomodoroTime)}
                                            </span>
                                            <span className={`text-[9px] uppercase tracking-widest font-black mt-2 font-mono transition-all duration-1000 px-3 py-1 rounded-full border ${
                                                pomodoroMode === 'focus' 
                                                    ? 'text-[#FF416C] bg-[#FF416C]/10 border-[#FF416C]/20 shadow-[0_0_10px_rgba(255,65,108,0.15)]' 
                                                    : pomodoroMode === 'shortBreak' 
                                                        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                                                        : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                                            }`}>
                                                {pomodoroMode === 'focus' ? 'Foco Máximo' : pomodoroMode === 'shortBreak' ? 'Descanso Ativo' : 'Descompressão'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-3 mt-5 w-full justify-center">
                                        <button 
                                            onClick={() => setPomodoroActive(!pomodoroActive)}
                                            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex-1 ${
                                                pomodoroActive 
                                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20' 
                                                    : pomodoroMode === 'focus'
                                                        ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white font-black shadow-[#FF416C]/35'
                                                        : pomodoroMode === 'shortBreak'
                                                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-100 font-black shadow-emerald-400/25'
                                                            : 'bg-gradient-to-r from-purple-400 to-fuchsia-500 text-white font-black shadow-purple-400/25'
                                            }`}
                                        >
                                            {pomodoroActive ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
                                            <span>{pomodoroActive ? 'Pausar' : 'Iniciar'}</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setPomodoroActive(false);
                                                setPomodoroTime(pomodoroMode === 'focus' ? focusDurationMin * 60 : pomodoroMode === 'shortBreak' ? 5 * 60 : 15 * 60);
                                                toast.info("Timer reiniciado!");
                                            }}
                                            title="Reiniciar Timer"
                                            className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                                theme === 'light'
                                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- NOVO PAINEL DE METAS & ESTIMULO SONORO (EVITA DESPERDÍCIO VISUAL / ESPAÇOS BRANCOS) --- */}
                        <div className="bento-card goals-card relative overflow-hidden group space-y-6" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(8, 10, 16, 0.9) 100%)', border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)' }}>
                            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px]" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-[40px]" />

                            <div className="relative z-10 space-y-5">
                                {/* Section title - Meta Diária */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/15 rounded-xl border border-amber-500/30 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.2)] ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>
                                            <Trophy size={18} className="drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight mb-0 ${theme === 'light' ? 'text-amber-800' : 'text-amber-200'}`} style={{ margin: 0, textShadow: theme === 'light' ? 'none' : '0 0 10px rgba(245,158,11,0.1)' }}>Meta de Estudos Diária</h4>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-0 ${theme === 'light' ? 'text-amber-600' : 'text-amber-500'}`} style={{ margin: 0 }}>Desempenho Real-Time & Foco</p>
                                        </div>
                                    </div>

                                    {/* Focus Statistics calculations */}
                                    {(() => {
                                        const totalFocusMins = Math.floor((displayUser.totalFocusSeconds || 0) / 60);
                                        const displayHours = Math.floor(totalFocusMins / 60);
                                        const displayMins = totalFocusMins % 60;
                                        const focusTimeFormatted = displayHours > 0 ? `${displayHours}h ${displayMins}min` : `${displayMins} min`;
                                        const currentProgressPercent = Math.min(100, Math.round((totalFocusMins / 120) * 100));

                                        return (
                                            <div className={`space-y-3 rounded-2xl p-4 border ${theme === 'light' ? 'bg-slate-50/85 border-slate-200/80' : 'bg-zinc-950/55 border-white/5'}`}>
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Tempo de Foco Hoje:</span>
                                                    <span className={`${theme === 'light' ? 'text-amber-700' : 'text-amber-400'} font-mono tracking-wider`}>{totalFocusMins} / 120 min</span>
                                                </div>

                                                <div className={`w-full h-3.5 rounded-full overflow-hidden p-[2px] relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] border ${theme === 'light' ? 'bg-slate-200/65 border-slate-300/40' : 'bg-zinc-950/80 border-white/10'}`}>
                                                    <div 
                                                        className="h-full rounded-full bg-gradient-to-r from-[#FF416C] via-[#FF4B2B] to-[#FABC3F] shadow-[0_0_15px_rgba(255,75,43,0.65)] transition-all duration-1000 relative"
                                                        style={{ width: `${Math.max(4, currentProgressPercent)}%` }}
                                                    >
                                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] font-black tracking-wide uppercase">
                                                    <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Progresso Geral: <strong className={theme === 'light' ? 'text-slate-800 font-black' : 'text-slate-200 font-bold'}>{focusTimeFormatted}</strong></span>
                                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B2B] to-[#FABC3F] drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">{currentProgressPercent}% da Meta</span>
                                                </div>

                                                <p className={`text-[11px] leading-relaxed pt-2.5 font-semibold mt-1 mb-0 flex items-start gap-1.5 border-t ${theme === 'light' ? 'text-slate-700 border-slate-200/60' : 'text-zinc-300 border-white/5'}`}>
                                                    <span className="text-amber-500 shrink-0">⚡</span>
                                                    <span>
                                                        {totalFocusMins === 0 
                                                            ? "Foco zerado por enquanto. Inicie um ciclo de foco máximo e acenda sua lâmpada estudantil!" 
                                                            : totalFocusMins < 120 
                                                                ? `Excelente progresso! Só faltam mais ${120 - totalFocusMins} minutinhos de alta produtividade para cumprir seu dever diário.` 
                                                                : "Parabéns! Você alcançou o seu potencial máximo recomendado de hoje e consolidou sua meta diária de estudos focados!"
                                                        }
                                                    </span>
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Section titles - Estudo Sonoro */}
                                <div className={`space-y-3 pt-3 border-t ${theme === 'light' ? 'border-slate-200/60' : 'border-white/5'}`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl border ${theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                            <Music size={18} />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight mb-0 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} style={{ margin: 0 }}>Sons Ambientais de Foco</h4>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} style={{ margin: 0 }}>Música de Fundo para Concentrar</p>
                                        </div>
                                    </div>

                                    {/* Ambient Audio Selection Triggers and controls */}
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {ambientSounds.map((sound) => {
                                            const isActive = activeSoundId === sound.id;
                                            return (
                                                <button
                                                    key={sound.id}
                                                    onClick={() => {
                                                        const nextSound = isActive ? null : sound.id;
                                                        setActiveSoundId(nextSound);
                                                        if (nextSound) {
                                                            playAmbientSound(nextSound);
                                                        } else {
                                                            stopAmbientSound();
                                                        }
                                                    }}
                                                    className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-1.5 transition-all text-xs border cursor-pointer select-none ${
                                                        isActive 
                                                            ? theme === 'light'
                                                                ? 'bg-gradient-to-br from-emerald-100 to-teal-50 border-emerald-400 text-emerald-800 shadow-sm font-black'
                                                                : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400 shadow-sm font-black' 
                                                            : theme === 'light'
                                                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
                                                                : 'bg-zinc-950/40 hover:bg-zinc-950/80 border-white/5 text-slate-400 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <span className="truncate">{sound.name}</span>
                                                    {isActive ? (
                                                        <span className="flex items-center gap-0.5 shrink-0">
                                                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                        </span>
                                                    ) : (
                                                        <Play size={10} className="text-slate-500 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {activeSoundId && (
                                        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-[10px] border ${theme === 'light' ? 'bg-slate-100/50 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-white/5 text-slate-400'}`} style={{ marginTop: '10px' }}>
                                            <Volume2 size={12} className="text-emerald-400 shrink-0 animate-pulse" />
                                            <span>Tocando Áudio de Foco em loop de segundo plano. Relaxe e concentre-se.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>
            </div>

            {selectedPost && (
                <div id="post-modal" className="modal" style={{ display: 'flex' }}>
                    <div className="modal-content insta-container" style={{ position: 'relative' }}>
                        <X size={24} className="close-modal" onClick={() => setSelectedPost(null)} style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10, cursor: 'pointer' }} />
                        <div className="insta-wrapper">
                            <div className="insta-left" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {(selectedPost.mediaType === 'video' || selectedPost.type === 'video' || selectedPost.videoURL) ? (
                                    <div className="video-wrapper" style={{ width: '100%', height: '100%', aspectRatio: '1/1' }}>
                                        {selectedPost.videoURL?.includes('youtube.com') || selectedPost.videoURL?.includes('youtu.be') ? (
                                            <iframe 
                                                src={`https://www.youtube.com/embed/${selectedPost.videoURL.split('v=')[1] || selectedPost.videoURL.split('/').pop()}`}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                allowFullScreen
                                            ></iframe>
                                        ) : (selectedPost.videoURL && (selectedPost.videoURL.startsWith('data:audio/') || selectedPost.videoURL.includes('audio') || selectedPost.videoURL.endsWith('.mp3') || selectedPost.videoURL.endsWith('.wav') || selectedPost.videoURL.endsWith('.ogg') || selectedPost.videoURL.endsWith('.m4a') || selectedPost.videoURL.startsWith('data:application/octet-stream'))) || (selectedPost.mediaURL && (selectedPost.mediaURL.startsWith('data:audio/') || selectedPost.mediaURL.includes('audio') || selectedPost.mediaURL.endsWith('.mp3') || selectedPost.mediaURL.endsWith('.wav') || selectedPost.mediaURL.endsWith('.ogg') || selectedPost.mediaURL.endsWith('.m4a') || selectedPost.mediaURL.startsWith('data:application/octet-stream'))) ? (
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 w-full h-full text-center">
                                                <div className="w-16 h-16 bg-accent-1/20 text-accent-1 rounded-2xl flex items-center justify-center mb-4">
                                                    <Music size={32} />
                                                </div>
                                                <p className="text-sm font-black mb-4 text-white">Arquivo de Áudio (MP3)</p>
                                                <audio src={selectedPost.videoURL || selectedPost.mediaURL} controls className="w-full max-w-sm" />
                                            </div>
                                        ) : (
                                            <video src={selectedPost.videoURL || selectedPost.mediaURL} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
                                        )}
                                    </div>
                                ) : (selectedPost.mediaURL || selectedPost.imageURL) ? (
                                    <img 
                                        src={selectedPost.mediaURL || selectedPost.imageURL} 
                                        id="modal-img" 
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
                                        referrerPolicy="no-referrer" 
                                    />
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)', width: '100%' }}>
                                        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>{selectedPost.content}</p>
                                    </div>
                                )}
                            </div>
                            <div className="insta-right" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '20px' }}>
                                <div className="insta-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <UserAvatar 
                                            uid={selectedPost.authorId}
                                            size="32px"
                                            fallbackPhoto={selectedPost.authorPhoto}
                                            fallbackName={selectedPost.authorName}
                                        />
                                        <strong>{selectedPost.authorName}</strong>
                                    </div>
                                    {selectedPost.authorId === currentUser?.uid && (
                                        <button 
                                            onClick={() => setPostToDelete(selectedPost.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '5px' }}
                                            title="Excluir publicação"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div className="insta-comments" style={{ flex: 1, overflowY: 'auto', padding: '15px 0' }}>
                                    <p style={{ marginBottom: '20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        <strong>{selectedPost.authorName}</strong> {selectedPost.content}
                                    </p>
                                    
                                    {postComments.map((comment, idx) => (
                                        <div key={comment.id || idx} style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'flex-start' }} className="group/comment-item">
                                            <button 
                                                onClick={() => {
                                                    setSelectedPost(null);
                                                    navigate(`/perfil?uid=${comment.authorId}`);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                            >
                                                <UserAvatar 
                                                    uid={comment.authorId}
                                                    size="28px"
                                                    fallbackPhoto={comment.authorPhoto}
                                                    fallbackName={comment.authorName}
                                                />
                                            </button>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                                                    <span 
                                                        onClick={() => {
                                                            setSelectedPost(null);
                                                            navigate(`/perfil?uid=${comment.authorId}`);
                                                        }}
                                                        style={{ fontWeight: 900, marginRight: '8px', cursor: 'pointer' }}
                                                        className="hover:text-accent-1"
                                                    >
                                                        {comment.authorName}
                                                    </span>
                                                    {comment.text}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                        {formatDate(comment.createdAt)}
                                                    </span>
                                                    {(currentUser?.uid === comment.authorId || currentUser?.uid === selectedPost.authorId) && comment.id && !comment.id.startsWith('temp_') && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px', fontSize: '0.7rem' }}
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            Excluir
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                    <div className="insta-footer" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                                        <div className="insta-icons" style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                            <button 
                                                onClick={() => handleLike(selectedPost.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                className={likedPosts.has(selectedPost.id) ? 'text-accent-1' : 'text-zinc-500'}
                                            >
                                                <Heart size={24} className={likedPosts.has(selectedPost.id) ? 'fill-current' : ''} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}>
                                                <Share2 size={24} />
                                            </button>
                                        </div>
                                        <div className="insta-likes" style={{ marginBottom: '10px' }}>
                                            <strong 
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openLikersModal(selectedPost.id)}
                                                className="hover:underline"
                                            >
                                                {formatNumber(selectedPost.likesCount || 0)}
                                            </strong> curtidas
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px', alignItems: 'center' }}>
                                            <UserAvatar 
                                                uid={currentUser?.uid || ''}
                                                size="28px"
                                                className="border border-accent-1"
                                                fallbackPhoto={currentUserProfile?.photoURL || currentUser?.photoURL || ''}
                                                fallbackName={currentUserProfile?.displayName || currentUser?.displayName || 'User'}
                                            />
                                            <input 
                                                type="text"
                                                placeholder="Comentar..."
                                                value={profileCommentInput}
                                                onChange={(e) => setProfileCommentInput(e.target.value)}
                                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && profileCommentInput.trim()) {
                                                        handleSendComment(selectedPost.id, profileCommentInput);
                                                        setProfileCommentInput('');
                                                    }
                                                }}
                                            />
                                            <div className="relative flex items-center">
                                                <button
                                                    onClick={() => {
                                                        setCommentMentionPostId(
                                                            commentMentionPostId === selectedPost.id ? null : selectedPost.id
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
                                                {commentMentionPostId === selectedPost.id && (
                                                    <div className="absolute bottom-9 right-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xl z-50 w-64 max-h-56 overflow-y-auto text-left" style={{ position: 'absolute', bottom: '35px', right: 0, zIndex: 1000, width: '240px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px' }}>
                                                        <div className="text-[10px] font-black text-accent-1 uppercase mb-1.5" style={{ color: 'var(--accent-1)', fontSize: '10px', fontWeight: 'bold' }}>
                                                            Marcar Colega
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar colega..."
                                                            value={mentionSearchTerm}
                                                            onChange={(e) => setMentionSearchTerm(e.target.value)}
                                                            className="w-full bg-slate-950/10 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 text-[10px] font-bold text-black dark:text-white outline-none mb-2"
                                                            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', color: 'inherit', outline: 'none', width: '100%', fontSize: '11px', marginBottom: '8px' }}
                                                        />
                                                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar">
                                                            {matchingUsers.length === 0 ? (
                                                                <div className="text-[11px] text-zinc-500 py-1 text-center font-bold" style={{ fontSize: '11px', textAlign: 'center', color: '#888' }}>
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
                                                                            setProfileCommentInput(
                                                                                (prev) => (prev || "") + `@${handle} `
                                                                            );
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
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-1)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
                                                onClick={() => {
                                                    if (profileCommentInput.trim()) {
                                                        handleSendComment(selectedPost.id, profileCommentInput);
                                                        setProfileCommentInput('');
                                                    }
                                                }}
                                            >
                                                Publicar
                                            </button>
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievement Modal Enhanced */}
            <AnimatePresence>
                {selectedAchievement && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                            onClick={() => setSelectedAchievement(null)}
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/10 rounded-[40px] sm:rounded-[56px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-1 via-accent-2 to-blue-500 z-20" />
                            
                            <button 
                                onClick={() => setSelectedAchievement(null)}
                                className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white z-20 border border-white/5"
                            >
                                <X size={20} />
                            </button>

                            <div className="overflow-y-auto p-8 sm:p-12 custom-scrollbar">
                                <div className="flex flex-col items-center text-center">
                                    {/* Iconic Badge Display */}
                                    <div className="relative mb-10 group">
                                        <div className={`absolute inset-0 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${
                                            selectedAchievement.rarity === 'lendario' ? 'bg-amber-500' :
                                            selectedAchievement.rarity === 'epico' ? 'bg-purple-500' :
                                            'bg-accent-1'
                                        }`} />
                                        
                                        <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-[40px] sm:rounded-[50px] flex items-center justify-center text-white relative z-10 border-2 transition-transform group-hover:scale-110 duration-500 ${
                                            selectedAchievement.rarity === 'lendario' ? 'bg-amber-500/10 border-amber-500/30' :
                                            selectedAchievement.rarity === 'epico' ? 'bg-purple-500/10 border-purple-500/30' :
                                            'bg-accent-1/10 border-accent-1/30'
                                        }`}>
                                            <div className="scale-[2] sm:scale-[2.5]">
                                                {selectedAchievement.icon}
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl z-20 whitespace-nowrap">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                                                selectedAchievement.rarity === 'lendario' ? 'text-amber-500' :
                                                selectedAchievement.rarity === 'epico' ? 'text-purple-500' :
                                                'text-accent-1'
                                            }`}>
                                                {getRarityLabel(selectedAchievement.rarity)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none min-h-[1.2em]">
                                            {selectedAchievement.title}
                                        </h2>
                                        <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-[280px] mx-auto">
                                            {selectedAchievement.description}
                                        </p>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col items-center group/item hover:bg-white/10 transition-colors">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 rounded-xl flex items-center justify-center mb-2 text-slate-500 group-hover/item:text-white transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/item:text-slate-400">Status</p>
                                            <span className="text-white font-black text-xs sm:text-sm">{selectedAchievement.status === 'unlocked' ? 'Conquistado' : 'Em progresso'}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col items-center group/item hover:bg-white/10 transition-colors">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-2 text-amber-500 group-hover/item:scale-110 transition-transform">
                                                <Trophy size={18} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/item:text-slate-400">Recompensa</p>
                                            <span className="text-white font-black italic text-xs sm:text-sm">+{selectedAchievement.xp} XP</span>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-3 mb-8">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Maestria</span>
                                            <span className="text-xl font-black text-white italic tabular-nums leading-none">
                                                {Math.round((selectedAchievement.progress / selectedAchievement.total) * 100)} %
                                            </span>
                                        </div>
                                        <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(selectedAchievement.progress / selectedAchievement.total) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full relative ${
                                                    selectedAchievement.rarity === 'lendario' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
                                                    selectedAchievement.rarity === 'epico' ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' :
                                                    'bg-accent-1 shadow-[0_0_20px_rgba(255,107,0,0.5)]'
                                                }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                            </motion.div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className="w-full py-4 bg-white text-zinc-950 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-lg group"
                                        onClick={() => {
                                            const text = `Conquistei a insígnia ${selectedAchievement.title} no VestApp! 🏆 #VestApp #Mérito`;
                                            if (navigator.share) {
                                                navigator.share({ title: 'VestApp', text, url: window.location.href }).catch(() => {
                                                    navigator.clipboard.writeText(text);
                                                    toast.success("Copiado!");
                                                });
                                            } else {
                                                navigator.clipboard.writeText(text);
                                                toast.success("Copiado!");
                                            }
                                        }}
                                    >
                                        <Share2 size={16} className="group-hover:rotate-12 transition-transform" /> 
                                        Compartilhar Triunfo
                                    </button>

                                    <p className="mt-5 text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center italic">
                                        Seu legado está sendo escrito no VestApp
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
                            <h3 className="font-black text-lg">Curtidas</h3>
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
                                    <Heart size={40} className="mx-auto text-zinc-800 mb-3" />
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
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{liker.displayName}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{liker.handle}</div>
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

            <AnimatePresence>
                {showPostModal && (
                    <div className="modal" style={{ display: 'flex', zIndex: 2000 }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-content glass-card" 
                            style={{ maxWidth: '500px', width: '90%', padding: '0', overflow: 'hidden', position: 'relative' }}
                        >
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', position: 'relative', zIndex: 10 }}>
                                <h3 style={{ margin: 0 }}>Nova Publicação</h3>
                                <X size={24} style={{ cursor: 'pointer', opacity: 0.9 }} onClick={() => setShowPostModal(false)} />
                            </div>
                            
                            <div 
                                ref={postModalRef}
                                onScroll={checkScroll}
                                style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}
                            >
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <button 
                                        className={`chip ${postType === 'text' ? 'active' : ''}`} 
                                        onClick={() => setPostType('text')}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Feather size={16} /> Texto
                                    </button>
                                    <button 
                                        className={`chip ${postType === 'image' ? 'active' : ''}`} 
                                        onClick={() => setPostType('image')}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <ImageIcon size={16} /> Foto
                                    </button>
                                    <button 
                                        className={`chip ${postType === 'video' ? 'active' : ''}`} 
                                        onClick={() => setPostType('video')}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Video size={16} /> Vídeo
                                    </button>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 1, display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--accent-1)' }}>MATÉRIA RELACIONADA</label>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                                        gap: '8px',
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        padding: '5px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        {['Geral', 'Redação', 'Matemática', 'Português', 'Biologia', 'Física', 'Química', 'História', 'Geografia', 'Filosofia', 'Sociologia'].map(subject => (
                                            <button
                                                key={subject}
                                                type="button"
                                                onClick={() => setNewPostSubject(subject)}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    transition: '0.2s',
                                                    background: newPostSubject === subject ? 'var(--accent-1)' : 'rgba(255,255,255,0.05)',
                                                    color: newPostSubject === subject ? 'white' : 'var(--text-secondary)',
                                                    border: '1px solid',
                                                    borderColor: newPostSubject === subject ? 'var(--accent-1)' : 'transparent'
                                                }}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea 
                                    value={newPostText}
                                    onChange={(e) => setNewPostText(e.target.value)}
                                    placeholder={
                                        postType === 'image' ? "Escreva uma legenda para sua foto..." : 
                                        postType === 'video' ? "Escreva uma legenda para seu vídeo..." : 
                                        "O que você está estudando hoje?"
                                    }
                                    style={{ 
                                        width: '100%', 
                                        background: 'var(--bg-main)', 
                                        border: '1px solid var(--glass-border)', 
                                        borderRadius: '12px', 
                                        padding: '15px', 
                                        color: 'var(--text-primary)', 
                                        fontWeight: 600,
                                        minHeight: '100px',
                                        resize: 'none',
                                        marginBottom: '15px'
                                    }}
                                />

                                {postType !== 'text' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label className="btn-main" style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '10px', 
                                            padding: '12px',
                                            background: 'var(--bg-main)',
                                            border: '1px dashed var(--glass-border)',
                                            cursor: 'pointer',
                                            borderRadius: '12px'
                                        }}>
                                            <Plus size={20} />
                                            <span>{postType === 'image' ? 'Selecionar Foto do Dispositivo' : 'Selecionar Vídeo do Dispositivo'}</span>
                                            <input 
                                                type="file" 
                                                accept={postType === 'image' ? "image/*" : "video/*"} 
                                                hidden 
                                                onChange={(e) => handlePostFileChange(e, postType as 'image' | 'video')} 
                                            />
                                        </label>
                                        
                                        <div style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.9, textAlign: 'center', fontWeight: 600 }}>Ou cole um link abaixo:</div>
                                        
                                        <input 
                                            type="text"
                                            value={postType === 'image' ? newPostImage : newPostVideo}
                                            onChange={(e) => postType === 'image' ? setNewPostImage(e.target.value) : setNewPostVideo(e.target.value)}
                                            placeholder={postType === 'image' ? "URL da Imagem (ex: https://...)" : "URL do Vídeo (ex: https://...)"}
                                            style={{ 
                                                width: '100%', 
                                                background: 'var(--bg-main)', 
                                                border: '1px solid var(--glass-border)', 
                                                borderRadius: '12px', 
                                                padding: '12px', 
                                                color: 'var(--text-primary)',
                                                fontWeight: 600,
                                                marginTop: '10px'
                                            }}
                                        />

                                        {(newPostImage || newPostVideo) && (
                                            <div style={{ marginTop: '15px', position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '150px', background: '#000' }}>
                                                {postType === 'image' ? (
                                                    <img src={newPostImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                                                        <Video size={32} />
                                                        <span style={{ marginLeft: '10px' }}>Vídeo Selecionado</span>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => postType === 'image' ? setNewPostImage('') : setNewPostVideo('')}
                                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '5px' }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button 
                                    className="btn-main" 
                                    disabled={isPosting || (!newPostText.trim() && !newPostImage && !newPostVideo)}
                                    onClick={async () => {
                                        if (!currentUser || (!newPostText.trim() && !newPostImage && !newPostVideo)) return;
                                        setIsPosting(true);
                                        try {
                                            const postData = {
                                                authorId: currentUser.uid,
                                                authorName: currentUserProfile?.displayName || currentUser.displayName || 'Estudante',
                                                authorPhoto: currentUserProfile?.photoURL || currentUser.photoURL || '',
                                                authorHandle: currentUserProfile?.handle || currentUser.email?.split('@')[0] || 'estudante',
                                                content: newPostText,
                                                imageURL: postType === 'image' ? (newPostImage || null) : null,
                                                videoURL: postType === 'video' ? (newPostVideo || null) : null,
                                                type: postType,
                                                subject: newPostSubject,
                                                likesCount: 0,
                                                commentsCount: 0,
                                                createdAt: serverTimestamp()
                                            };
                                            await addDoc(collection(db, 'posts'), postData);
                                            setNewPostText('');
                                            setNewPostImage('');
                                            setNewPostVideo('');
                                            setShowPostModal(false);
                                            toast.success('Publicação enviada com sucesso! 🚀');
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Erro ao publicar.');
                                        } finally {
                                            setIsPosting(false);
                                        }
                                    }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }}
                                >
                                    {isPosting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    <span>{isPosting ? 'Publicando...' : 'Publicar no Feed'}</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {canScrollDown && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        onClick={() => {
                                            postModalRef.current?.scrollTo({
                                                top: postModalRef.current.scrollHeight,
                                                behavior: 'smooth'
                                            });
                                        }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '20px',
                                            right: '20px',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'var(--accent-1)',
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            cursor: 'pointer',
                                            zIndex: 20
                                        }}
                                    >
                                        <ChevronDown size={24} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                url={shareData.url}
                title={shareData.title}
                text={shareData.text}
                theme={theme}
            />

            <AnimatePresence>
                {followModalType && (
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setFollowModalType(null) }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', width: '100%', maxWidth: '400px', minHeight: '300px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{followModalType === 'followers' ? 'Seguidores' : 'Seguindo'}</h2>
                                <button onClick={() => setFollowModalType(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                {loadingFollows ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-accent-1" size={30} /></div>
                                ) : followModalUsers.length === 0 ? (
                                    <div className="text-center text-zinc-500 py-10">Nenhum usuário encontrado.</div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {followModalUsers.map(u => (
                                            <div key={u.uid} className="flex items-center justify-between">
                                                <Link to={`/perfil?uid=${u.uid}`} onClick={() => setFollowModalType(null)} className="flex items-center gap-3">
                                                    <UserAvatar uid={u.uid} fallbackPhoto={u.photoURL} avatarEdited={u.avatarEdited} className="w-10 h-10" />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-[var(--text-primary)] hover:underline">{u.displayName || 'Estudante'}</span>
                                                        <span className="text-xs text-zinc-500">@{u.handle || 'estudante'}</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </Layout>
    );
};

export default Profile;
