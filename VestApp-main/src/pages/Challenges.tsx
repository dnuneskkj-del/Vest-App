import { useState, useEffect, useMemo, ReactElement, cloneElement } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UserAvatar from '../components/UserAvatar';
import { auth, db, onAuthStateChanged, handleFirestoreError, OperationType } from '../firebase';
import { safeLocalStorage } from '../lib/storage';
import { 
    doc, 
    onSnapshot, 
    collection, 
    query, 
    orderBy, 
    limit,
    updateDoc,
    increment,
    getDoc,
    runTransaction
} from 'firebase/firestore';
import { UserProfile, Post as PostType } from '../types';
import TrendsSidebar from '../components/TrendsSidebar';
import { useTrendingData } from '../hooks/useTrendingData';
import { 
    Award, 
    Trophy, 
    Zap, 
    Star, 
    Brain, 
    Target, 
    BookOpen, 
    Gamepad2, 
    Puzzle, 
    HelpCircle, 
    ChevronRight, 
    Search,
    Filter,
    Clock,
    Flame,
    Users,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    ArrowRight,
    Play,
    Info,
    ArrowUpRight,
    Layers,
    Lightbulb,
    Leaf,
    Globe,
    Share2,
    Palette,
    Dumbbell,
    Languages,
    PenTool,
    Scale,
    Timer,
    TrendingUp,
    User,
    Shield,
    Swords,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Medal,
    Map,
    Gamepad,
    Lock,
    Settings,
    Activity,
    Cpu,
    Skull,
    Sparkles,
    Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CONTENT_ITEMS, ContentItem, GameType } from '../data/challengesContent';
import { QUESTIONS_BY_TOPIC, Question } from '../data/questionsData';

// --- Constants ---

const SUBJECTS = [
    { id: 'linguagens', name: 'Linguagens', icon: <BookOpen size={18} />, color: '#E91E63' },
    { id: 'humanos', name: 'Humanos', icon: <Globe size={18} />, color: '#795548' },
    { id: 'natureza', name: 'Natureza', icon: <Leaf size={18} />, color: '#4CAF50' },
    { id: 'math', name: 'Matemática', icon: <Target size={18} />, color: '#FF4D4D' },
];

const houseColors: Record<string, string> = {
    'Corvinal': 'from-blue-600/10 via-indigo-600/5 to-blue-800/10 dark:from-blue-950/50 dark:via-slate-900/40 dark:to-indigo-950/50 text-blue-600 dark:text-blue-400 border-blue-500/25 dark:border-blue-500/45 shadow-lg shadow-blue-500/5 bg-blue-500/5 dark:bg-blue-950/15',
    'Grifinória': 'from-red-600/10 via-amber-600/5 to-yellow-600/10 dark:from-red-950/50 dark:via-slate-900/40 dark:to-yellow-950/15 text-red-600 dark:text-red-400 border-red-500/25 dark:border-red-500/45 shadow-lg shadow-red-500/5 bg-red-500/5 dark:bg-red-950/15',
    'Sonserina': 'from-emerald-600/10 via-teal-600/5 to-slate-700/10 dark:from-emerald-950/50 dark:via-slate-900/40 dark:to-slate-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/45 shadow-lg shadow-emerald-500/5 bg-emerald-500/5 dark:bg-emerald-950/15',
    'Lufa-Lufa': 'from-yellow-400/10 via-stone-600/5 to-zinc-800/10 dark:from-yellow-950/30 dark:via-slate-900/40 dark:to-stone-950/40 text-amber-600 dark:text-amber-400 border-amber-500/25 dark:border-amber-500/45 shadow-lg shadow-amber-500/5 bg-amber-500/5 dark:bg-amber-950/15'
};

const GAME_TYPES = [
    { id: 'all', name: 'Todos', icon: <Layers size={16} /> },
    { id: 'duel', name: 'Duelo 1v1', icon: <Swords size={16} /> },
    { id: 'tower', name: 'Torre', icon: <Shield size={16} /> },
    { id: 'quiz', name: 'Questões', icon: <HelpCircle size={16} /> },
    { id: 'anagram', name: 'Anagrama', icon: <Cpu size={16} /> },
    { id: 'box', name: 'Abrir Caixa', icon: <Layers size={16} /> },
    { id: 'wheel', name: 'Roleta', icon: <Activity size={16} /> },
    { id: 'true_false', name: 'V ou F', icon: <CheckCircle2 size={16} /> },
    { id: 'match', name: 'Combinar', icon: <Puzzle size={16} /> },
    { id: 'whack', name: 'Toupeira', icon: <Target size={16} /> },
    { id: 'memory', name: 'Memória', icon: <Puzzle size={16} /> },
    { id: 'flashcards', name: 'Cards', icon: <Zap size={16} /> },
    { id: 'speed', name: 'Rápido', icon: <Timer size={16} /> },
];

const RANKING_DATA = [
    { rank: 1, name: 'Marcos Silva', xp: '124.5k', avatar: 'https://i.pravatar.cc/150?u=1', status: 'up', trend: '+1.2k' },
    { rank: 2, name: 'Julia Santos', xp: '118.2k', avatar: 'https://i.pravatar.cc/150?u=2', status: 'stable', trend: '0' },
    { rank: 3, name: 'Pedro Oliver', xp: '115.9k', avatar: 'https://i.pravatar.cc/150?u=3', status: 'down', trend: '-200' },
    { rank: 4, name: 'Ana Costa', xp: '98.4k', avatar: 'https://i.pravatar.cc/150?u=4', status: 'up', trend: '+4.5k' },
    { rank: 5, name: 'Lucas Lima', xp: '87.1k', avatar: 'https://i.pravatar.cc/150?u=5', status: 'up', trend: '+800' },
    { rank: 6, name: 'Gê (Você)', xp: '14.2k', avatar: 'https://i.pravatar.cc/150?u=me', status: 'stable', trend: '+300', isMe: true },
    { rank: 7, name: 'Carla Dias', xp: '12.8k', avatar: 'https://i.pravatar.cc/150?u=7', status: 'down', trend: '-50' },
];

// --- Components ---

const computePhOfTitration = (targetMolarity: number, volumeBaseMl: number): number => {
    const volumeAcidMl = 20.0;
    const baseMolarity = 0.1;
    const molesAcid = (volumeAcidMl / 1000.0) * targetMolarity;
    const molesBase = (volumeBaseMl / 1000.0) * baseMolarity;
    const totalVolumeL = (volumeAcidMl + volumeBaseMl) / 1000.0;
    
    if (Math.abs(molesAcid - molesBase) < 1e-7) {
        return 7.0;
    } else if (molesAcid > molesBase) {
        const remainingH = molesAcid - molesBase;
        const concH = remainingH / totalVolumeL;
        const ph = -Math.log10(concH);
        return Math.max(1.0, parseFloat(ph.toFixed(2)));
    } else {
        const excessOH = molesBase - molesAcid;
        const concOH = excessOH / totalVolumeL;
        const poh = -Math.log10(concOH);
        const ph = 14.0 - poh;
        return Math.min(13.9, parseFloat(ph.toFixed(2)));
    }
};

const REALISTIC_RIVALS = [
    { id: 'rival_1', name: 'Mariana Med USP', xp: 14850, level: 15, acc: '94%', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'up', trend: '+1' },
    { id: 'rival_2', name: 'Lucas FUVEST Eng', xp: 12200, level: 13, acc: '89%', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'stable', trend: '0' },
    { id: 'rival_3', name: 'Bia Direito Unicamp', xp: 9550, level: 10, acc: '91%', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', status: 'up', trend: '+2' },
    { id: 'rival_4', name: 'Pedro ENEM 900+', xp: 7400, level: 8, acc: '85%', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'down', trend: '-1' },
    { id: 'rival_5', name: 'Juliana Med Unifesp', xp: 11150, level: 12, acc: '90%', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', status: 'stable', trend: '0' },
    { id: 'rival_6', name: 'Thiago Poli USP', xp: 8300, level: 9, acc: '87%', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', status: 'up', trend: '+1' },
    { id: 'rival_7', name: 'Gabriela Psico Federal', xp: 5100, level: 6, acc: '88%', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', status: 'stable', trend: '0' },
    { id: 'rival_8', name: 'Felipe Econ Insper', xp: 4200, level: 5, acc: '84%', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', status: 'down', trend: '-2' },
    { id: 'rival_9', name: 'Carla Letras Unesp', xp: 2950, level: 3, acc: '82%', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', status: 'up', trend: '+1' },
    { id: 'rival_10', name: 'Bruno Relações Int', xp: 1800, level: 2, acc: '80%', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', status: 'stable', trend: '0' }
];

const Challenges = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });

    useEffect(() => {
        const handleThemeChange = () => {
            const savedTheme = (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
            setTheme(savedTheme);
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => {
            window.removeEventListener('theme-changed', handleThemeChange);
        };
    }, []);

    const { 
        trendingSubjects, 
        topTrendingPhotos, 
        topTrendingPosts, 
        onlineUsers 
    } = useTrendingData(auth.currentUser);

    const [activeTrendView, setActiveTrendView] = useState<{name: string, category: string} | null>(null);
    const [activeSubject, setActiveSubject] = useState('Todos');
    const [activeType, setActiveType] = useState<GameType | 'all'>('all');
    const [activeDifficulty, setActiveDifficulty] = useState<'Todos' | 'Fácil' | 'Médio' | 'Difícil'>('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGame, setSelectedGame] = useState<ContentItem | null>(null);
    const [gameState, setGameState] = useState<'lobby' | 'playing' | 'results'>('lobby');
    const [hubTab, setHubTab] = useState<'central' | 'ranking' | 'conquistas' | 'castle'>('central');
    const [rankingData, setRankingData] = useState<any[]>([]);
    
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);

    const openPostModal = (post: PostType) => {
        setSelectedPost(post);
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
        onSnapshot(q, (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostComments(commentList);
        });
    };

    // XP Formatter Utility
    const formatXP = (xp: number) => {
        if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
        return xp.toString();
    };

    // Handle smooth navigation to cockpit tabs from the top stats blocks
    const handleStatCardClick = (tabId: 'central' | 'ranking' | 'conquistas' | 'castle') => {
        setHubTab(tabId);
        setTimeout(() => {
            const el = document.getElementById('hub-cockpit-navigation');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 80);
    };

    // Ranking Listener with only actual registered users from the database
    useEffect(() => {
        const rankingQuery = query(
            collection(db, 'users'),
            orderBy('xp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(rankingQuery, (snapshot) => {
            const dbUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.displayName || 'Estudante',
                    rawXp: data.xp || 0,
                    avatar: data.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${doc.id}`,
                    isMe: doc.id === auth.currentUser?.uid,
                    level: data.level || 1,
                    acc: Math.min(100, Math.round(((data.xp || 0) % 1000) / 10)) + '%',
                    status: 'stable',
                    trend: '0'
                };
            }).filter((u: any) => true);

            dbUsers.sort((a, b) => b.rawXp - a.rawXp);

            const ranked = dbUsers.map((user, idx) => ({
                rank: idx + 1,
                name: user.name,
                xp: user.rawXp.toLocaleString('pt-BR'),
                avatar: user.avatar,
                status: 'stable',
                trend: '0',
                isMe: user.isMe,
                level: user.level,
                acc: user.acc
            }));

            setRankingData(ranked);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'users');
        });

        return () => unsubscribe();
    }, [userProfile?.xp]);
    
    // Game States
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

    const finishGame = async (finalScore: number, baseXP: number) => {
        if (!currentUser) return;

        try {
            // Adjust XP based on performance (score bonus)
            const performanceBonus = Math.floor(finalScore / 100);
            const totalGainedXP = baseXP + performanceBonus;
            const userRef = doc(db, 'users', currentUser.uid);

            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("Usuário não encontrado");
                
                const userData = userDoc.data();
                const currentXP = userData.xp || 0;
                const newXP = currentXP + totalGainedXP;
                const newLevel = Math.floor(newXP / 1000) + 1;

                transaction.update(userRef, {
                    xp: newXP,
                    level: newLevel,
                    updatedAt: new Date().toISOString()
                });
            });

            toast.success(`Fim de jogo! +${totalGainedXP} XP`, {
                description: `Sincronizado com sucesso.`,
                icon: '🚀'
            });

            setGameState('results');
        } catch (error) {
            console.error("Error saving game results:", error);
            toast.error("Erro ao sincronizar resultados.");
            setGameState('results');
        }
    };

    // Auth Listeners & Profile Sync
    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;
        
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                // Subscribe to user profile changes in Firestore
                const userRef = doc(db, 'users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserProfile(snapshot.data() as UserProfile);
                    }
                }, (error) => {
                    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
                });
            } else {
                setUserProfile(null);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [memoryCards, setMemoryCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [speedActive, setSpeedActive] = useState(false);
    const [opponentHp, setOpponentHp] = useState(100);
    const [myHp, setMyHp] = useState(100);
    const [activeFloor, setActiveFloor] = useState(1);

    // Wordwall Games State
    const [anagramWord, setAnagramWord] = useState('');
    const [scrambledLetters, setScrambledLetters] = useState<{char: string, id: number}[]>([]);
    const [userLetters, setUserLetters] = useState<{char: string, id: number}[]>([]);
    const [boxes, setBoxes] = useState<{id: number, isOpen: boolean, questionIndex: number}[]>([]);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [hangmanWord, setHangmanWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [matchPairs, setMatchPairs] = useState<any[]>([]);
    const [whackTargets, setWhackTargets] = useState<any[]>([]);
    const [gameTimer, setGameTimer] = useState(30);

    // --- Custom Premium Interactive Games States ---
    // 1. Math Zombies (Invasão Zombie de Matemática)
    const [zombies, setZombies] = useState<{ id: number; equation: string; answer: number; distance: number; status: 'alive' | 'dying' }[]>([]);
    const [mathInput, setMathInput] = useState('');
    const [zombiesKilled, setZombiesKilled] = useState(0);

    // 2. Chemistry Lab (Virtual Acid-Base indicator experiment)
    const [liquidColor, setLiquidColor] = useState('bg-blue-200/40');
    const [solutionPh, setSolutionPh] = useState(7.0);
    const [chemicalBeakerState, setChemicalBeakerState] = useState<'idle' | 'bubbling' | 'neutralized'>('idle');
    const [isHeated, setIsHeated] = useState(false);
    const [addedChemicals, setAddedChemicals] = useState<string[]>([]);
    
    // New Interactive Game Selection States
    const [chemExperimentMode, setChemExperimentMode] = useState<'neutralize' | 'titration'>('neutralize');
    const [chemTargetMolarity, setChemTargetMolarity] = useState(0.10); // can be 0.05, 0.10, 0.15, or 0.20
    const [chemVolumeBaseGasto, setChemVolumeBaseGasto] = useState(0.0);
    const [chemSelectedIndicator, setChemSelectedIndicator] = useState<'Nenhum' | 'Fenolftaleína' | 'Azul de Bromotimol'>('Nenhum');
    const [chemStage, setChemStage] = useState<'setup' | 'titrating' | 'calculating' | 'solved'>('setup');
    const [chemMolarityAnswer, setChemMolarityAnswer] = useState<number | null>(null);

    // New History Period Select State
    const [timelinePeriod, setTimelinePeriod] = useState<'brasil' | 'franca' | 'roma' | 'guerra_mundial'>('brasil');

    // New Hangman Topic Selection
    const [hangmanTopic, setHangmanTopic] = useState<'biologia' | 'fisica' | 'quimica' | 'literatura' | 'geopolitica'>('biologia');

    // New Memory Topic Selection
    const [memoryTopic, setMemoryTopic] = useState<'biologia' | 'fisica' | 'gramatica' | 'historia' | 'quimica'>('biologia');
    
    // New Math Zombie Topic Selection
    const [zombieTopic, setZombieTopic] = useState<'aritmética' | 'equações' | 'sequências' | 'combinatória'>('aritmética');
    const [zombieDifficultyLevel, setZombieDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Wizard/Hogwarts Adventure Gamification State
    const [magicalHouse, setMagicalHouse] = useState<'Corvinal' | 'Grifinória' | 'Sonserina' | 'Lufa-Lufa'>(
        () => (safeLocalStorage.getItem('magicalHouse') as any) || 'Corvinal'
    );
    const [magicalWand, setMagicalWand] = useState<'Pena de Fênix' | 'Fibra de Dragão' | 'Pelo de Unicórnio'>('Pena de Fênix');
    const [castleFloor, setCastleFloor] = useState<'all' | 'dungeon' | 'ground' | 'tower'>('all');
    const [lastSpelledRoom, setLastSpelledRoom] = useState<string | null>(null);

    // 3. Jogo da Velha (Gramática / Português)
    const [ticTacToeBoard, setTicTacToeBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [ticTacToeActiveIndex, setTicTacToeActiveIndex] = useState<number | null>(null);
    const [ticTacToeWinner, setTicTacToeWinner] = useState<string | null>(null);
    const [ticTacToeQuestions, setTicTacToeQuestions] = useState<{ text: string; options: string[]; correct: number; explanation: string }[]>([]);
    const [ticTacToeCurrentQuestion, setTicTacToeCurrentQuestion] = useState<any>(null);

    // 4. Bio Cell Anatomy Mapping
    const [selectedBioPart, setSelectedBioPart] = useState<string | null>(null);
    const [bioUnlockedParts, setBioUnlockedParts] = useState<string[]>([]);
    const [bioAnatomyStatus, setBioAnatomyStatus] = useState<string>('Clique nos marcadores azuis brilhantes para interagir e nomear as organelas.');

    // 5. History Timeline (With Corvo Professor)
    const [timelineItems, setTimelineItems] = useState<{ id: string; year: string; event: string; index: number; description: string }[]>([]);
    const [timelineHintUsed, setTimelineHintUsed] = useState(false);
    const [corvoSpeech, setCorvoSpeech] = useState("Olá, jovem historiador! Eu sou o Corvo Sábio, seu professor e guia temporal. Hoje vamos ordenar os marcos que formaram a nossa história nacional.");

    // 6. UNIVERSAL INTERACTIVE LAB ARENA STATE
    const [labStep, setLabStep] = useState(1);
    const [labHearts, setLabHearts] = useState(3);
    const [labFormulaResult, setLabFormulaResult] = useState('');
    const [labSelectedAnswer, setLabSelectedAnswer] = useState<string | null>(null);
    const [labGameEngine, setLabGameEngine] = useState<any>(null);
    const [labFeedbackMessage, setLabFeedbackMessage] = useState<string>('');
    const [labCustomInput, setLabCustomInput] = useState('');
    const [labSuccessChain, setLabSuccessChain] = useState<boolean[]>([]);

    const filteredItems = CONTENT_ITEMS.filter(item => {
        const subjectMatch = activeSubject === 'Todos' || item.subject === activeSubject;
        
        let typeMatch = true;
        if ((activeType as string) === 'premium') {
            typeMatch = ['chemistry_lab', 'history_timeline', 'math_zombies', 'tic_tac_toe', 'bio_anatomy'].includes(item.type);
        } else if ((activeType as string) === 'hangman') {
            typeMatch = item.type === 'hangman';
        } else if ((activeType as string) === 'memory') {
            typeMatch = item.type === 'memory';
        } else if ((activeType as string) === 'quiz') {
            typeMatch = item.type === 'quiz';
        } else if ((activeType as string) === 'others') {
            typeMatch = !['chemistry_lab', 'history_timeline', 'math_zombies', 'tic_tac_toe', 'bio_anatomy', 'hangman', 'memory', 'quiz'].includes(item.type);
        } else if ((activeType as string) !== 'all') {
            typeMatch = item.type === activeType;
        }

        const difficultyMatch = activeDifficulty === 'Todos' || item.difficulty === activeDifficulty;
        const searchMatch = searchQuery.trim() === '' || 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return subjectMatch && typeMatch && difficultyMatch && searchMatch;
    });

    // --- Game Logic ---

    const startQuiz = () => {
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswered(false);
    };

    const startMemory = (topic?: 'biologia' | 'fisica' | 'gramatica' | 'historia' | 'quimica') => {
        const activeT = topic || memoryTopic;
        setMemoryTopic(activeT);

        const contentsMap = {
            biologia: ['Célula', 'DNA', 'RNA', 'Mitocôndria', 'Membrana', 'Cloroplasto', 'Núcleo', 'Organelas'],
            fisica: ['Newton', 'Inércia', 'Força', 'Velocidade', 'Aceleração', 'Energia', 'Atrito', 'Trabalho'],
            gramatica: ['Sintaxe', 'Verbo', 'Sujeito', 'Crase', 'Vírgula', 'Pronome', 'Adjetivo', 'Advérbio'],
            historia: ['Império', 'República', 'Vargas', 'Colônia', 'Monarquia', 'Revolução', 'Tratado', 'Guerra'],
            quimica: ['Próton', 'Elétron', 'Átomo', 'Molécula', 'Ácido', 'Base', 'Amônia', 'Reação']
        };

        const contents = contentsMap[activeT] || contentsMap.biologia;
        const deck = [...contents, ...contents]
            .sort(() => Math.random() - 0.5)
            .map((content, index) => ({ id: index, content, isFlipped: false, isMatched: false }));
        setMemoryCards(deck);
        setGameState('playing');
        setFlippedIndices([]);
        setScore(0);
        setCorrectAnswersCount(0);
    };

    const startSpeed = () => {
        setGameState('playing');
        setTimeLeft(30);
        setSpeedActive(true);
        setScore(0);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
    };

    const startDuel = () => {
        setGameState('playing');
        setMyHp(100);
        setOpponentHp(100);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
    };

    const startTower = () => {
        setGameState('playing');
        setActiveFloor(1);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
    };

    const startAnagram = () => {
        const words = ['LITERATURA', 'GRAMATICA', 'POESIA', 'REALISMO', 'MODERNISMO', 'ROMANTISMO', 'METAFORA'];
        const word = words[Math.floor(Math.random() * words.length)];
        setAnagramWord(word);
        const chars = word.split('').map((char, i) => ({ char, id: i }));
        setScrambledLetters([...chars].sort(() => Math.random() - 0.5));
        setUserLetters([]);
        setGameState('playing');
        setScore(0);
    };

    const startBox = () => {
        const newBoxes = Array.from({ length: 9 }).map((_, i) => ({
            id: i,
            isOpen: false,
            questionIndex: Math.floor(Math.random() * 5)
        }));
        setBoxes(newBoxes);
        setGameState('playing');
        setScore(0);
    };

    const startWheel = () => {
        setGameState('playing');
        setWheelRotation(0);
        setIsSpinning(false);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
    };

    const startHangman = (topic?: 'biologia' | 'fisica' | 'quimica' | 'literatura' | 'geopolitica') => {
        const activeT = topic || hangmanTopic;
        setHangmanTopic(activeT);
        
        const wordsMap = {
            biologia: ['MITOCONDRIA', 'CITOPLASMA', 'CENTRIOLO', 'RIBOSSOMO', 'LISOSSOMO', 'CELULA', 'NUCLEO', 'MEMBRANA', 'CROMOSSOMO', 'GENETICA'],
            fisica: ['ELETROMAGNETISMO', 'ONDULATORIA', 'ACELERACAO', 'INERCIA', 'TERMODINAMICA', 'FORCA', 'TRABALHO', 'VELOCIDADE', 'DIFRACAO', 'REFRACOES'],
            quimica: ['ESTEQUIOMETRIA', 'ELETROQUIMICA', 'HIDROCARBONETO', 'FENOLFTALEINA', 'BROMOTIMOL', 'SOLUBILIDADE', 'ATOMICA', 'ORGANICA', 'CONCENTRACAO', 'MISTURAS'],
            literatura: ['MODERNISMO', 'ROMANTISMO', 'REALISMO', 'MACHADODEASSIS', 'BARROCO', 'ARCADISMO', 'PARNASIANISMO', 'SIMBOLISMO', 'ALENCAR', 'GONCALVESDIAS'],
            geopolitica: ['GLOBALIZACAO', 'SUSTENTABILIDADE', 'CLIMATOLOGIA', 'NEOLIBERALISMO', 'DEMOGRAFIA', 'INDUSTRIALIZACAO', 'URBANIZACAO', 'MIGRACOES', 'RELEVO', 'ECOSSISTEMAS']
        };

        const words = wordsMap[activeT] || wordsMap.biologia;
        setHangmanWord(words[Math.floor(Math.random() * words.length)]);
        setGuessedLetters([]);
        setWrongGuesses(0);
        setGameState('playing');
        setScore(0);
        setCorrectAnswersCount(0);
    };

    const startMathZombies = (topic?: 'aritmética' | 'equações' | 'sequências' | 'combinatória', diff?: 'easy' | 'medium' | 'hard') => {
        const activeT = topic || zombieTopic;
        const activeD = diff || zombieDifficultyLevel;
        setZombieTopic(activeT);
        setZombieDifficultyLevel(activeD);
        setGameState('playing');
        setZombiesKilled(0);
        setMathInput('');
        setScore(0);

        let initialZombies = [];
        if (activeT === 'aritmética') {
            initialZombies = [
                { id: 1, equation: activeD === 'easy' ? '4 x 7' : activeD === 'medium' ? '12 x 8' : '15 x 14', answer: activeD === 'easy' ? 28 : activeD === 'medium' ? 96 : 210, distance: 80, status: 'alive' as const },
                { id: 2, equation: activeD === 'easy' ? '25 + 18' : activeD === 'medium' ? '137 - 59' : '344 + 566', answer: activeD === 'easy' ? 43 : activeD === 'medium' ? 78 : 910, distance: 110, status: 'alive' as const },
                { id: 3, equation: activeD === 'easy' ? '45 ÷ 9' : activeD === 'medium' ? '144 ÷ 12' : '625 ÷ 25', answer: activeD === 'easy' ? 5 : activeD === 'medium' ? 12 : 25, distance: 150, status: 'alive' as const },
            ];
        } else if (activeT === 'equações') {
            initialZombies = [
                { id: 1, equation: 'x + 12 = 30', answer: 18, distance: 80, status: 'alive' as const },
                { id: 2, equation: '3x - 5 = 16', answer: 7, distance: 110, status: 'alive' as const },
                { id: 3, equation: '2x + 8 = x + 15', answer: 7, distance: 150, status: 'alive' as const },
            ];
        } else if (activeT === 'sequências') {
            initialZombies = [
                { id: 1, equation: 'PA: 2, 5, 8, __', answer: 11, distance: 80, status: 'alive' as const },
                { id: 2, equation: 'PG: 1, 3, 9, __', answer: 27, distance: 110, status: 'alive' as const },
                { id: 3, equation: 'PA: a₁=5, r=4. a₃=__', answer: 13, distance: 150, status: 'alive' as const },
            ];
        } else if (activeT === 'combinatória') {
            initialZombies = [
                { id: 1, equation: 'Permutação P(3)', answer: 6, distance: 80, status: 'alive' as const },
                { id: 2, equation: 'Arranjo A(4,2)', answer: 12, distance: 110, status: 'alive' as const },
                { id: 3, equation: 'Combinação C(5,2)', answer: 10, distance: 150, status: 'alive' as const },
            ];
        }

        setZombies(initialZombies);
    };

    const startChemistryLab = (mode?: 'neutralize' | 'titration') => {
        const activeM = mode || chemExperimentMode;
        setChemExperimentMode(activeM);
        setGameState('playing');
        setLiquidColor('bg-blue-300/40');
        setAddedChemicals([]);
        setScore(0);
        setCorrectAnswersCount(0);
        setChemSelectedIndicator('Nenhum');

        if (activeM === 'neutralize') {
            // Acidic or basic starting pH
            const isAcidic = Math.random() >= 0.5;
            const initialPh = isAcidic 
                ? parseFloat((1.5 + Math.random() * 2.0).toFixed(1)) 
                : parseFloat((10.5 + Math.random() * 2.0).toFixed(1));
            setSolutionPh(initialPh);
            setChemicalBeakerState('idle');
            setChemStage('titrating');
        } else {
            // TITRATION stoichiometric challenge
            // target concentration can be 0.05, 0.10, 0.15, or 0.20 M
            const targetMolarities = [0.05, 0.10, 0.15, 0.20];
            const chosen = targetMolarities[Math.floor(Math.random() * targetMolarities.length)];
            setChemTargetMolarity(chosen);
            setChemVolumeBaseGasto(0.0);
            setSolutionPh(1.0); // starts strongly acidic
            setChemStage('setup');
            setChemMolarityAnswer(null);
        }
    };

    const startTicTacToe = () => {
        setGameState('playing');
        setTicTacToeBoard(Array(9).fill(null));
        setTicTacToeWinner(null);
        setTicTacToeActiveIndex(null);
        setScore(0);
        const grammarQuestionsRaw = [
            { text: 'Assinale a frase com o uso ADEQUADO da crase:', options: ['Refiro-me à professora da mesa ao lado.', 'Parabenizei à ela pelo excelente desempenho.', 'Dirigi-me a algum mercado no caminho.', 'Cheguei à pé mas cansado.'], correct: 0, explanation: 'A crase ocorre diante de substantivo feminino determinado ("à professora"). É incorreta antes de pronomes ("ela"), artigos indefinidos ("algum") ou palavras masculinas ("pé").' },
            { text: 'Escolha a frase que apresenta CONCORDÂNCIA correta:', options: ['Seguem anexas as cópias requisitadas.', 'Seguem anexo as cópias requisitadas.', 'Faziam dez anos que não visitava a capital.', 'Suco de maracujá é bom para a saúde.'], correct: 0, explanation: '"Anexo" deve concordar com o substantivo: "anexas as cópias". E o verbo fazer com sentido de tempo decorrido fica sempre no singular ("Faz dez anos").' },
            { text: 'Sabendo reger corretamente a regência verbal, selecione:', options: ['Nós assistimos o filme maravilhoso.', 'Nós assistimos ao filme maravilhoso.', 'Ele aspira o cargo de reitor.', 'Esqueci do livro na biblioteca.'], correct: 1, explanation: 'O verbo "assistir" no sentido de ver exige a preposição a ("assistir ao filme"). "Aspirar" no sentido de almejar também exige "a" ("aspira ao cargo").' },
            { text: 'Identifique a alternativa onde há desvio ortográfico:', options: ['Viagem de volta', 'Espero que eles viajem', 'Quero analisar os dados', 'Foi uma excessão no regulamento'], correct: 3, explanation: '"Exceção" se escreve com "ç" e não com "ss". Os outros estão perfeitamente corretos.' },
            { text: 'Qual das conjunções abaixo expressa uma ideia adversativa?', options: ['Embora', 'Porém', 'Portanto', 'Contanto que'], correct: 1, explanation: '"Porém", "mas", "todavia" e "contudo" são conjunções adversativas (oposição, contraste).' },
            { text: 'Em qual frase o pronome de tratamento está incorreto?', options: ['Vossa Excelência merece os méritos (para juiz).', 'Vossa Santidade ministrou missa (para Papa).', 'Vossa Senhoria assinará o recibo (diretores).', 'Vossa Majestade governará o império (para sacerdotes).'], correct: 3, explanation: 'Vossa Majestade é dedicado a reis e imperadores, não a sacerdotes (que recebem Vossa Reverendíssima).' }
        ];

        const grammarQuestions = grammarQuestionsRaw.map(q => {
            const mappedOptions = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correct }));
            const shuffled = [...mappedOptions].sort(() => Math.random() - 0.5);
            return {
                ...q,
                options: shuffled.map(o => o.text),
                correct: shuffled.findIndex(o => o.isCorrect)
            };
        });

        setTicTacToeQuestions(grammarQuestions.sort(() => Math.random() - 0.5));
        setTicTacToeCurrentQuestion(null);
    };

    const startBioAnatomy = () => {
        setGameState('playing');
        setSelectedBioPart(null);
        setBioUnlockedParts([]);
        setScore(0);
        setBioAnatomyStatus('Excelente! Clique nos marcadores brilhantes do diagrama celular para examinar as organelas.');
    };

    const startHistoryTimeline = (period?: 'brasil' | 'franca' | 'roma' | 'guerra_mundial') => {
        const activeP = period || timelinePeriod;
        setTimelinePeriod(activeP);
        setGameState('playing');
        setTimelineHintUsed(false);
        setScore(0);
        
        let speech = "Olá, historiador! Eu sou o Corvo Sábio. Ordene os marcos cronologicamente puxando-os com cuidado!";
        let events = [];

        if (activeP === 'brasil') {
            speech = "Vamos organizar os maiores marcos da formação histórica do Brasil, do descobrimento à redemocratização.";
            events = [
                { id: 'ev1', year: '1500', event: 'Chegada dos Portugueses', index: 0, description: 'Cabral desembarca na Bahia.' },
                { id: 'ev2', year: '1808', event: 'Família Real no Brasil', index: 1, description: 'Abertura dos Portos e fim do Pacto Colonial.' },
                { id: 'ev3', year: '1822', event: 'Independência do Brasil', index: 2, description: 'D. Pedro I sela a separação de Portugal.' },
                { id: 'ev4', year: '1888', event: 'Assinatura da Lei Áurea', index: 3, description: 'Fim formal da escravidão no país.' },
                { id: 'ev5', year: '1889', event: 'Proclamação da República', index: 4, description: 'Entrada das forças armadas e fim do Império.' },
                { id: 'ev6', year: '1930', event: 'Ascensão de Getúlio Vargas', index: 5, description: 'Fim da República Velha e início da Era Vargas.' }
            ];
        } else if (activeP === 'franca') {
            speech = "Ah, l'humanité! A Revolução Francesa derrubou o Antigo Regime. Vamos ordenar os fatos históricos cruciais!";
            events = [
                { id: 'ev1', year: '1789', event: 'Queda da Bastilha', index: 0, description: 'O sismo popular marca o fim do absolutismo.' },
                { id: 'ev2', year: '1792', event: 'Proclamação da República', index: 1, description: 'Fim da monarquia e início do calendário republicano.' },
                { id: 'ev3', year: '1793', event: 'Execução do Rei Luís XVI', index: 2, description: 'O rei é guilhotinado sob a acusação de traição.' },
                { id: 'ev4', year: '1794', event: 'Queda de Robespierre', index: 3, description: 'Fim do Período do Terror jacobino.' },
                { id: 'ev5', year: '1799', event: 'Golpe do 18 de Brumário', index: 4, description: 'Ascensão de Napoleão Bonaparte ao poder.' },
                { id: 'ev6', year: '1815', event: 'Batalha de Waterloo', index: 5, description: 'Queda definitiva de Napoleão e exílio em Santa Helena.' }
            ];
        } else if (activeP === 'roma') {
            speech = "Senatus Populusque Romanus! Roma consolidou todo o Mediterrâneo. Ordene estes episódios épicos!";
            events = [
                { id: 'ev1', year: '753 a.C.', event: 'Fundação de Roma', index: 0, description: 'Mito de Rômulo e Remo e estabelecimento da monarquia.' },
                { id: 'ev2', year: '509 a.C.', event: 'Instauração da República', index: 1, description: 'Queda do rei Tarquínio e domínio do Senado Romano.' },
                { id: 'ev3', year: '44 a.C.', event: 'Assassinato de Júlio César', index: 2, description: 'Idos de Março: conspiração sela asfixia da república.' },
                { id: 'ev4', year: '27 a.C.', event: 'Início do Império', index: 3, description: 'Otávio Augusto torna-se o primeiro imperador de Roma.' },
                { id: 'ev5', year: '313 d.C.', event: 'Edito de Milão', index: 4, description: 'Constantino legaliza a fé cristã através de tolerância religiosa.' },
                { id: 'ev6', year: '476 d.C.', event: 'Queda de Roma Ocidente', index: 5, description: 'Rômulo Augusto é deposto por Odoacro dos Hérulos.' }
            ];
        } else if (activeP === 'guerra_mundial') {
            speech = "O século XX foi marcado pelo maior conflito armado global. Vamos organizar os deveses da Segunda Guerra!";
            events = [
                { id: 'ev1', year: '1939', event: 'Invasão da Polônia', index: 0, description: 'Alemanha nazista ataca bólidos poloneses detonando a guerra.' },
                { id: 'ev2', year: '1941', event: 'Ataque à Pearl Harbor', index: 1, description: 'Império japonês ataca base naval forçando entrada dos EUA.' },
                { id: 'ev3', year: '1942', event: 'Batalha de Stalingrado', index: 2, description: 'Soviéticos resistem aos nazistas no ponto de virada da guerra.' },
                { id: 'ev4', year: '1944', event: 'Dia D (Normandia)', index: 3, description: 'Desembarque das tropas aliadas na costa francesa ocupada.' },
                { id: 'ev5', year: '1945', event: 'Atomização de Hiroshima', index: 4, description: 'Bombardeio atômico norte-americano encerra a resistência nipônica.' },
                { id: 'ev6', year: '1945 (Fim)', event: 'Fundação da ONU', index: 5, description: 'Criação das Nações Unidas para assegurar a paz duradoura.' }
            ];
        }

        setCorvoSpeech(speech);
        // randomize positions
        const scrambled = [...events]
            .map((item) => ({ ...item, rand: Math.random() }))
            .sort((a,b) => a.rand - b.rand)
            .map((item, idx) => ({ ...item, index: idx }));
        setTimelineItems(scrambled);
    };

    const generateLabTask = (gameId: string, step: number) => {
        let title = "Desafio Científico Interativo";
        let instructions = "Resolva a questão interativa apresentada pelo Professor Corvo Mentor.";
        let question = "Calculando as variáveis estruturais do vestibular...";
        let options: string[] = ["Opção A", "Opção B", "Opção C", "Opção D"];
        let correctAnswer = "Opção A";
        let explanation = "";
        let extraData: any = {};

        switch(gameId) {
            // --- MATEMÁTICA ---
            case 'mat_1': // Corrida das Equações
                title = "Corrida de Álgebra";
                instructions = "Resolva esta equação para o seu velocista disparar na frente na pista!";
                if (step === 1) {
                    question = "Resolva: 3x - 5 = 16";
                    options = ["x = 5", "x = 7", "x = 6", "x = 8"];
                    correctAnswer = "x = 7";
                } else if (step === 2) {
                    question = "Resolva: 2x + 12 = 4x";
                    options = ["x = 4", "x = 6", "x = 8", "x = 10"];
                    correctAnswer = "x = 6";
                } else if (step === 3) {
                    question = "Se x² - 25 = 0 e x é positivo, qual o valor de x?";
                    options = ["x = 5", "x = 25", "x = 0", "x = -5"];
                    correctAnswer = "x = 5";
                } else if (step === 4) {
                    question = "Resolva: x/3 + 4 = 10";
                    options = ["x = 15", "x = 18", "x = 12", "x = 21"];
                    correctAnswer = "x = 18";
                } else {
                    question = "Resolva: 5x - 3 = 2x + 15";
                    options = ["x = 5", "x = 6", "x = 7", "x = 8"];
                    correctAnswer = "x = 6";
                }
                extraData = { type: 'race', progress: (step - 1) * 20 };
                break;

            case 'mat_2': // Torre das Funções
                title = "Ascensão da Torre";
                instructions = "Analise a função para desbloquear o elevador e subir ao próximo andar!";
                if (step === 1) {
                    question = "Dada f(x) = 2x + 5, determine f(3).";
                    options = ["8", "10", "11", "12"];
                    correctAnswer = "11";
                } else if (step === 2) {
                    question = "Qual é o coeficiente linear da função f(x) = -4x + 7?";
                    options = ["-4", "7", "4", "0"];
                    correctAnswer = "7";
                } else if (step === 3) {
                    question = "A função f(x) = -3x + 10 é crescente ou decrescente?";
                    options = ["Crescente", "Decrescente", "Constante", "Exponencial"];
                    correctAnswer = "Decrescente";
                } else if (step === 4) {
                    question = "Se f(x) = x² - 4, qual o ponto onde f(x) corta o eixo y?";
                    options = ["y = 4", "y = -4", "y = 2", "y = 0"];
                    correctAnswer = "y = -4";
                } else {
                    question = "Dada f(x) = 3x - 1, se f(x) = 14, qual o valor de x?";
                    options = ["3", "4", "5", "6"];
                    correctAnswer = "5";
                }
                extraData = { type: 'tower', floor: step };
                break;

            case 'mat_3': // Sniper da Geometria
                title = "Sniper Geométrico";
                instructions = "Ajuste a mira balística calculando a métrica espacial solicitada!";
                if (step === 1) {
                    question = "Calcule a ÁREA de um triângulo com base 8 cm e altura 5 cm.";
                    options = ["13 cm²", "40 cm²", "20 cm²", "25 cm²"];
                    correctAnswer = "20 cm²";
                } else if (step === 2) {
                    question = "Calcule o PERÍMETRO de um retângulo de lados 6 cm e 9 cm.";
                    options = ["30 cm", "15 cm", "54 cm", "45 cm"];
                    correctAnswer = "30 cm";
                } else if (step === 3) {
                    question = "Qual o VOLUME de um cubo de aresta igual a 3 cm?";
                    options = ["9 cm³", "12 cm³", "27 cm³", "18 cm³"];
                    correctAnswer = "27 cm³";
                } else if (step === 4) {
                    question = "Calcule a ÁREA de um círculo cujo diâmetro mede 8 cm (Considere π = 3).";
                    options = ["48 cm²", "192 cm²", "24 cm²", "96 cm²"];
                    correctAnswer = "48 cm²";
                } else {
                    question = "Qual a diagonal de um retângulo com lados 3 cm e 4 cm?";
                    options = ["5 cm", "7 cm", "12 cm", "6 cm"];
                    correctAnswer = "5 cm";
                }
                extraData = { type: 'sniper', target: 'Polygon' };
                break;

            case 'mat_4': // Escape da Probabilidade
                title = "Prisão de Probabilidade";
                instructions = "Selecione a chave com a probabilidade matemática exata para destrancar a cela!";
                if (step === 1) {
                    question = "Ao lançar um dado de 6 lados, qual a probabilidade de sair um número par?";
                    options = ["1/3", "1/2", "2/3", "1/6"];
                    correctAnswer = "1/2";
                } else if (step === 2) {
                    question = "Em uma urna com 5 bolas azuis e 15 vermelhas, qual a chance de retirar uma azul?";
                    options = ["25%", "33%", "20%", "50%"];
                    correctAnswer = "25%";
                } else if (step === 3) {
                    question = "Qual a probabilidade de retirar um Ás de um baralho tradicional de 52 cartas?";
                    options = ["1/13", "1/52", "1/4", "1/26"];
                    correctAnswer = "1/13";
                } else if (step === 4) {
                    question = "Lançando duas moedas corriqueiras, qual a chance de obter duas 'Caras'?";
                    options = ["50%", "25%", "75%", "12.5%"];
                    correctAnswer = "25%";
                } else {
                    question = "Em um grupo de 10 alunos, 4 são canhotos. Escolhendo 1 ao acaso, qual a chance de ser destro?";
                    options = ["40%", "60%", "20%", "80%"];
                    correctAnswer = "60%";
                }
                extraData = { type: 'escape_door', cellsLeft: 5 - step };
                break;

            case 'mat_5': // Batalha da Tabuada / Potenciação
                title = "Arena da Tabuada & Potências";
                instructions = "Destrua as esferas matemáticas que se aproximam da sua tela!";
                if (step === 1) {
                    question = "O valor de 8 x 7 é?";
                    options = ["54", "56", "64", "49"];
                    correctAnswer = "56";
                } else if (step === 2) {
                    question = "Resolva a potência: 3³";
                    options = ["9", "27", "18", "81"];
                    correctAnswer = "27";
                } else if (step === 3) {
                    question = "O valor exponencial de 2⁵ é?";
                    options = ["16", "32", "64", "10"];
                    correctAnswer = "32";
                } else if (step === 4) {
                    question = "Calcule: 9 x 8";
                    options = ["72", "81", "63", "74"];
                    correctAnswer = "72";
                } else {
                    question = "Qual o resultado de 12 x 12?";
                    options = ["120", "144", "142", "122"];
                    correctAnswer = "144";
                }
                extraData = { type: 'arcade_shot' };
                break;

            case 'mat_6': // Sudoku Matemático
                title = "Sudoku Expressões";
                instructions = "Determine o valor oculto que completa a lógica da linha do Sudoku!";
                if (step === 1) {
                    question = "Linha: [ 2 | A | 8 ]. Sabendo que A + 3 = 7, qual o número que completa esta célula?";
                    options = ["3", "4", "5", "6"];
                    correctAnswer = "4";
                } else if (step === 2) {
                    question = "Linha: [ 9 | 1 | x ]. Sabendo que x² = 25 (e x é positivo), qual o valor de x?";
                    options = ["5", "3", "4", "25"];
                    correctAnswer = "5";
                } else if (step === 3) {
                    question = "Linha: [ x | 4 | 2 ]. Sabendo que 3x - 1 = 20, quem é x?";
                    options = ["7", "6", "8", "9"];
                    correctAnswer = "7";
                } else if (step === 4) {
                    question = "Linha: [ 5 | y | y ]. Sabendo que 2y = 12, qual o valor de y?";
                    options = ["4", "5", "6", "7"];
                    correctAnswer = "6";
                } else {
                    question = "Linha: [ 4 | 9 | s ]. Sabendo que s é a raiz quadrada de 144, quem é s?";
                    options = ["10", "11", "12", "14"];
                    correctAnswer = "12";
                }
                extraData = { type: 'sudoku_cells' };
                break;

            case 'mat_7': // Missão Financeira
                title = "Aventura de Finanças Públicas";
                instructions = "Selecione a ação financeira que maximiza seu rendimento com o menor risco de juros!";
                if (step === 1) {
                    question = "Comprar um notebook de R$1.000 à vista com 10% de desconto ou parcelado de 2x sem juros? Qual te poupa mais?";
                    options = ["À vista (poupa R$100)", "Parcelado", "Dá o mesmo", "Fazer empréstimo"];
                    correctAnswer = "À vista (poupa R$100)";
                } else if (step === 2) {
                    question = "Imagine render R$500 a juros simples de 10% ao ano. Quanto renderá de JUROS após 2 anos?";
                    options = ["R$50", "R$100", "R$150", "R$110"];
                    correctAnswer = "R$100";
                } else if (step === 3) {
                    question = "Qual aplicação tem maior rentabilidade assegurada no atual cenário nacional com juros compostos altos?";
                    options = ["Tesouro Selic", "Poupança comum", "Deixar na gaveta", "Comprar ações de alto risco"];
                    correctAnswer = "Tesouro Selic";
                } else if (step === 4) {
                    question = "Se uma fatura de R$100 sofrer multa de 10% de juros compostos ao mês, qual será o valor após 2 meses?";
                    options = ["R$110", "R$120", "R$121", "R$112"];
                    correctAnswer = "R$121";
                } else {
                    question = "Você deposita R$100 por mês em uma conta com taxa real positiva. Qual é o papel principal da inflação?";
                    options = ["Corroer o poder de compra", "Aumentar os rendimentos", "Estabilizar a moeda", "Reduzir as taxas cobradas"];
                    correctAnswer = "Corroer o poder de compra";
                }
                extraData = { type: 'finance_decision' };
                break;

            // --- QUÍMICA ---
            case 'qui_1': // Laboratório Explosivo
                title = "Béquer Sob Pressão";
                instructions = "As pressões gasosas estão explodindo! Adicione o neutralizador balanceado adequado.";
                if (step === 1) {
                    question = "Reator em pH 13 (Excessivamente alcalino). O que adicionar urgentemente?";
                    options = ["Ácido Clorídrico (diminuir pH)", "Hidróxido de Sódio", "Água destilada", "Cal viva"];
                    correctAnswer = "Ácido Clorídrico (diminuir pH)";
                } else if (step === 2) {
                    question = "Para neutralizar uma queima do metal Sódio explosivo em água, qual elemento seria seguro?";
                    options = ["Gás Helio Inerte", "Oxigênio puro", "Ácido sulfúrico diluído", "Cloro ativo"];
                    correctAnswer = "Gás Helio Inerte";
                } else if (step === 3) {
                    question = "O bico de Bunsen está em nível de combustão incompleta (chama amarela). Como resolver?";
                    options = ["Abrir entrada de Oxigênio", "Fechar entrada de gás", "Jogar nitrogênio", "Cobrir com silicato"];
                    correctAnswer = "Abrir entrada de Oxigênio";
                } else if (step === 4) {
                    question = "Acidente com HCl ácido forte derramado. O que jogar para neutralizar com segurança?";
                    options = ["Bicarbonato de Sódio (Base fraca)", "NaOH concentrado", "Água morna", "Cloreto de sódio"];
                    correctAnswer = "Bicarbonato de Sódio (Base fraca)";
                } else {
                    question = "Gás inflamável H₂ vazando livremente. Qual catalisador desativa a ativação térmica?";
                    options = ["Resfriamento térmico a gelo seco", "Fósforo aceso", "Fita de Magnésio", "Aquecer a bureta"];
                    correctAnswer = "Resfriamento térmico a gelo seco";
                }
                extraData = { type: 'chemistry_explode', heatLevel: step * 18 };
                break;

            case 'qui_2': // Tabela Periódica Rush
                title = "Tabela Periódica Rush";
                instructions = "Combine o símbolo ao elemento correto em alta velocidade na tela!";
                if (step === 1) {
                    question = "Qual o elemento químico correspondente ao símbolo 'Na'?";
                    options = ["Sódio", "Nitrogênio", "Néon", "Níquel"];
                    correctAnswer = "Sódio";
                } else if (step === 2) {
                    question = "Qual o símbolo correspondente ao elemento 'Ouro'?";
                    options = ["Au", "Ag", "Or", "Pt"];
                    correctAnswer = "Au";
                } else if (step === 3) {
                    question = "O elemento Ferro é representado por qual símbolo na tabela?";
                    options = ["Fe", "F", "Fr", "Fo"];
                    correctAnswer = "Fe";
                } else if (step === 4) {
                    question = "Qual destes elementos pertence ao grupo dos Gases Nobres?";
                    options = ["Hélio (He)", "Oxigênio (O)", "Flúor (F)", "Hidrogênio (H)"];
                    correctAnswer = "Hélio (He)";
                } else {
                    question = "Qual o símbolo químico do Potássio?";
                    options = ["K", "P", "Po", "Ko"];
                    correctAnswer = "K";
                }
                extraData = { type: 'periodic_rush' };
                break;

            case 'qui_3': // Balanceamento Challenge
                title = "Desafio Estequiométrico";
                instructions = "Qual o coeficiente estequiométrico omitido para perfeitamente balancear a reação?";
                if (step === 1) {
                    question = "Reaction: ___ H₂ + 1 O₂ ➔ 2 H₂O";
                    options = ["1", "2", "3", "4"];
                    correctAnswer = "2";
                } else if (step === 2) {
                    question = "Reaction: 1 N₂ + ___ H₂ ➔ 2 NH₃";
                    options = ["1", "2", "3", "4"];
                    correctAnswer = "3";
                } else if (step === 3) {
                    question = "Reaction: 2 CO + ___ O₂ ➔ 2 CO₂";
                    options = ["1", "2", "3", "4"];
                    correctAnswer = "1";
                } else if (step === 4) {
                    question = "Reaction: CH₄ + ___ O₂ ➔ 1 CO₂ + 2 H₂O";
                    options = ["1", "2", "3", "4"];
                    correctAnswer = "2";
                } else {
                    question = "Reaction: ___ HCl + 1 Ca(OH)₂ ➔ 1 CaCl₂ + 2 H₂O";
                    options = ["1", "2", "3", "4"];
                    correctAnswer = "2";
                }
                extraData = { type: 'stoichiometry_slider' };
                break;

            case 'qui_4': // Detetive do pH
                title = "pH Lab Investigator";
                instructions = "Aplique o indicador de Fenolftaleína e adivinhe a natureza do líquido misterioso!";
                if (step === 1) {
                    question = "O limão espremido diluído exibe acidez. Qual o pH aproximado?";
                    options = ["pH 2 (Ácido)", "pH 7 (Neutro)", "pH 12 (Alcalino)", "pH 9 (Básico)"];
                    correctAnswer = "pH 2 (Ácido)";
                } else if (step === 2) {
                    question = "Amostra misteriosa ficou Rosa-Choque intenso com Fenolftaleína. Ela é:";
                    options = ["Ácida", "Base (Alcalina)", "Neutra", "Água destilada"];
                    correctAnswer = "Base (Alcalina)";
                } else if (step === 3) {
                    question = "Amostra misteriosa ficou Amarela clara com Azul de Bromotimol. Isso indica:";
                    options = ["Fluido Ácido", "Fluido Alcalino", "Fluido Neutro", "Fluido Esterilizado"];
                    correctAnswer = "Fluido Ácido";
                } else if (step === 4) {
                    question = "O sabonete líquido ou detergente comum geralmente tem comportamento:";
                    options = ["Ácido severo", "Básico / Alcalino leve", "Neutro absoluto", "Superácido"];
                    correctAnswer = "Básico / Alcalino leve";
                } else {
                    question = "A água pura à temperatura ambiente possui pH igual a:";
                    options = ["0", "5", "7", "14"];
                    correctAnswer = "7";
                }
                extraData = { type: 'ph_detective' };
                break;

            case 'qui_5': // Monta-Molécula
                title = "Sintetizador Molecular";
                instructions = "Adicione as ligações covalentes estritas para formar a estrutura molecular alvo!";
                if (step === 1) {
                    question = "Para formar a molécula de gás metano (CH₄), quantas ligações simples com Hidrogênio o Carbono deve fazer?";
                    options = ["2", "3", "4", "5"];
                    correctAnswer = "4";
                } else if (step === 2) {
                    question = "A molécula de Gás Dióxido de Carbono (CO₂) faz:";
                    options = ["Duas ligações duplas", "Duas ligações simples", "Uma dupla e uma tripla", "Uma ligação tripla"];
                    correctAnswer = "Duas ligações duplas";
                } else if (step === 3) {
                    question = "A água H₂O requer qual modelo de geometria molecular?";
                    options = ["Linear", "Angular", "Trigonal plana", "Tetraédica"];
                    correctAnswer = "Angular";
                } else if (step === 4) {
                    question = "Qual é o número total de ligações covalentes simples na molécula de Etano (C₂H₆)?";
                    options = ["6", "7", "8", "5"];
                    correctAnswer = "7";
                } else {
                    question = "Qual é a fórmula de um hidrocarboneto alcano contendo três carbonos?";
                    options = ["C₃H₆", "C₃H₈", "C₃H₄", "C₃H₁₀"];
                    correctAnswer = "C₃H₈";
                }
                extraData = { type: 'molecule_builder' };
                break;

            case 'qui_6': // Reação Relâmpago
                title = "Reações Instantâneas";
                instructions = "Classifique esta equação química apresentada na tela de forma relâmpago!";
                if (step === 1) {
                    question = "S + O₂ ➔ SO₂";
                    options = ["Síntese ou Adição", "Decomposição / Análise", "Simples Troca", "Dupla Troca"];
                    correctAnswer = "Síntese ou Adição";
                } else if (step === 2) {
                    question = "2 H₂O ➔ 2 H₂ + O₂";
                    options = ["Síntese", "Decomposição ou Análise", "Deslocamento", "Dupla Troca"];
                    correctAnswer = "Decomposição ou Análise";
                } else if (step === 3) {
                    question = "Fe + CuSO₄ ➔ FeSO₄ + Cu";
                    options = ["Síntese", "Decomposição", "Simples Troca ou Deslocamento", "Dupla Troca"];
                    correctAnswer = "Simples Troca ou Deslocamento";
                } else if (step === 4) {
                    question = "HCl + NaOH ➔ NaCl + H₂O";
                    options = ["Síntese", "Adição", "Simples Troca", "Dupla Troca ou Neutralização"];
                    correctAnswer = "Dupla Troca ou Neutralização";
                } else {
                    question = "C₃H₈ + 5 O₂ ➔ 3 CO₂ + 4 H₂O";
                    options = ["Combustão", "Decomposição", "Simples Troca", "Polimerização"];
                    correctAnswer = "Combustão";
                }
                extraData = { type: 'reaction_flashcards' };
                break;

            case 'qui_7': // Quiz do Cientista Maluco
                title = "Cientista Maluco S/A";
                instructions = "Atire o soro da inteligência na tese química correta!";
                if (step === 1) {
                    question = "Quem propôs o modelo atômico conhecido como 'Pudim de Passas'?";
                    options = ["Dalton", "Thomson", "Rutherford", "Bohr"];
                    correctAnswer = "Thomson";
                } else if (step === 2) {
                    question = "O modelo das órbitas eletrônicas circulares quantizadas foi idealizado por:";
                    options = ["Bohr", "Rutherford", "Thomson", "Schrödinger"];
                    correctAnswer = "Bohr";
                } else if (step === 3) {
                    question = "Uma ligação iônica típica ocorre entre quais tipos de elementos químicos?";
                    options = ["Metal e Não-metal", "Não-metal e Não-metal", "Gás Nobre e Metal", "Não-metais e Hidrogênio"];
                    correctAnswer = "Metal e Não-metal";
                } else if (step === 4) {
                    question = "A passagem direta do estado sólido para o gasoso recebe o nome de:";
                    options = ["Fusão", "Vaporização", "Condensação", "Sublimação"];
                    correctAnswer = "Sublimação";
                } else {
                    question = "Elementos que possuem o mesmo número de nêutrons são chamados de:";
                    options = ["Isótopos", "Isóbaros", "Isótonos", "Isoeletrônicos"];
                    correctAnswer = "Isótonos";
                }
                extraData = { type: 'crazy_scientist' };
                break;

            // --- BIOLOGIA ---
            case 'bio_1_p': // Defesa do Corpo
                title = "Sistema de Defesa Imunológica";
                instructions = "Vetor imunológico active! Escolha o linfócito ou substância de combate ideal!";
                if (step === 1) {
                    question = "Vírus da Gripe envelopado detectado. Quem produz anticorpos específicos para marcá-lo?";
                    options = ["Linfócito B (Plasmócitos)", "Plaquetas", "Linfócito T-Killer", "Hemácias"];
                    correctAnswer = "Linfócito B (Plasmócitos)";
                } else if (step === 2) {
                    question = "Célula infectada por vírus expondo antígenos anormais no MHC-I. Quem fará a destruição dessa célula?";
                    options = ["Linfócito T CD8+ (Citotóxico)", "Linfócito T Helper", "Mastócitos", "Macrófagos passivos"];
                    correctAnswer = "Linfócito T CD8+ (Citotóxico)";
                } else if (step === 3) {
                    question = "Alérgeno invasor detonou liberação maciça de histamina. Qual anticorpo coordena esta reação alérgica?";
                    options = ["IgE", "IgG", "IgM", "IgA"];
                    correctAnswer = "IgE";
                } else if (step === 4) {
                    question = "Qual órgão humano é responsável pela maturação biológica dos Linfócitos T?";
                    options = ["Timo", "Baço", "Fígado", "Medula Óssea"];
                    correctAnswer = "Timo";
                } else {
                    question = "Qual o tipo de imunização induzida pela aplicação preventiva de uma VACINA comum?";
                    options = ["Imunização Ativa Artificial", "Imunização Passiva Natural", "Imunização Passiva Artificial", "Imunização Reativa Genética"];
                    correctAnswer = "Imunização Ativa Artificial";
                }
                extraData = { type: 'immune_shield' };
                break;

            case 'bio_2_p': // DNA Builder
                title = "DNA Builder Helix";
                instructions = "Engate a base nitrogenada complementar biológica correta!";
                if (step === 1) {
                    question = "Fita de DNA expõe: ADENINA (A). Qual a complementar correspondente?";
                    options = ["Timina (T)", "Uracila (U)", "Citosina (C)", "Guanina (G)"];
                    correctAnswer = "Timina (T)";
                } else if (step === 2) {
                    question = "Fita expõe: GUANINA (G). Qual a complementar correspondente?";
                    options = ["Citosina (C)", "Adenina (A)", "Timina (T)", "Uracila (U)"];
                    correctAnswer = "Citosina (C)";
                } else if (step === 3) {
                    question = "Durante a TRANSCRIÇÃO do DNA para RNA mensageiro, a Adenina se emparelha com:";
                    options = ["Uracila (U)", "Timina (T)", "Citosina (C)", "Guanina (G)"];
                    correctAnswer = "Uracila (U)";
                } else if (step === 4) {
                    question = "Quantas pontes/ligações de hidrogênio unem as bases Citosina e Guanina?";
                    options = ["Duas ligadas", "Três ligadas", "Uma ligada", "Quatro ligadas"];
                    correctAnswer = "Três ligadas";
                } else {
                    question = "Se uma molécula de DNA dupla-fita apresenta 30% de Adenina, qual o percentual de Citosina?";
                    options = ["30%", "20%", "40%", "10%"];
                    correctAnswer = "20%";
                }
                extraData = { type: 'dna_helix' };
                break;

            case 'bio_3_p': // Evolução das Espécies
                title = "Darwin Simulator";
                instructions = "Selecione a diretriz evolutiva que promove a sobrevivência diferencial do animal!";
                if (step === 1) {
                    question = "A Caatinga apresenta seca drástica. Qual adaptação foliar reduz a transpiração extrema?";
                    options = ["Transformação em espinhos", "Folhas largas e delgadas", "Aumento de estômatos abertos", "Ausência de cutícula"];
                    correctAnswer = "Transformação em espinhos";
                } else if (step === 2) {
                    question = "A mariposa branca se destaca em troncos escuros e é predada por ser exposta. Esse fato refere-se ao conceito de:";
                    options = ["Seleção Natural", "Mutação Direcionada", "Lamarckismo voluntário", "Deriva Genética aleatória"];
                    correctAnswer = "Seleção Natural";
                } else if (step === 3) {
                    question = "Órgãos de mesma origem embrionária mas com funções distintas (como braço humano e asa de morcego) são chamados:";
                    options = ["Análogos", "Homólogos", "Vestigiais", "Sintéticos"];
                    correctAnswer = "Homólogos";
                } else if (step === 4) {
                    question = "De acordo com a Teoria Sintética da Evolução (Neodarwinismo), quais as fontes primordiais de variabilidade genética?";
                    options = ["Mutação e Recombinação Genética", "Uso e Desuso e Mutação", "Clonagem e Adaptação Física", "Seleção Artificial e deriva"];
                    correctAnswer = "Mutação e Recombinação Genética";
                } else {
                    question = "O fenômeno onde duas espécies não aparentadas desenvolvem estruturas análogas semelhantes devido às pressões ambientais:";
                    options = ["Especiação Alopátrica", "Convergência Evolutiva", "Irradiação Adaptativa", "Coevolução Simbiótica"];
                    correctAnswer = "Convergência Evolutiva";
                }
                extraData = { type: 'darwin_mutation' };
                break;

            case 'bio_4_p': // Caça ao Órgão
                title = "O Corpo Humano Interativo";
                instructions = "Mostre o corpo humano! O Corvo desafia você a identificar cada órgão e sua respectiva função e sistema!";
                if (step === 1) {
                    question = "Suco gástrico extremamente ácido que digere as proteínas. Onde ocorre?";
                    options = ["Estômago", "Fígado", "Pâncreas", "Intestino Delgado"];
                    correctAnswer = "Estômago";
                } else if (step === 2) {
                    question = "Produção da bílis para emulsificação de gorduras lipídicas no duodeno. Qual órgão produz?";
                    options = ["Fígado", "Vesícula Biliar (apenas armazena)", "Pâncreas", "Baço"];
                    correctAnswer = "Fígado";
                } else if (step === 3) {
                    question = "Absorção massiva de água da digestão e formação do bolo fecal feculento:";
                    options = ["Intestino Grosso", "Intestino Delgado", "Estômago", "Esôfago"];
                    correctAnswer = "Intestino Grosso";
                } else if (step === 4) {
                    question = "Filtração de escórias nitrogenadas (ureia) produzindo urina ativa:";
                    options = ["Rins", "Bexiga", "Fígado", "Ureteres"];
                    correctAnswer = "Rins";
                } else {
                    question = "Secreção de insulina e glucagon regulando taxas de açúcar do sangue:";
                    options = ["Pâncreas", "Fígado", "Tireoide", "Hipófise"];
                    correctAnswer = "Pâncreas";
                }
                extraData = { type: 'biology_human_body' };
                break;

            case 'bio_5_p': // Ecossistema em Equilíbrio
                title = "Cadeia Ecológica";
                instructions = "Assegure o equilíbrio populacional! Quem ocupa o nível trófico indicado?";
                if (step === 1) {
                    question = "Qual organismo atua como PRODUTOR primário em um ecossistema terrestre?";
                    options = ["Plantas e Vegetais", "Gafanhoto", "Fungos decompositores", "Coelho"];
                    correctAnswer = "Plantas e Vegetais";
                } else if (step === 2) {
                    question = "Um sapo que se alimenta de um gafanhoto herbívoro na cadeia é posicionado como:";
                    options = ["Produtor", "Consumidor Primário", "Consumidor Secundário", "Consumidor Terciário"];
                    correctAnswer = "Consumidor Secundário";
                } else if (step === 3) {
                    question = "Qual o destino de 100% da energia biológica líquida gerada no ápice da cadeia?";
                    options = ["Decomposição por Bactérias/Fungos", "Acúmulo térmico eterno", "Retorno às plantas produtoras", "Uso industrial"];
                    correctAnswer = "Decomposição por Bactérias/Fungos";
                } else if (step === 4) {
                    question = "A relação de benefício mútuo obrigatório entre espécies diferentes, como líquens, é chamada:";
                    options = ["Mutualismo", "Protocooperação", "Comensalismo", "Inquilinismo"];
                    correctAnswer = "Mutualismo";
                } else {
                    question = "O acúmulo de metais pesados (mercúrio) ao longo dos níveis tróficos da cadeia ecológico chama-se:";
                    options = ["Eutrofização", "Magnificação Trófica / Bioacumulação", "Biomimetismo", "Lixiviação mineral"];
                    correctAnswer = "Magnificação Trófica / Bioacumulação";
                }
                extraData = { type: 'ecosystem_food_chain' };
                break;

            case 'bio_6_p': // Mutação Misteriosa
                title = "Genética do Professor Punnett";
                instructions = "Cruze os genes parentais e calcule as probabilidades fenotípicas fenomênicas!";
                if (step === 1) {
                    question = "No cruzamento entre heterozigotos 'Aa' e 'Aa', qual a proporção de homozigotos recessivos 'aa'?";
                    options = ["25% (1/4)", "50% (2/4)", "75% (3/4)", "0%"];
                    correctAnswer = "25% (1/4)";
                } else if (step === 2) {
                    question = "Um homem albino (aa) casa-se com uma mulher homozigota dominante (AA). Qual a chance de terem filho albino?";
                    options = ["0%", "50%", "100%", "25%"];
                    correctAnswer = "0%";
                } else if (step === 3) {
                    question = "No sistema de tipagem sanguínea ABO, qual o genótipo para o tipo sanguíneo 'O'?";
                    options = ["ii", "I_A i", "I_B i", "I_A I_B"];
                    correctAnswer = "ii";
                } else if (step === 4) {
                    question = "Se uma doença é recessiva ligada ao cromossomo X, quem transmite o gene para um filho homem afetado?";
                    options = ["Mãe", "Pai", "Avô paterno", "Ambos os pais"];
                    correctAnswer = "Mãe";
                } else {
                    question = "Cruzamento de duplo heterozigoto (AaBb x AaBb) resulta em qual proporção fenotípica mendeliana clássica?";
                    options = ["9:3:3:1", "3:1", "1:2:1", "9:7"];
                    correctAnswer = "9:3:3:1";
                }
                extraData = { type: 'punnett_genetics' };
                break;

            case 'bio_7_p': // Quiz celular
                title = "Quiz de Biologia Celular";
                instructions = "Clique na organela celular correta para disparar a respiração do vestibular!";
                if (step === 1) {
                    question = "Qual organela é a 'Usina Energética' celular, realizando a Respiração Celular Aeróbia?";
                    options = ["Mitocôndria", "Linosso", "Retículo Endoplasmático", "Ribossomo"];
                    correctAnswer = "Mitocôndria";
                } else if (step === 2) {
                    question = "Qual organela realiza a síntese de proteínas fundamentais para o metabolismo?";
                    options = ["Ribossomo", "Lisossomo", "Cloroplasto", "Centríolo"];
                    correctAnswer = "Ribossomo";
                } else if (step === 3) {
                    question = "A digestão intracelular (autofagia/heterofagia) é realizada por qual organela?";
                    options = ["Lisossomo", "Complexo de Golgi", "Peroxissomo", "Vacúolo clorofílico"];
                    correctAnswer = "Lisossomo";
                } else if (step === 4) {
                    question = "Qual organela vegetal é responsável pela fotossíntese capturando energia luminosa?";
                    options = ["Cloroplasto", "Mitocôndria", "Parede celular", "Glioxissomo"];
                    correctAnswer = "Cloroplasto";
                } else {
                    question = "O empacotamento, secreção e exportação celular de substâncias é atribuição do:";
                    options = ["Complexo de Golgi", "Retículo Rugoso", "Citoesqueleto", "Lisossomo"];
                    correctAnswer = "Complexo de Golgi";
                }
                extraData = { type: 'cellular_organelles' };
                break;

            // --- PORTUGUÊS / LITERATURA ---
            case 'lit_1': // Detetive Literário
                title = "Detetive Literário";
                instructions = "Reúna as pistas e acuse o autor correto do enigma literário!";
                if (step === 1) {
                    question = "Pista: Realista brasileiro, ironia afiada, autor de 'Memórias Póstumas de Brás Cubas' e 'Dom Casmurro'.";
                    options = ["Machado de Assis", "José de Alencar", "Clarice Lispector", "Aluísio Azevedo"];
                    correctAnswer = "Machado de Assis";
                } else if (step === 2) {
                    question = "Pista: Autor modernista de 'Vidas Secas', mestre do regionalismo nordestino de 1930.";
                    options = ["Graciliano Ramos", "Jorge Amado", "Rachel de Queiroz", "João Cabral de Melo Neto"];
                    correctAnswer = "Graciliano Ramos";
                } else if (step === 3) {
                    question = "Pista: Autora intimista, fluxo de consciência extraordinário, escreveu 'A Hora da Estrela' e 'Perto do Coração Selvagem'.";
                    options = ["Clarice Lispector", "Cecília Meireles", "Lygia Fagundes Telles", "Hilda Hilst"];
                    correctAnswer = "Clarice Lispector";
                } else if (step === 4) {
                    question = "Pista: Escandalizou a corte com 'O Cortiço' e 'O Mulato', liderando o Naturalismo nacional.";
                    options = ["Aluísio Azevedo", "Adolfo Caminha", "Raul Pompeia", "Lima Barreto"];
                    correctAnswer = "Aluísio Azevedo";
                } else {
                    question = "Pista: Mestre do barroco baiano, conhecido pelo apelido de 'Boca do Inferno' pelas poesias satíricas.";
                    options = ["Gregório de Matos", "Padre Antônio Vieira", "Cláudio Manuel da Costa", "Tomás Antônio Gonzaga"];
                    correctAnswer = "Gregório de Matos";
                }
                extraData = { type: 'literary_detective' };
                break;

            case 'lit_2': // Caça ao Erro de Português
                title = "Caçador de Desvios";
                instructions = "Selecione o fragmento textual que viola a norma culta padrão da língua portuguesa!";
                if (step === 1) {
                    question = "Qual palavra incorre em erro gramatical na frase: 'Houveram muitos problemas na reunião de condomínio ontem.'";
                    options = ["Houveram (deve ser Houve)", "problemas", "na", "ontem"];
                    correctAnswer = "Houveram (deve ser Houve)";
                } else if (step === 2) {
                    question = "Qual palavra agride a regência em: 'Assistimos o filme emocionante que estreou ontem no cinema.'";
                    options = ["Assistimos o (deve ser Assistimos ao)", "filme", "emocionante", "estreou"];
                    correctAnswer = "Assistimos o (deve ser Assistimos ao)";
                } else if (step === 3) {
                    question = "Qual palavra está errada na concordância: 'Seguem anexo as faturas que você solicitou.'";
                    options = ["anexo (deve ser anexas)", "Seguem", "faturas", "solicitou"];
                    correctAnswer = "anexo (deve ser anexas)";
                } else if (step === 4) {
                    question = "Indique a grafia indevida: 'Fui no mercado pois as crianças queriam comer meias maçãs vermelhas.'";
                    options = ["Fui no (deve ser Fui ao)", "as", "meias (deve ser meia)", "mercado"];
                    correctAnswer = "Fui no (deve ser Fui ao)";
                } else {
                    question = "Qual termo está grafado incorretamente: 'Estávamos ansiosos para ver os resultados, porisso corremos tanto.'";
                    options = ["porisso (deve ser por isso)", "Estávamos", "corremos", "ansiosos"];
                    correctAnswer = "porisso (deve ser por isso)";
                }
                extraData = { type: 'grammar_typo' };
                break;

            case 'lit_3': // Complete a Frase
                title = "Ortografia Ortográfica";
                instructions = "Complete o termo omitido seguindo a regência oficial!";
                if (step === 1) {
                    question = "Fui ______ biblioteca estudar com meus queridos colegas de classe.";
                    options = ["à", "a", "há", "á"];
                    correctAnswer = "à";
                } else if (step === 2) {
                    question = "Eles correram bastante, ______ não conseguiram alcançar o trem da manhã.";
                    options = ["mas", "mais", "más", "menos"];
                    correctAnswer = "mas";
                } else if (step === 3) {
                    question = "______ dez anos que não visito minha aconchegante cidade natal.";
                    options = ["Há", "A", "Ah", "Até"];
                    correctAnswer = "Há";
                } else if (step === 4) {
                    question = "Este é o colégio ______ estudei durante toda a minha juventude de ouro.";
                    options = ["onde", "aonde", "de onde", "cujo o"];
                    correctAnswer = "onde";
                } else {
                    question = "Ele comeu menos doce hoje porque estava sentindo-se ______ disposto.";
                    options = ["mal", "mau", "mais", "menos"];
                    correctAnswer = "mal";
                }
                extraData = { type: 'complete_blank' };
                break;

            case 'lit_4': // Liga Figuras de Linguagem
                title = "Figuras de Linguagem";
                instructions = "Qual figura de linguagem rege a oração destacada de forma estilística?";
                if (step === 1) {
                    question = "Frase: 'O sol sorria alegremente para toda a calorosa cidade.'";
                    options = ["Prosopopeia ou Personificação", "Metáfora", "Hipérbole", "Eufemismo"];
                    correctAnswer = "Prosopopeia ou Personificação";
                } else if (step === 2) {
                    question = "Frase: 'Chorei rios de lágrimas com aquele final de romance trágico.'";
                    options = ["Hipérbole (Exagero)", "Metonímia", "Antítese", "Paradoxo"];
                    correctAnswer = "Hipérbole (Exagero)";
                } else if (step === 3) {
                    question = "Frase: 'Aquele rapaz que trabalha conosco faltou com a verdade hoje.'";
                    options = ["Eufemismo (Suavizar)", "Ironia", "Metáfora", "Litotes"];
                    correctAnswer = "Eufemismo (Suavizar)";
                } else if (step === 4) {
                    question = "Frase: 'Aquele terno preto dele era uma estátua fria.'";
                    options = ["Metáfora", "Metonímia", "Pleonasmo", "Antítese"];
                    correctAnswer = "Metáfora";
                } else {
                    question = "Frase: 'Ler de cabo a rabo um Machado de Assis é essencial.'";
                    options = ["Metonímia (Autor pela Obra)", "Ironia", "Silepse", "Anáfora"];
                    correctAnswer = "Metonímia (Autor pela Obra)";
                }
                extraData = { type: 'figures_rhetoric' };
                break;

            case 'lit_5': // Batalha de Interpretação
                title = "A Interpretação Crítica";
                instructions = "Leia e identifique a tônica ou recurso literário predominante!";
                if (step === 1) {
                    question = "Em 'Amor é fogo que arde sem se ver', a contradição racional expressa caracteriza um:";
                    options = ["Paradoxo", "Pleonasmo", "Anacoluto", "Polissíndeto"];
                    correctAnswer = "Paradoxo";
                } else if (step === 2) {
                    question = "A ironia machadiana destina-se principalmente a zombar de quem nas suas famosas crônicas?";
                    options = ["Da hipocrisia burguesa do século XIX", "Da escravidão nacional diretamente", "Do romantismo sentimental puro", "Do imperador do Brasil"];
                    correctAnswer = "Da hipocrisia burguesa do século XIX";
                } else if (step === 3) {
                    question = "A função da linguagem cujo objetivo principal é testar e manter o canal de comunicação aberto (ex: 'Alô?', 'Entende?'):";
                    options = ["Função Fática", "Função Metalinguística", "Função Conativa", "Função Emotiva"];
                    correctAnswer = "Função Fática";
                } else if (step === 4) {
                    question = "Quando o dicionário define uma palavra, ou um autor explica a própria escritura, temos a função:";
                    options = ["Metalinguística", "Referencial", "Poética", "Conativa"];
                    correctAnswer = "Metalinguística";
                } else {
                    question = "Qual é o foco predominante da Função Conativa ou Apelativa na propagação de textos publicitários?";
                    options = ["Persuadir e convencer o receptor", "Expressar as emoções do emissor", "Explicar códigos lexicais", "Transmitir dados objetivos frios"];
                    correctAnswer = "Persuadir e convencer o receptor";
                }
                extraData = { type: 'reading_battle' };
                break;

            case 'lit_6': // Timeline Literária
                title = "Timeline Literária";
                instructions = "Escolha qual movimento preenche o quadrado temporal vazio de forma correta!";
                if (step === 1) {
                    question = "Escola literária brasileira de forte idealismo nacionalista e herói índio (1836-1881):";
                    options = ["Romantismo", "Realismo", "Barroco", "Modernismo"];
                    correctAnswer = "Romantismo";
                } else if (step === 2) {
                    question = "Escola onde impera o conflito existencial humano, claro-escuro e teocentrismo vs antropocentrismo (Século XVII):";
                    options = ["Barroco", "Arcadismo", "Realismo", "Simbolismo"];
                    correctAnswer = "Barroco";
                } else if (step === 3) {
                    question = "Iniciou-se in 1922 com a famosa Semana de Arte Moderna, pregando quebra de regras acadêmicas antigas:";
                    options = ["Modernismo", "Parnasianismo", "Romantismo", "Naturalismo"];
                    correctAnswer = "Modernismo";
                } else if (step === 4) {
                    question = "Movimento poético focado na perfeição formal, rimas ricas e arte pela arte:";
                    options = ["Parnasianismo", "Simbolismo", "Romantismo", "Barroco"];
                    correctAnswer = "Parnasianismo";
                } else {
                    question = "Retrata a revalorização da vida bucólica e pastoril, renegando os ruídos urbanos (fugere urbem):";
                    options = ["Arcadismo", "Barroco", "Realismo", "Naturalismo"];
                    correctAnswer = "Arcadismo";
                }
                extraData = { type: 'literary_timeline' };
                break;

            case 'lit_7': // Meme ou Metáfora?
                title = "Expressividade Dialética";
                instructions = "Determine se o termo abaixo constitui uma figura de linguagem formal ou uma convenção popular informal!";
                if (step === 1) {
                    question = "'Estou morrendo de rir!' constitui uma:";
                    options = ["Figura de Linguagem (Hipérbole)", "Meme popular sem base", "Metonímia formal de estilo", "Ironia literária pura"];
                    correctAnswer = "Figura de Linguagem (Hipérbole)";
                } else if (step === 2) {
                    question = "'O rapaz de verde choveu na horta do vestibular' constitui tipicamente:";
                    options = ["Meme popular ou Gíria coloquial", "Comparação gramatical estrita", "Prosopopeia conceitual", "Antítese Barroca"];
                    correctAnswer = "Meme popular ou Gíria coloquial";
                } else if (step === 3) {
                    question = "'Suas palavras gélidas queimaram minha esperança.' O cruzamento sensitivo descreve:";
                    options = ["Sinestesia (Mistura de sentidos)", "Catacrese", "Pleonásmo", "Meme"];
                    correctAnswer = "Sinestesia (Mistura de sentidos)";
                } else if (step === 4) {
                    question = "'Não seja chiclete com as pessoas!' representa uma:";
                    options = ["Figurativa Coloquial (Gíria)", "Metáfora Parnasiana", "Metonímia Imperial", "Anáfora Erudita"];
                    correctAnswer = "Figurativa Coloquial (Gíria)";
                } else {
                    question = "'Comi dez pratos de feijoada pois estava faminto como um leão.'";
                    options = ["Comparação e Hipérbole (Figuras)", "Apenas meme moderno", "Erro sintático severo", "Silepse de gênero"];
                    correctAnswer = "Comparação e Hipérbole (Figuras)";
                }
                extraData = { type: 'meme_metaphor_classifier' };
                break;

            // --- GEOGRAFIA ---
            case 'geo_1_p': // Que país é esse?
                title = "Adivinhe o Território";
                instructions = "Analise as coordenadas cartográficas e defina o país misterioso!";
                if (step === 1) {
                    question = "Dica: Maior país da América do Sul, cortado pela linha do equador e trópico de capricórnio.";
                    options = ["Brasil", "Argentina", "Colômbia", "Venezuela"];
                    correctAnswer = "Brasil";
                } else if (step === 2) {
                    question = "Dica: Capital Tóquio. Arquipélago montanhoso de alta atividade sísmica na Ásia Oriental.";
                    options = ["Japão", "China", "Coreia do Sul", "Filipinas"];
                    correctAnswer = "Japão";
                } else if (step === 3) {
                    question = "Dica: Abriga a famosa cordilheira dos Andes de ponta a ponta e tem formato longo e estreito.";
                    options = ["Chile", "Peru", "Equador", "Colômbia"];
                    correctAnswer = "Chile";
                } else if (step === 4) {
                    question = "Dica: Cruzado pelo Canal que conecta os Oceanos Atlântico e Pacífico na América Central.";
                    options = ["Panamá", "Costa Rica", "Colômbia", "México"];
                    correctAnswer = "Panamá";
                } else {
                    question = "Dica: Localizado no norte da África, abriga a foz do histórico Rio Nilo e as pirâmides de Gizé.";
                    options = ["Egito", "Marrocos", "África do Sul", "Tunísia"];
                    correctAnswer = "Egito";
                }
                extraData = { type: 'country_outline' };
                break;

            case 'geo_2_p': // Clima Survivor
                title = "Sobrevivente Climático";
                instructions = "Qual ecossistema ou conduta adapta-se à pressão ecológica solicitada?";
                if (step === 1) {
                    question = "No Bioma da Caatinga nordestina, como se denominam as plantas adaptadas à seca drástica?";
                    options = ["Xerófitas", "Higrófitas", "Mesófitas", "Tropófitas"];
                    correctAnswer = "Xerófitas";
                } else if (step === 2) {
                    question = "Qual fenômeno térmico retém calor antropogênico em grandes centros urbanos asfaltados?";
                    options = ["Ilha de Calor", "Efeito Estufa natural", "Inversão Térmica", "Chuvas ácidas"];
                    correctAnswer = "Ilha de Calor";
                } else if (step === 3) {
                    question = "A vegetação do Cerrado brasileiro exibe caules retorcidos e casca grossa principalmente de que fator?";
                    options = ["Acidez do solo e incêndios periódicos", "Frio extremo", "Excesso de chuvas", "Predadores de grande porte"];
                    correctAnswer = "Acidez do solo e incêndios periódicos";
                } else if (step === 4) {
                    question = "Fenômeno climático de resfriamento anormal das águas do Oceano Pacífico Equatorial:";
                    options = ["La Niña", "El Niño", "Monções asiáticas", "Corrente do Golfo"];
                    correctAnswer = "La Niña";
                } else {
                    question = "Bioma com árvores de raízes aéreas adaptados a solos salinos e lodosos litorâneos:";
                    options = ["Manguezal", "Campos Sulinos", "Mata de Cocais", "Mata Atlântica"];
                    correctAnswer = "Manguezal";
                }
                extraData = { type: 'climate_survivor' };
                break;

            case 'geo_3_p': // Monta o Mapa
                title = "O Globo Terrestre Interativo";
                instructions = "Explore o globo virtual do Corvo! Clique nos hotspots para aprender sobre coordenadas, biomas, oceanos e relevo!";
                if (step === 1) {
                    question = "Qual região brasileira abriga a maior bacia hidrográfica do planeta Terra?";
                    options = ["Região Norte", "Região Nordeste", "Região Centro-Oeste", "Região Sul"];
                    correctAnswer = "Região Norte";
                } else if (step === 2) {
                    question = "O fuso horário oficial de Brasília (capital do Brasil) em relação à linha de Greenwich:";
                    options = ["-3 horas", "-2 horas", "-4 horas", "0 horas"];
                    correctAnswer = "-3 horas";
                } else if (step === 3) {
                    question = "Qual estado brasileiro possui o maior litoral voltado para o Oceano Atlântico?";
                    options = ["Bahia", "Rio de Janeiro", "São Paulo", "Ceará"];
                    correctAnswer = "Bahia";
                } else if (step === 4) {
                    question = "A projeção cartográfica cilíndrica que mantém a FORMA dos países, porém distorce suas proporções de tamanho de área:";
                    options = ["Mercator", "Peters", "Robinson", "Cônica"];
                    correctAnswer = "Mercator";
                } else {
                    question = "Qual país sul-americano NÃO faz fronteira territorial direta com o território brasileiro?";
                    options = ["Equador (e Chile)", "Argentina", "Paraguai", "Uruguai"];
                    correctAnswer = "Equador (e Chile)";
                }
                extraData = { type: 'geography_globe' };
                break;

            case 'geo_4_p': // Geopolítica em crise
                title = "Líder Global Geopolítico";
                instructions = "Resolva as crises geopolíticas de recursos naturais e fronteiras!";
                if (step === 1) {
                    question = "O maior bloco econômico mundial, caracterizado pela livre circulação de pessoas e moeda única:";
                    options = ["União Europeia", "Mercosul", "USMCA (ex-Nafta)", "Brics"];
                    correctAnswer = "União Europeia";
                } else if (step === 2) {
                    question = "Qual estreito marítimo estratégico escoa 20%+ do petróleo mundial e liga o Golfo Pérsico ao mar aberto?";
                    options = ["Estreito de Ormuz", "Estreito de Gibraltar", "Canal de Suez", "Estreito de Malaca"];
                    correctAnswer = "Estreito de Ormuz";
                } else if (step === 3) {
                    question = "Qual país liderou a saída do bloco da União Europeia, processo conhecido como 'Brexit'?";
                    options = ["Reino Unido", "França", "Alemanha", "Itália"];
                    correctAnswer = "Reino Unido";
                } else if (step === 4) {
                    question = "Grupo intergovernamental de países emergentes composto originalmente por Brasil, Rússia, Índia, China e África do Sul:";
                    options = ["BRICS", "G7", "OCDE", "OTAN"];
                    correctAnswer = "BRICS";
                } else {
                    question = "Qual aliança militar de defesa mútua ocidental foi erguida na Guerra Fria e permanece ativa?";
                    options = ["OTAN", "Pacto de Varsóvia", "Organização das Nações Unidas", "BCE"];
                    correctAnswer = "OTAN";
                }
                extraData = { type: 'geopolitic_decision' };
                break;

            case 'geo_5_p': // Quiz de bandeiras
                title = "Vexilologia de Elite";
                instructions = "Combine a bandeira que surge rapidamente ao país correspondente!";
                if (step === 1) {
                    question = "Bandeira com listras horizontais Preta, Vermelha e Amarela.";
                    options = ["Alemanha", "Bélgica", "França", "Espanha"];
                    correctAnswer = "Alemanha";
                } else if (step === 2) {
                    question = "Bandeira com fundo vermelho, contendo um grande círculo branco e um Sol vermelho no meio.";
                    options = ["Japão", "Coreia do Sul", "Vietnã", "China"];
                    correctAnswer = "Japão";
                } else if (step === 3) {
                    question = "Bandeira com listras horizontais Amarela, Azul e Vermelha (com amarelo cobrindo a metade superior).";
                    options = ["Colômbia", "Venezuela", "Equador", "Romênia"];
                    correctAnswer = "Colômbia";
                } else if (step === 4) {
                    question = "Bandeira com três listras verticais Azul, Branca e Vermelha.";
                    options = ["França", "Itália", "Holanda", "Luxemburgo"];
                    correctAnswer = "França";
                } else {
                    question = "Bandeira com um Sol de Maio no centro sobre listras horizontais Azuis claras e Brancas.";
                    options = ["Argentina", "Uruguai", "Grécia", "Honduras"];
                    correctAnswer = "Argentina";
                }
                extraData = { type: 'flags_rush' };
                break;

            case 'geo_6_p': // Recursos Naturais Match
                title = "Matriz Energética Global";
                instructions = "Direcione os recursos naturais e fósseis às suas respectivas fontes dominantes!";
                if (step === 1) {
                    question = "Qual é o principal recurso fóssil explorado no famoso Pré-sal brasileiro?";
                    options = ["Petróleo", "Carvão Mineral", "Gás Xisto", "Urânio"];
                    correctAnswer = "Petróleo";
                } else if (step === 2) {
                    question = "Qual metal altamente valorizado na fabricação de baterias de carros elétricos é chamado de 'Ouro Branco'?";
                    options = ["Lítio", "Cobre", "Níquel", "Ferro"];
                    correctAnswer = "Lítio";
                } else if (step === 3) {
                    question = "Qual país abriga a maior reserva assegurada de petróleo bruto do planeta?";
                    options = ["Venezuela", "Arábia Saudita", "Estados Unidos", "Rússia"];
                    correctAnswer = "Venezuela";
                } else if (step === 4) {
                    question = "A principal fonte geradora da matriz ELÉTRICA limpa e renovável no Brasil decorre de:";
                    options = ["Energia Hidrelétrica", "Termoelétricas a Gás", "Energia Solar", "Energia Eólica"];
                    correctAnswer = "Energia Hidrelétrica";
                } else {
                    question = "A queima de qual combustível fóssil é historicamente a maior emissora de CO₂ no mundo industrializado?";
                    options = ["Carvão Mineral", "Gás Natural", "Etanol de cana", "Madeira verde"];
                    correctAnswer = "Carvão Mineral";
                }
                extraData = { type: 'natural_resources' };
                break;

            case 'geo_7_p': // Viagem pelo Brasil
                title = "Expedição pelo Brasil";
                instructions = "Responda sobre aspectos sociodemográficos e biomas para viajar pelo território nacional!";
                if (step === 1) {
                    question = "O bioma composto por árvores de troncos retorcidos, adaptado a solos ácidos no planalto central:";
                    options = ["Cerrado", "Mata Atlântica", "Pampa", "Pantanal"];
                    correctAnswer = "Cerrado";
                } else if (step === 2) {
                    question = "A transição agroecológica entre o semiárido do Sertão e a floresta Amazônica chama-se:";
                    options = ["Meio-Norte (Mata de Cocais)", "Agreste", "Zona da Mata", "Recôncavo"];
                    correctAnswer = "Meio-Norte (Mata de Cocais)";
                } else if (step === 3) {
                    question = "Qual grupo demográfico liderou migrações maciças rumo à fronteira agrícola do Centro-Oeste e Norte a partir dos anos 70?";
                    options = ["Surgidos do Sul e Sudeste", "Vindos do Nordeste apenas", "Imigrantes asiáticos", "Estudantes cariocas"];
                    correctAnswer = "Surgidos do Sul e Sudeste";
                } else if (step === 4) {
                    question = "A maior planície de inundação contínua de água doce do mundo, localizada no Mato Grosso:";
                    options = ["Pantanal", "Pampa", "Caatinga", "Mata de Araucárias"];
                    correctAnswer = "Pantanal";
                } else {
                    question = "Qual região brasileira possui o maior IDH e a maior densidade demográfica concentrada do país?";
                    options = ["Sudeste", "Sul", "Nordeste", "Norte"];
                    correctAnswer = "Sudeste";
                }
                extraData = { type: 'brazil_travel' };
                break;

            // --- HISTÓRIA ---
            case 'his_1_p': // Linha do Tempo
                title = "Cronologia Temporal";
                instructions = "Coloque os principais fatos históricos do Brasil colonial e republicano na linha central!";
                if (step === 1) {
                    question = "Em que ano ocorreu a oficial e formal Proclamação da República no Brasil?";
                    options = ["1822", "1889", "1808", "1930"];
                    correctAnswer = "1889";
                } else if (step === 2) {
                    question = "O Período Regencial brasileiro estendeu-se de qual momento cronológico marcante?";
                    options = ["Abdilgação de Dom Pedro I até Maioridade de Dom Pedro II", "Descobrimento até Proclamação", "Guerra do Paraguai", "Início do governo Vargas"];
                    correctAnswer = "Abdilgação de Dom Pedro I até Maioridade de Dom Pedro II";
                } else if (step === 3) {
                    question = "O famoso tratado que dividiu as Américas entre Portugal e Espanha em 1494 recebeu o nome de:";
                    options = ["Tratado de Tordesilhas", "Tratado de Madri", "Bula Intercoetera", "Tratado de Utrecht"];
                    correctAnswer = "Tratado de Tordesilhas";
                } else if (step === 4) {
                    question = "Qual foi o estopim brasileiro que deu fim ao Segundo Reinado de Dom Pedro II de forma diplomática?";
                    options = ["Abolição da Escravidão em 1888 e atrito militar", "Guerra dos Farrapos", "Revolta da Chibata", "A vinda da família real"];
                    correctAnswer = "Abolição da Escravidão em 1888 e atrito militar";
                } else {
                    question = "O marcante golpe civil-militar que impôs a Ditadura Militar na história brasileira ocorreu no ano de:";
                    options = ["1964", "1937", "1985", "1930"];
                    correctAnswer = "1964";
                }
                extraData = { type: 'history_timeline_game' };
                break;

            case 'his_2_p': // Guerra Estratégica
                title = "Batalha do Conhecimento";
                instructions = "Comande suas tropas respondendo sobre as grandes guerras mundiais de forma estratégica!";
                if (step === 1) {
                    question = "Qual evento político-militar serviu de pretexto incontornável para o início da Primeira Guerra Mundial de 1914?";
                    options = ["Assassinato do Arquiduque Francisco Ferdinando", "A invasão da Polônia", "O bombardeiro de Pearl Harbor", "O Tratado de Versalhes"];
                    correctAnswer = "Assassinato do Arquiduque Francisco Ferdinando";
                } else if (step === 2) {
                    question = "A invasão de qual país europeu pela Alemanha nazista em 1939 iniciou a Segunda Guerra Mundial?";
                    options = ["Polônia", "França", "Áustria", "União Soviética"];
                    correctAnswer = "Polônia";
                } else if (step === 3) {
                    question = "O que caracterizou o longo conflito conceitual da Guerra Fria entre EUA e URSS?";
                    options = ["Bipolaridade ideológica e corrida armamentista sem combate direto", "Combate militar direto em território europeu", "Cooperação nuclear unificada", "A união dos blocos econômicos"];
                    correctAnswer = "Bipolaridade ideológica e corrida armamentista sem combate direto";
                } else if (step === 4) {
                    question = "Qual tratado pós-Primeira Guerra Mundial impôs duras punições estruturais e econômicas à Alemanha?";
                    options = ["Tratado de Versalhes", "Pacto de Munique", "Conferência de Yalta", "Tratado de Saint-Germain"];
                    correctAnswer = "Tratado de Versalhes";
                } else {
                    question = "Qual país efetuou o bombardeio surpresa à base norte-americana de Pearl Harbor em 1941?";
                    options = ["Japão", "Alemanha", "Itália", "União Soviética"];
                    correctAnswer = "Japão";
                }
                extraData = { type: 'tactical_warfare' };
                break;

            case 'his_3_p': // Quem disse isso?
                title = "Pronunciamentos Famosos";
                instructions = "Atribua a célebre citação histórica ao seu real enunciador!";
                if (step === 1) {
                    question = "'Se é para o bem de todos e felicidade geral da nação, estou pronto: diga ao povo que fico.'";
                    options = ["Dom Pedro I", "Dom Pedro II", "Marechal Deodoro da Fonseca", "José Bonifacio"];
                    correctAnswer = "Dom Pedro I";
                } else if (step === 2) {
                    question = "'O Estado sou eu.' (L'État c'est moi). Frase clássica que resume o Absolutismo monárquico.";
                    options = ["Luís XIV da França", "Henrique VIII da Inglaterra", "Napoleão Bonaparte", "Luís XVI"];
                    correctAnswer = "Luís XIV da França";
                } else if (step === 3) {
                    question = "'Cinquenta anos de progresso em cinco de governo!' Slogan desenvolvimentista de qual presidente brasileiro?";
                    options = ["Juscelino Kubitschek", "Getúlio Vargas", "João Goulart", "Eurico Gaspar Dutra"];
                    correctAnswer = "Juscelino Kubitschek";
                } else if (step === 4) {
                    question = "'Trabalhadores do Brasil!' Famoso jargão que iniciava os discursos de rádio de qual presidente histórico?";
                    options = ["Getúlio Vargas", "João Goulart", "Jânio Quadros", "Tancredo Neves"];
                    correctAnswer = "Getúlio Vargas";
                } else {
                    question = "'Vim, vi e venci.' (Veni, vidi, vici). Expressão proferida por qual imponente general romano?";
                    options = ["Júlio César", "Augusto", "Nero", "Marco Antônio"];
                    correctAnswer = "Júlio César";
                }
                extraData = { type: 'quote_match' };
                break;

            case 'his_4_p': // Escape da Revolução Francesa
                title = "Teatrinho de História";
                instructions = "Que subam as cortinas! Decida as falas e os rumos dos personagens históricos sob a iluminação do palco!";
                if (step === 1) {
                    question = "Qual grupo representava o Terceiro Estado, majoritário e oprimido na sociedade francesa pré-revolucionária?";
                    options = ["Burguesia, Camponeses e Trabalhadores", "Nobreza clériga", "Realeza e exército real", "Clero episcopal"];
                    correctAnswer = "Burguesia, Camponeses e Trabalhadores";
                } else if (step === 2) {
                    question = "Durante a Revolução Francesa, qual facção radical liderada por Robespierre promoveu o Período do Terror?";
                    options = ["Jacobinos", "Girondinos", "Sans-culottes moderados", "Monarquistas absolutistas"];
                    correctAnswer = "Jacobinos";
                } else if (step === 3) {
                    question = "A famosa declaração que definiu a liberdade e igualdade de direitos de todos no início de 1789 chamava-se:";
                    options = ["Declaração dos Direitos do Homem e do Cidadão", "Código Civil Napoleônico", "Tratado de Versalhes", "Carta Magna de Direitos"];
                    correctAnswer = "Declaração dos Direitos do Homem e do Cidadão";
                } else if (step === 4) {
                    question = "Qual general tomou o poder na França em 1799 com o Golpe do 18 de Brumário, encerrando a revolução?";
                    options = ["Napoleão Bonaparte", "Maximilien Robespierre", "Jean-Paul Marat", "Luís XVI"];
                    correctAnswer = "Napoleão Bonaparte";
                } else {
                    question = "Quem era a Rainha da França casada com Luís XVI, guilhotinada no auge da revolução?";
                    options = ["Maria Antonieta", "Catarina de Médici", "Maria de Médici", "Carlota Joaquina"];
                    correctAnswer = "Maria Antonieta";
                }
                extraData = { type: 'history_theatre' };
                break;

            case 'his_5_p': // Match de presidentes/períodos
                title = "Atos Econômicos da República";
                instructions = "Conecte os presidentes à sua respectiva marca registrada governamental!";
                if (step === 1) {
                    question = "Introdução do 'Plano Real' que finalmente estabilizou a inflação descontrolada no Brasil em 1994:";
                    options = ["Itamar Franco (e FHC)", "Collor de Mello", "José Sarney", "Lula da Silva"];
                    correctAnswer = "Itamar Franco (e FHC)";
                } else if (step === 2) {
                    question = "Presidente que confiscou os depósitos de poupança dos brasileiros em 1990 provocando pânico financeiro:";
                    options = ["Fernando Collor", "José Sarney", "Itamar Franco", "FHC"];
                    correctAnswer = "Fernando Collor";
                } else if (step === 3) {
                    question = "Instaurou o populismo centralizador do Estado Novo (1937-1945) outorgando leis trabalhistas (CLT):";
                    options = ["Getúlio Vargas", "Eurico Dutra", "Jânio Quadros", "Washington Luís"];
                    correctAnswer = "Getúlio Vargas";
                } else if (step === 4) {
                    question = "Seu mandato bizarro e efêmero em 1961 ficou marcado pelo uso da vassoura como símbolo anti-corrupção:";
                    options = ["Jânio Quadros", "João Goulart", "JK", "Castelo Branco"];
                    correctAnswer = "Jânio Quadros";
                } else {
                    question = "Primeiro presidente civil eleito indiretamente que encerrou a Ditadura Militar, mas faleceu antes de assumir:";
                    options = ["Tancredo Neves", "José Sarney", "Ulysses Guimarães", "Paulo Maluf"];
                    correctAnswer = "Tancredo Neves";
                }
                extraData = { type: 'presidential_match' };
                break;

            case 'his_6_p': // Império ou República?
                title = "Império ou República?";
                instructions = "Classifique as características e eventos institucionais na era correta!";
                if (step === 1) {
                    question = "A promulgação da primeira lei de terras e outorga do Poder Moderador pertencem a:";
                    options = ["Brasil Império", "Brasil República", "Brasil Colônia", "Regência Provisória"];
                    correctAnswer = "Brasil Império";
                } else if (step === 2) {
                    question = "A marcante Revolta da Vacina de 1904 no Rio de Janeiro ocorreu durante qual regime?";
                    options = ["Brasil República (República Velha)", "Brasil Império", "Período Regencial", "Estado Novo"];
                    correctAnswer = "Brasil República (República Velha)";
                } else if (step === 3) {
                    question = "A promulgação do Código de Defesa do Consumidor e eleições diretas pós-ditadura:";
                    options = ["Brasil República (Nova República)", "Brasil Império", "Ditadura Militar", "Era Vargas"];
                    correctAnswer = "Brasil República (Nova República)";
                } else if (step === 4) {
                    question = "A histórica Guerra do Paraguai de 1864-1870 deu-se no regime:";
                    options = ["Brasil Império (Segundo Reinado)", "Brasil República", "Brasil Colônia", "Primeira República"];
                    correctAnswer = "Brasil Império (Segundo Reinado)";
                } else {
                    question = "A heróica assinatura da Lei Áurea em 1888 extinguindo a escravidão formal ocorreu no:";
                    options = ["Brasil Império", "Brasil República", "Brasil Colônia", "Governo Hermes da Fonseca"];
                    correctAnswer = "Brasil Império";
                }
                extraData = { type: 'regime_classifier' };
                break;

            case 'his_7_p': // Missão arqueológica
                title = "Arqueologia Prática";
                instructions = "Classifique la fonte histórica e desenterre vestígios do passado humano!";
                if (step === 1) {
                    question = "Um vaso de cerâmica grego pintado datado de 400 a.C. constitui uma:";
                    options = ["Fonte Material e Direta", "Fonte Escrita e Indireta", "Fonte Oral", "Fonte Telegráfica"];
                    correctAnswer = "Fonte Material e Direta";
                } else if (step === 2) {
                    question = "A famosa Carta de Pero Vaz de Caminha descrevendo o território brasileiro em 1500 constitui uma:";
                    options = ["Fonte Escrita Primária", "Fonte Iconográfica secundária", "Fonte Material Arqueológica", "Fonte Oral Lenda"];
                    correctAnswer = "Fonte Escrita Primária";
                } else if (step === 3) {
                    question = "Mitos transmitidos de geração em geração por indígenas tupis sem escrita configuram:";
                    options = ["Fontes Orais", "Fontes Cartográficas", "Fontes Jurídicas", "Fontes Geológicas"];
                    correctAnswer = "Fontes Orais";
                } else if (step === 4) {
                    question = "Para determinar a datação absoluta de artefatos arqueológicos orgânicos antigos, utiliza-se:";
                    options = ["Método do Carbono-14", "Dendrocronologia líquida", "Historiografia positivista", "Litografia"];
                    correctAnswer = "Método do Carbono-14";
                } else {
                    question = "A corrente que defendia apenas documentos oficiais de instituições estatais como fontes válidas de história:";
                    options = ["Positivismo Histórico", "Escola dos Annales", "Marxismo Historiográfico", "Nova História Cultural"];
                    correctAnswer = "Positivismo Histórico";
                }
                extraData = { type: 'archeology_dig' };
                break;

            // --- IDIOMAS ---
            case 'idi_1': // Word Runner
                title = "Word Runner Space";
                instructions = "Atire no caça espacial contendo a tradução correta da palavra destacada!";
                if (step === 1) {
                    question = "Translate into English: 'Cachorro'";
                    options = ["Cat", "Dog", "Bird", "Horse"];
                    correctAnswer = "Dog";
                } else if (step === 2) {
                    question = "Translate into Spanish: 'Maçã'";
                    options = ["Manzana", "Naranja", "Plátano", "Fresa"];
                    correctAnswer = "Manzana";
                } else if (step === 3) {
                    question = "Translate into English: 'Livro'";
                    options = ["Pen", "Notebook", "Book", "Paper"];
                    correctAnswer = "Book";
                } else if (step === 4) {
                    question = "Translate into Spanish: 'Carro'";
                    options = ["Coche (ou Auto)", "Avión", "Barco", "Tren"];
                    correctAnswer = "Coche (ou Auto)";
                } else {
                    question = "Translate into English: 'Janela'";
                    options = ["Door", "Window", "Wall", "Floor"];
                    correctAnswer = "Window";
                }
                extraData = { type: 'running_letters' };
                break;

            case 'idi_2': // Tradução contra o tempo
                title = "Fast Translator";
                instructions = "Selecione o sentido idiomático equivalente antes de zerar o relógio de pulso!";
                if (step === 1) {
                    question = "What does 'I don't mind' mean in Portuguese?";
                    options = ["Eu não me importo", "Eu perdi minha mente", "Eu não gosto disso", "Eu não entendo"];
                    correctAnswer = "Eu não me importo";
                } else if (step === 2) {
                    question = "What does 'Lo siento' mean in Spanish?";
                    options = ["Eu sinto muito / Sinto muito", "Eu me sento", "Eu escuto você", "Eu concordo com você"];
                    correctAnswer = "Eu sinto muito / Sinto muito";
                } else if (step === 3) {
                    question = "What does 'Never mind' mean in English?";
                    options = ["Deixa para lá / Não se preocupe", "Nunca perdi a cabeça", "Eu odeio lembrar", "Até logo"];
                    correctAnswer = "Deixa para lá / Não se preocupe";
                } else if (step === 4) {
                    question = "What does 'De acuerdo' mean in Spanish?";
                    options = ["De acordo / Combinado", "Com certeza não", "Estou com saudades", "Até amanhã"];
                    correctAnswer = "De acordo / Combinado";
                } else {
                    question = "What does 'By the way' mean in English?";
                    options = ["A propósito / Por falar nisso", "Pelo caminho correto", "Longe de tudo", "Tanto faz"];
                    correctAnswer = "A propósito / Por falar nisso";
                }
                extraData = { type: 'fast_time_translation' };
                break;

            case 'idi_3': // Memory de vocabulário
                title = "Memory Pair Match";
                instructions = "Agrupe as cartas emparelhando as conexões idiomáticas!";
                if (step === 1) {
                    question = "Atribua o par traduzido correto para: 'Beautiful'";
                    options = ["Lindo / Bonito", "Feio", "Rápido", "Devagar"];
                    correctAnswer = "Lindo / Bonito";
                } else if (step === 2) {
                    question = "Atribua o par traduzido correto para: 'Perro' em Espanhol";
                    options = ["Cachorro", "Gato", "Pássaro", "Coelho"];
                    correctAnswer = "Cachorro";
                } else if (step === 3) {
                    question = "Atribua o par traduzido correto para: 'Suddenly' em Inglês";
                    options = ["Repentinamente", "Certamente", "Raramente", "Sempre"];
                    correctAnswer = "Repentinamente";
                } else if (step === 4) {
                    question = "Atribua o par traduzido correto para: 'Embarazo' em Espanhol (false friend!)";
                    options = ["Gravidez", "Embaraço / Vergonha", "Grandeza", "Crescimento"];
                    correctAnswer = "Gravidez";
                } else {
                    question = "Atribua o par traduzido correto para: 'Actually' em Inglês (false friend!)";
                    options = ["Na verdade / Realmente", "Atualmente", "Prontamente", "Certamente"];
                    correctAnswer = "Na verdade / Realmente";
                }
                extraData = { type: 'vocab_cards' };
                break;

            case 'idi_4': // Fill in the blank
                title = "Fill in the Blanks";
                instructions = "Selecione o conector ou Verbo Composto ideal para fazer sentido à frase!";
                if (step === 1) {
                    question = "Sentença: 'I always _________ at 6 AM in the morning.'";
                    options = ["get up", "take off", "break down", "chill out"];
                    correctAnswer = "get up";
                } else if (step === 2) {
                    question = "Sentença: 'The plane will _________ in ten minutes.'";
                    options = ["take off", "look for", "give up", "get along"];
                    correctAnswer = "take off";
                } else if (step === 3) {
                    question = "Sentença: 'No me gusta estudiar _________ la noite.'";
                    options = ["por", "en", "para", "de"];
                    correctAnswer = "por";
                } else if (step === 4) {
                    question = "Sentença: 'I am looking forward _________ meeting you.'";
                    options = ["to", "for", "with", "at"];
                    correctAnswer = "to";
                } else {
                    question = "Sentença: 'Ella está contenta _________ sus notas escolares.'";
                    options = ["con", "de", "para", "por"];
                    correctAnswer = "con";
                }
                extraData = { type: 'blank_filler' };
                break;

            case 'idi_5': // Pronúncia + áudio
                title = "Inglês & Espanhol com Música";
                instructions = "Trilha sonora no ar! Complete os versos e traduza as canções mais famosas do mundo!";
                if (step === 1) {
                    question = "Complete o hit romântico 'Birds of a Feather' da Billie Eilish: 'Birds of a feather, we should stick ________.'";
                    options = ["together", "forever", "apart", "tonight"];
                    correctAnswer = "together";
                    explanation = "Excelente! 'Birds of a feather, we should stick together' é um lindo jogo com a expressão idiomática inglesa baseada no ditado original 'Birds of a feather flock together' (pássaros de mesma plumagem voam juntos), usada por Billie para expressar o amor inseparável de almas gêmeas!";
                } else if (step === 2) {
                    question = "Complete o clássico inesquecível da boyband One Direction: 'Baby, you light up my world like nobody ________.'";
                    options = ["else", "can", "knows", "does"];
                    correctAnswer = "else";
                    explanation = "Incrível! 'Baby, you light up my world like nobody else' é um dos refrões mais icônicos do século XXI cantado por Harry Styles, Zayn Malik, Louis Tomlinson, Niall Horan e Liam Payne! A estrutura 'like nobody else' traduz-se como 'como ninguém mais'.";
                } else if (step === 3) {
                    question = "No hino eletrizante 'Cruel Summer' de Taylor Swift, qual palavra rima com o verso anterior: 'I'm drunk in the back of the car, and I cried like a baby coming home from the ________.'";
                    options = ["bar", "star", "car", "far"];
                    correctAnswer = "bar";
                    explanation = "Perfeito! Na célebre ponte dramática de 'Cruel Summer', Taylor Swift rima 'back of the car' com 'home from the bar' para expressar a intensidade de sentimentos escondidos voltando de uma noite intensa.";
                } else if (step === 4) {
                    question = "Domine o refrão viciante do megahit 'Espresso' de Sabrina Carpenter: 'Say you can't sleep, baby, I know. That's that me, ________.'";
                    options = ["espresso", "decaf", "sweetheart", "coffee"];
                    correctAnswer = "espresso";
                    explanation = "Sensacional! Sabrina Carpenter usa a metáfora divertida de ser tão viciante e revigorante quanto um café forte expresso ('That's that me, espresso'), deixando o pretendente acordado a noite inteira pensando nela!";
                } else {
                    question = "Complete o premiadíssimo hino romântico 'Just the Way You Are' de Bruno Mars: 'When I see your face, there's not a thing that I would ________.'";
                    options = ["change", "blame", "rearrange", "forget"];
                    correctAnswer = "change";
                    explanation = "Perfeito! 'Just the Way You Are' é um dos maiores sucessos de Bruno Mars, celebrando o amor incondicional onde a pessoa é perfeita 'do jeitinho que é' sem precisar mudar nada ('there's not a thing that I would change').";
                }
                extraData = { type: 'languages_karaoke' };
                break;

            case 'idi_6': // Idioms challenge
                title = "The Idioms Room";
                instructions = "Desvende as divertidas expressões metafóricas e provérbios populares!";
                if (step === 1) {
                    question = "O provérbio inglês 'A piece of cake' significa literalmente:";
                    options = ["Uma coisa muito fácil", "Um bolo gostoso", "Pagar barato", "Estar atrasado"];
                    correctAnswer = "Uma coisa muito fácil";
                } else if (step === 2) {
                    question = "A expressão em espanhol 'Dar en el clavo' equivale a qual expressão em português?";
                    options = ["Acertar em cheio / Acertar", "Quebrar a cara", "Ficar enrolando", "Fugir do assunto"];
                    correctAnswer = "Acertar em cheio / Acertar";
                } else if (step === 3) {
                    question = "O termo inglês 'Break a leg!' é usado para desejar:";
                    options = ["Boa Sorte! (antes de atuações)", "Azar severo", "Melhoras de saúde", "Bom apetite"];
                    correctAnswer = "Boa Sorte! (antes de atuações)";
                } else if (step === 4) {
                    question = "A expressão espanhola 'Tomar el pelo' significa:";
                    options = ["Brincar / Sarro com alguém", "Cortar cabelo", "Brigar fisicamente", "Dar presentes"];
                    correctAnswer = "Brincar / Sarro com alguém";
                } else {
                    question = "Em inglês, 'It is raining cats and dogs' quer dizer:";
                    options = ["Está chovendo muito forte", "Animais soltos na rua", "Chuva de pedras", "Dia ensolarado"];
                    correctAnswer = "Está chovendo muito forte";
                }
                extraData = { type: 'figurative_idioms' };
                break;

            case 'idi_7': // Dialogue simulator
                title = "Dialogue Simulator Engine";
                instructions = "Selecione o desfecho conversacional mais polido e apropriado!";
                if (step === 1) {
                    question = "Imigração: 'What is the purpose of your visit?' Resposta ideal:";
                    options = ["I am here on vacation for sightseeing.", "I want to work and live forever.", "None of your business.", "What did you say?"];
                    correctAnswer = "I am here on vacation for sightseeing.";
                } else if (step === 2) {
                    question = "Entrevista: 'How do you handle difficult deadlines?' Resposta ideal:";
                    options = ["I prioritize tasks and communicate immediately with the team.", "I usually cry and run away.", "I work all night without sleeping.", "I ignore them and rest."];
                    correctAnswer = "I prioritize tasks and communicate immediately with the team.";
                } else if (step === 3) {
                    question = "Restaurante: 'Would you like some dessert?' Resposta ideal para recusar com polidez:";
                    options = ["No, thank you, I am full.", "I hate sweets.", "No, bring me the bill immediately.", "I have no money."];
                    correctAnswer = "No, thank you, I am full.";
                } else if (step === 4) {
                    question = "Hotel em Espanhol: '¿A qué nombre está la reserva?' Resposta ideal:";
                    options = ["Está a nombre de Carlos Mendes.", "No sé nada de nombres.", "Reservé ayer por la tarde.", "Quiero mi llave ya."];
                    correctAnswer = "Está a nombre de Carlos Mendes.";
                } else {
                    question = "Negociações: 'We are ready to sign, but the pricing needs adjustments.' Resposta cooperativa:";
                    options = ["Let's review the breakdown to find a fair middle ground.", "We will not change our prices.", "Then the deal is completely over.", "Okay, you write whatever you want."];
                    correctAnswer = "Let's review the breakdown to find a fair middle ground.";
                }
                extraData = { type: 'chat_simulator' };
                break;

            case 'fil_1':
                title = "O Banquete dos Filósofos";
                instructions = "Participe de um debate dialético emocionante respondendo conforme os ensinamentos dos pensadores!";
                if (step === 1) {
                    question = "Para Sócrates, o verdadeiro ponto de partida da filosofia através do método maiêutico consiste em:";
                    options = ["Reconhecer a própria ignorância para dar parto a novas ideias", "Provar que os outros filósofos estão completamente errados", "Acumular o maior número possível de fatos e dogmas", "Submeter-se cegamente à opinião da maioria da pólis"];
                    correctAnswer = "Reconhecer a própria ignorância para dar parto a novas ideias";
                } else if (step === 2) {
                    question = "De acordo com o racionalismo cartesiano, a dúvida metódica exige que o filósofo de início:";
                    options = ["Rejeite temporariamente tudo aquilo que possa suscitar a menor incerteza", "Aceite apenas as verdades reveladas pelas autoridades religiosas", "Acredite piamente em tudo o que os sentidos físicos demonstram", "Abandone a razão e baseie seus julgamentos apenas na emoção pura"];
                    correctAnswer = "Rejeite temporariamente tudo aquilo que possa suscitar a menor incerteza";
                } else if (step === 3) {
                    question = "Nietzsche defende um projeto de superação de valores. Ele direciona sua crítica mais ácida à:";
                    options = ["Moral de escravos, baseada no ressentimento e na negação da vida", "Vontade de potência e expansão de nossas faculdades criadoras", "Ideia de aceitação sublime do destino por meio do amor-fati", "Doutrina do Super-Homem como meta evolutiva da humanidade"];
                    correctAnswer = "Moral de escravos, baseada no ressentimento e na negação da vida";
                } else if (step === 4) {
                    question = "Visando resguardar a moral pura, o 'Imperativo Categórico' formulado por Kant prescreve que o ato ético deve:";
                    options = ["Poder ser adotado como uma regra válida para todos sem contradição", "Buscar o máximo de benefício e utilidade pessoal a curto prazo", "Seguir estritamente os impulsos emocionais mais profundos do agente", "Adequar-se aos costumes populares de cada região ou cultura"];
                    correctAnswer = "Poder ser adotado como uma regra válida para todos sem contradição";
                } else {
                    question = "No célebre Mito da Caverna de Platão, o que representa a visão restrita dos prisioneiros acorrentados?";
                    options = ["Ilusões do mundo sensível e a opinião vulgar desprovida de ciência", "Visões proféticas e verdades elevadas sobre o futuro cósmico", "Acesso direto à essência inteligível e pura das ideias eternas", "A liberdade alcançada pelos filósofos que retornam para anunciar"];
                    correctAnswer = "Ilusões do mundo sensível e a opinião vulgar desprovida de ciência";
                }
                extraData = { type: 'philosophy_debate' };
                break;

            case 'soc_1':
                title = "Mesa-Redonda Sociológica";
                instructions = "Analise e faça considerações nas correntes sociológicas fundamentais das relações humanas!";
                if (step === 1) {
                    question = "Para Karl Marx, o conflito que define a dinâmica histórica e o desenvolvimento das forças produtivas é o de:";
                    options = ["Lutas estruturais de classes com interesses materiais antagônicos", "Cooperativismo pacífico e harmonia inata entre as classes", "Modificações genéticas e puramente biológicas do ser humano", "Consenso pacífico promovido pelas elites intelectuais religiosas"];
                    correctAnswer = "Lutas estruturais de classes com interesses materiais antagônicos";
                } else if (step === 2) {
                    question = "Segundo Émile Durkheim, quais são as características definidoras de um 'Fato Social'?";
                    options = ["A exterioridade ao indivíduo, a coatividade e a generalidade estatística", "A dependência direta dos sentimentos e desejos individuais biológicos", "A volatilidade baseada na diversão momentânea de grupos restritos", "A natureza puramente imaginária e sem qualquer impacto prático"];
                    correctAnswer = "A exterioridade ao indivíduo, a coatividade e a generalidade estatística";
                } else if (step === 3) {
                    question = "Na concepção sociológica de Max Weber, uma conduta humana é classificada de fato como 'Ação Social' quando:";
                    options = ["O sentido subjetivo da ação é orientado para a conduta de outros indivíduos", "O comportamento ocorre puramente por indução instintiva inconsciente", "O ato é planejado e executado exclusivamente por representantes estatais", "Ocorre de forma inteiramente isolada sem qualquer impacto coletivo"];
                    correctAnswer = "O sentido subjetivo da ação é orientado para a conduta de outros indivíduos";
                } else if (step === 4) {
                    question = "O conceito de 'Anomia Social' desenvolvido por Durkheim designa um estado de:";
                    options = ["Ausência ou enfraquecimento crônico das normas integradoras e reguladoras", "Pleno exercício da soberania direta e harmonia legal coletiva", "Igualdade material absoluta decorrente de reformas econômicas", "Desenvolvimento tecnológico acelerado com estabilidade de valores"];
                    correctAnswer = "Ausência ou enfraquecimento crônico das normas integradoras e reguladoras";
                } else {
                    question = "Marx formula o conceito de 'Mais-Valia' para elucidar a exploração capitalista. Ele a conceitua como:";
                    options = ["A diferença entre o valor gerado pelo trabalhador e a remuneração paga pelo capital", "O bônus financeiro concedido voluntariamente ao final do ano", "A tributação cobrada diretamente pelo Estado sobre a circulação de bens", "A contribuição assistencialista voltada aos setores marginalizados"];
                    correctAnswer = "A diferença entre o valor gerado pelo trabalhador e a remuneração paga pelo capital";
                }
                extraData = { type: 'philosophy_debate', variant: 'sociology' };
                break;

            case 'mat_8':
                title = "A Casinha da Matemática";
                instructions = "Explore os cômodos e portas para desvendar equações, frações e a geometria do lar!";
                if (step === 1) {
                    question = "Na Cozinha encontram-se 3/4 de uma pizza. Se comermos metade dessa fatia, quanto resta da pizza inteira?";
                    options = ["3/8 da pizza", "1/4 da pizza", "1/2 da pizza", "3/2 da pizza"];
                    correctAnswer = "3/8 da pizza";
                } else if (step === 2) {
                    question = "No Quarto, a parede mede 12m² de área. Se o comprimento é x + 2 e a largura é 3m, qual o valor de x?";
                    options = ["x = 2", "x = 4", "x = 3", "x = 6"];
                    correctAnswer = "x = 2";
                } else if (step === 3) {
                    question = "No Sótão há uma escada com padrão: 2, 5, 8, 11... Qual é o número do próximo degrau?";
                    options = ["14", "15", "13", "12"];
                    correctAnswer = "14";
                } else if (step === 4) {
                    question = "Na Sala, a mesa tem tampo circular de raio 2m. Usando pi = 3.14, qual é a área do tampo?";
                    options = ["12.56 m²", "6.28 m²", "25.12 m²", "3.14 m²"];
                    correctAnswer = "12.56 m²";
                } else {
                    question = "No Jardim dos Fundos, a probabilidade de chover amanhã é 25%. Qual a probabilidade de NÃO chover?";
                    options = ["75%", "50%", "25%", "80%"];
                    correctAnswer = "75%";
                }
                extraData = { type: 'math_house' };
                break;
        }

        // Embaralha as alternativas para que a correta não fique sempre na mesma posição
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

        return {
            title,
            instructions,
            question,
            options: shuffledOptions,
            correctAnswer,
            explanation,
            extraData
        };
    };

    const handleGameStart = (game: ContentItem) => {
        setSelectedGame(game);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setGameTimer(30);
        
        const difficultyKey = `${game.topic}_${game.difficulty}`;
        const topicQuestions = QUESTIONS_BY_TOPIC[difficultyKey] || QUESTIONS_BY_TOPIC[game.topic] || QUESTIONS_BY_TOPIC['Interpretação'];
        
        if (game.type === 'interactive_lab') {
            setLabStep(1);
            setLabHearts(3);
            setLabFormulaResult('');
            setLabSelectedAnswer(null);
            setLabFeedbackMessage('');
            setLabCustomInput('');
            setLabSuccessChain([]);
            const firstTask = generateLabTask(game.id, 1);
            setLabGameEngine(firstTask);
            setGameState('playing');
        } else if (game.type === 'match') {
            const options = topicQuestions.slice(0, 4).map(q => ({
                id: q.id,
                text: q.text,
                answer: q.options[q.correct]
            }));
            const shuffledAnswers = [...options].sort(() => Math.random() - 0.5);
            setMatchPairs(options.map((o, i) => ({ ...o, shuffledAnswer: shuffledAnswers[i].answer, correctId: shuffledAnswers[i].id })));
            setGameState('playing');
        } else if (game.type === 'whack') {
            const currentQ = topicQuestions[0];
            const targets = currentQ.options.map((opt, i) => ({
                text: opt,
                isCorrect: i === currentQ.correct,
                active: false,
                id: i
            }));
            setWhackTargets(targets);
            setGameState('playing');
        } else if (game.type === 'quiz') setGameState('playing');
        else if (game.type === 'memory') startMemory();
        else if (game.type === 'speed') startSpeed();
        else if (game.type === 'duel') startDuel();
        else if (game.type === 'tower') startTower();
        else if (game.type === 'anagram') startAnagram();
        else if (game.type === 'hangman') startHangman();
        else if (game.type === 'box') startBox();
        else if (game.type === 'wheel') startWheel();
        // --- CUSTOM GAME START CHECKS ---
        else if (game.type === 'math_zombies') startMathZombies();
        else if (game.type === 'chemistry_lab') startChemistryLab();
        else if (game.type === 'tic_tac_toe') startTicTacToe();
        else if (game.type === 'bio_anatomy') startBioAnatomy();
        else if (game.type === 'history_timeline') startHistoryTimeline();
        else setGameState('playing');
    };

    // --- Custom Interactive Games Helper Handlers ---
    // Universal Lab Handlers
    const handleLabSubmitAnswer = (option: string) => {
        if (isAnswered) return;
        setLabSelectedAnswer(option);
        setIsAnswered(true);
        
        const isCorrect = option === labGameEngine.correctAnswer;
        
        if (isCorrect) {
            setScore(prev => prev + 100);
            setCorrectAnswersCount(prev => prev + 1);
            setLabFeedbackMessage(labGameEngine.explanation || 'Correto! Raciocínio brilhante do vestibular!');
            setLabSuccessChain(prev => [...prev, true]);
            toast.success('RESPOSTA CORRETA! Você desbravou o desafio.', { icon: '🎯' });
        } else {
            setLabHearts(prev => Math.max(0, prev - 1));
            setLabFeedbackMessage(labGameEngine.explanation ? `Incorreto. ${labGameEngine.explanation}` : `Ops! O correto era: ${labGameEngine.correctAnswer}`);
            setLabSuccessChain(prev => [...prev, false]);
            toast.error('RESPOSTA INCORRETA! O Corvo Mentor recomenda estudar mais.', { icon: '⚠️' });
        }
    };

    const handleLabNextStep = () => {
        if (labHearts <= 0) {
            finishGame(score, selectedGame?.xp || 150);
            return;
        }

        if (labStep >= 5) {
            finishGame(score + 150, selectedGame?.xp || 200);
            return;
        }

        const nextS = labStep + 1;
        setLabStep(nextS);
        setIsAnswered(false);
        setLabSelectedAnswer(null);
        setLabFeedbackMessage('');
        const nextTask = generateLabTask(selectedGame!.id, nextS);
        setLabGameEngine(nextTask);
    };

    // 1. Math Zombies
    const handleZombieSubmit = (e?: any) => {
        if (e) e.preventDefault();
        const parsed = parseInt(mathInput.trim());
        if (isNaN(parsed)) return;

        const matchIdx = zombies.findIndex(z => z.answer === parsed && z.status === 'alive');
        if (matchIdx !== -1) {
            const updated = [...zombies];
            updated[matchIdx].status = 'dying';
            setZombies(updated);
            
            const nextKilledCount = zombiesKilled + 1;
            setZombiesKilled(nextKilledCount);
            setScore(s => s + 70);
            setCorrectAnswersCount(c => c + 1);
            toast.success('TIRO CERTEIRO! Um zumbi foi desintegrado.', { icon: '🎯' });
            setMathInput('');

            if (nextKilledCount >= 5) {
                setTimeout(() => {
                    finishGame(score + 350, selectedGame?.xp || 0);
                }, 1200);
            } else {
                setTimeout(() => {
                    setZombies(prev => {
                        const clean = prev.filter(z => z.id !== updated[matchIdx].id);
                        const ops = ['+', '-', 'x'];
                        const op = ops[Math.floor(Math.random() * ops.length)];
                        let a = 0, b = 0, eq = '', ans = 0;
                        if (op === '+') {
                            a = Math.floor(Math.random() * 40) + 10;
                            b = Math.floor(Math.random() * 40) + 10;
                            eq = `${a} + ${b}`;
                            ans = a + b;
                        } else if (op === '-') {
                            a = Math.floor(Math.random() * 40) + 20;
                            b = Math.floor(Math.random() * (a - 4)) + 4;
                            eq = `${a} - ${b}`;
                            ans = a - b;
                        } else {
                            a = Math.floor(Math.random() * 8) + 2;
                            b = Math.floor(Math.random() * 9) + 2;
                            eq = `${a} x ${b}`;
                            ans = a * b;
                        }
                        return [...clean, {
                            id: Date.now(),
                            equation: eq,
                            answer: ans,
                            distance: 140,
                            status: 'alive' as const
                        }];
                    });
                }, 800);
            }
        } else {
            toast.error('Cálculo incorreto! Os zumbis avançaram mais rápido!', { icon: '🧟' });
            setZombies(prev => prev.map(z => z.status === 'alive' ? { ...z, distance: Math.max(16, z.distance - 25) } : z));
            setMathInput('');
        }
    };

    const getBeakerColor = () => {
        const hasPhenol = addedChemicals.includes('Fenolftaleína') || chemSelectedIndicator === 'Fenolftaleína';
        const hasBromo = addedChemicals.includes('Azul de Bromotimol') || chemSelectedIndicator === 'Azul de Bromotimol';
        
        if (!hasPhenol && !hasBromo) {
            return 'bg-blue-100/30';
        }
        
        if (hasBromo) {
            if (solutionPh < 6.5) return 'bg-yellow-400/70 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]';
            if (solutionPh > 7.6) return 'bg-blue-600/70 border-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.4)]';
            return 'bg-emerald-500/70 border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
        }
        
        if (hasPhenol) {
            if (solutionPh >= 8.2) return 'bg-fuchsia-600/70 border-fuchsia-700 shadow-[0_0_20px_rgba(217,70,239,0.4)]';
            return 'bg-blue-100/10 border-slate-300';
        }
        
        return 'bg-blue-100/30';
    };

    // 2. Chemistry Lab (Acid-Base Indicators)
    const handleChemistryAdd = (chemical: string) => {
        setChemicalBeakerState('bubbling');
        setAddedChemicals(prev => prev.includes(chemical) ? prev : [...prev, chemical]);
        
        if (chemical === 'Ácido Clorídrico (HCl)') {
            setSolutionPh(p => Math.max(1.0, parseFloat((p - 1.5).toFixed(1))));
            toast.success('Adicionado HCl (Diminuiu pH)', { icon: '🧪' });
        } else if (chemical === 'Hidróxido de Sódio (NaOH)') {
            setSolutionPh(p => Math.min(14.0, parseFloat((p + 1.5).toFixed(1))));
            toast.success('Adicionado NaOH (Aumentou pH)', { icon: '🧪' });
        } else if (chemical === 'Água Destilada') {
            setSolutionPh(p => {
                if (p > 7.0) return parseFloat(Math.max(7.0, p - 1.0).toFixed(1));
                if (p < 7.0) return parseFloat(Math.min(7.0, p + 1.0).toFixed(1));
                return p;
            });
            toast.success('Adicionado H₂O (Diluição neutralizadora)', { icon: '💧' });
        } else if (chemical.includes('Indicador')) {
            toast.success(`Indicador ${chemical} carregado no béquer!`);
        }
        
        setTimeout(() => setChemicalBeakerState('idle'), 1000);
    };

    const handleChemistryConclude = () => {
        const hasPhenol = addedChemicals.includes('Fenolftaleína');
        const hasBromo = addedChemicals.includes('Azul de Bromotimol');
        
        if (!hasPhenol && !hasBromo) {
            toast.error('Você precisa adicionar pelo menos um indicador (Fenolftaleína ou Azul de Bromotimol) para visualizar a mudança de pH!');
            return;
        }

        const isNeutral = solutionPh >= 6.8 && solutionPh <= 7.2;
        if (isNeutral) {
            toast.success('Neutralização Perfeita Realizada com sucesso!', { icon: '🎓' });
            setScore(s => s + 400);
            setCorrectAnswersCount(c => c + 1);
            setTimeout(() => {
                finishGame(score + 400, selectedGame?.xp || 0);
            }, 1500);
        } else {
            toast.error(`Reação instável! O pH atual é ${solutionPh}. Tente aproximar de 7.0 (Neutro).`, { icon: '⚠️' });
        }
    };

    // 3. Jogo da Velha (Gramática / Português)
    const handleTicTacToeGridClick = (index: number) => {
        if (ticTacToeBoard[index] !== null || ticTacToeWinner !== null || ticTacToeActiveIndex !== null) return;
        
        const question = ticTacToeQuestions[Math.floor(Math.random() * ticTacToeQuestions.length)];
        setTicTacToeActiveIndex(index);
        setTicTacToeCurrentQuestion(question);
    };

    const handleTicTacToeAnswer = (optionIdx: number) => {
        if (ticTacToeActiveIndex === null || !ticTacToeCurrentQuestion) return;
        
        const isCorrect = optionIdx === ticTacToeCurrentQuestion.correct;
        const index = ticTacToeActiveIndex;
        
        const newBoard = [...ticTacToeBoard];
        
        if (isCorrect) {
            newBoard[index] = 'O';
            setScore(s => s + 100);
            setCorrectAnswersCount(c => c + 1);
            toast.success('Resposta corretíssima! Célula conquistada!', { icon: '✅' });
        } else {
            newBoard[index] = 'X';
            toast.error('Incorreto! O Corvo Professor bloqueou este espaço!', { icon: '🐦' });
        }
        
        setTicTacToeBoard(newBoard);
        setTicTacToeActiveIndex(null);
        setTicTacToeCurrentQuestion(null);
        
        const nextWinner = checkTicTacToeWinner(newBoard);
        if (nextWinner) {
            setTicTacToeWinner(nextWinner);
            if (nextWinner === 'O') {
                toast.success('Vitória no Jogo da Velha! Excelente gramática.', { icon: '🏆' });
                setScore(s => s + 200);
                setTimeout(() => finishGame(score + 300, selectedGame?.xp || 0), 2000);
            } else {
                toast.error('O Corvo venceu! Revise as regras gramaticais e tente de novo.', { icon: '🐦' });
                setTimeout(() => finishGame(Math.max(50, score), selectedGame?.xp || 0), 2000);
            }
            return;
        }
        
        if (isCorrect) {
            const emptyIndices = newBoard.map((val, idx) => val === null ? idx : null).filter(v => v !== null) as number[];
            if (emptyIndices.length > 0) {
                setTimeout(() => {
                    const ravenMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    const boardAfterRaven = [...newBoard];
                    boardAfterRaven[ravenMove] = 'X';
                    setTicTacToeBoard(boardAfterRaven);
                    toast.info('O Corvo fez a jogada dele!', { icon: '🐦' });
                    
                    const ravenWinner = checkTicTacToeWinner(boardAfterRaven);
                    if (ravenWinner) {
                        setTicTacToeWinner(ravenWinner);
                        if (ravenWinner === 'X') {
                            toast.error('O Corvo conseguiu alinhar três! Tente de novo.', { icon: '😢' });
                            setTimeout(() => finishGame(Math.max(50, score), selectedGame?.xp || 0), 2000);
                        }
                    } else if (boardAfterRaven.every(cell => cell !== null)) {
                        setTicTacToeWinner('Empate');
                        toast.info('Deu velha! Empate técnico.', { icon: '🤝' });
                        setTimeout(() => finishGame(score + 100, selectedGame?.xp || 0), 2000);
                    }
                }, 1000);
            } else {
                setTicTacToeWinner('Empate');
                toast.info('Deu velha! Empate técnico.', { icon: '🤝' });
                setTimeout(() => finishGame(score + 100, selectedGame?.xp || 0), 2000);
            }
        } else {
            if (newBoard.every(cell => cell !== null)) {
                setTicTacToeWinner('Empate');
                toast.info('Deu velha! Empate técnico.', { icon: '🤝' });
                setTimeout(() => finishGame(score + 100, selectedGame?.xp || 0), 2000);
            }
        }
    };

    const checkTicTacToeWinner = (board: (string | null)[]) => {
        const winningLines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < winningLines.length; i++) {
            const [a, b, c] = winningLines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    };

    // 4. Bio Cell Anatomy Mapping
    const handleBioPartSelect = (organelleName: string) => {
        setSelectedBioPart(organelleName);
        
        const details: Record<string, string> = {
            'Mitocôndria': 'Usina energética da célula. Responsável pela síntese de ATP por meio da respiração celular aeróbica.',
            'Ribossomo': 'Fábrica de proteínas da célula. Traduz moléculas de RNAm para montar cadeias peptídicas e estruturais.',
            'Cloroplasto': 'Organela vegetal da fotossíntese. Capta luz para realizar a fixação quimiomolecular do carbono.',
            'Complexo de Golgi': 'Centro de empacotamento, distribuição, processamento químico e secreção de macromoléculas.',
            'Núcleo': 'Biblioteca genética. Contém cromossomos, nucléolo estruturado e gerencia as instruções replicadoras celulares.',
            'Lisossomo': 'Central de digestão intracelular contendo enzimas hidrolíticas ativadas sob pH ácido.'
        };
        
        if (!bioUnlockedParts.includes(organelleName)) {
            const updated = [...bioUnlockedParts, organelleName];
            setBioUnlockedParts(updated);
            setScore(s => s + 85);
            setCorrectAnswersCount(c => c + 1);
            setBioAnatomyStatus(`Descoberta: ${organelleName}! ${details[organelleName]}`);
            
            if (updated.length >= 6) {
                toast.success('Sensacional! Você mapeou todas as principais estruturas celulares!', { icon: '🧬' });
                setTimeout(() => {
                    finishGame(score + 510, selectedGame?.xp || 0);
                }, 2500);
            } else {
                toast.success(`Estrutura mapeada (+85 XP): ${organelleName}`, { icon: '🔬' });
            }
        } else {
            setBioAnatomyStatus(`${organelleName}: ${details[organelleName]}`);
        }
    };

    // 5. History Timeline
    const handleShiftTimeline = (idx: number, direction: 'up' | 'down') => {
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === timelineItems.length - 1) return;
        
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const newItems = [...timelineItems];
        
        const temp = { ...newItems[idx] };
        newItems[idx] = { ...newItems[targetIdx] };
        newItems[targetIdx] = temp;
        
        newItems[idx].index = idx;
        newItems[targetIdx].index = targetIdx;
        
        setTimelineItems(newItems);
        
        const comments = [
            "Excelente escolha de realocação temporal!",
            "Interessante... O fluxo da história está mudando sob sua influência.",
            "As datas começam a fazer sentido sob seu olhar clínico!",
            "Atenção para as reviravoltas da história!"
        ];
        setCorvoSpeech(comments[Math.floor(Math.random() * comments.length)]);
    };

    const handleValidateTimeline = () => {
        const expectedOrder = ['ev1', 'ev2', 'ev3', 'ev4', 'ev5', 'ev6'];
        let correctCount = 0;
        
        timelineItems.forEach((item, idx) => {
            if (item.id === expectedOrder[idx]) {
                correctCount++;
            }
        });
        
        if (correctCount === expectedOrder.length) {
            toast.success('Sensacional! Linha do tempo perfeitamente restabelecida!', { icon: '⏳' });
            setScore(s => s + 450);
            setCorrectAnswersCount(c => c + 1);
            setCorvoSpeech("Estupendo! Você é um verdadeiro mestre de Ciências Humanas. Toda a cronologia nacional está salva!");
            setTimeout(() => {
                finishGame(score + 450, selectedGame?.xp || 0);
            }, 1800);
        } else {
            setScore(s => Math.max(0, s - 30));
            setCorvoSpeech(`Hum, ainda há algumas anomalidades temporais. Você encaixou ${correctCount} de ${expectedOrder.length} eventos nas ordens corretas. Utilize minha dica se precisar!`);
            toast.error(`Incorreto! ${correctCount}/${expectedOrder.length} eventos no lugar correto.`, { icon: '⏱️' });
        }
    };

    const handleCorvoHint = () => {
        setTimelineHintUsed(true);
        setCorvoSpeech("Dica Especial do Corvo: Dom João VI assenta no Brasil em 1808 (Corte). A Declaração do Ipiranga por Pedro I ocorre logo depois em 1822. A Lei Áurea de 1888 encerra formalmente a escravidão um ano antes de Deodoro declarar a República em 1889!");
        toast.info('O Corvo Sábio sussurrou uma pista histórica!', { icon: '💡' });
    };

    const currentQuestions = useMemo(() => {
        if (!selectedGame) return [];
        
        // Map common topics to QUESTIONS_BY_TOPIC keys
        const topicMap: Record<string, string> = {
            'Biologia': 'Citologia',
            'Química': 'Físico-Química',
            'Linguagens': 'Interpretação',
            'Humanos': 'Brasil',
            'Matemática': 'Básica',
            'Álgebra': 'Álgebra',
            'Funções': 'Básica',
            'Geometria': 'Geometria',
            'Probabilidade': 'Básica',
            'Aritmética': 'Básica',
            'Raciocínio Lógico': 'Básica',
            'Matemática Financeira': 'Básica',
        };

        const topic = topicMap[selectedGame.topic] || selectedGame.topic;
        const difficultyKey = `${topic}_${selectedGame.difficulty}`;
        const baseQuestions = QUESTIONS_BY_TOPIC[difficultyKey] || QUESTIONS_BY_TOPIC[topic] || QUESTIONS_BY_TOPIC['Interpretação'];
        
        return baseQuestions.map(q => {
            const mappedOptions = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correct }));
            const shuffled = [...mappedOptions].sort(() => Math.random() - 0.5);
            return {
                ...q,
                options: shuffled.map(o => o.text),
                correct: shuffled.findIndex(o => o.isCorrect)
            };
        });
    }, [selectedGame]);

    const currentQuestion = currentQuestions[currentQuestionIndex] || currentQuestions[0];

    const handleQuizAnswer = (index: number) => {
        if (isAnswered || !currentQuestion) return;
        setSelectedOption(index);
        setIsAnswered(true);
        
        const isCorrect = index === currentQuestion.correct; 
        if (isCorrect) {
            setScore(prev => prev + 1);
            toast.success('Correto! +XP');
        } else {
            toast.error('Incorreto!');
        }
    };

    const handleMemoryClick = (index: number) => {
        if (flippedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

        const newCards = [...memoryCards];
        newCards[index].isFlipped = true;
        setMemoryCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const [first, second] = newFlipped;
            if (memoryCards[first].content === memoryCards[second].content) {
                setTimeout(() => {
                    const matchedCards = [...memoryCards];
                    matchedCards[first].isMatched = true;
                    matchedCards[second].isMatched = true;
                    setMemoryCards(matchedCards);
                    setFlippedIndices([]);
                    const newScore = score + 100;
                    setScore(newScore);
                    const newCount = correctAnswersCount + 1;
                    setCorrectAnswersCount(newCount);
                    toast.success('Par encontrado! +100 p', { icon: '✨' });
                    
                    if (matchedCards.every(c => c.isMatched)) {
                        setTimeout(() => {
                            finishGame(newScore, selectedGame?.xp || 150);
                        }, 1000);
                    }
                }, 500);
            } else {
                setTimeout(() => {
                    const resetCards = [...memoryCards];
                    resetCards[first].isFlipped = false;
                    resetCards[second].isFlipped = false;
                    setMemoryCards(resetCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    useEffect(() => {
        let timer: any;
        if (speedActive && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && speedActive) {
            setSpeedActive(false);
            setGameState('results');
        }
        return () => clearInterval(timer);
    }, [speedActive, timeLeft]);

    // Unified Magical Game Starter for Hogwarts Castle Adventure
    const startMagicalGame = (id: string, title: string, category: string, desc: string, xp: number) => {
        let matchingItem = CONTENT_ITEMS.find(item => item.id === id);
        if (!matchingItem) {
            matchingItem = {
                id: id,
                title: title,
                subject: category === 'QUÍMICA' ? 'Química' : 
                         category === 'BIOLOGIA' ? 'Biologia' : 
                         category === 'PORTUGUÊS' ? 'Português' : 
                         category === 'MATEMÁTICA' ? 'Matemática' : 'História',
                topic: category,
                type: id === 'chem_lab_1' ? 'chemistry_lab' :
                      id === 'history_timeline_1' ? 'history_timeline' :
                      id === 'math_zombies_1' ? 'math_zombies' :
                      id === 'tic_tac_toe_1' ? 'tic_tac_toe' :
                      id === 'bio_anatomy_1' ? 'bio_anatomy' : 'interactive_lab',
                difficulty: 'Médio',
                xp: xp,
                description: desc,
                image: '',
                rarity: 'Épico'
            } as ContentItem;
        }
        handleGameStart(matchingItem);
    };

    const renderLobby = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-24">
            {/* CLEAN HERO HEADER - REDESIGNED */}
            <div className="relative mb-16">
                {/* Ambient background glow */}
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] -z-10" />
                
                <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-12">
                    <div className="space-y-6 flex-1 min-w-0">
                        <motion.div 
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 text-blue-500/60"
                        >
                            <div className="w-12 h-[2px] rounded-full bg-gradient-to-r from-blue-600 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.2)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.6em] font-mono">Plataforma de Desafios</span>
                        </motion.div>
                        
                        <div className="relative">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-6xl 2xl:text-7xl font-black text-[var(--text-primary)] font-anton uppercase tracking-tighter leading-[0.85] drop-shadow-2xl select-none">
                                <span className="whitespace-nowrap">Domine o</span> <br/>
                                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-blue-600 pb-2">
                                    Conhecimento
                                </span>
                            </h1>
                        </div>

                        <p className="text-slate-600 dark:text-slate-200 font-bold text-lg md:text-xl md:max-w-3xl tracking-tight leading-relaxed border-l-4 border-blue-500/50 pl-8 py-2 bg-gradient-to-r from-blue-500/5 to-transparent rounded-r-2xl">
                            <span className="text-blue-400">Transforme teoria em soberania.</span> Explore uma fronteira final de desafios dinâmicos, projetados para elevar seu potencial ao nível máximo.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                        {(() => {
                            const userRank = rankingData.find(u => u.isMe)?.rank;
                            const rankingValue = userRank ? (userRank < 10 ? `#0${userRank}` : `#${userRank}`) : '#--';
                            
                            const userXpVal = userProfile?.xp !== undefined ? userProfile.xp : 0;
                            const formatSincronia = (xpVal: number) => {
                                if (xpVal >= 1000) return `${(xpVal / 1000).toFixed(1).replace('.', ',')}k`;
                                return xpVal.toString();
                            };
                            const sincroniaValue = userProfile?.xp !== undefined ? formatSincronia(userXpVal) : '--';
                            
                            const userOndaVal = (userProfile as any)?.streak !== undefined ? (userProfile as any).streak : 0;
                            const ondaValue = `${userOndaVal} ${userOndaVal === 1 ? 'Dia' : 'Dias'}`;

                            return [
                                { label: 'RANKING', value: rankingValue, color: 'text-amber-500', icon: <Trophy size={18} />, bg: 'bg-amber-500/5', border: 'border-amber-500/20', glow: 'shadow-amber-500/10', target: 'ranking', tooltip: 'Ver Rank' },
                                { label: 'SINCRONIA', value: sincroniaValue, color: 'text-blue-400', icon: <Activity size={18} />, bg: 'bg-blue-500/5', border: 'border-blue-500/20', glow: 'shadow-blue-500/10', target: 'ranking', tooltip: 'Ver Detalhes do Rank' },
                                { label: 'ONDA', value: ondaValue, color: 'text-orange-500', icon: <Flame size={18} />, bg: 'bg-orange-500/5', border: 'border-orange-500/20', glow: 'shadow-orange-500/10', target: 'conquistas', tooltip: 'Ver Conquistas' }
                            ].map((stat, i) => (
                                <motion.div 
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                                    onClick={() => handleStatCardClick(stat.target as any)}
                                    className={`relative group p-6 pb-8 rounded-[2.5rem] bg-slate-50 dark:bg-black/30 backdrop-blur-3xl border border-slate-200 dark:${stat.border} flex flex-col items-center justify-center min-w-[140px] md:min-w-[160px] ${stat.glow} transition-all duration-500 hover:scale-105 hover:bg-slate-100 dark:hover:bg-white/[0.05] shadow-2xl cursor-pointer`}
                                    title={stat.tooltip}
                                >
                                    <div className={`flex items-center gap-2 mb-3 ${stat.color} opacity-60 group-hover:opacity-100 transition-all`}>
                                        <div className={`p-2 rounded-xl scale-90 group-hover:scale-100 transition-transform ${stat.bg}`}>{stat.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">{stat.label}</span>
                                    </div>
                                    <span className={`text-3xl md:text-4xl font-black tabular-nums ${stat.color} tracking-tight drop-shadow-sm`}>{stat.value}</span>
                                    
                                    {/* Action link indicator */}
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 opacity-30 group-hover:opacity-100 transition-all duration-300 mt-2 flex items-center gap-1 uppercase">
                                        {stat.tooltip} <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform animate-pulse">→</span>
                                    </span>

                                    {/* Bottom Accent Line */}
                                    <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-current ${stat.color} opacity-10 group-hover:opacity-30 transition-all`} />
                                </motion.div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* 🎮 ARENA DE SIMULADORES E JOGOS DE IMPACTO - GAMIFICAÇÃO EM DESTAQUE */}
            <div className="bg-gradient-to-r from-blue-900/10 via-blue-900/10 to-transparent p-8 md:p-10 rounded-[3rem] border border-blue-500/15 shadow-2xl relative overflow-hidden my-12">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-blue-500 font-mono text-xs font-black uppercase tracking-[0.4em]">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                                🎯 Aprendizado Prático de Alto Impacto
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none mt-1">
                                Laboratórios & Arena de Gamificação Virtual
                            </h2>
                            <p className="text-slate-400 dark:text-zinc-350 font-bold text-base max-w-2xl leading-relaxed mt-2">
                                Nada de teoria chata! Clique nos simuladores especiais abaixo para experimentar reações químicas, ordenar marcos históricos, e detonar zumbis matemáticos.
                            </p>
                        </div>
                        <div className="px-6 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/25 text-sm font-black text-blue-400 tracking-wider">
                            ⚡ 12 JOGOS PREMIUM ATIVOS
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4 w-full">
                        {[
                            {
                                id: 'chem_lab_1',
                                title: 'Laboratório de Química',
                                subtitle: 'Titulação de pH em Tempo Real',
                                desc: 'Simulador interativo de ácidos, bases e indicadores (Fenolftaleína e Azul de Bromotimol) para chegar ao ponto neutro!',
                                category: 'QUÍMICA',
                                color: 'border-teal-500/30 hover:border-teal-500 bg-teal-500/5 dark:bg-teal-500/5',
                                badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                                icon: '🧪',
                                xp: 400
                            },
                            {
                                id: 'history_timeline_1',
                                title: 'O Corvo do Tempo',
                                subtitle: 'Linha do Tempo do Brasil',
                                desc: 'Ordene cronologicamente os marcos da nossa história com o apoio estratégico e as teorias do Corvo Professor Sábio!',
                                category: 'HISTÓRIA',
                                color: 'border-amber-500/30 hover:border-amber-500 bg-amber-500/5 dark:bg-amber-500/5',
                                badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                icon: '⏳',
                                xp: 450
                            },
                            {
                                id: 'math_zombies_1',
                                title: 'Invasão Zumbi: Raciocínio',
                                subtitle: 'Matemática Dinâmica Sob Pressão',
                                desc: 'Detone zumbis que se aproximam resolvendo contas de matemática básica e raciocínio lógico em segundos!',
                                category: 'MATEMÁTICA',
                                color: 'border-red-500/30 hover:border-red-500 bg-red-500/5 dark:bg-red-500/5',
                                badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                                icon: '🧟',
                                xp: 350
                            },
                            {
                                id: 'tic_tac_toe_1',
                                title: 'Jogo da Velha Gramatical',
                                subtitle: 'Morfologia & Sintaxe do Português',
                                desc: 'Derrote a máquina no jogo da velha respondendo regras essenciais de concordância, regência e crase!',
                                category: 'PORTUGUÊS',
                                color: 'border-fuchsia-500/30 hover:border-fuchsia-500 bg-fuchsia-500/5 dark:bg-fuchsia-500/5',
                                badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
                                icon: '❌⭕',
                                xp: 250
                            },
                            {
                                id: 'bio_anatomy_1',
                                title: 'Mapeamento Celular',
                                subtitle: 'Citologia Visual e Interação',
                                desc: 'Explore um modelo celular marcando as organelas citológicas principais para popular a sua enciclopédia celular!',
                                category: 'BIOLOGIA',
                                color: 'border-sky-500/30 hover:border-sky-500 bg-sky-500/5 dark:bg-sky-500/5',
                                badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                                icon: '🧫',
                                xp: 300
                            },
                            {
                                id: 'fil_1',
                                title: 'O Banquete dos Filósofos',
                                subtitle: 'Debate Dialético Especial',
                                desc: 'Dialogue diretamente com Sócrates, Descartes e Nietzsche em nosso simulador de debate dialético de alta fidelidade.',
                                category: 'FILOSOFIA',
                                color: 'border-amber-600/30 hover:border-amber-600 bg-amber-600/5 dark:bg-amber-600/5',
                                badgeColor: 'bg-amber-600/10 text-amber-700 dark:text-amber-450 border-amber-600/20',
                                icon: '🏛️',
                                xp: 280
                            },
                            {
                                id: 'soc_1',
                                title: 'Conexão Sociológica',
                                subtitle: 'Mesa-Redonda Sociológica',
                                desc: 'Discuta o mundo moderno com Karl Marx, Émile Durkheim e Max Weber em uma mesa-redonda interativa especial.',
                                category: 'SOCIOLOGIA',
                                color: 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/5',
                                badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                                icon: '👥',
                                xp: 280
                            },
                            {
                                id: 'mat_8',
                                title: 'A Casinha da Matemática',
                                subtitle: 'Geometria & Álgebra Doméstica',
                                desc: 'Abra portas e janelas interativas na Casinha das Propriedades para desvendar frações na cozinha, equações no quarto e probabilidades no jardim!',
                                category: 'MATEMÁTICA',
                                color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5',
                                badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                icon: '🏡',
                                xp: 220
                            },
                            {
                                id: 'his_4_p',
                                title: 'Teatrinho de História',
                                subtitle: 'A Queda da Bastilha Encenada',
                                desc: 'Assuma os papéis, decida as falas e guie os rumos de personagens históricos cruciais sob as luzes dramáticas do palco!',
                                category: 'HISTÓRIA',
                                color: 'border-rose-500/30 hover:border-rose-500 bg-rose-500/5 dark:bg-rose-500/5',
                                badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                                icon: '🎭',
                                xp: 350
                            },
                            {
                                id: 'bio_4_p',
                                title: 'O Corpo Humano Interativo',
                                subtitle: 'Anatomia Humana Colorida',
                                desc: 'Localize os órgãos biológicos vitais (estômago, fígado, pâncreas, rim) e desvende seus sistemas glandulares e digestivos!',
                                category: 'BIOLOGIA',
                                color: 'border-cyan-500/30 hover:border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/5',
                                badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
                                icon: '🫁',
                                xp: 250
                            },
                            {
                                id: 'geo_3_p',
                                title: 'O Globo Terrestre Interativo',
                                subtitle: 'Projeções e Linhas Imaginárias',
                                desc: 'Sinta o poder da projeção holográfica clicando em hotspots estratégicos para desvendar bacias geográficas, coordenadas e oceanos!',
                                category: 'GEOGRAFIA',
                                color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5',
                                badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                icon: '🌐',
                                xp: 280
                            },
                            {
                                id: 'idi_5',
                                title: 'Inglês & Espanhol com Música',
                                subtitle: 'Karaokê e Tradução Rítmica',
                                desc: 'Preencha o vazio rítmico das maiores canções do mundo e domine sotaques, pronúncias, vocabulários e gírias nativas!',
                                category: 'IDIOMAS',
                                color: 'border-rose-500/30 hover:border-rose-500 bg-rose-500/5 dark:bg-rose-500/5',
                                badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                                icon: '🎵',
                                xp: 270
                            }
                        ].map((game) => (
                            <motion.div
                                key={game.id}
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    let matchingItem = CONTENT_ITEMS.find(item => item.id === game.id);
                                    if (!matchingItem) {
                                        matchingItem = {
                                            id: game.id,
                                            title: game.title,
                                            subject: game.category === 'QUÍMICA' ? 'Química' : 
                                                     game.category === 'BIOLOGIA' ? 'Biologia' : 
                                                     game.category === 'PORTUGUÊS' ? 'Português' : 
                                                     game.category === 'MATEMÁTICA' ? 'Matemática' : 'História',
                                            topic: game.category,
                                            type: game.id === 'chem_lab_1' ? 'chemistry_lab' :
                                                  game.id === 'history_timeline_1' ? 'history_timeline' :
                                                  game.id === 'math_zombies_1' ? 'math_zombies' :
                                                  game.id === 'tic_tac_toe_1' ? 'tic_tac_toe' :
                                                  game.id === 'bio_anatomy_1' ? 'bio_anatomy' : 'interactive_lab',
                                            difficulty: 'Médio',
                                            xp: game.xp,
                                            description: game.desc,
                                            image: '',
                                            rarity: 'Épico'
                                        } as ContentItem;
                                    }
                                    handleGameStart(matchingItem);
                                }}
                                className={`p-8 border-2 ${game.color} rounded-[2rem] flex flex-col justify-between cursor-pointer transition-all duration-300 relative group overflow-hidden shadow-md hover:shadow-xl`}
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1.5 text-[11px] font-black border rounded-lg ${game.badgeColor}`}>
                                            {game.category}
                                        </span>
                                        <span className="text-4xl">{game.icon}</span>
                                    </div>
                                    <div className="space-y-1 my-1 text-left">
                                        <h4 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors break-words">
                                            {game.title}
                                        </h4>
                                        <p className="text-xs font-black text-blue-500 uppercase tracking-widest leading-none break-words">
                                            {game.subtitle}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-zinc-350 font-semibold leading-relaxed text-left">
                                        {game.desc}
                                    </p>
                                </div>

                                <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                        <Zap size={13} fill="currentColor" />
                                        <span className="text-sm font-black tracking-widest leading-none">+{game.xp} XP</span>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1.5 transition-all">
                                        ABRIR &rarr;
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BUSCA DE DESAFIOS */}
            <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-center bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-white/5 p-5 rounded-[2rem] shrink-0 shadow-lg mb-8">
                <div className="flex items-center gap-3 w-full md:max-w-md bg-white dark:bg-black border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl shadow-sm focus-within:border-blue-500 transition-colors">
                    <Search size={18} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Busque por assunto (ex: química, história, fração, gramática)..." 
                        className="bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-550 border-none outline-none w-full font-semibold focus:ring-0"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0"
                        >
                            Limpar
                        </button>
                    )}
                </div>

                <div className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-wider font-mono">
                    Encontrados <span className="text-blue-500 font-black">{filteredItems.length}</span> desafios catalogados
                </div>
            </div>

            {/* MODERN FILTER BAR */}
            <section className="space-y-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Subject filter */}
                    <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50 dark:bg-black/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl">
                        <motion.button 
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveSubject('Todos')}
                            className={`relative px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2.5 overflow-hidden group ${
                                activeSubject === 'Todos' ? 'text-white' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {activeSubject === 'Todos' && (
                                <motion.div 
                                    layoutId="navGlow" 
                                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Layers size={14} className="relative z-10" />
                            <span className="relative z-10">Tudo</span>
                        </motion.button>

                        {SUBJECTS.map(sub => (
                            <motion.button 
                                key={sub.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveSubject(sub.name)}
                                className={`relative px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2.5 overflow-hidden group ${
                                    activeSubject === sub.name ? 'text-white' : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                {activeSubject === sub.name && (
                                    <motion.div 
                                        layoutId="navGlow" 
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10" style={{ color: activeSubject === sub.name ? '#fff' : sub.color }}>
                                    {cloneElement(sub.icon as any, { size: 14 })}
                                </span>
                                <span className="relative z-10">{sub.name}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Difficulty Level Filter (Leveled system) */}
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-black/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] pl-3 pr-1 text-slate-400 font-mono">Nível:</span>
                        {(['Todos', 'Fácil', 'Médio', 'Difícil'] as const).map(diff => (
                            <motion.button 
                                key={diff}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveDifficulty(diff)}
                                className={`relative px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 flex items-center gap-2 overflow-hidden group ${
                                    activeDifficulty === diff ? 'text-white' : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                {activeDifficulty === diff && (
                                    <motion.div 
                                        layoutId="diffGlow" 
                                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {diff === 'Todos' ? 'Nivelado (Todos)' : diff}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* CHALLENGES - HORIZONTAL WIDE CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, idx) => (
                            <motion.div 
                                layout
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.01, x: 10 }}
                                onClick={() => handleGameStart(item)}
                                className="group relative flex flex-col sm:flex-row bg-white dark:bg-[#0d0f14] border-2 border-slate-100 dark:border-white/[0.07] rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer shadow-xl hover:shadow-2xl"
                            >
                                {/* LEFT VISUAL ACCENT */}
                                <div className="sm:w-2 bg-gradient-to-b from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] font-mono">
                                                <span>{item.subject}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                                <span>{item.type}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                                    item.difficulty === 'Fácil' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' :
                                                    item.difficulty === 'Médio' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10' :
                                                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10'
                                                }`}>{item.difficulty}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${
                                                    item.rarity === 'Lendário' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
                                                }`}>
                                                    {item.rarity}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold tracking-wide leading-relaxed max-w-xl opacity-85 group-hover:opacity-100 transition-opacity">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                            <Zap size={14} fill="currentColor" />
                                            <span className="text-xs font-black tracking-widest leading-none">+{item.xp} XP</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-500/60 uppercase tracking-[0.3em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            Explorar
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT CALL TO ACTION */}
                                <div className="p-8 sm:p-0 sm:w-40 bg-slate-50 dark:bg-white/[0.02] border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-500 border border-slate-100 dark:border-transparent">
                                            {SUBJECTS.find(s => s.name === item.subject)?.icon ? 
                                                cloneElement(SUBJECTS.find(s => s.name === item.subject)?.icon as any, { size: 28 }) : 
                                                <BookOpen size={28} />
                                            }
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 transition-colors">Iniciar</span>
                                    </div>
                                    
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500 hidden sm:block">
                                        <ArrowRight size={24} className="text-blue-500 group-hover:text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>
        </motion.div>
    );

    const renderCastleAdventure = () => {
        const CASTLE_ROOMS = [
            {
                id: 'chem_lab_1',
                name: 'Masmorra de Poções & Ácido-Base',
                subject: 'Química',
                category: 'QUÍMICA',
                professor: 'Severus Snape <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Aguamenti Liquis',
                desc: 'Ajuste a acidez da solução gotejando indicadores (Fenolftaleína e Azul de Bromotimol) para alcançar a cor do ponto neutro exato de pH 7.0.',
                xp: 400,
                floor: 'dungeon',
                glow: 'hover:shadow-emerald-500/40 hover:border-emerald-500 bg-emerald-500/10',
                badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black'
            },
            {
                id: 'tic_tac_toe_1',
                name: 'Salão de Duelos Gramaticais',
                subject: 'Português',
                category: 'PORTUGUÊS',
                professor: 'Minerva McGonagall <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Grammaticus Finite Incantatem',
                desc: 'Defina a grafia de pronomes, crases e regências de Português no clássico Jogo da Velha contra o Corvo Inteligente para conquistar o tabuleiro.',
                xp: 250,
                floor: 'dungeon',
                glow: 'hover:shadow-fuchsia-500/40 hover:border-fuchsia-500 bg-fuchsia-500/10',
                badgeStyle: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 font-black'
            },
            {
                id: 'history_timeline_1',
                name: 'Sala do Relógio do Tempo e Linhas Temporais',
                subject: 'História',
                category: 'HISTÓRIA',
                professor: 'Alvo Dumbledore <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Chronos Revelio',
                desc: 'Ordene eventos primordiais da história nacional e global cronologicamente na mesa holográfica de ampulhetas e salve a linha do tempo.',
                xp: 450,
                floor: 'ground',
                glow: 'hover:shadow-amber-500/40 hover:border-amber-500 bg-amber-500/10',
                badgeStyle: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-black'
            },
            {
                id: 'mat_8',
                name: 'Estufa de Geometria e Álgebra Doméstica',
                subject: 'Matemática',
                category: 'MATEMÁTICA',
                professor: 'Filius Flitwick <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Arithmetica Revelio',
                desc: 'Explore portas e móveis interativos na Casinha das Propriedades, desvendando equações no quarto, frações na cozinha e probabilidades no jardim!',
                xp: 220,
                floor: 'ground',
                glow: 'hover:shadow-lime-500/40 hover:border-lime-500 bg-lime-500/10',
                badgeStyle: 'bg-lime-500/20 text-lime-400 border-lime-500/30 font-black'
            },
            {
                id: 'math_zombies_1',
                name: 'Defesa Contra a Aritmética das Trevas',
                subject: 'Matemática',
                category: 'MATEMÁTICA',
                professor: 'Remus Lupin <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Expecto Arithmetica',
                desc: 'Defenda a ponte do Castelo lançando rajadas de cálculos rápidos em zumbis aritméticos que se aproximam em velocidade acelerada.',
                xp: 350,
                floor: 'ground',
                glow: 'hover:shadow-rose-500/40 hover:border-rose-500 bg-rose-500/10',
                badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-black'
            },
            {
                id: 'bio_anatomy_1',
                name: 'Laboratório de Herbologia & Citologia Botânica',
                subject: 'Biologia',
                category: 'BIOLOGIA',
                professor: 'Pomona Sprout <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Herbivicus Organellis',
                desc: 'Mapeie organelas celulares microscópicas, como a usina de Mitocôndria ou núcleos replificadores, para restaurar o grimório citológico.',
                xp: 300,
                floor: 'tower',
                glow: 'hover:shadow-sky-500/40 hover:border-sky-500 bg-sky-500/10',
                badgeStyle: 'bg-sky-500/20 text-sky-400 border-sky-500/30 font-black'
            },
            {
                id: 'geo_3_p',
                name: 'Observatório de Astronomia & Coordenadas Climatológicas',
                subject: 'História',
                category: 'HISTÓRIA',
                professor: 'Centauro Firenze <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Projetio Geographica',
                desc: 'Selecione e trace bacias fluviais, projeções cilíndricas raras e meridianos terrestres na grande lente de constelações terrestres do Brasil.',
                xp: 320,
                floor: 'tower',
                glow: 'hover:shadow-indigo-500/40 hover:border-indigo-500 bg-indigo-500/10',
                badgeStyle: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-black'
            },
            {
                id: 'idi_5',
                name: 'Coral de Sapos e Sincronias Líricas',
                subject: 'Linguagens',
                category: 'LINGUAGENS',
                professor: 'Gilderoy Lockhart <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Melodia Translato',
                desc: 'Preencha versos e estrofes de músicas internacionais modernas (Billie Eilish, etc.) e domine a gramática.',
                xp: 280,
                floor: 'tower',
                glow: 'hover:shadow-pink-500/40 hover:border-pink-500 bg-pink-500/10',
                badgeStyle: 'bg-pink-500/20 text-pink-400 border-pink-500/30 font-black'
            },
            {
                id: 'fil_1',
                name: 'Banquete Dialético de Transfiguração Crítica',
                subject: 'História',
                category: 'HISTÓRIA',
                professor: 'Sócrates & Cia <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB Concept)</span>',
                spell: 'Dialectus Totalus',
                desc: 'Sente-se à mesa redonda do Castelo e duele hipóteses dialéticas diretamente contra Sócrates, Descartes ou Nietzsche para moldar suas ideias.',
                xp: 280,
                floor: 'tower',
                glow: 'hover:shadow-orange-500/40 hover:border-orange-500 bg-orange-500/10',
                badgeStyle: 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-black'
            },
            {
                id: 'quidditch_physics',
                name: 'Campo de Quadribol & Vetores de Movimento',
                subject: 'Física',
                category: 'FÍSICA',
                professor: 'Madame Hooch <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Vecturus Volaris',
                desc: 'Monte sua vassoura e calcule a trajetória exata do Pomo de Ouro usando vetores, aceleração centrípeta e forças de arraste para vencer a partida.',
                xp: 500,
                floor: 'tower',
                glow: 'hover:shadow-yellow-400/50 hover:border-yellow-400 bg-yellow-400/10',
                badgeStyle: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30 font-black'
            },
            {
                id: 'final_battle',
                name: 'O Duelo Final: Harry vs. Voldemort',
                subject: 'Redação',
                category: 'REDAÇÃO',
                professor: 'Dumbledore & Você <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Priori Incantatem',
                desc: 'Enfrente seu medo literário no Grande Pátio. Conecte argumentos lógicos e repertórios socioculturais para formar o feitiço de proteção contra os erros gramaticais das trevas.',
                xp: 1000,
                floor: 'ground',
                glow: 'hover:shadow-cyan-400/60 hover:border-cyan-400 bg-cyan-400/15 ring-1 ring-cyan-500/30',
                badgeStyle: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40 font-bold animate-pulse'
            },
            {
                id: 'gringotts_math',
                name: 'Cofres de Gringotts: Câmbio e Juros',
                subject: 'Matemática',
                category: 'MATEMÁTICA',
                professor: 'Grampo (Duende) <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Numerus Infinita',
                desc: 'Acesse os cofres mais profundos e calcule conversões de Nuques para Galeões usando juros compostos e progressões aritméticas para gerenciar seu tesouro acadêmico.',
                xp: 600,
                floor: 'dungeon',
                glow: 'hover:shadow-yellow-600/50 hover:border-yellow-600 bg-yellow-600/10',
                badgeStyle: 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30 font-black'
            },
            {
                id: 'polyjuice_isomery',
                name: 'Poções Polissuco: Isomeria & Reações',
                subject: 'Química',
                category: 'QUÍMICA',
                professor: 'Severus Snape <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Isomerus Reveal',
                desc: 'Identifique os isômeros ópticos e planos nos ingredientes da Poção Polissuco para garantir que a transformação seja bem-sucedida e estável.',
                xp: 450,
                floor: 'dungeon',
                glow: 'hover:shadow-emerald-600/50 hover:border-emerald-600 bg-emerald-600/10',
                badgeStyle: 'bg-emerald-600/20 text-emerald-500 border-emerald-600/30 font-black'
            },
            {
                id: 'herbology_greenhouse_1',
                name: 'Estufa de Herbologia: Taxonomia Mágica',
                subject: 'Biologia',
                category: 'BIOLOGIA',
                professor: 'Pomona Sprout <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Herbivicus Alpha',
                desc: 'Classifique plantas mágicas e suas propriedades medicinais seguindo as regras da taxonomia moderna e biologia vegetal avançada.',
                xp: 380,
                floor: 'dungeon',
                glow: 'hover:shadow-green-500/50 hover:border-green-500 bg-green-500/10',
                badgeStyle: 'bg-green-500/20 text-green-400 border-green-500/30 font-black'
            },
            {
                id: 'dark_arts_defense_2',
                name: 'Defesa Contra as Trevas: Lógica Proposicional',
                subject: 'Filosofia',
                category: 'FILOSOFIA',
                professor: 'Remus Lupin <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Riddikulus Logicus',
                desc: 'Enfrente um Bicho-Papão que se transforma em paradoxos lógicos. Use tabelas-verdade e argumentos válidos para desarmar a criatura.',
                xp: 420,
                floor: 'ground',
                glow: 'hover:shadow-purple-500/50 hover:border-purple-500 bg-purple-500/10',
                badgeStyle: 'bg-purple-500/20 text-purple-400 border-purple-500/30 font-black'
            },
            {
                id: 'history_magic_1',
                name: 'História da Magia & Civilizações',
                subject: 'História',
                category: 'HISTÓRIA',
                professor: 'Cuthbert Binns <span className="opacity-40 text-[9px] block italic">(Créditos: J.K. Rowling & WB)</span>',
                spell: 'Chronos Revelio',
                desc: 'Viaje pelas Eras nos corredores da Biblioteca. Correlacione as Revoluções Industriais com as Grandes Rebeliões dos Duendes e salve a memória histórica.',
                xp: 480,
                floor: 'tower',
                glow: 'hover:shadow-stone-500/50 hover:border-stone-500 bg-stone-500/10',
                badgeStyle: 'bg-stone-500/20 text-stone-400 border-stone-500/30 font-black'
            }
        ];

const filteredRooms = CASTLE_ROOMS.filter(room => castleFloor === 'all' || room.floor === castleFloor);

        const activeHouseDetails = {
            'Corvinal': { desc: 'A Casa da Sabedoria e da Redação Nota 1000. Seus alunos superam limites através de raciocínio crítico, lógica afiada e análises metodológicas implacáveis.', emblem: 'Casa Corvinal' },
            'Grifinória': { desc: 'A Casa da Audácia e do Sucesso no 2º Dia de ENEM. Focados na superação de limites pragmáticos, cálculos difíceis e interpretações profundas sob pressão temporal.', emblem: 'Casa Grifinória' },
            'Sonserina': { desc: 'A Casa da Ambição pelas vagas de Medicina e Direito. Seus integrantes trilham o caminho da aprovação máxima, utilizando ferramentas táticas de altíssimo rendimento.', emblem: 'Casa Sonserina' },
            'Lufa-Lufa': { desc: 'A Casa da Dedicação, Lealdade e Triângulos das Exatas. Caracterizados pela paciência na resolução detalhada, simulados persistentes e redações impecáveis.', emblem: 'Casa Lufa-Lufa' }
        };

        const handleSpellConjuring = (room: typeof CASTLE_ROOMS[0]) => {
            setLastSpelledRoom(room.id);
            const wandEffect = magicalWand === 'Pena de Fênix' ? 'Chamas de Fênix' : magicalWand === 'Fibra de Dragão' ? 'Relâmpagos de Dragão' : 'Brilhos de Unicórnio';
            toast.success(`VARINHA EM POSIÇÃO! Conjurando feitiço [${room.spell}] com o núcleo de ${magicalWand}! ${wandEffect}!`, {
                description: `${room.professor} está pronto para sua aula interativa...`,
                duration: 2500
            });
            setTimeout(() => {
                startMagicalGame(room.id, room.name, room.category, room.desc, room.xp);
            }, 1200);
        };

        return (
            <div className="space-y-12">
                {/* 🏰 HERO HEADER WIZARDING SCHOOL */}
                <div className="relative p-10 md:p-14 rounded-[3.5rem] bg-gradient-to-br from-indigo-950 via-zinc-900 to-black border border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="space-y-5 lg:max-w-3xl">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[9px] font-black uppercase tracking-widest border border-indigo-400/30">
                                    Academia de Bruxaria Intelectual
                                </span>
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/20">
                                    Hogwarts Arcana
                                </span>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-300 to-amber-500 font-anton uppercase tracking-tight leading-none">
                                <span className="text-5xl md:text-6xl block">Castelo de Hogwarts</span>
                                <span className="text-3xl md:text-4xl text-amber-400 block mt-1 tracking-wider">DO VESTIBULAR</span>
                            </h1>
                            
                            <p className="text-stone-300 font-medium text-base md:text-lg leading-relaxed">
                                Bem-vindo ao Grande Salão Acadêmico! Aqui, cada sala de aula é uma coordenada do conhecimento do vestibular, cada professor ministra uma ciência viva, e cada feitiço aprendido é uma atividade prática de alto impacto cognitivo. Escolha seu caminho e prepare sua varinha.
                            </p>
                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest opacity-6 border-l-2 border-amber-500/30 pl-3">
                                    Baseado no Mundo Bruxo criado por J.K. Rowling. Personagens, nomes e indícios relacionados são © & ™ Warner Bros. Entertainment Inc. Direitos de publicação de Harry Potter © JKR.
                                </p>
                            </div>
                        </div>
                        
                        {/* Interactive Wizard Customization Panel */}
                        <div className={`p-10 rounded-[3rem] border backdrop-blur-md shadow-2xl w-full lg:max-w-2xl ${houseColors[magicalHouse]} transition-all duration-500`}>
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                <span className="text-xs font-black uppercase tracking-widest text-amber-300 font-mono">Ficha de Bruxo Vestibulando</span>
                                <Sparkles size={20} className="text-amber-400 animate-pulse" />
                            </div>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 text-white shrink-0">
                                    <Shield size={44} className="text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white leading-tight">{activeHouseDetails[magicalHouse].emblem}</h3>
                                    <p className="text-xs font-mono opacity-70 text-stone-200 mt-1">Varinha Core: {magicalWand}</p>
                                </div>
                            </div>

                            <p className="text-base font-medium leading-relaxed mb-8 opacity-90 text-stone-100 italic">
                                {activeHouseDetails[magicalHouse].desc}
                            </p>

                            <div className="space-y-6 pt-6 border-t border-white/10">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-stone-300">Selecione sua Casa:</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {(['Corvinal', 'Grifinória', 'Sonserina', 'Lufa-Lufa'] as const).map(house => (
                                            <button
                                                key={house}
                                                type="button"
                                                onClick={() => {
                                                    setMagicalHouse(house);
                                                    safeLocalStorage.setItem('magicalHouse', house);
                                                    
                                                    // Map chosen house to a high-contrast global theme accent color
                                                    let themeColor = 'default'; // Blue for Corvinal
                                                    if (house === 'Grifinória') themeColor = '#fc77b2'; // Pink/Red/Yellow Hue
                                                    else if (house === 'Sonserina') themeColor = '#36ae68'; // Green Hue
                                                    else if (house === 'Lufa-Lufa') themeColor = '#fff461'; // Yellow Hue
                                                    safeLocalStorage.setItem('light-theme-color', themeColor);
                                                    
                                                    toast.success(`Selecionada a Casa ${house}! Seus bônus cognitivos foram sintonizados.`, { duration: 2000 });
                                                    setTimeout(() => {
                                                        window.location.reload();
                                                    }, 500);
                                                }}
                                                className={`text-xs font-black uppercase tracking-wider py-4 rounded-2xl transition-all border ${
                                                    magicalHouse === house 
                                                        ? 'bg-white/20 text-white border-white/40 shadow-xl font-black scale-105' 
                                                        : 'bg-black/30 hover:bg-white/10 text-stone-300 border-white/5'
                                                }`}
                                            >
                                                {house.substring(0, 4)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-stone-300">Núcleo Mágico da Varinha:</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['Pena de Fênix', 'Fibra de Dragão', 'Pelo de Unicórnio'] as const).map(core => (
                                            <button
                                                key={core}
                                                type="button"
                                                onClick={() => {
                                                    setMagicalWand(core);
                                                    toast.success(`Varinha ajustada para Núcleo de ${core}!`);
                                                }}
                                                className={`text-xs font-black py-4 rounded-2xl transition-all border ${
                                                    magicalWand === core 
                                                        ? 'bg-white/20 text-white border-white/40 shadow-xl scale-105' 
                                                        : 'bg-black/30 hover:bg-white/10 text-stone-300 border-white/5'
                                                }`}
                                            >
                                                {core.replace('Pena de ', '').replace('Fibra de ', '').replace('Pelo de ', '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🗺️ INTERACTIVE MAP NAVIGATION TABS (MAPA DO MAROTO STYLE) */}
                <div className="space-y-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10 pb-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black dark:text-white tracking-tight uppercase font-mono flex items-center gap-2">
                                <Compass className="text-amber-400 animate-spin" size={20} style={{ animationDuration: '6s' }} />
                                Seletor de Setores e Andares do Castelo
                            </h2>
                            <p className="text-stone-400 text-sm font-medium">Filtre a exploração pelas câmaras mágicas e andares da academia do vestibular:</p>
                        </div>

                        <div className="flex flex-wrap gap-2 bg-slate-950 border border-white/5 p-1.5 rounded-2xl shrink-0">
                            {[
                                { id: 'all', name: 'Todo o Castelo', count: CASTLE_ROOMS.length },
                                { id: 'dungeon', name: 'Masmorras (Subsolo)', count: CASTLE_ROOMS.filter(r => r.floor === 'dungeon').length },
                                { id: 'ground', name: 'Térreo (Grandes Salões)', count: CASTLE_ROOMS.filter(r => r.floor === 'ground').length },
                                { id: 'tower', name: 'Torres (Setor Superior)', count: CASTLE_ROOMS.filter(r => r.floor === 'tower').length }
                            ].map(floor => (
                                <button
                                    key={floor.id}
                                    type="button"
                                    onClick={() => setCastleFloor(floor.id as any)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                                        castleFloor === floor.id
                                            ? 'bg-amber-550 text-slate-950 shadow-lg font-black'
                                            : 'text-stone-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span>{floor.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${castleFloor === floor.id ? 'bg-slate-900/20 text-slate-950' : 'bg-white/5 text-stone-500'}`}>{floor.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 🎮 GRID OF ROOMS */}
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-full"
                    >
                        {filteredRooms.map((room) => {
                            const isBeingSpelled = lastSpelledRoom === room.id;
                            return (
                                <motion.div
                                    key={room.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 15 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className={`flex flex-col justify-between p-6 rounded-[2rem] border border-white/5 hover:border-white/20 shadow-2xl transition-all duration-500 relative group overflow-hidden ${room.glow} ${isBeingSpelled ? 'ring-2 ring-amber-500 scale-98 pointer-events-none' : ''}`}
                                >
                                    {/* Decorative background shapes */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />
                                    
                                    {/* Floor Tag */}
                                    <div className="absolute top-4 right-4 flex gap-1.5">
                                        <span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-stone-300 bg-white/10 border border-white/5">
                                            {room.floor === 'dungeon' ? 'SUBSOLO' : room.floor === 'ground' ? 'TÉRREO' : 'SUPERIOR'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Room Header Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border ${room.badgeStyle}`}>
                                                    {room.subject}
                                                </span>
                                                <span className="text-xs font-bold text-stone-400 font-mono">
                                                    +{room.xp} XP POTÊNCIA
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black dark:text-neutral-100 flex items-center gap-2 group-hover:text-amber-400 transition-colors pt-1">
                                                {room.name}
                                            </h3>
                                        </div>

                                        <p className="text-sm font-bold leading-relaxed text-slate-800 dark:text-zinc-50 pb-1">
                                            {room.desc}
                                        </p>

                                        {/* Class Staff and Cast spells specs */}
                                        <div className="p-4 bg-black/60 rounded-2xl border border-white/10 space-y-2.5 font-mono text-xs my-1 relative overflow-hidden group/specs shadow-inner">
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover/specs:opacity-100 transition-opacity duration-700" />
                                            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 relative z-10">
                                                <span>Professor:</span>
                                                <span className="font-black text-slate-900 dark:text-white text-right" dangerouslySetInnerHTML={{ __html: room.professor || '' }} />
                                            </div>
                                            <div className="flex items-center justify-between text-amber-500/90 relative z-10">
                                                <span>Feitiço Alvo:</span>
                                                <span className="italic font-black font-sans text-amber-300">"{room.spell}"</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action trigger button */}
                                    <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => handleSpellConjuring(room)}
                                            className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 hover:border-amber-500/50 hover:from-amber-600 hover:to-amber-500 text-stone-300 hover:text-slate-950 font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 shadow-lg hover:shadow-amber-500/20 group/magicbtn"
                                        >
                                            <div className="relative">
                                                <Sparkles size={16} className="group-hover/magicbtn:animate-pulse" />
                                                <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover/magicbtn:opacity-40 transition-opacity" />
                                            </div>
                                            <span className="relative z-10">Conjurar Feitiço Mágico</span>
                                        </button>
                                    </div>
                                    
                                    {/* Particle Burst overlay on active casting */}
                                    {isBeingSpelled && (
                                        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                                            <span className="text-3xl animate-spin">🪄</span>
                                            <span className="text-xs font-mono tracking-widest text-amber-400 animate-pulse font-black uppercase">Conjurando {room.spell}!</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* 📜 LEGAL FOOTER */}
                    <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-80 hover:opacity-100 transition-opacity duration-700">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                               <span className="text-xl">🏰</span>
                           </div>
                           <div className="text-[10px] font-black leading-tight max-w-xs text-zinc-300">
                               Este projeto é uma iniciativa educacional sem fins lucrativos. Não possuímos direitos sobre o universo Harry Potter.
                           </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Wizarding World Attribution</p>
                            <p className="text-[10px] font-bold text-zinc-400">
                                J.K. ROWLING'S WIZARDING WORLD is a trademark of J.K. Rowling and Warner Bros. Entertainment Inc.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlaying = () => {
        if (!selectedGame) return null;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-12">
                {/* MODERN GAME HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-glass-border">
                    <div className="flex items-center gap-6">
                        <motion.button 
                            whileHover={{ scale: 1.05, x: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setGameState('lobby')}
                            className="w-12 h-12 bg-bg-secondary rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-glass-border flex items-center justify-center transition-all"
                        >
                            <ArrowLeft size={20} />
                        </motion.button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-accent-1 animate-pulse" />
                                <span className="text-[10px] font-bold text-accent-1 uppercase tracking-widest font-mono">Desafio Ativo</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
                                {selectedGame.title}
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-bg-secondary px-6 py-4 rounded-2xl border border-glass-border shadow-xl">
                        <div className="flex items-center gap-4 pr-6 border-r border-glass-border">
                            <div className="w-10 h-10 bg-accent-1/10 rounded-xl flex items-center justify-center text-accent-1">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1">Recompensa</p>
                                <p className="text-xl font-bold text-[var(--text-primary)] leading-none">+{selectedGame.xp} <span className="text-xs text-[var(--text-secondary)]">XP</span></p>
                            </div>
                        </div>
                        <div className="hidden sm:flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-bg-secondary bg-blue-500/10 flex items-center justify-center">
                                <Users size={12} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {selectedGame.type === 'anagram' && (
                    <div className="space-y-12 max-w-4xl mx-auto py-10">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest uppercase font-mono">Anagrama</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Reordene as letras para formar a palavra correta</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 min-h-[90px] p-8 bg-slate-100 dark:bg-white/[0.03] rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
                            {userLetters.map((item) => (
                                <motion.div
                                    key={`user-${item.id}`}
                                    layoutId={`char-${item.id}`}
                                    onClick={() => {
                                        setUserLetters(prev => prev.filter(l => l.id !== item.id));
                                        setScrambledLetters(prev => [...prev, item]);
                                    }}
                                    className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl font-black text-white cursor-pointer shadow-lg shadow-blue-500/30"
                                >
                                    {item.char}
                                </motion.div>
                            ))}
                            {Array.from({ length: Math.max(0, anagramWord.length - userLetters.length) }).map((_, i) => (
                                <div key={i} className="w-14 h-14 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/20" />
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            {scrambledLetters.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layoutId={`char-${item.id}`}
                                    onClick={() => {
                                        setScrambledLetters(prev => prev.filter(l => l.id !== item.id));
                                        setUserLetters(prev => [...prev, item]);
                                    }}
                                    className="w-14 h-14 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-2xl font-black text-slate-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-600/20 hover:border-blue-500 hover:scale-110 cursor-pointer transition-all shadow-sm"
                                >
                                    {item.char}
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => {
                                    const formedWord = userLetters.map(l => l.char).join('');
                                    if (formedWord === anagramWord) {
                                        toast.success('Palavra correta!');
                                        setScore(prev => prev + 1);
                                        setTimeout(() => setGameState('results'), 1000);
                                    } else if (userLetters.length === anagramWord.length) {
                                        toast.error('Tente novamente!');
                                    }
                                }}
                                className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl ${
                                    userLetters.length === anagramWord.length ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/40' : 'bg-slate-200 dark:bg-white/10 text-slate-500 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                Verificar Palavra
                            </button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'box' && (
                    <div className="space-y-12 max-w-4xl mx-auto py-10">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest uppercase">Abra a Caixa</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Escolha uma caixa para revelar o desafio</p>
                        </div>

                        {!isAnswered ? (
                            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                                {boxes.map((box) => (
                                    <motion.div
                                        key={box.id}
                                        whileHover={!box.isOpen ? { scale: 1.05, y: -5 } : {}}
                                        whileTap={!box.isOpen ? { scale: 0.95 } : {}}
                                        onClick={() => {
                                            if (box.isOpen) return;
                                            const newBoxes = [...boxes];
                                            newBoxes[box.id].isOpen = true;
                                            setBoxes(newBoxes);
                                            setCurrentQuestionIndex(box.questionIndex);
                                            setIsAnswered(true);
                                            setSelectedOption(null);
                                        }}
                                        className={`aspect-square rounded-[2rem] flex items-center justify-center text-4xl font-black transition-all cursor-pointer border-4 shadow-xl ${
                                            box.isOpen 
                                                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-600 text-blue-600' 
                                                : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/10 text-slate-700 dark:text-white hover:border-blue-500 hover:text-blue-500'
                                        }`}
                                    >
                                        {box.isOpen ? <CheckCircle2 size={48} className="animate-in zoom-in" /> : box.id + 1}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Layers size={80} />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white relative z-10 leading-tight">{currentQuestion?.text}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentQuestion?.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (i === currentQuestion.correct) {
                                                    toast.success('Correto!');
                                                    setScore(prev => prev + 1);
                                                } else {
                                                    toast.error('Incorreto!');
                                                }
                                                setIsAnswered(false);
                                                if (boxes.every(b => b.isOpen)) {
                                                    setTimeout(() => setGameState('results'), 1000);
                                                }
                                            }}
                                            className="p-6 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-left hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transform transition-all hover:scale-[1.02] shadow-sm font-bold text-slate-700 dark:text-white"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <span className="px-8 py-3 bg-blue-600/10 dark:bg-blue-600/20 rounded-full text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-500/20 uppercase tracking-[0.2em]">
                                {boxes.filter(b => b.isOpen).length} / 9 REVELADAS
                            </span>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'wheel' && (
                    <div className="space-y-12 max-w-4xl mx-auto py-10 flex flex-col items-center">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest uppercase">Roleta Aleatória</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Gire a roleta para selecionar um tema</p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-10 h-12 bg-rose-500 shadow-lg" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
                            
                            <motion.div
                                animate={{ rotate: wheelRotation }}
                                transition={{ duration: isSpinning ? 4 : 0, ease: "circOut" }}
                                onAnimationComplete={() => {
                                    if (isSpinning) {
                                        setIsSpinning(false);
                                        const segments = 8;
                                        const actualRotation = wheelRotation % 360;
                                        const segmentIndex = Math.floor(((360 - actualRotation) % 360) / (360 / segments));
                                        setCurrentQuestionIndex(segmentIndex % currentQuestions.length);
                                        setIsAnswered(true);
                                    }
                                }}
                                className="w-[320px] h-[320px] md:w-[480px] md:h-[480px] rounded-full border-[12px] border-slate-100 dark:border-white/10 relative overflow-hidden shadow-2xl"
                                style={{ background: 'conic-gradient(#2563eb 0deg 45deg, #4f46e5 45deg 90deg, #2563eb 90deg 135deg, #4f46e5 135deg 180deg, #2563eb 180deg 225deg, #4f46e5 225deg 270deg, #2563eb 270deg 315deg, #4f46e5 315deg 360deg)' }}
                            >
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 h-full w-[2px] bg-white/10 dark:bg-white/20 origin-top"
                                        style={{ transform: `translate(-50%, -50%) rotate(${i * 45}deg)` }}
                                    />
                                ))}
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={`text-${i}`}
                                        className="absolute top-1/2 left-1/2 h-1/2 origin-top pt-12 md:pt-16 text-[10px] md:text-xs font-black text-white/60 dark:text-white/40 uppercase tracking-[0.3em]"
                                        style={{ transform: `translate(-50%, 0) rotate(${i * 45 + 22.5}deg)` }}
                                    >
                                        TEMA {i + 1}
                                    </div>
                                ))}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-2xl z-10 flex flex-col items-center justify-center text-blue-600 font-black text-xs tracking-tighter">
                                    <Activity size={24} className="mb-1" />
                                    SPIN
                                </div>
                            </motion.div>
                        </div>

                        {!isAnswered ? (
                            <button
                                onClick={() => {
                                    if (isSpinning) return;
                                    const extraSpins = 6 + Math.random() * 4;
                                    setWheelRotation(prev => prev + 360 * extraSpins + Math.random() * 360);
                                    setIsSpinning(true);
                                }}
                                disabled={isSpinning}
                                className="px-20 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-blue-500/30"
                            >
                                GIRAR!
                            </button>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="w-full max-w-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-2xl"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Desafio da Roleta</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white text-center leading-tight">{currentQuestion?.text}</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {currentQuestion?.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (i === currentQuestion.correct) {
                                                    toast.success('Excelente!');
                                                    setScore(prev => prev + 1);
                                                } else {
                                                    toast.error('Quase lá!');
                                                }
                                                setIsAnswered(false);
                                            }}
                                            className="p-6 bg-slate-50 dark:bg-blue-600/10 border-2 border-slate-100 dark:border-blue-500/20 rounded-2xl text-left hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 transition-all font-bold text-slate-700 dark:text-white text-lg shadow-sm"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {selectedGame.type === 'memory' && (
                    <div className="space-y-10 py-8 max-w-4xl mx-auto">
                        {/* Header and Topic switcher */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="text-left">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Jogo da Memória do Vestibular</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Encontre os pares para correlacionar e memorizar conceitos-chave!</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                {(['biologia', 'fisica', 'quimica', 'historia', 'gramatica'] as const).map((topic) => (
                                    <button 
                                        key={topic}
                                        onClick={() => startMemory(topic)}
                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                            memoryTopic === topic 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {topic === 'biologia' && '🧬 Bio'}
                                        {topic === 'fisica' && '⚡ Fís'}
                                        {topic === 'quimica' && '🧪 Quí'}
                                        {topic === 'historia' && '🏛️ Hist'}
                                        {topic === 'gramatica' && '✍️ Gram'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Top Stats Banner */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-zinc-950/40 p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-inner">
                            <span className="text-[10px] sm:text-xs font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 dark:bg-white/5 px-3 py-1.5 rounded-lg">Matéria Ativa: {memoryTopic.toUpperCase()}</span>
                            
                            <div className="flex gap-4">
                                <div className="bg-blue-600 px-6 py-3 rounded-2xl text-center shadow-xl shadow-blue-500/25">
                                    <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Pares Resolvidos</p>
                                    <p className="text-xl font-black text-white">{correctAnswersCount} / 8</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pontuação</p>
                                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">{score}</p>
                                </div>
                            </div>
                        </div>

                        {/* Memory Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {memoryCards.map((card, i) => (
                                <motion.button
                                    key={card.id}
                                    whileHover={!(card.isFlipped || card.isMatched) ? { scale: 1.04, y: -2 } : {}}
                                    whileTap={!(card.isFlipped || card.isMatched) ? { scale: 0.96 } : {}}
                                    onClick={() => handleMemoryClick(i)}
                                    className={`aspect-square border-2 rounded-2xl flex items-center justify-center p-4 group relative overflow-hidden transition-all shadow-sm ${
                                        card.isFlipped || card.isMatched
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/5 text-slate-300 dark:text-white/20 hover:border-blue-500 hover:text-blue-500'
                                    }`}
                                >
                                    {card.isFlipped || card.isMatched ? (
                                        <span className="text-xs sm:text-sm font-black uppercase text-center px-1 break-words font-sans tracking-tight">{card.content}</span>
                                    ) : (
                                        <Brain size={36} className="text-slate-400/80 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                        
                        <div className="flex justify-center pt-6">
                            <button 
                                onClick={() => finishGame(score, selectedGame?.xp || 150)}
                                className="px-12 py-4.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                            >
                                Finalizar Desafio
                            </button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'speed' && currentQuestion && (
                    <div className="space-y-12 max-w-4xl mx-auto py-10">
                        <div className="w-full h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-white/10 shadow-inner">
                            <motion.div 
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 30, ease: "linear" }}
                                onAnimationComplete={() => {
                                    setSpeedActive(false);
                                    finishGame(score, selectedGame?.xp || 150);
                                }}
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                            />
                        </div>
                        
                        <div className="bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/10 rounded-[2.5rem] p-12 text-center space-y-10 relative overflow-hidden shadow-2xl">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border-2 border-blue-500/20 shadow-inner">
                                    <Timer size={40} className="animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Resposta Rápida</p>
                                    <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest">SPEED RUN</h3>
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-slate-700 dark:text-white tracking-tight leading-tight opacity-90 uppercase">
                                {currentQuestion.text}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentQuestion.options.map((opt, i) => (
                                <motion.button 
                                    key={opt}
                                    whileHover={{ scale: 1.02, x: i % 2 === 0 ? 8 : -8 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (isAnswered) return;
                                        setIsAnswered(true);
                                        const isCorrect = i === currentQuestion.correct;
                                        if (isCorrect) {
                                            const newScore = score + 150;
                                            setScore(newScore);
                                            setCorrectAnswersCount(prev => prev + 1);
                                            toast.success('Correto! +150 p', { icon: '⚡' });
                                        } else {
                                            toast.error('Incorreto! 💥');
                                        }

                                        setTimeout(() => {
                                            if (currentQuestionIndex < currentQuestions.length - 1) {
                                                setCurrentQuestionIndex(prev => prev + 1);
                                                setIsAnswered(false);
                                            } else {
                                                setSpeedActive(false);
                                                finishGame(score + (isCorrect ? 150 : 0), selectedGame?.xp || 150);
                                            }
                                        }, 800);
                                    }}
                                    className={`p-8 border-2 rounded-2xl text-left group transition-all shadow-sm ${
                                        isAnswered 
                                        ? i === currentQuestion.correct 
                                            ? 'bg-emerald-500 border-emerald-400 text-white'
                                            : 'bg-white dark:bg-white/[0.05] border-slate-100 dark:border-white/10 opacity-50'
                                        : 'bg-white dark:bg-white/[0.05] border-slate-100 dark:border-white/10 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors shadow-inner">
                                            <span className="text-lg font-black text-slate-400 dark:text-white/40 group-hover:text-white">{i + 1}</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-700 dark:text-white group-hover:text-white transition-colors uppercase tracking-tight">{opt}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedGame.type === 'duel' && (
                    <div className="space-y-12 max-w-5xl mx-auto py-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-white dark:bg-white/[0.03] rounded-[3rem] p-12 border-2 border-slate-100 dark:border-white/10 relative overflow-hidden shadow-2xl">
                            {/* Player 1 */}
                            <div className="flex flex-col items-center gap-6 w-full md:w-auto">
                                <div className="w-28 h-28 rounded-3xl border-4 border-emerald-500/20 p-2 shadow-2xl bg-white dark:bg-white/5 flex items-center justify-center">
                                    <User size={70} className="text-emerald-500" />
                                </div>
                                <div className="text-center space-y-3 w-full">
                                    <p className="text-slate-800 dark:text-white font-black text-xl uppercase tracking-tighter">Você</p>
                                    <div className="w-full md:w-56 h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
                                        <motion.div animate={{ width: `${myHp}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-white/10 border-4 border-slate-100 dark:border-white/10 rounded-3xl flex items-center justify-center font-black text-3xl text-slate-800 dark:text-white shadow-inner">
                                    VS
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Questão {currentQuestionIndex + 1}</span>
                            </div>

                            {/* Opponent */}
                            <div className="flex flex-col items-center gap-6 w-full md:w-auto">
                                <div className="w-28 h-28 rounded-3xl border-4 border-rose-500/20 p-2 shadow-2xl bg-white dark:bg-white/5 flex items-center justify-center">
                                    <Shield size={70} className="text-rose-500" />
                                </div>
                                <div className="text-center space-y-3 w-full">
                                    <p className="text-slate-800 dark:text-white font-black text-xl uppercase tracking-tighter">Shadow Hunter</p>
                                    <div className="w-full md:w-56 h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
                                        <motion.div animate={{ width: `${opponentHp}%` }} className="h-full bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {currentQuestion && (
                            <div className="space-y-10 max-w-4xl mx-auto">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white text-center leading-tight tracking-tight uppercase">
                                    {currentQuestion.text}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {currentQuestion.options.map((opt, i) => (
                                        <motion.button 
                                            key={i}
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (isAnswered) return;
                                                setIsAnswered(true);
                                                if (i === currentQuestion.correct) {
                                                    setOpponentHp(prev => Math.max(0, prev - 25));
                                                    toast.success('ACERTO CRÍTICO! -25 HP');
                                                } else {
                                                    setMyHp(prev => Math.max(0, prev - 15));
                                                    toast.error('RESPOSTA INCORRETA! -15 HP');
                                                }
                                                setTimeout(() => {
                                                    if (opponentHp - 25 <= 0 || myHp - 15 <= 0) {
                                                        setGameState('results');
                                                    } else {
                                                        setCurrentQuestionIndex(prev => prev + 1);
                                                        setIsAnswered(false);
                                                    }
                                                }, 1000);
                                            }}
                                            className="p-8 bg-white dark:bg-white/[0.05] border-2 border-slate-100 dark:border-white/10 rounded-[2rem] text-slate-800 dark:text-white font-black hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-600 transition-all text-left flex items-center gap-6 shadow-sm"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 flex items-center justify-center text-xl text-slate-400 font-black">{String.fromCharCode(65 + i)}</div>
                                            <span className="text-xl uppercase tracking-tight">{opt}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedGame.type === 'tower' && (
                    <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto py-10">
                        <div className="w-full lg:w-56 bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col-reverse gap-4 h-fit shadow-2xl">
                            {[1, 2, 3, 4, 5, 6].map(floor => (
                                <div 
                                    key={floor} 
                                    className={`h-16 rounded-[1.2rem] flex items-center justify-center font-black transition-all border-4 ${
                                        activeFloor === floor 
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-110' 
                                            : activeFloor > floor 
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                                : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-white/20 border-slate-100 dark:border-white/10'
                                    }`}
                                >
                                    {floor}F
                                </div>
                            ))}
                        </div>

                        <div className="flex-1">
                            <div className="bg-white dark:bg-white/[0.03] p-16 rounded-[3.5rem] border-2 border-slate-100 dark:border-white/10 relative overflow-hidden shadow-2xl">
                                <div className="space-y-12 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-10 bg-blue-600 rounded-full" />
                                        <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest uppercase">
                                            {activeFloor}º Andar
                                        </h3>
                                    </div>
                                    
                                    {currentQuestion && (
                                        <div className="space-y-10">
                                            <p className="text-2xl md:text-3xl text-slate-700 dark:text-white opacity-90 font-black leading-tight uppercase tracking-tight">{currentQuestion.text}</p>
                                            <div className="grid gap-4">
                                                {currentQuestion.options.map((opt, i) => (
                                                    <motion.button 
                                                        key={i}
                                                        whileHover={{ x: 10, scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => {
                                                            if (isAnswered) return;
                                                            setIsAnswered(true);
                                                            if (i === currentQuestion.correct) {
                                                                toast.success('ANDAR CONCLUÍDO!');
                                                                setTimeout(() => {
                                                                    if (activeFloor === 6) finishGame(score + 500, selectedGame?.xp || 0);
                                                                    else {
                                                                        setActiveFloor(prev => prev + 1);
                                                                        setCurrentQuestionIndex(prev => prev + 1);
                                                                        setIsAnswered(false);
                                                                    }
                                                                }, 800);
                                                            } else {
                                                                toast.error('RESPOSTA ERRADA! Tente novamente.');
                                                                setIsAnswered(false);
                                                            }
                                                        }}
                                                        className="p-6 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-black hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all text-left flex items-center justify-between group shadow-sm"
                                                    >
                                                        <span className="text-xl uppercase tracking-tight">{opt}</span>
                                                        <ChevronRight size={24} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'hangman' && (
                    <div className="space-y-10 max-w-4xl mx-auto py-8">
                        {/* Header and Topic switcher */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="text-left">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Jogo da Forca do Vestibular</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Adivinhe o termo acadêmico antes de esgotar as tentativas!</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                {(['biologia', 'fisica', 'quimica', 'literatura', 'geopolitica'] as const).map((topic) => (
                                    <button 
                                        key={topic}
                                        onClick={() => startHangman(topic)}
                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                            hangmanTopic === topic 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {topic === 'biologia' && '🧬 Bio'}
                                        {topic === 'fisica' && '⚡ Fís'}
                                        {topic === 'quimica' && '🧪 Quí'}
                                        {topic === 'literatura' && '📚 Lit'}
                                        {topic === 'geopolitica' && '🌍 Geo'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            {/* Gallows illustration */}
                            <div className="bg-slate-50 dark:bg-zinc-950/40 p-8 rounded-[3rem] border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center min-h-[360px] relative shadow-inner">
                                <span className="absolute top-4 left-6 text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 dark:bg-white/5 px-2.5 py-1 rounded-md">Tentativas erradas: {wrongGuesses}/6</span>
                                
                                <div className="relative w-44 h-60 border-l-4 border-b-4 border-slate-300 dark:border-white/10">
                                    <div className="absolute top-0 left-0 w-28 h-1 bg-slate-300 dark:border-white/10" />
                                    <div className="absolute top-0 right-12 w-1 h-8 bg-slate-300 dark:border-white/10" />
                                    
                                    <AnimatePresence>
                                        {wrongGuesses >= 1 && (
                                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-8 right-[36px] w-8 h-8 rounded-full border-4 border-slate-700 dark:border-white bg-[#0f172a] dark:bg-slate-900" />
                                        )}
                                        {wrongGuesses >= 2 && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-16 right-[50px] w-1 h-16 bg-slate-700 dark:bg-white" />
                                        )}
                                        {wrongGuesses >= 3 && (
                                            <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 30 }} className="absolute top-20 right-[50px] w-10 h-1 bg-slate-700 dark:bg-white origin-left" />
                                        )}
                                        {wrongGuesses >= 4 && (
                                            <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: -30 }} className="absolute top-20 right-[12px] w-10 h-1 bg-slate-700 dark:bg-white origin-right" />
                                        )}
                                        {wrongGuesses >= 5 && (
                                            <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 45 }} className="absolute top-32 right-[50px] w-10 h-1 bg-slate-700 dark:bg-white origin-left" />
                                        )}
                                        {wrongGuesses >= 6 && (
                                            <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: -45 }} className="absolute top-32 right-[12px] w-10 h-1 bg-slate-700 dark:bg-white origin-right" />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Word secret matching and characters board */}
                            <div className="space-y-8 flex flex-col justify-center">
                                {/* Word secret display */}
                                <div className="flex flex-wrap justify-center gap-3">
                                    {hangmanWord.split('').map((char, i) => (
                                        <div key={i} className="w-11 h-14 border-b-4 border-blue-600 flex items-center justify-center text-2xl font-black text-slate-800 dark:text-white font-mono bg-slate-50 dark:bg-white/5 rounded-t-lg shadow-sm">
                                            {guessedLetters.includes(char) ? char : ''}
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center font-mono text-[9px] uppercase font-black text-slate-400 tracking-widest bg-slate-100 dark:bg-[#000]/20 p-2.5 rounded-xl border dark:border-white/5 max-w-xs mx-auto">
                                    Dica do Professor Corvo: {hangmanTopic.toUpperCase()}
                                </div>

                                {/* Virtual Keyboard */}
                                <div className="grid grid-cols-7 gap-2 max-w-md mx-auto">
                                    {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                                        const isGuessed = guessedLetters.includes(char);
                                        const isWrong = isGuessed && !hangmanWord.includes(char);
                                        const isCorrect = isGuessed && hangmanWord.includes(char);

                                        return (
                                            <button
                                                key={char}
                                                disabled={isGuessed}
                                                onClick={() => {
                                                    if (isGuessed) return;
                                                    const newGuessed = [...guessedLetters, char];
                                                    setGuessedLetters(newGuessed);
                                                    
                                                    if (!hangmanWord.includes(char)) {
                                                        const newWrong = wrongGuesses + 1;
                                                        setWrongGuesses(newWrong);
                                                        if (newWrong >= 6) {
                                                            toast.error(`Game Over! A palavra era ${hangmanWord}`);
                                                            setTimeout(() => finishGame(score, 0), 1500);
                                                        }
                                                    } else {
                                                        const wordSet = new Set(hangmanWord.split(''));
                                                        if (Array.from(wordSet).every(c => newGuessed.includes(c))) {
                                                            toast.success('Parabéns! Você descobriu a palavra!');
                                                            setScore(prev => prev + 100);
                                                            setCorrectAnswersCount(c => c + 1);
                                                            setTimeout(() => finishGame(score + 100, selectedGame?.xp || 0), 1500);
                                                        }
                                                    }
                                                }}
                                                className={`w-9 h-9 rounded-lg font-black text-xs transition-all ${
                                                    isCorrect 
                                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                                                        : isWrong 
                                                            ? 'bg-rose-500 text-white shadow-rose-500/30' 
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-blue-600 hover:text-white active:scale-95 border border-slate-200/60 dark:border-white/10 font-mono shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                                                } ${isGuessed ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                {char}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {selectedGame.type === 'quiz' && currentQuestion && (
                    <div className="space-y-10 max-w-4xl mx-auto py-10">
                        <div className="bg-white dark:bg-white/[0.03] border-4 border-slate-100 dark:border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center font-black text-3xl shadow-xl">
                                        {currentQuestionIndex + 1}
                                    </div>
                                    <div>
                                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Questão {currentQuestionIndex + 1} de {currentQuestions.length}</p>
                                        <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{selectedGame.subject} &bull; {selectedGame.difficulty}</p>
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{score} ACERTOS</span>
                                </div>
                            </div>

                            {/* Beautiful Literary/Reading passage block if contextText is declared */}
                            {currentQuestion.contextText && (
                                <div className="mb-10 p-8 bg-slate-50/60 dark:bg-white/[0.02] border-2 border-slate-100 dark:border-white/5 rounded-3xl relative">
                                    <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Texto Base
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-sans text-base leading-relaxed whitespace-pre-line text-left pl-3 border-l-4 border-blue-500 italic">
                                        {currentQuestion.contextText}
                                    </p>
                                </div>
                            )}

                            {/* Image Rendering for Challenges (ENEM Style) */}
                            {currentQuestion.imageUrl && (
                                <div className="mb-10 flex flex-col group/img max-w-full overflow-hidden">
                                    <div className="relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                        <img 
                                            src={currentQuestion.imageUrl} 
                                            alt="Recurso visual da questão" 
                                            className="w-full max-h-[500px] object-contain mx-auto"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                // Fallback for broken images with a placeholder
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1549429789-940794fdcaee?w=800&auto=format&fit=crop";
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] mt-4 text-slate-400 dark:text-white/30 font-black uppercase tracking-[0.2em] italic text-center">
                                        Recurso Visual • {currentQuestion.origin} {currentQuestion.year} • Ampliação disponível em nova aba
                                    </span>
                                </div>
                            )}

                            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-relaxed text-left">
                                {currentQuestion.text}
                            </h3>
                        </div>
                        
                        <div className="grid gap-4">
                            {currentQuestion.options.map((opt, i) => (
                                <motion.button 
                                    key={i}
                                    whileHover={!isAnswered ? { scale: 1.01, x: 5 } : {}}
                                    onClick={() => handleQuizAnswer(i)}
                                    disabled={isAnswered}
                                    className={`group p-8 rounded-[1.5rem] text-left font-black transition-all flex items-center gap-8 border-4 ${
                                        isAnswered 
                                            ? i === currentQuestion.correct 
                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600' 
                                                : selectedOption === i 
                                                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                                                    : 'opacity-40 border-slate-100 dark:border-white/10 text-slate-400'
                                            : selectedOption === i 
                                                ? 'bg-blue-600/10 border-blue-600 text-blue-600' 
                                                : 'bg-white dark:bg-white/[0.05] border-slate-100 dark:border-white/10 text-slate-400 hover:border-blue-500 hover:text-blue-500'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-4 transition-all shadow-inner shrink-0 ${
                                        isAnswered ? 'border-transparent' : 'border-slate-50 dark:border-white/5 group-hover:border-blue-500'
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="text-lg md:text-xl flex-1 text-slate-800 dark:text-white tracking-tight leading-relaxed">{opt}</span>
                                    {isAnswered && i === currentQuestion.correct && <CheckCircle2 className="text-emerald-500 shrink-0" size={32} />}
                                    {isAnswered && selectedOption === i && i !== currentQuestion.correct && <XCircle className="text-rose-500 shrink-0" size={32} />}
                                </motion.button>
                            ))}
                        </div>

                        {isAnswered && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-inner">
                                <div className="flex items-center gap-3 text-blue-600 mb-4 animate-pulse">
                                    <Info size={24} />
                                    <span className="text-xs font-black uppercase tracking-[0.4em]">Sincronização de Conhecimento (Explicação)</span>
                                </div>
                                <p className="text-slate-600 dark:text-white/60 leading-relaxed text-base md:text-lg font-bold tracking-tight">{currentQuestion.explanation}</p>
                            </motion.div>
                        )}

                        <div className="flex justify-end pt-8">
                            <button 
                                onClick={() => {
                                    if (currentQuestionIndex < currentQuestions.length - 1) {
                                        setCurrentQuestionIndex(prev => prev + 1);
                                        setIsAnswered(false);
                                        setSelectedOption(null);
                                    } else {
                                        finishGame(score, selectedGame?.xp || 0);
                                    }
                                }}
                                disabled={!isAnswered}
                                className={`px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-2xl ${
                                    isAnswered ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 dark:bg-white/10 text-slate-400 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {currentQuestionIndex < currentQuestions.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                            </button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'theory' && (
                    <div className="max-w-4xl mx-auto py-12 space-y-12">
                        <div className="bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
                             <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-0.5 bg-blue-600/30" />
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.5em]">Leitura Profunda</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white tracking-widest leading-[1.1] mb-12 uppercase">
                                A Revolução <br/> <span className="text-blue-600 underline decoration-blue-600/30 underline-offset-8">Industrial</span>
                            </h2>
                            
                            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-xl text-slate-600 dark:text-white/60 font-medium leading-relaxed">
                                <p className="first-letter:text-7xl first-letter:font-black first-letter:text-slate-800 dark:first-letter:text-white first-letter:mr-4 first-letter:float-left pt-2">
                                    A Primeira Revolução Industrial, iniciada na Inglaterra em meados do século XVIII, marcou a transição de métodos de produção manuais para máquinas.
                                </p>
                                <p>
                                    O uso do carvão mineral como fonte de energia e o desenvolvimento da máquina a vapor por James Watt foram pilares fundamentais dessa transformação.
                                </p>
                                <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 text-xl font-black text-slate-800 dark:text-white leading-relaxed italic relative shadow-inner">
                                    <div className="absolute -top-6 -left-6 w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl text-3xl font-serif">"</div>
                                    "A manufatura deu lugar à maquinofatura, alterando drasticamente as relações de trabalho e a estrutura social urbana."
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center">
                            <button 
                                onClick={() => finishGame(200, selectedGame?.xp || 200)}
                                className="px-16 py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/30"
                            >
                                Concluir Leitura (+200 XP)
                            </button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'flashcards' && (
                    <div className="max-w-3xl mx-auto py-12">
                        <div className="text-center mb-12 space-y-6">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.6em]">Memorização Ativa</span>
                            <div className="flex items-center justify-center gap-6">
                                <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-widest uppercase">
                                    Card <span className="text-blue-600">{currentQuestionIndex + 1}</span> de {currentQuestions.length || 10}
                                </h2>
                            </div>
                            <div className="w-56 mx-auto h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-8 p-0.5 border border-slate-200 dark:border-white/10 shadow-inner">
                                <motion.div 
                                    animate={{ width: `${((currentQuestionIndex + 1) / (currentQuestions.length || 10)) * 100}%` }} 
                                    className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                                />
                            </div>
                        </div>

                        <motion.div 
                            onClick={() => setIsAnswered(!isAnswered)}
                            className="h-[520px] cursor-pointer perspective-2000 group"
                        >
                            <motion.div
                                animate={{ rotateY: isAnswered ? 180 : 0 }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                                className="w-full h-full relative preserve-3d"
                            >
                                {/* FRONTSIDE */}
                                <div className="absolute inset-0 backface-hidden bg-white dark:bg-white/[0.03] border-4 border-slate-100 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-16 text-center shadow-2xl transition-all group-hover:border-blue-500/50">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-12 border border-slate-100 dark:border-white/10 shadow-inner">
                                        <HelpCircle size={40} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-widest leading-tight mb-10 uppercase">
                                        {currentQuestion.text}
                                    </h3>
                                    <div className="absolute bottom-12 flex flex-col items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Layers size={20} className="text-slate-400" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Clique para revelar</p>
                                    </div>
                                </div>

                                {/* BACKSIDE */}
                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-[3rem] flex flex-col items-center justify-center p-16 text-center rotate-y-180 shadow-2xl">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 flex items-center justify-center mb-12 border border-white/20">
                                        <CheckCircle2 size={40} className="text-white" />
                                    </div>
                                    <div className="space-y-8 max-w-md">
                                        <p className="text-white text-2xl md:text-3xl font-black tracking-widest uppercase leading-[1.1]">
                                            {currentQuestion.explanation || "Resposta confirmada no banco de dados."}
                                        </p>
                                    </div>
                                    
                                    <div className="absolute bottom-12 inset-x-12 flex gap-6">
                                        <motion.button 
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (currentQuestionIndex < currentQuestions.length - 1) {
                                                    setCurrentQuestionIndex(prev => prev + 1); 
                                                    setIsAnswered(false);
                                                } else {
                                                    finishGame(score, selectedGame?.xp || 0);
                                                }
                                            }} 
                                            className="flex-1 py-5 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                        >
                                            Próximo Card
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                )}

                {selectedGame.type === 'true_false' && (
                    <div className="max-w-2xl mx-auto py-12">
                        <div className="text-center mb-12">
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Verdadeiro ou Falso?</h3>
                            <p className="text-slate-500 dark:text-white/40 uppercase tracking-widest text-xs font-black">Decida rápido!</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-12 mb-12 shadow-2xl">
                            <p className="text-3xl font-black text-center text-slate-800 dark:text-white leading-tight">
                                {currentQuestion.text}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <button 
                                onClick={() => {
                                    if (currentQuestion.correct === 1) {
                                        setScore(s => s + 100);
                                        setCorrectAnswersCount(c => c + 1);
                                    }
                                    if (currentQuestionIndex < currentQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
                                    else finishGame(score + (currentQuestion.correct === 1 ? 100 : 0), selectedGame?.xp || 0);
                                }}
                                className="py-10 bg-emerald-500 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/30"
                            >
                                Verdadeiro
                            </button>
                            <button 
                                onClick={() => {
                                    if (currentQuestion.correct !== 1) {
                                        setScore(s => s + 100);
                                        setCorrectAnswersCount(c => c + 1);
                                    }
                                    if (currentQuestionIndex < currentQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
                                    else finishGame(score + (currentQuestion.correct !== 1 ? 100 : 0), selectedGame?.xp || 0);
                                }}
                                className="py-10 bg-rose-500 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/30"
                            >
                                Falso
                            </button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'match' && (
                    <div className="max-w-4xl mx-auto py-8">
                        <div className="text-center mb-10">
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Combinação Magnética</h3>
                            <p className="text-slate-500 dark:text-white/40 uppercase tracking-widest text-xs font-black">Arraste os conceitos para suas definições</p>
                        </div>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                {matchPairs.map((pair, i) => (
                                    <div key={i} className="p-6 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-black text-sm uppercase">
                                        {pair.text}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {matchPairs.map((pair, i) => (
                                    <motion.div 
                                        key={i} 
                                        drag
                                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                        onDragEnd={(e, info) => {
                                            if (info.offset.x < -100) {
                                                // Simplified match logic
                                                setScore(s => s + 50);
                                                toast.success('Combinação realizada!');
                                            }
                                        }}
                                        className="p-6 bg-blue-600 text-white border-2 border-blue-400 rounded-2xl cursor-grab active:cursor-grabbing font-black text-sm uppercase text-center shadow-lg"
                                    >
                                        {pair.shuffledAnswer}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-12 text-center">
                            <button onClick={() => finishGame(score, selectedGame?.xp || 0)} className="px-12 py-5 bg-slate-800 dark:bg-white text-white dark:text-slate-800 rounded-full font-black uppercase text-xs tracking-widest">Finalizar Desafio</button>
                        </div>
                    </div>
                )}

                {selectedGame.type === 'whack' && (
                    <div className="max-w-4xl mx-auto py-8">
                        <div className="flex justify-between items-center mb-10">
                            <div className="text-left">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ataque à Resposta</h3>
                                <p className="text-blue-600 uppercase tracking-widest text-xs font-black">Bata na resposta correta!</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-zinc-800 px-8 py-4 rounded-3xl border-2 border-slate-200 dark:border-white/10">
                                <span className="text-4xl font-black tabular-nums text-slate-800 dark:text-white">{gameTimer}s</span>
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border-4 border-emerald-500/20 rounded-[4rem] p-12 mb-10 text-center">
                            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter mb-4">Pergunta atual:</h4>
                            <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{currentQuestion.text}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {whackTargets.map((target, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        if (target.isCorrect) {
                                            setScore(s => s + 200);
                                            setCorrectAnswersCount(c => c + 1);
                                            toast.success('ACERTOU!', { icon: '🎯' });
                                            // Trigger next
                                            if (currentQuestionIndex < currentQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
                                            else finishGame(score + 200, selectedGame?.xp || 0);
                                        } else {
                                            toast.error('ERROU!', { icon: '💥' });
                                            setScore(s => Math.max(0, s - 50));
                                        }
                                    }}
                                    className="h-44 bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem] border-4 border-slate-300 dark:border-white/10 flex items-center justify-center p-6 text-center overflow-hidden hover:border-emerald-500/50 transition-all shadow-xl"
                                >
                                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{target.text}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 1. MATH ZOMBIES GAMEPLAY SCREEN */}
                {selectedGame.type === 'math_zombies' && (
                    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                            <div className="text-left">
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Matemática: Invasão Zombie</h3>
                                <p className="text-rose-500 uppercase tracking-widest text-[9px] sm:text-[10px] font-black">Combata os monstros resolvendo os cálculos rapidamente!</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 bg-red-500/10 dark:bg-red-500/5 px-4 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl border border-red-500/10">
                                <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 font-mono uppercase tracking-widest">Eliminados: {zombiesKilled} / 5</span>
                            </div>
                        </div>

                        {/* Battlefield track */}
                        <div className={`${theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 dark:bg-black/80 border-slate-800'} rounded-2xl sm:rounded-[3rem] p-3 sm:p-8 md:p-12 mb-6 sm:mb-10 border-2 sm:border-4 relative overflow-hidden shadow-2xl h-80 sm:h-96 flex flex-col justify-between`}>
                            {/* Grid vertical lines for spacing/lanes */}
                            <div className={`absolute inset-x-0 top-0 bottom-0 ${theme === 'light' ? 'bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)]'} bg-[size:10%_100%] pointer-events-none`} />
                            {/* Castle Base / Weapon Fortress */}
                            <div className="absolute left-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-r from-blue-600/30 to-transparent border-r-2 sm:border-r-4 border-dashed border-blue-500 flex flex-col items-center justify-center pointer-events-none z-10">
                                <span className="text-[9px] sm:text-xs font-black text-blue-400 font-mono rotate-270 tracking-widest uppercase">Base</span>
                            </div>

                            {/* Zombie container lane tracks */}
                            <div className="relative flex-1 flex flex-col justify-around py-2 sm:py-4 z-20">
                                {zombies.map((z) => (
                                    <motion.div
                                        key={z.id}
                                        initial={{ opacity: 0, x: 200 }}
                                        animate={{ 
                                            opacity: z.status === 'dying' ? 0 : 1, 
                                            scale: z.status === 'dying' ? 0.3 : 1,
                                            x: `${z.distance}%` 
                                        }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                        className="absolute h-12 sm:h-16 flex items-center gap-1.5 sm:gap-3 pl-1 sm:pl-2 select-none font-mono"
                                        style={{ left: 0 }}
                                    >
                                        <div className="px-3 py-1.5 sm:px-5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-700 border border-emerald-400 text-white rounded-xl sm:rounded-2xl font-bold flex items-center gap-1.5 sm:gap-2 shadow-xl sm:shadow-2xl shadow-emerald-950">
                                            <span className="text-lg sm:text-2xl">🧟</span>
                                            <span className="font-mono text-xs sm:text-sm tracking-wide sm:tracking-widest">{z.equation}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            <div className="text-stone-500 text-[8px] sm:text-[10px] font-mono text-right relative z-10 uppercase tracking-widest bg-stone-950/60 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-white/5">
                                [Status: Defesas em prontidão. Digite o valor correto para desintegrar em segundos]
                            </div>
                        </div>

                        {/* Weapon trigger form */}
                        <form onSubmit={handleZombieSubmit} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-[2.5rem]">
                            <div className="flex-1 w-full pl-1 sm:pl-3 text-left">
                                <label className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-white/40 block mb-0.5 sm:mb-1">Cálculo selecionado para disparo</label>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/70 leading-tight">Interfira na cronologia resolvendo as operações de matemática</span>
                            </div>
                            <div className="flex gap-2.5 sm:gap-3 w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={mathInput}
                                    onChange={(e) => setMathInput(e.target.value.replace(/[^0-9-]/g, ''))}
                                    placeholder="Resultado..."
                                    className="w-full sm:w-36 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-mono text-center text-base sm:text-lg font-black bg-white dark:bg-black border-2 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all font-mono shrink-0"
                                >
                                    FOGO!
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 2. VIRTUAL CHEMISTRY LAB SCREEN */}
                {selectedGame.type === 'chemistry_lab' && (
                    <div className="max-w-4xl mx-auto py-8">
                        {/* Tab header to switch modes */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                            <div className="text-left">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Laboratório Químico Virtual</h3>
                                <p className="text-teal-500 uppercase tracking-widest text-[10px] font-black">Práticas realistas baseadas nas questões de química e estequiometria do ENEM/Vestibular</p>
                            </div>
                            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                <button 
                                    onClick={() => startChemistryLab('neutralize')}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                        chemExperimentMode === 'neutralize' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    💧 Equilíbrio de pH
                                </button>
                                <button 
                                    onClick={() => startChemistryLab('titration')}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                        chemExperimentMode === 'titration' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    📐 Titulação e Molaridade
                                </button>
                            </div>
                        </div>

                        {chemExperimentMode === 'neutralize' ? (
                            // MODE 1: pH neutralization
                            <div className="space-y-8">
                                <div className="flex justify-between items-center bg-teal-500/10 dark:bg-teal-500/5 px-8 py-4 rounded-[1.5rem] border border-teal-500/20">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Desafio: Adicione reagentes e indicadores para atingir neutralidade (pH 7,0)</span>
                                    <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono bg-teal-500/20 px-4 py-1.5 rounded-xl border border-teal-500/40">PH ATUAL: {solutionPh.toFixed(1)}</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Glass beaker side */}
                                    <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative min-h-[400px]">
                                        {/* Glass flask shape container */}
                                        <div className="w-48 h-64 border-4 border-slate-400/80 rounded-b-[4rem] rounded-t-3xl relative flex flex-col justify-end overflow-hidden pb-4 shadow-2xl">
                                            {/* Liquid layer inside */}
                                            <motion.div 
                                                animate={{ 
                                                    height: '65%',
                                                    skewY: chemicalBeakerState === 'bubbling' ? [0, 2, -2, 0] : 0,
                                                }}
                                                transition={{ repeat: chemicalBeakerState === 'bubbling' ? Infinity : 0, duration: 0.3 }}
                                                className={`w-full transition-all duration-700 border-t border-white/40 flex items-center justify-center ${getBeakerColor()}`}
                                            >
                                                <div className="font-mono text-[9px] font-black opacity-50 text-stone-900 uppercase">
                                                    H₂O &bull; pH {solutionPh.toFixed(1)}
                                                </div>
                                            </motion.div>

                                            {chemicalBeakerState === 'bubbling' && (
                                                <div className="absolute inset-x-0 bottom-4 top-24 flex justify-around pointer-events-none">
                                                    <span className="w-3 h-3 bg-white/30 rounded-full animate-bounce delay-100" />
                                                    <span className="w-2.5 h-2.5 bg-white/20 rounded-full animate-bounce delay-200" />
                                                    <span className="w-3.5 h-3.5 bg-white/25 rounded-full animate-bounce delay-300" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-56 h-3 bg-slate-300 dark:bg-zinc-800 rounded-full mt-2" />
                                        
                                        <div className="mt-6 text-center">
                                            <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-widest block mb-2 font-black">Elementos no Béquer:</span>
                                            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                                                {addedChemicals.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic font-semibold">Nenhum componente adicionado</span>
                                                ) : (
                                                    addedChemicals.map(c => (
                                                        <span key={c} className="px-2.5 py-1 bg-slate-200 dark:bg-zinc-800 border dark:border-white/5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-zinc-300">{c}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Control board side */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8">
                                            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-teal-600 mb-4 block font-mono">1. Adicione Indicadores Colorimétricos</span>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => handleChemistryAdd('Fenolftaleína')}
                                                    className={`py-4 px-3.5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        addedChemicals.includes('Fenolftaleína') 
                                                            ? 'bg-fuchsia-600/15 border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 shadow-inner' 
                                                            : 'bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-fuchsia-500'
                                                    }`}
                                                >
                                                    🧪 Fenolftaleína
                                                </button>
                                                <button 
                                                    onClick={() => handleChemistryAdd('Azul de Bromotimol')}
                                                    className={`py-4 px-3.5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        addedChemicals.includes('Azul de Bromotimol') 
                                                            ? 'bg-emerald-600/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-inner' 
                                                            : 'bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-emerald-500'
                                                    }`}
                                                >
                                                    🧪 Azul Bromotimol
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8">
                                            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-teal-600 mb-4 block font-mono">2. Altere o Equilíbrio Químico (Reagentes)</span>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button 
                                                    onClick={() => handleChemistryAdd('Ácido Clorídrico (HCl)')}
                                                    className="py-4 bg-white dark:bg-black border-2 border-red-200 dark:border-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500 transition-colors"
                                                >
                                                    HCl (+Ácido)
                                                </button>
                                                <button 
                                                    onClick={() => handleChemistryAdd('Hidróxido de Sódio (NaOH)')}
                                                    className="py-4 bg-white dark:bg-black border-2 border-blue-200 dark:border-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:border-blue-500 transition-colors"
                                                >
                                                    NaOH (+Base)
                                                </button>
                                                <button 
                                                    onClick={() => handleChemistryAdd('Água Destilada')}
                                                    className="py-4 bg-white dark:bg-black border-2 border-sky-200 dark:border-sky-950/20 text-sky-600 dark:text-sky-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-500/10 hover:border-sky-500 transition-colors"
                                                >
                                                    H₂O (Diluir)
                                                </button>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleChemistryConclude}
                                            className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.25em] transition-all shadow-xl shadow-teal-700/10 flex items-center justify-center gap-2.5 active:scale-95"
                                        >
                                            🧪 CONCLUIR REAÇÃO &bull; pH SEGURO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // MODE 2: Stoichiometric Titration
                            <div className="space-y-8">
                                {chemStage === 'setup' && (
                                    <div className="bg-slate-50 dark:bg-[#0d0f14] border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-10 text-center space-y-6">
                                        <div className="max-w-md mx-auto space-y-4">
                                            <span className="text-4xl">🧪</span>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Experimento de Titulação Ácido-Base</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
                                                Amostra no béquer: **20 mL de HCl** de concentração desconhecida.<br/>
                                                Titulante na bureta: **NaOH 0.1 mol/L**.<br/>
                                                Escolha um indicador colorimétrico apropriado e clique abaixo para iniciar o gotejador!
                                            </p>
                                        </div>

                                        <div className="flex justify-center gap-4 max-w-sm mx-auto">
                                            <button 
                                                onClick={() => setChemSelectedIndicator('Fenolftaleína')}
                                                className={`flex-1 py-4 px-3 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    chemSelectedIndicator === 'Fenolftaleína'
                                                        ? 'bg-fuchsia-600/15 border-fuchsia-500 text-fuchsia-600 shadow-inner'
                                                        : 'bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-500 hover:border-fuchsia-400'
                                                }`}
                                            >
                                                Fenolftaleína
                                            </button>
                                            <button 
                                                onClick={() => setChemSelectedIndicator('Azul de Bromotimol')}
                                                className={`flex-1 py-4 px-3 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    chemSelectedIndicator === 'Azul de Bromotimol'
                                                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-600 shadow-inner'
                                                        : 'bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-400'
                                                }`}
                                            >
                                                Azul Bromotimol
                                            </button>
                                        </div>

                                        <button
                                            disabled={chemSelectedIndicator === 'Nenhum'}
                                            onClick={() => setChemStage('titrating')}
                                            className={`w-full max-w-md py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                                chemSelectedIndicator === 'Nenhum'
                                                    ? 'bg-slate-300 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl active:scale-95'
                                            }`}
                                        >
                                            Iniciar Gotejamento
                                        </button>
                                    </div>
                                )}

                                {chemStage === 'titrating' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Titrating view: Show beaker + Bureta! */}
                                        <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-8 flex flex-col items-center relative min-h-[480px] justify-between">
                                            {/* Burette Graphic */}
                                            <div className="w-10 h-32 bg-slate-200 dark:bg-zinc-800 border-x-4 border-slate-400/80 rounded-b-lg relative flex flex-col justify-end items-center">
                                                <div className="absolute top-1 text-[8px] font-black text-slate-500 font-mono">BURETA</div>
                                                <div className="w-1.5 bg-blue-500/40 h-2/3 flex items-center justify-center font-mono text-[6px] text-white">0.1M</div>
                                                <div className="absolute -bottom-4 w-4 h-4 bg-teal-600 rounded-full flex items-center justify-center text-[8px] text-white font-black cursor-pointer shadow">V</div>
                                            </div>

                                            {/* Droplet animation */}
                                            <div className="h-10 flex items-center justify-center">
                                                {chemicalBeakerState === 'bubbling' && (
                                                    <motion.div 
                                                        animate={{ y: [0, 40], opacity: [1, 0] }}
                                                        transition={{ duration: 0.3, ease: 'easeIn' }}
                                                        className="w-2 h-2.5 bg-sky-400 rounded-full"
                                                    />
                                                )}
                                            </div>

                                            {/* Beaker representation */}
                                            <div className="w-40 h-44 border-4 border-slate-400/80 rounded-b-[3.5rem] rounded-t-xl relative flex flex-col justify-end overflow-hidden pb-4 shadow-xl">
                                                <motion.div 
                                                    animate={{ 
                                                        height: `${45 + chemVolumeBaseGasto * 1.2}%`, 
                                                        skewY: chemicalBeakerState === 'bubbling' ? [0, 1.5, -1.5, 0] : 0 
                                                    }}
                                                    className={`w-full transition-all duration-300 border-t border-white/30 flex flex-col items-center justify-center ${getBeakerColor()}`}
                                                >
                                                    <span className="font-mono text-[7px] font-black opacity-35 text-stone-900">HCl 20 mL</span>
                                                    <span className="font-mono text-[8px] font-black opacity-50 text-stone-900">pH: {solutionPh.toFixed(2)}</span>
                                                </motion.div>
                                            </div>

                                            <div className="text-center space-y-1 mt-3">
                                                <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-widest">Indicador Ativo:</span>
                                                <span className="px-3 py-1 bg-slate-200 dark:bg-zinc-800 border rounded-lg text-[9px] font-bold text-slate-700 dark:text-zinc-300 uppercase">{chemSelectedIndicator}</span>
                                            </div>
                                        </div>

                                        {/* Burette controllers */}
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-4">
                                                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-teal-600 block font-mono">Controle da Bureta</span>
                                                <div className="text-left bg-teal-500/10 p-5 rounded-2xl border border-teal-500/20">
                                                    <p className="text-xs text-teal-700 dark:text-teal-300 font-bold leading-relaxed">
                                                        goteje **NaOH 0.1 mol/L** em sua amostra de **20 mL de HCl**.<br/>
                                                        Fique atento à **mudança repentina de cor** provocada pelo ponto de virada (neutralização)!
                                                    </p>
                                                </div>

                                                <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 p-5 rounded-2xl flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500">Volume de NaOH Gasto:</span>
                                                    <span className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">{chemVolumeBaseGasto.toFixed(1)} mL</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <button 
                                                        onClick={() => {
                                                            setChemicalBeakerState('bubbling');
                                                            const newVal = parseFloat((chemVolumeBaseGasto + 0.1).toFixed(1));
                                                            setChemVolumeBaseGasto(newVal);
                                                            setSolutionPh(computePhOfTitration(chemTargetMolarity, newVal));
                                                            setTimeout(() => setChemicalBeakerState('idle'), 300);
                                                        }}
                                                        className="py-4 bg-white dark:bg-black border-2 border-teal-500/40 text-teal-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:border-teal-500 hover:bg-teal-500/10 transition-colors"
                                                    >
                                                        💧 +0.1 mL (Gota)
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setChemicalBeakerState('bubbling');
                                                            const newVal = parseFloat((chemVolumeBaseGasto + 1.0).toFixed(1));
                                                            setChemVolumeBaseGasto(newVal);
                                                            setSolutionPh(computePhOfTitration(chemTargetMolarity, newVal));
                                                            setTimeout(() => setChemicalBeakerState('idle'), 300);
                                                        }}
                                                        className="py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-teal-700 transition-colors shadow-lg shadow-teal-700/10"
                                                    >
                                                        💧 +1.0 mL (Rápido)
                                                    </button>
                                                </div>
                                            </div>

                                            <button 
                                                disabled={chemVolumeBaseGasto === 0}
                                                onClick={() => setChemStage('calculating')}
                                                className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 ${
                                                    chemVolumeBaseGasto === 0 
                                                        ? 'bg-slate-300 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                                                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-700/10 active:scale-95'
                                                }`}
                                            >
                                                📊 REGISTRAR MUDANÇA E RESOLVER ESTEQUIOMETRIA
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {chemStage === 'calculating' && (
                                    <div className="bg-slate-50 dark:bg-[#0d0f14] border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-10 text-center space-y-8 max-w-2xl mx-auto">
                                        <div className="space-y-4">
                                            <span className="text-3xl">📊</span>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Estequiometria de Titulação</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                                                Consumindo exatamente **{chemVolumeBaseGasto.toFixed(1)} mL** de titulante **NaOH 0,1 mol/L** para neutralizar **20 mL** de amostra de **HCl** de concentração desconhecida:
                                            </p>
                                        </div>

                                        <div className="p-6 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-left max-w-md mx-auto space-y-3 font-mono text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                                            <p className="font-extrabold uppercase text-slate-400 mb-1 tracking-wider">Passo a Passo Teórico:</p>
                                            <p>1. Reação: HCl + NaOH → NaCl + H₂O</p>
                                            <p>2. No ponto estequiométrico: n(HCl) = n(NaOH)</p>
                                            <p>3. n(NaOH) = M(base) × V(base) = 0,1 mol/L × {chemVolumeBaseGasto.toFixed(1)} mL</p>
                                            <p>4. M(HCl) = n(HCl) / V(HCl) = n(NaOH) / 20 mL</p>
                                        </div>

                                        <div className="space-y-3 max-w-md mx-auto">
                                            <p className="text-xs uppercase font-black tracking-widest text-teal-600">Qual é a concentração em mol/L do HCl?</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[0.05, 0.10, 0.15, 0.20].map((m) => (
                                                    <button
                                                        key={m}
                                                        onClick={() => {
                                                            if (m === chemTargetMolarity) {
                                                                toast.success('EXCELENTE! Resolvido perfeitamente!', { icon: '🏆' });
                                                                setScore(s => s + 400);
                                                                setCorrectAnswersCount(c => c + 1);
                                                                setChemStage('solved');
                                                            } else {
                                                                toast.error('Concentração incorreta, tente refazer os cálculos!', { icon: '❌' });
                                                            }
                                                        }}
                                                        className="py-4 border-2 border-slate-200 dark:border-white/5 font-mono font-black text-center text-sm rounded-2xl bg-white dark:bg-black hover:border-teal-500 hover:bg-teal-500/5 transition-all text-slate-700 dark:text-white"
                                                    >
                                                        {m.toFixed(2).replace('.', ',')} mol/L
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {chemStage === 'solved' && (
                                    <div className="bg-emerald-600/10 border-4 border-emerald-500/20 rounded-[3rem] p-12 text-center max-w-md mx-auto space-y-6">
                                        <span className="text-4xl">🏆</span>
                                        <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Muito Bem!</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
                                            Você determinou de forma cientificamente precisa a concentração original do ácido de **{chemTargetMolarity.toFixed(2).replace('.', ',')} mol/L** a partir da titulação!
                                        </p>
                                        <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-600/20">
                                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">+400 XP ADICIONADOS</span>
                                        </div>
                                        <button 
                                            onClick={() => finishGame(score, selectedGame?.xp || 200)}
                                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                        >
                                            Concluir & Resgatar XP
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. JOGO DA VELHA GRAMATICAL SCREEN */}
                {selectedGame.type === 'tic_tac_toe' && (
                    <div className="max-w-4xl mx-auto py-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="text-left">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Jogo da Velha Gramatical</h3>
                                <p className="text-amber-500 uppercase tracking-widest text-[10px] font-black">Conquiste a casa acertando as dúvidas do vestibular. Você joga com "O".</p>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/5 px-6 py-3.5 rounded-2xl border-2 border-amber-500/10 font-mono text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                🐦 O Corvo Professor é seu adversário
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12 justify-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="grid grid-cols-3 gap-4 bg-slate-100 dark:bg-zinc-800 p-4 rounded-[3.5rem] border-4 border-slate-200 dark:border-white/5 shadow-2xl relative">
                                    {ticTacToeBoard.map((cell, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleTicTacToeGridClick(i)}
                                            className={`w-28 h-28 md:w-32 md:h-32 rounded-3xl border-4 flex items-center justify-center text-4xl font-black transition-all shadow-md mt-0 active:scale-95 ${
                                                cell === 'O' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                                                cell === 'X' ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400' :
                                                'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-transparent hover:border-amber-500'
                                            }`}
                                        >
                                            {cell || ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {ticTacToeActiveIndex !== null && ticTacToeCurrentQuestion && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                                <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl relative">
                                    <div className="absolute top-0 right-12 -translate-y-1/2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest text-left">
                                        Desafio de Concordância / Regência
                                    </div>
                                    <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-relaxed text-left mb-8">
                                        {ticTacToeCurrentQuestion.text}
                                    </h4>
                                    <div className="space-y-4">
                                        {ticTacToeCurrentQuestion.options.map((option: string, oIdx: number) => (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleTicTacToeAnswer(oIdx)}
                                                className="w-full text-left p-5 border-2 border-slate-100 hover:border-amber-500 dark:border-white/5 rounded-2xl flex items-center gap-4 bg-slate-50 hover:bg-amber-50/20 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 font-black text-xs flex items-center justify-center border group-hover:border-amber-500 group-hover:text-amber-500 transition-colors">
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 dark:text-stone-300">{option}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. BIO CELL ANATOMY VISUAL GAMEPLAY SCREEN */}
                {selectedGame.type === 'bio_anatomy' && (
                    <div className="max-w-5xl mx-auto py-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="text-left">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Mapeamento Celular Visual</h3>
                                <p className="text-sky-500 uppercase tracking-widest text-[10px] font-black">Interaja com o modelo do micro-mundo molecular para preencher a sua enciclopédia celular!</p>
                            </div>
                            <div className="flex items-center gap-2 bg-sky-500/10 dark:bg-sky-500/5 px-6 py-3.5 rounded-2xl border-2 border-sky-500/10 font-mono text-sm font-black text-sky-600 dark:text-sky-400 shadow-sm">
                                Descobertas: {bioUnlockedParts.length} / 6
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[3rem] p-6 flex items-center justify-center relative shadow-xl h-[400px] overflow-hidden select-none">
                                <div className="absolute inset-0 flex items-center justify-center p-8">
                                    <svg viewBox="0 0 400 400" className="w-full h-full max-w-sm drop-shadow-2xl">
                                        <circle cx="200" cy="200" r="170" fill="none" stroke="#2563ea" strokeWidth="8" strokeDasharray="5,10" className="animate-[spin_60s_linear_infinite]" />
                                        <circle cx="200" cy="200" r="162" fill="#3b82f6" fillOpacity="0.06" stroke="#3b82f6" strokeWidth="3" />
                                        <circle cx="200" cy="200" r="50" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="4" />
                                        <circle cx="200" cy="200" r="22" fill="#c084fc" />
                                        
                                        <path d="M 270 120 Q 290 140 310 130 Q 320 110 300 90 Z" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="2" />
                                        <path d="M 100 130 Q 120 150 140 140 Q 150 120 130 100 Z" fill="#10b981" fillOpacity="0.4" stroke="#10b981" strokeWidth="2" />
                                        <circle cx="150" cy="260" r="4" fill="#a1a1aa" />
                                        <circle cx="160" cy="280" r="4" fill="#a1a1aa" />
                                        <circle cx="270" cy="270" r="4" fill="#a1a1aa" />
                                        <path d="M 90 220 Q 120 230 110 250 T 130 280" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                                        <circle cx="280" cy="210" r="15" fill="#f43f5e" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="2" />
                                    </svg>
                                </div>

                                <button
                                    onClick={() => handleBioPartSelect('Núcleo')}
                                    className={`absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Núcleo') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">1</span>
                                </button>
                                <button
                                    onClick={() => handleBioPartSelect('Mitocôndria')}
                                    className={`absolute left-[70%] top-[30%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Mitocôndria') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">2</span>
                                </button>
                                <button
                                    onClick={() => handleBioPartSelect('Cloroplasto')}
                                    className={`absolute left-[30%] top-[30%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Cloroplasto') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">3</span>
                                </button>
                                <button
                                    onClick={() => handleBioPartSelect('Complexo de Golgi')}
                                    className={`absolute left-[28%] top-[62%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Complexo de Golgi') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">4</span>
                                </button>
                                <button
                                    onClick={() => handleBioPartSelect('Lisossomo')}
                                    className={`absolute left-[70%] top-[52%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Lisossomo') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">5</span>
                                </button>
                                <button
                                    onClick={() => handleBioPartSelect('Ribossomo')}
                                    className={`absolute left-[40%] top-[68%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xl transition-all hover:scale-125 z-40 ${
                                        bioUnlockedParts.includes('Ribossomo') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-600 shadow-blue-500/50'
                                    }`}
                                >
                                    <span className="text-[9px] font-black text-white">6</span>
                                </button>
                            </div>

                            <div className="flex flex-col justify-between">
                                <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono font-black text-sky-600 uppercase mb-4 text-left">
                                            <span>Mecanismo Biológico</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                                        </div>
                                        <p className="text-slate-600 dark:text-stone-300 font-sans text-xs md:text-sm leading-relaxed text-left">
                                            {bioAnatomyStatus}
                                        </p>
                                    </div>

                                    <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6">
                                        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block mb-3 text-left">Cata-partes da Célula Eucariótica:</span>
                                        <div className="flex flex-wrap gap-2.5">
                                            {['Núcleo', 'Mitocôndria', 'Cloroplasto', 'Complexo de Golgi', 'Lisossomo', 'Ribossomo'].map(part => (
                                                <button
                                                    key={part}
                                                    onClick={() => handleBioPartSelect(part)}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                        bioUnlockedParts.includes(part)
                                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                                                            : 'bg-white dark:bg-black border-slate-200 dark:border-white/5 text-slate-400 hover:border-sky-500 hover:text-sky-500'
                                                    }`}
                                                >
                                                    {part}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. HISTORY TIMELINE SCREEN */}
                {selectedGame.type === 'history_timeline' && (
                    <div className="max-w-4xl mx-auto py-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="text-left">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">O Corvo do Tempo</h3>
                                <p className="text-blue-500 uppercase tracking-widest text-[10px] font-black">Organize os eventos histográficos na sequência temporal correta!</p>
                            </div>
                            <button
                                onClick={handleCorvoHint}
                                disabled={timelineHintUsed}
                                className={`px-6 py-3.5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    timelineHintUsed 
                                        ? 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400 cursor-not-allowed' 
                                        : 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                                }`}
                            >
                                💡 Pedir Pista de Humanas
                            </button>
                        </div>

                        <div className="bg-blue-500/10 dark:bg-blue-500/5 border-2 border-blue-500/20 rounded-[2.5rem] p-6 mb-10 flex gap-6 items-center text-left">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg shrink-0 border-2 border-blue-400 animate-bounce">
                                🐦🎓
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Professor Corvo Sábio diz:</span>
                                <p className="text-slate-700 dark:text-stone-300 text-xs md:text-sm font-semibold italic leading-relaxed">
                                    "{corvoSpeech}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            {timelineItems.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow group text-left"
                                >
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <button 
                                            type="button"
                                            onClick={() => handleShiftTimeline(idx, 'up')}
                                            disabled={idx === 0}
                                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border dark:border-white/5 flex items-center justify-center text-stone-500 hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-stone-500"
                                        >
                                            ▲
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleShiftTimeline(idx, 'down')}
                                            disabled={idx === timelineItems.length - 1}
                                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border dark:border-white/5 flex items-center justify-center text-stone-500 hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-stone-500"
                                        >
                                            ▼
                                        </button>
                                    </div>

                                    <div className="w-20 md:w-24 px-4 py-2.5 bg-slate-100 dark:bg-white/5 rounded-2xl text-center font-mono text-sm font-black text-slate-800 dark:text-white">
                                        {item.year}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="text-sm md:text-base font-bold text-slate-800 dark:text-white tracking-tight leading-tight uppercase">{item.event}</h4>
                                        <p className="text-slate-400 dark:text-stone-400/80 text-[11px] md:text-xs truncate leading-normal mt-0.5">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            onClick={handleValidateTimeline}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.25em] transition-all shadow-xl shadow-blue-700/10 flex items-center justify-center gap-2.5 active:scale-95"
                        >
                            ⏳ VALIDAR CRONOLOGIA TEMPORAL
                        </button>
                    </div>
                )}

                {/* 6. UNIVERSAL INTERACTIVE LAB ARENA SCREEN */}
                {selectedGame.type === 'interactive_lab' && labGameEngine && (
                    <div className="max-w-4xl mx-auto py-8 space-y-8">
                        {/* THE CORVO MENTOR HUD */}
                        <div className="flex flex-wrap items-center justify-between gap-6 bg-linear-to-r from-blue-500/10 via-[var(--accent-1)]/10 to-blue-600/10 border-2 border-[var(--accent-1)]/30 rounded-[2rem] p-6 shadow-xs">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
                                    <Brain size={28} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-1)]">Corvo Mentor Ativo</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{selectedGame.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Tema: <span className="text-[var(--accent-1)] font-mono uppercase font-bold">{selectedGame.topic}</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="bg-bg-secondary px-5 py-3 rounded-xl border border-glass-border text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] leading-none mb-1">Passo</p>
                                    <p className="text-lg font-black text-[var(--text-primary)] leading-none">{labStep} / 5</p>
                                </div>
                                <div className="bg-bg-secondary px-5 py-3 rounded-xl border border-glass-border text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] leading-none mb-1">Vidas</p>
                                    <div className="flex gap-1 justify-center">
                                        {[1, 2, 3].map((heartNum) => (
                                            <span key={heartNum} className="text-sm transition-all duration-300">
                                                {heartNum <= labHearts ? '❤️' : '🖤'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-bg-secondary px-5 py-3 rounded-xl border border-glass-border text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] leading-none mb-1">Pontos</p>
                                    <p className="text-lg font-black text-[var(--text-primary)] leading-none font-mono">{score}</p>
                                </div>
                            </div>
                        </div>

                        {/* INTERACTIVE STUDY SIMULATOR OR MAP */}
                        <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-xs">
                            <div className="p-8 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-1)] animate-ping" />
                                    <span className="text-xs font-black text-[var(--accent-1)] uppercase tracking-[0.2em]">{labGameEngine.title}</span>
                                </div>
                                <h4 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-relaxed text-center sm:text-left">
                                    {labGameEngine.instructions}
                                </h4>
                            </div>

                            {/* DIAGRAM PANEL - GRAPHICS & DYNAMIC ANIMATIONS ACCORDING TO USER GAMES */}
                            <div className="p-8 bg-slate-100/50 dark:bg-zinc-950/40 border-b border-slate-200 dark:border-white/10 flex flex-col items-center justify-center min-h-[160px] text-center">
                                {labGameEngine.extraData?.type === 'race' && (
                                    <div className="w-full max-w-md space-y-4">
                                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">Pista de Corrida Álgebra</div>
                                        <div className="relative w-full h-8 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-glass-border flex items-center px-4">
                                            <div className="absolute top-0 bottom-0 left-0 bg-blue-500/20 transition-all duration-500" style={{ width: `${(labStep - 1) * 25}%` }} />
                                            <div 
                                                className="text-xl relative z-10 transition-all duration-500"
                                                style={{ transform: `translateX(${(labStep - 1) * 70}px)` }}
                                            >
                                                🏃‍♂️💨
                                            </div>
                                            <div className="absolute right-4 text-xs font-mono text-stone-400">Chegada 🏁</div>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'tower' && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">Elevador da Função</div>
                                        <div className="flex flex-col-reverse gap-1.5 w-48">
                                            {[1, 2, 3, 4, 5].map((fl) => (
                                                <div 
                                                    key={fl} 
                                                    className={`px-4 py-2 rounded-xl text-xs font-black text-center transition-all ${
                                                        fl === labStep
                                                            ? 'bg-blue-500 text-white shadow-md scale-105 border-2 border-blue-400'
                                                            : fl < labStep
                                                                ? 'bg-emerald-500/20 text-emerald-500'
                                                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-400'
                                                    }`}
                                                >
                                                    Andar {fl} {fl === labStep && '🚀'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'sniper' && (
                                    <div className="relative w-24 h-24 rounded-full border-4 border-dashed border-red-500 flex items-center justify-center animate-spin">
                                        <div className="w-16 h-16 rounded-full border-2 border-red-400 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-red-600 rounded-full" />
                                        </div>
                                        <span className="absolute text-[8px] font-black text-red-500 -top-4 tracking-widest">MIRA ATIVA</span>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'escape_door' && (
                                    <div className="flex gap-4">
                                        {[1, 2, 3, 4, 5].map((room) => (
                                            <div 
                                                key={room}
                                                className={`w-12 h-16 rounded-t-2xl border-2 flex flex-col items-center justify-center text-xl transition-all ${
                                                    room === labStep
                                                        ? 'bg-amber-500/20 border-amber-500 animate-pulse scale-110'
                                                        : room < labStep
                                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                                                            : 'bg-slate-200 dark:bg-zinc-800 border-stone-300 text-stone-400'
                                                }`}
                                            >
                                                🚪
                                                <span className="text-[9px] font-black">{room < labStep ? '🔓' : '🔒'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'chemistry_explode' && (
                                    <div className="w-56 space-y-3">
                                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-mono">Bureta Quântica</div>
                                        <div className="w-12 h-36 border-4 border-slate-300 dark:border-stone-700 bg-slate-200 dark:bg-zinc-900 rounded-b-3xl relative overflow-hidden mx-auto shadow-inner">
                                            <div 
                                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 to-amber-500 transition-all duration-700" 
                                                style={{ height: `${labStep * 20}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-stone-800 dark:text-white mix-blend-difference">
                                                {labStep * 20}% Vol
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'ph_detective' && (
                                    <div className="space-y-4">
                                        <div className="w-16 h-20 border-4 border-white dark:border-stone-800 rounded-b-2xl rounded-t-sm relative bg-slate-100 overflow-hidden mx-auto shadow-md">
                                            <div 
                                                className={`absolute bottom-0 left-0 right-0 h-14 transition-colors duration-500 ${
                                                    labStep === 1 ? 'bg-red-500' :
                                                    labStep === 2 ? 'bg-pink-600' :
                                                    labStep === 3 ? 'bg-orange-500' :
                                                    labStep === 4 ? 'bg-yellow-400' :
                                                    'bg-blue-600'
                                                }`}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-stone-900 font-bold font-mono">
                                                pH {labStep === 1 ? '2.0' : labStep === 2 ? '12.0' : labStep === 3 ? '4.5' : labStep === 4 ? '8.5' : '7.0'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] capitalize leading-none">
                                            Indicador Químico Ativo: <span className="font-bold text-pink-500 font-mono">Fenolftaleína</span>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'molecule_builder' && (
                                    <div className="flex items-center gap-2 font-mono">
                                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white border-2 border-white flex items-center justify-center font-bold">C</div>
                                        <div className="w-6 h-1 bg-stone-400" />
                                        <div className="w-8 h-8 rounded-full bg-blue-400 text-stone-900 border-2 border-white flex items-center justify-center font-bold text-xs">H</div>
                                        <div className="w-6 h-1 bg-stone-400" />
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-stone-900 border-2 border-white flex items-center justify-center font-bold text-xs">O</div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'dna_helix' && (
                                    <div className="space-y-2">
                                        <div className="flex gap-4 font-mono font-black text-xs text-center">
                                            <div className="p-2 border-2 border-red-500 bg-red-100 text-red-600 rounded-lg">Adenina (A)</div>
                                            <div className="p-2 flex items-center text-stone-400 animate-pulse">═══</div>
                                            <div className="p-2 border-2 border-blue-500 bg-blue-100 text-blue-600 rounded-lg">Timina (T)</div>
                                        </div>
                                        <div className="flex gap-4 font-mono font-black text-xs text-center mt-2">
                                            <div className="p-2 border-2 border-emerald-500 bg-emerald-100 text-emerald-600 rounded-lg">Guanina (G)</div>
                                            <div className="p-2 flex items-center text-stone-400 animate-pulse">═══</div>
                                            <div className="p-2 border-2 border-yellow-500 bg-yellow-100 text-yellow-600 rounded-lg">Citosina (C)</div>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'ecosystem_food_chain' && (
                                    <div className="flex flex-col gap-1 w-64 font-bold text-xs uppercase text-slate-800 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-glass-border">
                                        <div className="bg-red-400 text-white py-1.5 rounded-sm px-6 text-center shadow-xs">Consumidores Supremos (Topo)</div>
                                        <div className="bg-orange-400 text-white py-1.5 rounded-sm px-10 text-center shadow-xs">Carnívoros (Secundários)</div>
                                        <div className="bg-yellow-400 text-white py-1.5 rounded-sm px-16 text-center shadow-xs">Herbívoros (Primários)</div>
                                        <div className="bg-emerald-500 text-white py-1.5 rounded-sm px-20 text-center shadow-xs text-stone-900">Produtores (Gabarito Vegetal)</div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'arcade_shot' && (
                                    <div className="grid grid-cols-3 gap-3 w-64">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className={`h-12 border-2 rounded-xl flex items-center justify-center text-xl shadow-inner ${i === labStep ? 'bg-blue-500/20 border-blue-500 animate-pulse' : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-white/5'}`}>
                                                {i < labStep ? '💥' : '👾'}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'sudoku_cells' && (
                                    <div className="grid grid-cols-3 gap-1 p-2 bg-slate-800 rounded-lg">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                            <div key={i} className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold border ${i % 2 === 0 ? 'bg-white text-slate-800' : 'bg-blue-600 text-white border-blue-400'}`}>
                                                {i === 5 ? 'x' : Math.floor(Math.random() * 9) + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'finance_decision' && (
                                    <div className="flex gap-4">
                                        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl flex flex-col items-center">
                                            <span className="text-2xl mb-1">💰</span>
                                            <span className="text-[10px] font-black uppercase text-emerald-600">Investir</span>
                                        </div>
                                        <div className="p-4 bg-rose-500/10 border-2 border-rose-500 rounded-2xl flex flex-col items-center">
                                            <span className="text-2xl mb-1">💳</span>
                                            <span className="text-[10px] font-black uppercase text-rose-600">Gastar</span>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'chemistry_rush' && (
                                    <div className="w-48 h-32 bg-slate-900 border-4 border-slate-700 rounded-2xl relative overflow-hidden flex items-center justify-center text-4xl shadow-2xl">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent)]" />
                                        <span className="text-blue-400 font-mono font-black drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                                            {labStep === 1 ? 'Au' : labStep === 2 ? 'Fe' : labStep === 3 ? 'O' : 'H'}
                                        </span>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'chemistry_balance' && (
                                    <div className="flex items-center gap-4 text-xl font-black font-mono text-slate-800 dark:text-white">
                                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">?</span>
                                        <span>H₂ + O₂ → H₂O</span>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'history_theatre' && (
                                    <div className="w-full max-w-lg bg-zinc-950 rounded-[2rem] p-6 border-b-8 border-amber-900 shadow-2xl relative overflow-hidden text-center select-none">
                                        <div className="absolute top-0 inset-x-0 h-4 bg-linear-to-r from-red-700 via-red-600 to-red-700 border-b border-yellow-500 flex justify-between px-6 z-20">
                                            <div className="w-2 h-4 bg-yellow-400 rounded-b-sm" />
                                            <div className="w-2 h-4 bg-yellow-400 rounded-b-sm" />
                                            <div className="w-2 h-4 bg-yellow-400 rounded-b-sm" />
                                        </div>

                                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.3),transparent_70%)]" />

                                        <div className="relative z-10 pt-4 flex flex-col md:flex-row items-center md:items-end justify-between min-h-[140px] px-2 gap-4">
                                            <div className="flex flex-col items-center space-y-1.5 animate-bounce" style={{ animationDuration: '3s' }}>
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-500 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-lg">
                                                        {labStep === 1 ? '👑' : labStep === 2 ? '⚔️' : labStep === 3 ? '📜' : labStep === 4 ? '🎖️' : '🎀'}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[9px] font-black font-mono text-zinc-950 px-1 py-0.5 rounded-xs border border-zinc-950">
                                                        {labStep === 1 ? 'REI' : labStep === 2 ? 'LÍDER' : labStep === 3 ? 'ASSEMBLEIA' : labStep === 4 ? 'NAPOLEÃO' : 'RAINHA'}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] uppercase font-black tracking-wider text-yellow-500 font-mono">Personagem</div>
                                            </div>

                                            <div className="grow max-w-xs bg-zinc-900 border-2 border-red-500/40 rounded-2xl p-4 text-left relative text-xs text-stone-200">
                                                <div className="font-bold text-red-400 mb-1">Ato III, Cena {labStep}:</div>
                                                <div className="font-mono italic text-[11px] leading-relaxed">
                                                    {labStep === 1 ? '"A nobreza e o clero exigem que o Terceiro Estado se curve imediatamente ao absolutismo mercantil!"' : 
                                                     labStep === 2 ? '"A guilhotina aguarda os conspiradores que traírem a glória da pátria Jacobina!"' : 
                                                     labStep === 3 ? '"Eis o documento solene que consagrará todos os cidadãos como iguais perante a lei!"' : 
                                                     labStep === 4 ? '"Com este golpe militar, deitarei por terra os conspiradores e assumirei o Consulado!"' : 
                                                     '"Se o povo faminto não dispõe de pão para o sustento diário, que delicie brioches finos!"'}
                                                </div>
                                                <div className="absolute -bottom-2 md:bottom-auto md:-left-2 md:top-1/2 md:-translate-y-1/2 w-3 h-3 bg-zinc-900 border-l-2 border-b-2 border-red-500/40 transform rotate-45" />
                                            </div>

                                            <div className="flex flex-col items-center space-y-1.5 animate-pulse">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-2 border-blue-400 flex items-center justify-center shadow-lg shrink-0">
                                                    <Brain size={28} />
                                                </div>
                                                <div className="text-[10px] uppercase font-black tracking-wider text-blue-400 font-mono">Dramaturgo</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-around border-t border-zinc-800 pt-2 pb-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === labStep ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-red-950'}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'math_house' && (
                                    <div className="w-full max-w-md bg-zinc-950 border-2 border-[var(--accent-1)]/30 rounded-3xl p-6 relative overflow-hidden select-none">
                                        <div className="text-[9px] uppercase font-black text-center text-amber-500 font-mono tracking-widest mb-4">Casinha de Propriedades da Matemática</div>
                                        
                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center justify-center ${labStep === 1 ? 'border-amber-400 bg-amber-500/10 scale-102 shadow-lg' : 'border-zinc-800 bg-zinc-900/30 opacity-40'}`}>
                                                <span className="text-3xl mb-1">🍕</span>
                                                <h5 className="text-[11px] font-bold text-amber-500 tracking-tight leading-none">Cozinha das Frações</h5>
                                                <span className="text-[9px] font-mono mt-1 text-stone-400">Pizza total: 3/4 &times; 1/2</span>
                                            </div>

                                            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center justify-center ${labStep === 2 ? 'border-blue-400 bg-blue-500/10 scale-102 shadow-lg' : 'border-zinc-800 bg-zinc-900/30 opacity-40'}`}>
                                                <span className="text-3xl mb-1">🛏️</span>
                                                <h5 className="text-[11px] font-bold text-blue-400 tracking-tight leading-none">Quarto da Álgebra</h5>
                                                <span className="text-[9px] font-mono mt-1 text-stone-400">Área: (x+2) &times; 3 = 12</span>
                                            </div>

                                            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center justify-center ${labStep === 3 ? 'border-purple-400 bg-purple-500/10 scale-102 shadow-lg' : 'border-zinc-800 bg-zinc-900/30 opacity-40'}`}>
                                                <span className="text-3xl mb-1">🪜</span>
                                                <h5 className="text-[11px] font-bold text-purple-400 tracking-tight leading-none">Sótão das Progressões</h5>
                                                <span className="text-[9px] font-mono mt-1 text-stone-400">Sequência: 2, 5, 8, 11 (+3)</span>
                                            </div>

                                            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center justify-center ${labStep === 4 ? 'border-emerald-400 bg-emerald-500/10 scale-102 shadow-lg' : 'border-zinc-800 bg-zinc-900/30 opacity-40'}`}>
                                                <span className="text-3xl mb-1">🛋️</span>
                                                <h5 className="text-[11px] font-bold text-emerald-400 tracking-tight leading-none">Sala da Geometria</h5>
                                                <span className="text-[9px] font-mono mt-1 text-stone-400">Mesa: r = 2m (A = &pi;r&sup2;)</span>
                                            </div>
                                        </div>

                                        <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-center gap-4 ${labStep === 5 ? 'border-red-400 bg-red-500/10 scale-102 shadow-lg' : 'border-zinc-800 bg-zinc-900/20 opacity-40'}`}>
                                            <span className="text-3xl">🏡</span>
                                            <div className="text-left text-xs">
                                                <h5 className="font-bold text-red-400 leading-tight">Jardim de Probabilidade</h5>
                                                <span className="text-[9px] font-mono text-stone-400">Chance de chover amanhã: 25%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'biology_human_body' && (
                                    <div className="w-full max-w-sm bg-zinc-950 rounded-3xl p-6 border-2 border-cyan-500/20 flex flex-col items-center relative overflow-hidden select-none">
                                        <div className="text-[9px] uppercase font-black text-cyan-400 font-mono tracking-widest mb-4">Mapeador de Órgãos & Sistemas</div>
                                        <div className="flex flex-col sm:flex-row gap-6 w-full items-center">
                                            <div className="relative w-28 h-44 bg-zinc-900 rounded-2xl border-2 border-cyan-800/25 flex items-center justify-center overflow-hidden shrink-0">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 animate-pulse">
                                                    <div className="w-7 h-7 rounded-full bg-cyan-400" />
                                                    <div className="w-10 h-24 rounded-b-xl bg-cyan-400 mt-1" />
                                                </div>

                                                <div className="relative z-10 flex flex-col items-center justify-center">
                                                    {labStep === 1 && (
                                                        <div className="flex flex-col items-center animate-bounce">
                                                            <div className="text-3xl">🤢</div>
                                                            <div className="text-[9px] font-black text-orange-400 font-mono mt-2">ESTÔMAGO</div>
                                                        </div>
                                                    )}
                                                    {labStep === 2 && (
                                                        <div className="flex flex-col items-center animate-bounce">
                                                            <div className="text-3xl">🫁</div>
                                                            <div className="text-[9px] font-black text-rose-400 font-mono mt-2">FÍGADO</div>
                                                        </div>
                                                    )}
                                                    {labStep === 3 && (
                                                        <div className="flex flex-col items-center animate-bounce">
                                                            <div className="text-3xl">➰</div>
                                                            <div className="text-[9px] font-black text-emerald-400 font-mono mt-2">INTESTINO</div>
                                                        </div>
                                                    )}
                                                    {labStep === 4 && (
                                                        <div className="flex flex-col items-center animate-bounce">
                                                            <div className="text-3xl">🧬</div>
                                                            <div className="text-[9px] font-black text-purple-400 font-mono mt-2">RINS</div>
                                                        </div>
                                                    )}
                                                    {labStep === 5 && (
                                                        <div className="flex flex-col items-center animate-bounce">
                                                            <div className="text-3xl">🥞</div>
                                                            <div className="text-[9px] font-black text-yellow-400 font-mono mt-2">PÂNCREAS</div>
                                                        </div>
                                                    )}
                                                    <span className="absolute w-12 h-12 bg-cyan-500/10 rounded-full animate-ping pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="grow space-y-3 text-left text-xs bg-zinc-900 border border-white/5 p-4 rounded-xl">
                                                <div>
                                                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-mono">Tipo de Sistema</span>
                                                    <p className="text-cyan-400 font-bold font-mono">
                                                        {[1, 2, 3].includes(labStep) ? 'SISTEMA DIGESTÓRIO' : labStep === 4 ? 'SISTEMA EXCRETOR / URINÁRIO' : 'SISTEMA ENDÓCRINO'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-mono">Bio-Função Chave</span>
                                                    <p className="text-slate-300 leading-snug">
                                                        {labStep === 1 && 'Digestão bioquímica ativa de proteínas via suco gástrico ácido.'}
                                                        {labStep === 2 && 'Mecanismo de secreção de bílis para a digestão de gorduras lipídicas.'}
                                                        {labStep === 3 && 'Absorção massiva de água da digestão e formação ativa do bolo fecal.'}
                                                        {labStep === 4 && 'Filtração e depuração ativa do plasma para extração de urina nos néfrons.'}
                                                        {labStep === 5 && 'Secreção equilibrada de hormônios reguladores de glicose no sangue.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'languages_karaoke' && (
                                    <div className="w-full max-w-sm bg-zinc-950 rounded-3xl p-6 border-2 border-rose-500/25 relative overflow-hidden flex flex-col items-center text-center">
                                        <div className="text-[9px] uppercase font-black text-rose-400 font-mono tracking-widest mb-4">Música, Ritmos & Tradução</div>
                                        
                                        <div className="flex gap-6 items-center justify-center w-full mb-4">
                                            <div className="relative w-16 h-16 bg-zinc-900 rounded-full border border-stone-800 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
                                                <div className="absolute inset-2 border-2 border-dashed border-zinc-950 rounded-full opacity-60" />
                                                <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-xs shadow-md border-2 border-zinc-950">
                                                    💿
                                                </div>
                                            </div>

                                            <div className="flex items-end gap-1 h-9">
                                                {[...Array(6)].map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="w-1.5 bg-rose-400 rounded-full animate-bounce" 
                                                        style={{ 
                                                            height: `${30 + (i % 3) * 35}%`, 
                                                            animationDelay: `${i * 0.1}s`,
                                                            animationDuration: '0.6s'
                                                        }} 
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="w-full bg-zinc-900 p-4 rounded-xl border border-white/5">
                                            <div className="text-[9px] uppercase font-bold text-rose-500 tracking-widest font-mono mb-1">Karaokê Letra Ativa</div>
                                            <div className="text-sm text-stone-200 font-bold italic font-mono leading-relaxed">
                                                {labStep === 1 && '"Birds of a feather, we should stick [ _____ ]"'}
                                                {labStep === 2 && '"Baby, you light up my world like nobody [ _____ ]"'}
                                                {labStep === 3 && '"...and I cried like a baby coming home from the [ _____ ]"'}
                                                {labStep === 4 && '"Say you can\'t sleep, baby, I know. That\'s that me, [ _____ ]"'}
                                                {labStep === 5 && '"And you\'re probably with that blonde girl, who always made me [ _____ ]"'}
                                            </div>
                                            <div className="text-[9px] text-stone-500 mt-2">Dica: Selecione a resposta ideal abaixo para preencher o vazio rítmico!</div>
                                        </div>

                                        <div className="mt-4 text-[7px] text-zinc-500 font-mono uppercase tracking-widest">
                                            Créditos: Taylor Swift, Billie Eilish, One Direction, Sabrina Carpenter, Bruno Mars
                                        </div>
                                    </div>
                                )}

                                {labGameEngine.extraData?.type === 'geography_globe' && (
                                    <div className="w-full max-w-sm bg-zinc-950 rounded-3xl p-6 border-2 border-emerald-500/25 flex flex-col items-center relative overflow-hidden select-none">
                                        <div className="text-[9px] uppercase font-black text-emerald-400 font-mono tracking-widest mb-4">Globo Terrestre Holográfico</div>
                                        
                                        <div className="relative w-32 h-32 rounded-full bg-blue-950 border-2 border-emerald-500/30 flex items-center justify-center shadow-[inset_0_0_15px_rgba(16,185,129,0.25)] overflow-hidden">
                                            <div className="absolute inset-0 border border-white/5 rounded-full" />
                                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-500/10" />
                                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-emerald-500/20" />
                                            <div className="absolute inset-4 border border-emerald-500/5 rounded-full" />
                                            <div className="absolute w-12 h-14 bg-emerald-800/15 rounded-full top-6 left-2 rotate-12 blur-xs animate-pulse" />
                                            <div className="absolute w-14 h-16 bg-emerald-850/15 rounded-full bottom-2 right-4 -rotate-45 blur-xs animate-pulse" />

                                            {labStep === 1 && (
                                                <div className="absolute left-8 top-12 flex flex-col items-center animate-bounce">
                                                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                                    <span className="w-3 h-3 bg-red-600 rounded-full" />
                                                    <span className="text-[8px] font-black text-white bg-zinc-950 px-1 rounded-sm mt-1 whitespace-nowrap">AMAZÔNIA 🌲</span>
                                                </div>
                                            )}
                                             {labStep === 2 && (
                                                 <div className="absolute left-16 top-8 flex flex-col items-center animate-bounce">
                                                     <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                                     <span className="w-3 h-3 bg-red-600 rounded-full" />
                                                     <span className="text-[8px] font-black text-white bg-zinc-950 px-1 rounded-sm mt-1 whitespace-nowrap">GMT -3h 🌐</span>
                                                 </div>
                                             )}
                                             {labStep === 3 && (
                                                 <div className="absolute right-6 top-14 flex flex-col items-center animate-bounce">
                                                     <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                                     <span className="w-3 h-3 bg-red-600 rounded-full" />
                                                     <span className="text-[8px] font-black text-white bg-zinc-950 px-1 rounded-sm mt-1 whitespace-nowrap">COSTA ATLÂNTICA 🌊</span>
                                                 </div>
                                             )}
                                             {labStep === 4 && (
                                                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                     <div className="w-16 h-16 border-2 border-dashed border-emerald-400/40 rounded-full animate-spin" />
                                                     <span className="text-[8px] font-black text-white bg-zinc-950 px-1 rounded-sm absolute">PROJEÇÃO</span>
                                                 </div>
                                             )}
                                             {labStep === 5 && (
                                                 <div className="absolute left-4 top-16 flex flex-col items-center animate-bounce">
                                                     <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                                     <span className="w-3 h-3 bg-red-600 rounded-full" />
                                                     <span className="text-[8px] font-black text-white bg-zinc-950 px-1 rounded-sm mt-1 whitespace-nowrap">DIVISA CHILE/EQUADOR 🏔️</span>
                                                 </div>
                                             )}
                                         </div>

                                         <p className="text-[10px] text-emerald-400 font-mono mt-3 text-center">
                                             {labStep === 1 && 'Foco: Maior bacia hidrográfica do mundo.'}
                                             {labStep === 2 && 'Foco: Greenwich e as linhas de fuso horário.'}
                                             {labStep === 3 && 'Foco: Litoral atlântico brasileiro.'}
                                             {labStep === 4 && 'Foco: Projeção de Peters e anamorfose.'}
                                             {labStep === 5 && 'Foco: Chile e a Cordilheira dos Andes.'}
                                         </p>
                                     </div>
                                 )}
 
                                {labGameEngine.extraData?.type === 'philosophy_debate' && (
                                    <div className="w-full max-w-xl bg-zinc-950 rounded-3xl p-6 border-2 border-stone-800 flex flex-col gap-6">
                                        <div className="flex items-center justify-between border-b border-stone-900 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase text-amber-500 font-mono tracking-widest">
                                                    {labGameEngine.extraData?.variant === 'sociology' ? 'Fórum Sociológico' : 'Banquete Filosófico'}
                                                </span>
                                            </div>
                                            <span className="text-[9px] uppercase font-bold text-stone-600 font-mono tracking-wider">Diálogo Dialético</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-base border-2 border-amber-500/20 shrink-0">
                                                    👥
                                                </div>
                                                <div className="space-y-1.5 flex-1 text-left">
                                                    <div className="text-[10px] font-bold uppercase text-amber-500 font-mono tracking-wider leading-none">
                                                        {labGameEngine.extraData?.variant === 'sociology' ? (
                                                            labStep === 1 ? 'Karl Marx' : labStep === 2 ? 'Émile Durkheim' : labStep === 3 ? 'Max Weber' : labStep === 4 ? 'Durkheim' : 'Karl Marx'
                                                        ) : (
                                                            labStep === 1 ? 'Sócrates' : labStep === 2 ? 'René Descartes' : labStep === 3 ? 'F. Nietzsche' : labStep === 4 ? 'Immanuel Kant' : 'Platão'
                                                        )}
                                                    </div>
                                                    <div className="bg-zinc-900 text-stone-200 text-xs rounded-2xl rounded-tl-none p-3 leading-relaxed border border-stone-800 shadow-sm font-mono">
                                                        {labGameEngine.extraData?.variant === 'sociology' ? (
                                                            labStep === 1 ? '"As sociedades não evoluem por mera harmonia ou ideias abstratas. Qual é o motor material por trás das grandes transformações na estrutura humana?"' :
                                                            labStep === 2 ? '"Os indivíduos acreditam agir com plena autonomia, mas existem forças externas invisíveis que moldam suas condutas de maneira geral e impositiva."' :
                                                            labStep === 3 ? '"A sociologia deve interpretar a conduta humana a partir do significado que os sujeitos atribuem ao que fazem. Mas que elemento valida uma ação como social?"' :
                                                            labStep === 4 ? '"Quando as crises econômicas e rápidas transformações superam a capacidade social de regular a moral dos indivíduos, ocorre uma desorganização perigosa."' :
                                                            '"O capitalista não paga ao operário toda a riqueza que ele produz durante a jornada de trabalho. A que conceito essa extração se refere?"'
                                                        ) : (
                                                            labStep === 1 ? '"Amigo estudante, as pessoas andam cheias de certezas dogmáticas. No entanto, para alcançar a sabedoria autêntica, qual deve ser o nosso ponto de partida crítico?"' :
                                                            labStep === 2 ? '"Para encontrarmos um fundamento inabalável para o conhecimento científico, qual postura radical devemos adotar frente às nossas opiniões antigas?"' :
                                                            labStep === 3 ? '"Os valores tradicionais foram construídos para enfraquecer o forte em favor do fraco, glorificando a passividade. Que tipo de estrutura nós devemos superar de uma vez por todas?"' :
                                                            labStep === 4 ? '"A moralidade não pode depender de sentimentos ou conveniências passageiras. Qual é o critério racional absoluto que torna uma ação genuinamente correta?"' :
                                                            '"Aqueles que vivem no fundo da caverna confundem as projeções instáveis nas paredes com a realidade das coisas em si. Como devemos interpretar o que eles de fato veem?"'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start justify-end gap-3 text-right">
                                                <div className="space-y-1 max-w-xs text-right">
                                                    <div className="text-[10px] font-black uppercase text-blue-400 font-mono tracking-wider leading-none">Você (Estudante)</div>
                                                    <div className="bg-blue-600/10 text-slate-300 text-xs rounded-2xl rounded-tr-none p-3 leading-relaxed border border-blue-500/25 shadow-sm inline-block text-left">
                                                        <i>Selecione o melhor argumento na lista de opções abaixo para rebater ou concordar com o pensador de forma racional...</i>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                    🎓
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fallback elegant visual vector */}
                                {!['race', 'tower', 'sniper', 'escape_door', 'chemistry_explode', 'ph_detective', 'molecule_builder', 'dna_helix', 'ecosystem_food_chain', 'arcade_shot', 'sudoku_cells', 'finance_decision', 'chemistry_rush', 'chemistry_balance', 'history_theatre', 'math_house', 'biology_human_body', 'languages_karaoke', 'geography_globe', 'philosophy_debate'].includes(labGameEngine.extraData?.type) && (
                                    <div className="p-6 border-2 border-dashed border-[var(--accent-1)]/10 rounded-3xl bg-[var(--accent-1)]/5 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[var(--accent-1)]/20 text-[var(--accent-1)] flex items-center justify-center text-xl font-bold">
                                            🎓
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-[var(--text-primary)]">Laboratório Corvo Mentor</div>
                                            <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">{selectedGame.subject} Mode</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QUESTION CARDBOX */}
                            <div className="p-8 space-y-6 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Enunciado da Questão interativa</span>
                                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-snug tracking-tight">
                                    {labGameEngine.question}
                                </h3>

                                {/* MULTIPLE OPTIONS FEEDBACK */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    {labGameEngine.options.map((option: string) => {
                                        const isSelected = labSelectedAnswer === option;
                                        const isThisCorrect = option === labGameEngine.correctAnswer;
                                        const showWrongBg = isSelected && !isThisCorrect;
                                        
                                        let borderClass = "border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400 hover:ring-4 hover:ring-amber-500/15";
                                        let bgClass = "bg-white hover:bg-amber-500/5 dark:bg-zinc-900/90 shadow-sm hover:shadow-md";
                                        let textClass = "text-slate-800 dark:text-stone-100 font-bold";
                                        let prefix = "";

                                        if (isAnswered) {
                                            if (isThisCorrect) {
                                                borderClass = "border-emerald-500 dark:border-emerald-550 ring-4 ring-emerald-500/20 dark:ring-emerald-500/30 scale-102";
                                                bgClass = "bg-emerald-50 dark:bg-emerald-950/80";
                                                textClass = "text-emerald-800 dark:text-emerald-400 font-extrabold";
                                                prefix = "✨ [GABARITO] ";
                                            } else if (showWrongBg) {
                                                borderClass = "border-rose-500 dark:border-rose-550 ring-4 ring-rose-500/20 dark:ring-rose-500/30";
                                                bgClass = "bg-rose-50 dark:bg-rose-950/80";
                                                textClass = "text-rose-800 dark:text-rose-350 font-extrabold";
                                                prefix = "❌ [SUA ESCOLHA] ";
                                            } else {
                                                borderClass = "border-slate-100 dark:border-white/5 opacity-40";
                                                bgClass = "bg-slate-50 dark:bg-zinc-950/55";
                                                textClass = "text-slate-400 dark:text-zinc-500 font-normal";
                                            }
                                        }

                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => handleLabSubmitAnswer(option)}
                                                className={`p-6 rounded-3xl border-2 ${borderClass} ${bgClass} ${textClass} text-left transition-all duration-300 text-sm font-semibold leading-relaxed active:scale-[0.98] cursor-pointer flex items-start gap-2.5`}
                                            >
                                                {prefix && <span className="font-mono text-xs uppercase select-none shrink-0">{prefix}</span>}
                                                <span>{option}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT FEEDBACK STRIP */}
                        {isAnswered && (
                            <div 
                                className={`p-6 rounded-[2rem] border-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-left transition-all ${
                                    labSelectedAnswer === labGameEngine.correctAnswer
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-red-500/10 border-red-500/25 text-red-800 dark:text-red-300'
                                }`}
                            >
                                <div className="space-y-1">
                                    <h4 className="font-extrabold text-base">
                                        {labSelectedAnswer === labGameEngine.correctAnswer ? '✨ Excelente Trabalho!' : '❌ Ops! Estude a Explicação'}
                                    </h4>
                                    <p className="text-xs leading-relaxed max-w-xl opacity-90">
                                        {labFeedbackMessage}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLabNextStep}
                                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shrink-0 active:scale-95"
                                >
                                    {labStep >= 5 ? '🏁 FINALIZAR' : '⏩ PRÓXIMO PASSO'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        );
    };

    useEffect(() => {
        let returnTimer: NodeJS.Timeout;
        if (gameState === 'results') {
            returnTimer = setTimeout(() => {
                setGameState('lobby');
            }, 5000);
        }
        return () => {
            if (returnTimer) clearTimeout(returnTimer);
        };
    }, [gameState]);

    const renderResults = () => {
        const totalQuestions = currentQuestions.length || 10;
        const precision = Math.round((correctAnswersCount / totalQuestions) * 100);
        const xpGained = (selectedGame?.xp || 0) + Math.floor(score / 100);

        const stats = [
            { label: 'Pontuação Real', value: `${score || 0}`, icon: <Trophy size={20} />, color: 'text-amber-500' },
            { label: 'Precisão', value: `${precision}%`, icon: <Activity size={20} />, color: 'text-blue-500' },
            { label: 'XP Ganhos', value: `+${xpGained}`, icon: <Zap size={20} />, color: 'text-emerald-500' },
        ];

        return (
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-8"
            >
                <div className="relative mb-20">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="w-56 h-56 bg-gradient-to-br from-accent-1 to-accent-1/80 rounded-[3.5rem] flex flex-col items-center justify-center text-white shadow-2xl shadow-accent-1/40 relative z-10"
                    >
                        <Trophy size={70} fill="currentColor" strokeWidth={0} className="mb-3 opacity-30 animate-bounce" />
                        <span className="text-5xl font-black tracking-tighter">{score}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">PONTOS</span>
                    </motion.div>
                    <div className="absolute inset-[-60px] border-4 border-dashed border-blue-500/20 rounded-full -z-10 animate-[spin_30s_linear_infinite]" />
                    <div className="absolute inset-[-30px] border-2 border-dashed border-blue-500/10 rounded-full -z-10 animate-[spin_15s_linear_infinite_reverse]" />
                </div>

                <div className="text-center space-y-6 mb-20">
                    <h2 className="text-7xl font-black text-slate-800 dark:text-white font-anton uppercase tracking-tighter leading-none">Missão <br/> <span className="text-accent-1">Cumprida!</span></h2>
                    <p className="text-slate-500 dark:text-white/40 text-xl max-w-lg mx-auto font-black uppercase tracking-tight opacity-80">Excelente desempenho estratégico. Seus dados foram sincronizados com o núcleo central da Arena.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-20">
                    {stats.map((stat, i) => (
                        <motion.div 
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/10 p-12 rounded-[3rem] flex flex-col items-center gap-5 text-center group hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all shadow-xl hover:scale-105"
                        >
                            <div className={`${stat.color} p-4 bg-slate-50 dark:bg-white/5 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <div className="space-y-1">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/10 p-16 rounded-[4rem] w-full max-w-5xl mb-20 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 left-0 w-3 h-full bg-accent-1" />
                    <div className="flex items-center gap-10 mb-12">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-accent-1/10 flex items-center justify-center text-accent-1 shadow-inner">
                            <Star size={40} fill="currentColor" strokeWidth={0} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-2">Nível de Sincronia</h3>
                            <p className="text-accent-1 text-[10px] font-black uppercase tracking-[0.3em]">+150 XP de Bônus de Elite</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="w-full h-6 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1.5 border-2 border-slate-200 dark:border-white/10 shadow-inner">
                            <motion.div 
                                initial={{ width: '70%' }}
                                animate={{ width: '85%' }}
                                className="h-full bg-gradient-to-r from-accent-1 to-accent-1/60 rounded-full relative shadow-[0_0_25px_rgba(var(--accent-rgb),0.5)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                        </div>
                        <div className="flex justify-between items-center px-4">
                             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Progresso: 85%</span>
                             <span className="text-xs font-black text-accent-1 uppercase tracking-[0.4em]">Próximo Nível: 2.4k XP</span>
                        </div>
                    </div>
                </div>

                {/* ATIVIDADES RECOMENDADAS DO MESMO TEMA */}
                {(() => {
                    if (!selectedGame) return null;
                    
                    const currentSubj = (selectedGame.subject || '').toLowerCase();
                    const currentTopic = (selectedGame.topic || '').toLowerCase();
                    
                    // Filter recommendations of the same theme/subject
                    let candidates = CONTENT_ITEMS.filter(item => {
                        if (item.id === selectedGame.id) return false;
                        
                        const itemSub = item.subject.toLowerCase();
                        const itemTop = item.topic.toLowerCase();
                        
                        // Check if subject or topic match
                        if (itemSub === currentSubj || itemTop === currentTopic) return true;
                        
                        // Cross matches (e.g. Natureza / Química / Biologia)
                        if ((currentSubj.includes('natureza') || currentTopic.includes('química') || currentTopic.includes('biologia')) &&
                            (itemSub.includes('natureza') || itemTop.includes('química') || itemTop.includes('biologia'))) {
                            return true;
                        }
                        if ((currentSubj.includes('humanos') || currentTopic.includes('história') || currentTopic.includes('geografia') || currentTopic.includes('filosofia')) &&
                            (itemSub.includes('humanos') || itemTop.includes('história') || itemTop.includes('geografia') || itemTop.includes('filosofia'))) {
                            return true;
                        }
                        if ((currentSubj.includes('linguagens') || currentTopic.includes('português') || currentTopic.includes('literatura') || currentTopic.includes('idiomas')) &&
                            (itemSub.includes('linguagens') || itemTop.includes('português') || itemTop.includes('literatura') || itemTop.includes('idiomas'))) {
                            return true;
                        }
                        if (currentSubj.includes('matemática') && itemSub.includes('matemática')) {
                            return true;
                        }
                        
                        return false;
                    });
                    
                    // Sort/shuffle recommended candidates
                    candidates = candidates.sort(() => Math.random() - 0.5);
                    
                    // Fallback to bring variety if not enough candidates found
                    if (candidates.length < 3) {
                        const fallbacks = CONTENT_ITEMS.filter(item => item.id !== selectedGame.id && !candidates.some(c => c.id === item.id));
                        candidates = [...candidates, ...fallbacks.sort(() => Math.random() - 0.5)];
                    }
                    
                    const listToRecommend = candidates.slice(0, 3);
                    
                    if (listToRecommend.length === 0) return null;
                    
                    return (
                        <div className="w-full max-w-5xl mb-20 space-y-10" id="thematic-recommendations">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-white/10 pb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-accent-1">
                                        <Compass size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">Continuidade Temática</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        Mais Atividades Temáticas em <span className="text-accent-1">{selectedGame.subject}</span>
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-white/40 font-semibold max-w-2xl leading-relaxed">
                                        Concluiu o desafio com sucesso! Que tal reforçar seu aprendizado nas mesmas competências com estas outras atividades selecionadas?
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                                {listToRecommend.map((item, index) => {
                                    let badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";
                                    if (item.subject === 'Matemática') {
                                        badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/30";
                                    } else if (item.subject === 'Natureza') {
                                        badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
                                    } else if (item.subject === 'Linguagens') {
                                        badgeColor = "bg-purple-500/10 text-purple-500 border-purple-500/30";
                                    } else if (item.subject === 'Humanos') {
                                        badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";
                                    }

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.15 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            className="bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 p-8 rounded-[3rem] flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:border-accent-2/40 transition-all relative overflow-hidden min-h-[340px]"
                                        >
                                            {item.image && (
                                                <div className="absolute inset-0 -z-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeColor} font-mono`}>
                                                        {item.topic}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest font-mono">
                                                        {item.difficulty}
                                                    </span>
                                                </div>

                                                <h4 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-accent-1 transition-colors leading-tight">
                                                    {item.title}
                                                </h4>

                                                <p className="text-xs text-slate-500 dark:text-white/50 font-medium leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="pt-6 flex items-center justify-between border-t border-slate-150 dark:border-white/5 mt-4 relative z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 font-mono">Recompensa</span>
                                                    <span className="text-lg font-black text-emerald-500 font-mono tracking-tight flex items-center gap-1">
                                                        +{item.xp} <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">XP</span>
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleGameStart(item)}
                                                    className="px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 group-hover:bg-accent-1 group-hover:text-slate-950 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-3 transition-all font-mono"
                                                >
                                                    Jogar
                                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                <div className="flex flex-col sm:flex-row gap-8 w-full max-w-xl">
                    <motion.button 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGameState('lobby')}
                        className="flex-1 py-8 bg-accent-1 text-slate-950 text-[10px] font-black uppercase tracking-[0.5em] rounded-3xl shadow-2xl shadow-accent-1/40 transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
                    >
                        <span>Voltar ao Menu</span>
                        <span className="text-[8px] opacity-70">(Automático em 5s)</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGameStart(selectedGame!)}
                        className="flex-1 py-8 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-3xl border-2 border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
                    >
                        Jogar Novamente
                    </motion.button>
                </div>
            </motion.div>
        );
    };

    return (
        <Layout>
            <div className="w-full transition-colors duration-300 relative overflow-hidden" id="challenges-container">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 pt-2 pb-8">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Decorative background patterns */}
                        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
                            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
                        </div>
                        
                        <div className="w-full mx-auto relative z-10 space-y-10">
                            {/* HUD COCKPIT - Player Dashboard Banner */}
                            <div id="hub-cockpit-navigation" className="w-full bg-bg-secondary border border-glass-border rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-1/5 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[110px] pointer-events-none" />

                                <div className="relative z-10 flex flex-col gap-6 md:gap-8">
                                    {/* Top Row: Identity and XP progress */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                        {/* Column 1: User Identity Card */}
                                        <div className="flex items-center gap-5">
                                            <div className="relative group shrink-0">
                                                <div className="w-20 h-20 rounded-[1.5rem] border-4 border-slate-50/10 dark:border-blue-500/20 p-1 group-hover:border-blue-600 transition-all duration-500 bg-slate-50/5 dark:bg-white/[0.04] shadow-inner flex items-center justify-center overflow-hidden">
                                                    <UserAvatar 
                                                        uid={currentUser?.uid || ""}
                                                        fallbackPhoto={userProfile?.photoURL || currentUser?.photoURL || ""}
                                                        fallbackName={userProfile?.displayName || currentUser?.displayName || "Perfil"}
                                                        size="100%"
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                </div>
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[11px] font-black w-8 h-8 rounded-xl flex items-center justify-center border-2 border-bg-secondary shadow-xl"
                                                >
                                                    {userProfile?.xp !== undefined ? Math.floor(userProfile.xp / 1000) + 1 : (userProfile?.level || 1)}
                                                </motion.div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">Jogador Ativo</span>
                                                </div>
                                                <p className="text-white text-2xl font-black tracking-tight leading-none mb-1 truncate uppercase">
                                                    {userProfile?.displayName || currentUser?.displayName || 'Jogador'}
                                                </p>
                                                <p className="text-accent-1 text-xs font-black uppercase tracking-wider opacity-85 truncate">
                                                    {userProfile?.handle ? `@${userProfile.handle}` : (currentUser?.email?.split('@')[0] || 'Visitante')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Column 2: XP progress and Mini Stats */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">
                                                <span>Sincronização de XP</span>
                                                <span className="text-accent-1">{userProfile ? Math.min(100, Math.round(((userProfile.xp || 0) % 1000) / 10)) : 0}%</span>
                                            </div>
                                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${userProfile ? Math.min(100, Math.round(((userProfile.xp || 0) % 1000) / 10)) : 0}%` }}
                                                    className="h-full bg-gradient-to-r from-accent-1 to-indigo-500 rounded-full relative shadow-[0_0_10px_rgba(var(--accent-rgb),0.4)]"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="py-2 px-3 rounded-2xl bg-white/[0.04] border border-white/5 text-center shadow-lg transition-all hover:bg-white/[0.06]">
                                                    <p className="text-[9px] font-black uppercase text-[#a1a1aa] tracking-wider mb-0.5">Módulos</p>
                                                    <p className="text-sm font-black text-white">{userProfile ? (userProfile.simuladosCount || 0) : 0}</p>
                                                </div>
                                                <div className="py-2 px-3 rounded-2xl bg-white/[0.04] border border-white/5 text-center shadow-lg transition-all hover:bg-white/[0.06]">
                                                    <p className="text-[9px] font-black uppercase text-[#a1a1aa] tracking-wider mb-0.5">Sequência</p>
                                                    <p className="text-sm font-black text-rose-450 flex items-center justify-center gap-0.5">{(userProfile as any)?.streak || '0'}🔥</p>
                                                </div>
                                                <div className="py-2 px-3 rounded-2xl bg-white/[0.04] border border-white/5 text-center shadow-lg transition-all hover:bg-white/[0.06]">
                                                    <p className="text-[9px] font-black uppercase text-[#a1a1aa] tracking-wider mb-0.5">Liga/Tier</p>
                                                    <p className="text-sm font-black text-accent-1 uppercase leading-none mt-1 select-none">{userProfile ? (userProfile.xp < 1000 ? 'BRONZE' : userProfile.xp < 3000 ? 'PRATA' : userProfile.xp < 6000 ? 'OURO' : 'ELITE') : 'BRONZE'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Tab Action Buttons with uniform size and icons */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 border-t border-white/10 dark:border-white/10 pt-6">
                                        {[
                                            { id: 'castle', name: 'Castelo', desc: 'Sua Jornada Mágica', icon: <Sparkles size={18} /> },
                                            { id: 'central', name: 'Simuladores', desc: 'Treinar Matérias', icon: <Gamepad2 size={18} /> },
                                            { id: 'ranking', name: 'Ranking de Elite', desc: 'Ver Sua Posição', icon: <Trophy size={18} /> },
                                            { id: 'conquistas', name: 'Conquistas', desc: 'Suas Relíquias', icon: <Award size={18} /> },
                                        ].map(tab => {
                                            const isActive = hubTab === tab.id;
                                            return (
                                                <button 
                                                    key={tab.id}
                                                    onClick={() => setHubTab(tab.id as any)}
                                                    className={`flex items-center gap-4.5 p-4 rounded-2xl text-left transition-all duration-300 border cursor-pointer group relative overflow-hidden ${
                                                        isActive 
                                                            ? 'bg-accent-1 border-accent-1 text-slate-950 shadow-xl shadow-accent-1/25 font-black' 
                                                            : 'bg-white/[0.03] border-white/5 text-[#a1a1aa] hover:border-white/10 hover:text-white hover:bg-white/[0.06] font-bold'
                                                    }`}
                                                >
                                                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                                                        isActive 
                                                            ? 'bg-slate-950/10 text-slate-950' 
                                                            : 'bg-white/[0.05] text-[#a1a1aa] group-hover:text-white group-hover:bg-white/[0.08]'
                                                    }`}>
                                                        {tab.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-black tracking-tight leading-tight uppercase truncate">{tab.name}</h4>
                                                        <p className={`text-[10px] leading-tight font-bold tracking-normal opacity-70 mt-0.5 truncate uppercase ${isActive ? 'text-slate-950/80' : 'text-zinc-500'}`}>{tab.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <main className="w-full mt-14 md:mt-20">
                        <AnimatePresence mode="wait">
                            {gameState === 'playing' ? (
                                <motion.div 
                                    key="playing"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                >
                                    {renderPlaying()}
                                </motion.div>
                            ) : gameState === 'results' ? (
                                <motion.div 
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                >
                                    {renderResults()}
                                </motion.div>
                            ) : hubTab === 'ranking' ? (
                                <motion.div 
                                    key="ranking"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-24"
                                >
                                    {/* RANKING HEADER */}
                                    <div className="flex flex-col xl:flex-row xl:items-end justify-between px-10 gap-16">
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4 text-accent-3">
                                                <Trophy size={20} />
                                                <span className="text-sm font-black uppercase tracking-[0.5em]">Protocolo de Classificação</span>
                                            </div>
                                            <h2 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
                                                Rank de <span className="text-accent-3">Soberania</span>
                                            </h2>
                                            <p className="text-[var(--text-secondary)] font-bold text-xl max-w-xl leading-relaxed">
                                                Análise comparativa de rendimento neural. Apenas os operadores de frequência ultra-alta mantêm sua posição no topo.
                                            </p>
                                        </div>

                                            <div className="bg-bg-secondary p-10 rounded-3xl border border-glass-border shadow-xl shadow-accent-1/5 min-w-[320px]">
                                                <p className="text-slate-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest mb-4">Seu Status Atual</p>
                                                <p className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                    RANK #{rankingData.find(u => u.isMe)?.rank ? (rankingData.find(u => u.isMe).rank < 10 ? `0${rankingData.find(u => u.isMe).rank}` : rankingData.find(u => u.isMe).rank) : '--'}
                                                </p>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">PONTUAÇÃO REAL ATUALIZADA</span>
                                                    <TrendingUp size={18} className="text-emerald-500" />
                                                </div>
                                            </div>
                                    </div>

                                    {/* ELITE PODIUM */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 items-end gap-10 px-10 pt-20">
                                        {/* RANK 2 */}
                                        {rankingData[1] && (
                                            <motion.div 
                                                whileHover={{ y: -10 }}
                                                className="order-2 lg:order-1 bg-bg-secondary rounded-3xl p-10 border border-glass-border relative group shadow-2xl h-[420px] flex flex-col justify-end overflow-hidden shadow-accent-1/5"
                                            >
                                                <div className="absolute top-8 left-8 text-8xl font-bold text-slate-900/5 dark:text-white/5 tracking-tighter leading-none pointer-events-none">02</div>
                                                <div className="relative z-10 space-y-6 text-center">
                                                    <div className="w-28 h-28 rounded-3xl border-2 border-glass-border p-1 mx-auto mb-6 bg-bg-main shadow-lg flex items-center justify-center overflow-hidden">
                                                        <img src={rankingData[1].avatar} alt={rankingData[1].name} className="w-full h-full object-cover rounded-2xl" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-900 dark:text-white font-black text-2xl truncate uppercase tracking-tighter">{rankingData[1].name}</p>
                                                        <p className="text-slate-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">Nível {rankingData[1].level}</p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent-1/80" style={{ width: rankingData[1].acc }} />
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm font-black text-slate-500 uppercase tracking-widest px-1">
                                                            <span>{rankingData[1].acc} SYNC</span>
                                                            <span>{rankingData[1].xp} XP</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* RANK 1 */}
                                        {rankingData[0] && (
                                            <motion.div 
                                                whileHover={{ y: -10 }}
                                                className="order-1 lg:order-2 bg-gradient-to-br from-accent-1 to-accent-1/80 rounded-3xl p-12 border-4 border-white dark:border-white/20 relative group shadow-2xl h-[500px] flex flex-col justify-end overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 p-8 text-white/10">
                                                    <Trophy size={140} />
                                                </div>
                                                <div className="absolute top-8 left-8 text-9xl font-bold text-white/5 tracking-tighter leading-none pointer-events-none">01</div>
                                                <div className="relative z-10 space-y-8 text-center">
                                                    <div className="w-36 h-36 rounded-3xl border-4 border-white dark:border-zinc-900 p-1.5 mx-auto mb-6 bg-white dark:bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden">
                                                        <img src={rankingData[0].avatar} alt={rankingData[0].name} className="w-full h-full object-cover rounded-2xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-white text-5xl font-black tracking-tight uppercase truncate">{rankingData[0].name}</p>
                                                        <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-black uppercase tracking-widest inline-block border border-white/30 uppercase">Dominador Ultra</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                            <div className="h-full bg-white" style={{ width: rankingData[0].acc }} />
                                                        </div>
                                                        <div className="flex justify-between items-center text-base font-black text-white uppercase tracking-widest px-1">
                                                            <span>{rankingData[0].acc} SYNC</span>
                                                            <span>{rankingData[0].xp} XP</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* RANK 3 */}
                                        {rankingData[2] && (
                                            <motion.div 
                                                whileHover={{ y: -10 }}
                                                className="order-3 lg:order-3 bg-bg-secondary rounded-3xl p-10 border border-glass-border relative group shadow-2xl h-[380px] flex flex-col justify-end overflow-hidden shadow-accent-1/5"
                                            >
                                                <div className="absolute top-8 left-8 text-8xl font-bold text-slate-900/5 dark:text-white/5 tracking-tighter leading-none pointer-events-none">03</div>
                                                <div className="relative z-10 space-y-6 text-center">
                                                    <div className="w-24 h-24 rounded-3xl border-2 border-glass-border p-1 mx-auto mb-6 bg-bg-main shadow-lg flex items-center justify-center overflow-hidden">
                                                        <img src={rankingData[2].avatar} alt={rankingData[2].name} className="w-full h-full object-cover rounded-2xl" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-900 dark:text-white font-black text-2xl truncate uppercase tracking-tighter">{rankingData[2].name}</p>
                                                        <p className="text-slate-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">Nível {rankingData[2].level}</p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent-1/80" style={{ width: rankingData[2].acc }} />
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm font-black text-slate-500 uppercase tracking-widest px-1">
                                                            <span>{rankingData[2].acc} SYNC</span>
                                                            <span>{rankingData[2].xp} XP</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* LEADERBOARD LIST */}
                                    <div className="px-10 pb-32 space-y-4 mt-20">
                                        <div className="flex items-center gap-6 px-10 text-slate-700 dark:text-zinc-400 text-xs font-black uppercase tracking-[0.4em] pb-4">
                                            <div className="w-12">Rank</div>
                                            <div className="flex-1">Operador</div>
                                            <div className="w-32 text-center">Frequência</div>
                                            <div className="w-32 text-right">Potência XP</div>
                                        </div>
                                        {rankingData.slice(3).map((player, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`group flex items-center gap-8 p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                                                    player.isMe 
                                                        ? 'bg-accent-1 border-accent-1 shadow-lg text-slate-900' 
                                                        : 'bg-bg-secondary border-glass-border hover:border-accent-1/40 hover:shadow-lg hover:shadow-accent-1/5 dark:hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <div className="w-12 text-center">
                                                    <span className={`text-3xl font-black tracking-tighter ${player.rank <= 3 ? 'text-accent-1' : player.isMe ? 'text-slate-900' : 'text-slate-400 dark:text-zinc-500 group-hover:text-accent-1'}`}>
                                                        #{player.rank < 10 ? `0${player.rank}` : player.rank}
                                                    </span>
                                                </div>

                                                <div className="flex-1 flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-xl border p-0.5 flex items-center justify-center overflow-hidden ${player.isMe ? 'bg-white/20 border-white/30' : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-white/10'}`}>
                                                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                                                    </div>
                                                    <div>
                                                    <p className={`font-black text-xl leading-none transition-colors truncate uppercase ${player.isMe ? 'text-slate-900' : 'text-[var(--text-primary)] group-hover:text-accent-1'}`}>
                                                            {player.name} {player.isMe && '(VOCÊ)'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${player.status === 'up' || player.isMe ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${player.isMe ? 'text-slate-900/60' : 'text-slate-405'}`}>Operador Nível {player.level}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-32 flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${player.isMe ? 'bg-slate-900/10 border-slate-900/20 text-slate-900' : 'bg-bg-main border-glass-border text-accent-1'}`}>
                                                        {player.acc} SYNC
                                                     </span>
                                                </div>

                                                <div className="w-32 text-right pr-2">
                                                    <div className="flex flex-col">
                                                         <span className={`text-2xl font-black tracking-tight transition-colors ${player.isMe ? 'text-slate-900' : 'text-[var(--text-primary)] group-hover:text-accent-1'}`}>{player.xp}</span>
                                                         <span className={`text-[10px] font-black uppercase tracking-widest ${player.isMe ? 'text-slate-900/60' : 'text-slate-400'}`}>XP Potency</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : hubTab === 'conquistas' ? (
                                (() => {
                                const currentLevel = userProfile?.level || 1;
                                const currentXP = userProfile?.xp || 0;
                                const userStreak = (userProfile as any)?.streak || 0;

                                const badges = [
                                    { 
                                        title: 'Primeiro Sinal', 
                                        desc: 'Concluiu seu primeiro desafio no Ninho Acadêmico com sucesso.', 
                                        date: (currentXP > 0 && (userProfile as any)?.createdAt?.seconds) 
                                            ? (new Date((userProfile as any).createdAt.seconds * 1000).toLocaleDateString() || 'RECENTE') 
                                            : 'RECENTE', 
                                        color: 'bg-emerald-500', 
                                        icon: <Play size={28} />, 
                                        unlocked: currentXP > 0, 
                                        progress: currentXP > 0 ? 100 : 0,
                                        id: 'ACH-001' 
                                    },
                                    { 
                                        title: 'Motor Eterno', 
                                        desc: 'Manteve uma sequência operativa de 5 ciclos ininterruptos de estudo.', 
                                        date: 'RECENTE', 
                                        color: 'bg-orange-500', 
                                        icon: <Flame size={28} />, 
                                        unlocked: userStreak >= 5, 
                                        progress: Math.min(100, Math.round((userStreak / 5) * 100)), 
                                        id: 'ACH-042' 
                                    },
                                    { 
                                        title: 'O Arquiteto', 
                                        desc: 'Alcance o Nível 5 na rede de vestibulandos de alta performance.', 
                                        date: 'RECENTE', 
                                        color: 'bg-indigo-500', 
                                        icon: <Brain size={28} />, 
                                        unlocked: currentLevel >= 5, 
                                        progress: Math.min(100, Math.round((currentLevel / 5) * 100)), 
                                        id: 'ACH-108' 
                                    },
                                    { 
                                        title: 'Neural Max', 
                                        desc: 'Alcançou 10.000 XP acumulados nos simulados e duelos.', 
                                        date: 'RECENTE', 
                                        color: 'bg-yellow-500', 
                                        icon: <Zap size={28} />, 
                                        unlocked: currentXP >= 10000, 
                                        progress: Math.min(100, Math.round((currentXP / 10000) * 100)), 
                                        id: 'ACH-256' 
                                    },
                                    { 
                                        title: 'Atlas Digital', 
                                        desc: 'Alcance o Nível 10 para dominar e mapear todos os canais de estudo.', 
                                        date: 'RECENTE', 
                                        color: 'bg-purple-500', 
                                        icon: <Map size={28} />, 
                                        unlocked: currentLevel >= 10, 
                                        progress: Math.min(100, Math.round((currentLevel / 10) * 100)), 
                                        id: 'ACH-512' 
                                    },
                                    { 
                                        title: 'Mestre do Tempo', 
                                        desc: 'Mantenha o foco extremo e complete metas cronometradas diariamente alcançando Nível 3.', 
                                        date: 'RECENTE', 
                                        color: 'bg-pink-500', 
                                        icon: <Clock size={28} />, 
                                        unlocked: currentLevel >= 3, 
                                        progress: Math.min(100, Math.round((currentLevel / 3) * 100)), 
                                        id: 'ACH-150' 
                                    },
                                    { 
                                        title: 'Bruxo Intelectual', 
                                        desc: 'Desintegre as barreiras e canalize o conhecimento arcano alcançando o Nível 2.', 
                                        date: 'RECENTE', 
                                        color: 'bg-indigo-605', 
                                        icon: <Sparkles size={28} />, 
                                        unlocked: currentLevel >= 2, 
                                        progress: Math.min(100, Math.round((currentLevel / 2) * 100)), 
                                        id: 'ACH-707' 
                                    },
                                    { 
                                        title: 'Conexão Sináptica', 
                                        desc: 'Alinhou perfeitamente os maiores conceitos cognitivos acumulando 2.000 XP.', 
                                        date: 'RECENTE', 
                                        color: 'bg-sky-500', 
                                        icon: <Activity size={28} />, 
                                        unlocked: currentXP >= 2000, 
                                        progress: Math.min(100, Math.round((currentXP / 2000) * 100)), 
                                        id: 'ACH-708' 
                                    },
                                    { 
                                        title: 'Alquimia Pura', 
                                        desc: 'Aumente seu rendimento em Ciências da Natureza alcançando pelo menos 3.000 XP.', 
                                        date: 'RECENTE', 
                                        color: 'bg-cyan-500', 
                                        icon: <Sparkles size={28} />, 
                                        unlocked: currentXP >= 3000, 
                                        progress: Math.min(100, Math.round((currentXP / 3000) * 100)), 
                                        id: 'ACH-200' 
                                    },
                                    { 
                                        title: 'Sobrevivente Numérico', 
                                        desc: 'Neutralizou hordas de equações complexas no simulador zombie ao atingir o Nível 7.', 
                                        date: 'RECENTE', 
                                        color: 'bg-red-650', 
                                        icon: <Skull size={28} />, 
                                        unlocked: currentLevel >= 7, 
                                        progress: Math.min(100, Math.round((currentLevel / 7) * 100)), 
                                        id: 'ACH-709' 
                                    },
                                    { 
                                        title: 'Gênio da Redação', 
                                        desc: 'Escreva e envie redações complexas com critérios reais do ENEM atingindo Nível 6.', 
                                        date: 'RECENTE', 
                                        color: 'bg-blue-600', 
                                        icon: <PenTool size={28} />, 
                                        unlocked: currentLevel >= 6, 
                                        progress: Math.min(100, Math.round((currentLevel / 6) * 100)), 
                                        id: 'ACH-350' 
                                    },
                                    { 
                                        title: 'Alquimista Supremo', 
                                        desc: 'Dominou a tabela periódica de vestibulares atingindo pelo menos 8.000 XP acumulados.', 
                                        date: 'bg-violet-600', 
                                        color: 'bg-fuchsia-600', 
                                        icon: <Lightbulb size={28} />, 
                                        unlocked: currentXP >= 8000, 
                                        progress: Math.min(100, Math.round((currentXP / 8000) * 100)), 
                                        id: 'ACH-710' 
                                    },
                                    { 
                                        title: 'Foco Inabalável', 
                                        desc: 'Concluiu simulados de alta intensidade com eficiência ideal ao atingir Nível 4.', 
                                        date: 'RECENTE', 
                                        color: 'bg-teal-500', 
                                        icon: <Target size={28} />, 
                                        unlocked: currentLevel >= 4, 
                                        progress: Math.min(100, Math.round((currentLevel / 4) * 100)), 
                                        id: 'ACH-500' 
                                    },
                                    { 
                                        title: 'Farol Operativo', 
                                        desc: 'Manteve o foco com uma sequência operativa de 3 ciclos diários ativos com o seu grupo.', 
                                        date: 'RECENTE', 
                                        color: 'bg-amber-500', 
                                        icon: <Medal size={28} />, 
                                        unlocked: userStreak >= 3, 
                                        progress: Math.min(100, Math.round((userStreak / 3) * 100)), 
                                        id: 'ACH-711' 
                                    },
                                    { 
                                        title: 'Calculador Impecável', 
                                        desc: 'Acerte sequências de lógica exata e atinja a marca de 5.000 XP acumulados.', 
                                        date: 'RECENTE', 
                                        color: 'bg-emerald-500', 
                                        icon: <CheckCircle2 size={28} />, 
                                        unlocked: currentXP >= 5000, 
                                        progress: Math.min(100, Math.round((currentXP / 5000) * 100)), 
                                        id: 'ACH-600' 
                                    },
                                    { 
                                        title: 'Mestre Estrategista', 
                                        desc: 'Formule metodologias de elite e ultrapasse seus rivais alcançando o Top 5 do Ranking.', 
                                        date: 'RECENTE', 
                                        color: 'bg-orange-600', 
                                        icon: <TrendingUp size={28} />, 
                                        unlocked: rankingData.findIndex(u => u.isMe) !== -1 && rankingData.findIndex(u => u.isMe) <= 4, 
                                        progress: rankingData.findIndex(u => u.isMe) !== -1 ? Math.min(100, Math.round(((11 - (rankingData.findIndex(u => u.isMe) + 1)) / 6) * 100)) : 0, 
                                        id: 'ACH-712' 
                                    },
                                    { 
                                        title: 'Conselheiro de Elite', 
                                        desc: 'Seja reconhecido como membro da comunidade ativa de vestibulandos ao atingir Nível 8.', 
                                        date: 'RECENTE', 
                                        color: 'bg-rose-500', 
                                        icon: <Users size={28} />, 
                                        unlocked: currentLevel >= 8, 
                                        progress: Math.min(100, Math.round((currentLevel / 8) * 100)), 
                                        id: 'ACH-888' 
                                    },
                                    { 
                                        title: 'Trono Alfa', 
                                        desc: 'Conquistou a soberania absoluta assumindo o topo em tempo real do Ranking de Elite.', 
                                        date: 'RECENTE', 
                                        color: 'bg-yellow-500', 
                                        icon: <Trophy size={28} />, 
                                        unlocked: rankingData[0]?.isMe === true, 
                                        progress: rankingData[0]?.isMe === true ? 100 : 0, 
                                        id: 'ACH-999' 
                                    }
                                ];

                                const unlockedCount = badges.filter(b => b.unlocked).length;
                                const progressPct = Math.round((unlockedCount / badges.length) * 100);

                                return (
                                    <motion.div 
                                        key="conquistas"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-24 px-10"
                                    >
                                        {/* ACHIEVEMENTS HEADER */}
                                        <div className="flex flex-col xl:flex-row xl:items-end justify-between px-10 gap-16">
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4 text-emerald-500">
                                                    <Award size={20} />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Conquistas de Operador</span>
                                                </div>
                                                <h2 className="text-5xl md:text-6xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                                                    Cofre de <span className="text-emerald-500">Relíquias</span>
                                                </h2>
                                                <p className="text-[var(--text-secondary)] font-medium text-lg max-w-xl">
                                                    Artefatos adquiridos através de superação técnica. Cada insígnia representa um salto operacional no seu aprendizado.
                                                </p>
                                            </div>

                                            <div className="bg-bg-secondary p-10 rounded-3xl border border-glass-border shadow-xl shadow-blue-100/20 min-w-[320px]">
                                                <p className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Artefatos Coletados</p>
                                                <p className="text-6xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                                    {unlockedCount < 10 ? `0${unlockedCount}` : unlockedCount} <span className="text-slate-400 dark:text-zinc-500 text-xl ml-2 uppercase tracking-widest font-sans">/ {badges.length} PEÇAS</span>
                                                </p>
                                                <div className="mt-6 w-full h-1.5 bg-bg-main rounded-full overflow-hidden border border-glass-border">
                                                    <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" style={{ width: `${progressPct}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACHIEVEMENTS GRID */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 px-10 pb-40 mt-16">
                                            {badges.map((badge, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    whileHover={{ y: -8 }}
                                                    className={`bg-bg-secondary border border-glass-border rounded-3xl p-10 relative overflow-hidden group shadow-xl transition-all duration-500 h-[420px] flex flex-col justify-between ${!badge.unlocked ? 'opacity-90' : ''}`}
                                                >
                                                    {!badge.unlocked && (
                                                        <div className="absolute inset-0 bg-bg-main/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-glass-border">
                                                                <Lock size={24} className="text-[var(--text-primary)]/20" />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Sincronia Bloqueada</span>
                                                        </div>
                                                    )}

                                                    <div className="relative z-10 space-y-8">
                                                        <div className="flex items-start justify-between">
                                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-lg ${badge.unlocked ? 'bg-bg-main border-glass-border text-blue-600 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-bg-main border-glass-border text-slate-300 dark:text-zinc-700'}`}>
                                                                {badge.icon}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${badge.unlocked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                                    {badge.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                                                                </div>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 font-mono"># {badge.id}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <h3 className={`text-3xl font-bold tracking-tight transition-colors ${badge.unlocked ? 'text-[var(--text-primary)] group-hover:text-blue-600' : 'text-slate-400'}`}>
                                                                {badge.title}
                                                            </h3>
                                                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                                                {badge.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-glass-border relative z-10">
                                                        {badge.unlocked ? (
                                                            <div className="flex justify-between items-center bg-bg-main p-4 rounded-xl border border-glass-border">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Adquirida</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{badge.date}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                                                    <span className="text-slate-400">Progresso</span>
                                                                    <span className="text-slate-900 dark:text-zinc-200 font-mono">{badge.progress}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }} 
                                                                        whileInView={{ width: `${badge.progress}%` }} 
                                                                        className={`h-full ${badge.color} rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })()
                            ) : hubTab === 'castle' ? (
                                <motion.div 
                                    key="castle"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="px-10 pb-24"
                                >
                                    {renderCastleAdventure()}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="central"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {renderLobby()}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Creative Credits Footer */}
                        <footer className="mt-20 pt-10 border-t border-slate-200 dark:border-white/5 pb-10 text-center">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] max-w-2xl mx-auto leading-loose">
                                Créditos de Inspiração: Universo de Harry Potter (Warner Bros/J.K. Rowling) • Músicas de Billie Eilish, One Direction, Taylor Swift, Sabrina Carpenter e Bruno Mars • Direitos reservados aos seus respectivos autores.
                            </p>
                        </footer>
                    </main>
                </div>

                    {/* Right Sidebar - Trends & Community */}
                    <aside className="hidden xl:block w-80 shrink-0 relative z-20">
                        <div className="sticky top-24">
                            <TrendsSidebar 
                                userProfile={userProfile}
                                currentUser={auth.currentUser}
                                trendingSubjects={trendingSubjects}
                                topTrendingPhotos={topTrendingPhotos}
                                topTrendingPosts={topTrendingPosts}
                                onlineUsers={onlineUsers}
                                setFilter={() => {}}
                                setActiveArea={() => {}}
                                setActiveTrendView={setActiveTrendView}
                                openPostModal={() => {}}
                            />
                        </div>
                    </aside>
                </div>
            </div>
            <style>{`
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee {
                display: inline-block;
                animation: marquee 20s linear infinite;
            }
            .perspective-1000 { perspective: 1000px; }
            .preserve-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
    </Layout>
);
};

export default Challenges;
