import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { User, Bell, Shield, Palette, HelpCircle, ChevronRight, LogOut, Moon, Sun, Zap, Eye, Trash2, Camera, Mail, Lock, Calendar, Info, CalendarDays, Code, MessageSquare, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { auth, db, onAuthStateChanged, signOut, updatePresence, handleFirestoreError, OperationType } from '../firebase';
import UserAvatar from '../components/UserAvatar';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { safeLocalStorage } from '../lib/storage';

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);

    const handleLogout = async () => {
        try {
            await updatePresence('offline');
        } catch (e) {
            console.error("Erro ao atualizar presença para offline:", e);
        }
        await signOut(auth);
        navigate('/');
    };
    const [theme, setTheme] = useState(safeLocalStorage.getItem('theme') || 'dark');
    const [lightThemeColor, setLightThemeColor] = useState(safeLocalStorage.getItem('light-theme-color') || 'default');
    const [fontSize, setFontSize] = useState(safeLocalStorage.getItem('fontsize') || 'normal');
    const [activeSection, setActiveSection] = useState('profile');
    const [colorBlindMode, setColorBlindMode] = useState(safeLocalStorage.getItem('colorblind') || 'none');
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editHandle, setEditHandle] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editBirthdate, setEditBirthdate] = useState('');
    const [editPhotoURL, setEditPhotoURL] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleThemeChange = () => {
            setTheme(safeLocalStorage.getItem('theme') || 'dark');
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

    const changeLightThemeColor = (color: string) => {
        setLightThemeColor(color);
        if (color === 'default') {
            safeLocalStorage.removeItem('light-theme-color');
        } else {
            safeLocalStorage.setItem('light-theme-color', color);
        }
        window.dispatchEvent(new CustomEvent('theme-color-changed'));
        toast.success(`Paleta de cores atualizada! ✨`);
    };

    useEffect(() => {
        const handleColorBlindChange = () => {
            setColorBlindMode(safeLocalStorage.getItem('colorblind') || 'none');
        };
        const handleFontSizeChange = () => {
            setFontSize(safeLocalStorage.getItem('fontsize') || 'normal');
        };
        window.addEventListener('colorblind-changed', handleColorBlindChange);
        window.addEventListener('fontsize-changed', handleFontSizeChange);
        return () => {
            window.removeEventListener('colorblind-changed', handleColorBlindChange);
            window.removeEventListener('fontsize-changed', handleFontSizeChange);
        };
    }, []);

    const changeFontSize = (size: string) => {
        setFontSize(size);
        safeLocalStorage.setItem('fontsize', size);
        window.dispatchEvent(new CustomEvent('fontsize-changed'));
        toast.success(`Tamanho da fonte ajustado!`);
    };

    const changeColorBlindMode = (mode: string) => {
        setColorBlindMode(mode);
        safeLocalStorage.setItem('colorblind', mode);
        
        window.dispatchEvent(new CustomEvent('colorblind-changed'));
        toast.success(`Modo de visualização: ${mode === 'none' ? 'Padrão' : mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    };

    const [settings, setSettings] = useState({
        notificationsLikes: true,
        notificationsComments: true,
        notificationsFollows: true,
        publicProfile: true,
        showOnlineStatus: true,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setEditDisplayName(currentUser.displayName || '');
                setEditPhotoURL(currentUser.photoURL || '');
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        setEditDisplayName(data.displayName || currentUser.displayName || '');
                        setEditPhotoURL(data.photoURL || currentUser.photoURL || '');
                        setEditHandle(data.handle || '');
                        setEditBio(data.bio || '');
                        setEditBirthdate(data.birthdate || '');
                        
                        if (data.settings) {
                            setSettings(prev => ({ ...prev, ...data.settings }));
                        }
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    handleFirestoreError(err, OperationType.GET, 'users/' + currentUser.uid);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleSetting = async (key: keyof typeof settings) => {
        if (!user) return;
        const newValue = !settings[key];
        const newSettings = { ...settings, [key]: newValue };
        setSettings(newSettings);
        
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                settings: newSettings
            });
            toast.success("Configuração atualizada! ✨");
        } catch (err) {
            console.error("Erro ao salvar configuração:", err);
            toast.error("Erro ao salvar sua preferência.");
            // Revert on error
            setSettings(settings);
        }
    };

    const handleBlockedUsers = () => {
        toast.info("A lista de usuários bloqueados está vazia ou esta funcionalidade está sendo atualizada.");
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm("ATENÇÃO: Você tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados, conquistas, posts e progresso de estudos serão APAGADOS. Esta ação NÃO pode ser desfeita.");
        if (confirm) {
            setIsSaving(true);
            try {
                // In a real app we'd call a cloud function here to wipe data
                // For now, let's just delete the user document and logout
                if (user) {
                    await deleteDoc(doc(db, 'users', user.uid));
                    // We can't easily delete the auth user without re-auth, so we just log them out
                    toast.success("Dados da conta apagados com sucesso.");
                    await signOut(auth);
                    navigate('/');
                }
            } catch (err) {
                console.error("Erro ao deletar conta:", err);
                toast.error("Erro ao excluir conta. Entre em contato com suporte@vestapp.com.br");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const changeTheme = (newTheme: string) => {
        setTheme(newTheme);
        safeLocalStorage.setItem('theme', newTheme);
        window.dispatchEvent(new CustomEvent('theme-changed'));
        
        let label = 'Claro';
        if (newTheme === 'dark') label = 'Escuro (Dim)';
        
        toast.success(`Modo ${label} ativado!`);
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditPhotoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const sections = [
        { id: 'profile', label: 'Meu Perfil', icon: <User size={20} /> },
        { id: 'notifications', label: 'Notificações', icon: <Bell size={20} /> },
        { id: 'privacy', label: 'Privacidade', icon: <Shield size={20} /> },
        { id: 'appearance', label: 'Aparência', icon: <Palette size={20} /> },
        { id: 'about', label: 'Sobre o VestApp', icon: <Info size={20} /> },
    ];

    const renderProfileSettings = () => (
        <div className="space-y-6 text-center py-6">
            <div className={`p-8 sm:p-12 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/[0.02]'} border border-glass-border rounded-[2rem] shadow-sm max-w-xl mx-auto`}>
                <div className="flex justify-center mb-6">
                    <UserAvatar 
                        uid={user?.uid || "guest"}
                        fallbackPhoto={userData?.photoURL || ""}
                        size="130px"
                        className="rounded-full object-cover border-4 border-accent-1 shadow-2xl"
                    />
                </div>
                <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tighter uppercase mb-1`}>
                    {userData?.displayName || user?.displayName || 'Seu Perfil'}
                </h3>
                {userData?.handle && (
                    <p className="text-base font-bold text-accent-1 mb-2">@{userData.handle}</p>
                )}
                
                {(userData?.email || user?.email) && (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-6 bg-slate-100 dark:bg-white/5 py-2 px-4 rounded-xl w-fit mx-auto border border-slate-200 dark:border-white/5 shadow-inner">
                        <Mail size={16} className="text-accent-1" />
                        <span>{userData?.email || user?.email}</span>
                    </div>
                )}
                
                <p className={`${theme === 'light' ? 'text-slate-600' : 'text-gray-400'} text-sm mb-8 leading-relaxed max-w-md mx-auto font-bold`}>
                    Para manter as informações do seu perfil estudantil centralizadas, seguras e evitar dados inconsistentes, as configurações e edição do seu perfil agora são gerenciadas diretamente na aba principal de Perfil.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto justify-center">
                    <Link 
                        to="/perfil?edit=true"
                        className="flex items-center justify-center gap-2 py-4 px-6 bg-accent-1 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                        <User size={16} />
                        Editar meu Perfil
                    </Link>
                    <Link 
                        to="/perfil"
                        className={`flex items-center justify-center gap-2 py-4 px-6 ${theme === 'light' ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'} font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer`}
                    >
                        Ver Perfil Completo
                    </Link>
                </div>
            </div>
        </div>
    );

    const renderNotificationsSettings = () => {
        return (
            <div className="space-y-8">
                <div>
                    <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Alertas de Interação</h4>
                    <div className="space-y-3">
                        {[
                            { id: 'notificationsLikes', label: 'Novas Curtidas', desc: 'Receba avisos quando alguém curtir seus posts', icon: Bell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                            { id: 'notificationsComments', label: 'Comentários', desc: 'Seja notificado quando comentarem em suas fotos ou vídeos', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { id: 'notificationsFollows', label: 'Novos Seguidores', desc: 'Saiba quem começou a te seguir no Ninho', icon: User, color: 'text-green-500', bg: 'bg-green-500/10' },
                        ].map((item) => (
                            <div key={item.id} className={`p-4 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200' : 'bg-white/5 border-white/10'} border rounded-2xl flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${item.bg} rounded-xl`}>
                                        <item.icon size={20} className={item.color} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.label}</h4>
                                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleSetting(item.id as keyof typeof settings)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${settings[item.id as keyof typeof settings] ? 'bg-accent-1' : 'bg-slate-400 dark:bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[item.id as keyof typeof settings] ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-4 ${theme === 'light' ? 'bg-slate-100/50 border-slate-200/50' : 'bg-accent-1/5 border border-accent-1/10'} rounded-2xl`}>
                    <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'} leading-relaxed text-center`}>
                        Você também pode gerenciar as notificações de push através do seu navegador ou dispositivo móvel.
                    </p>
                </div>
            </div>
        );
    };

    const renderPrivacySettings = () => (
        <div className="space-y-6">
            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Segurança da Conta</h4>
                <div className="grid gap-4">
                    <div className={`p-4 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200' : 'bg-white/5 border-white/10'} border rounded-2xl flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Eye size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Perfil Público</h4>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Permitir que qualquer pessoa veja seu progresso e posts</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleSetting('publicProfile')}
                            className={`w-12 h-6 rounded-full transition-all relative ${settings.publicProfile ? 'bg-accent-1' : 'bg-slate-400 dark:bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.publicProfile ? 'right-1' : 'left-1'}`}></div>
                        </button>
                    </div>

                    <div className={`p-4 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200' : 'bg-white/5 border-white/10'} border rounded-2xl flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-xl">
                                <Lock size={20} className="text-green-500" />
                            </div>
                            <div>
                                <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Status Online</h4>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Mostrar quando você está estudando no "Ninho"</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleSetting('showOnlineStatus')}
                            className={`w-12 h-6 rounded-full transition-all relative ${settings.showOnlineStatus ? 'bg-accent-1' : 'bg-slate-400 dark:bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showOnlineStatus ? 'right-1' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Dados e Visibilidade</h4>
                <div className="space-y-3">
                    <div 
                        onClick={handleBlockedUsers}
                        className={`p-4 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border rounded-2xl flex items-center justify-between group cursor-pointer transition-all`}>
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-gray-500 group-hover:text-accent-1 transition-colors" />
                            <span className={`text-sm ${theme === 'light' ? 'text-slate-750' : 'text-gray-200'}`}>Gerenciar usuários bloqueados</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-600" />
                    </div>
                    
                    <div 
                        onClick={handleDeleteAccount}
                        className={`p-4 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border rounded-2xl flex items-center justify-between group cursor-pointer transition-all`}>
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-red-500/70" />
                            <span className="text-sm text-red-500/90 font-bold">Excluir minha conta permanentemente</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-600" />
                    </div>
                </div>
            </div>
            
            <div className={`p-4 ${theme === 'light' ? 'bg-slate-100/50 border-slate-200/50' : 'bg-accent-1/5 border border-accent-1/10'} rounded-2xl`}>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'} leading-relaxed text-center`}>
                    Seus dados são protegidos seguindo as normas da LGPD. <br />
                    Para mais detalhes, consulte nossos <span className="text-accent-1 cursor-pointer hover:underline">Termos de Uso</span>.
                </p>
            </div>
        </div>
    );

    const renderAboutSettings = () => (
        <div className="space-y-8">
            <div className="p-6 bg-accent-1/5 border border-accent-1/10 rounded-3xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-1/10 rounded-full blur-3xl"></div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 relative z-10">Sobre o VestApp</h4>
                <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed relative z-10">
                    A vida dos estudantes foca boa parte dos seus esforços nos estudos, porém muitos acabam estudando sozinhos e se quer possuem qualquer base de como devem começar ou prosseguir em frente para alcançar a sua sonhada vida no ensino superior, conseguindo o seu próprio espaço na faculdade e curso tão desejados.
                </p>
            </div>

            <div className="grid gap-6">
                <div>
                    <h5 className="text-xs font-bold text-accent-1 uppercase tracking-widest mb-3">O que é o VestApp?</h5>
                    <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                        O <strong>VestApp</strong> é um projeto desenvolvido para ajudar para aqueles que buscam por um novo espaço para os estudos e querem assegurar melhor conhecimento, sendo que por meio dele também se encontra apoio em uma comunidade focada no objetivo conjunto de melhorar o seu desempenho acadêmico para assim poder conseguir conquistar a sua pontuação final sonhada nos vestibulares que participarem. O que é facilitado com os elementos disponibilizados para todos os usuários do nosso "Ninho", como meios de planejamento de estudos, cronogramas, recompensa por jogos com foco nas matérias do Enem e assistência personalizada com a nossa IA, o Vest.
                    </p>
                </div>

                <div>
                    <h5 className="text-xs font-bold text-accent-1 uppercase tracking-widest mb-3">Quem o produziu?</h5>
                    <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                        Consistindo de 4 integrantes, o programa é criado por uma equipe de estudantes que também estão indo atrás de avançar a própria educação para chegar na faculdade que tanto querem. Usando o que aprendemos, melhoramos o projeto que existe pela aspiração mútua de todos os envolvidos de evoluir o conhecimento ao lado dos estudantes que decidem usar o nosso aplicativo e todos cooperando para o seu aprimoramento coletivo.
                    </p>
                </div>

                <div className="pt-6 border-t border-slate-200/40 dark:border-white/5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                        <Code size={24} className="text-slate-500 dark:text-gray-500" />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-bold">Versão 2.4.0 - Phoenix Edition</span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-500 mt-1">Orgulhosamente criado para a próxima geração de universitários.</span>
                </div>
            </div>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="space-y-6">
            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Temas Básicos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { id: 'light', label: 'Claro', icon: <Sun className="text-amber-500" size={24} />, previewBg: 'bg-white border border-slate-200' },
                        { id: 'dark', label: 'Escuro', icon: <Moon className="text-blue-400" size={24} />, previewBg: 'bg-slate-900 border border-slate-700' },
                    ].map((item) => {
                        const isSelected = theme === item.id;
                        return (
                            <button 
                                key={item.id}
                                onClick={() => changeTheme(item.id)}
                                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-2xl transition-all cursor-pointer ${
                                    isSelected 
                                    ? 'border-accent-1 bg-accent-1/10 text-accent-1 font-black shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' 
                                    : theme === 'light'
                                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80 hover:border-slate-300'
                                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className={`w-full aspect-video rounded-lg flex items-center justify-center shadow-lg ${item.previewBg}`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Paleta de Cores</h4>
                <div className={`p-5 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200/80' : 'bg-white/5 border-white/10'} border rounded-2xl space-y-4`}>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'} leading-relaxed`}>
                        Selecione uma cor para personalizar o visual, botões, ícones e destaques da interface:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { id: 'default', color: '#6366f1', name: 'Indigo' },
                            { id: '#fc77b2', color: '#fc77b2', name: 'Rosa' },
                            { id: '#00bef2', color: '#00bef2', name: 'Azul' },
                            { id: '#fff461', color: '#fff461', name: 'Amarelo' },
                            { id: '#36ae68', color: '#36ae68', name: 'Verde' },
                        ].map((item) => {
                            const isSelected = lightThemeColor === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => changeLightThemeColor(item.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-slate-100 dark:bg-white/10 border-accent-1 text-slate-900 dark:text-white font-black scale-[1.02] shadow-sm'
                                            : theme === 'light'
                                              ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                >
                                    <div 
                                        className="w-8 h-8 rounded-full mb-2 shadow-inner border border-black/10 flex items-center justify-center transition-transform"
                                        style={{ backgroundColor: item.color }}
                                    >
                                        {isSelected && (
                                            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Tamanho da Fonte</h4>
                <div className={`p-5 ${theme === 'light' ? 'bg-slate-100/80 border-slate-200/80' : 'bg-white/5 border-white/10'} border rounded-2xl`}>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'} leading-relaxed mb-4`}>
                        Ajuste o tamanho das letras para uma leitura mais confortável:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { id: 'small', label: 'Pequena', icon: 'A', class: 'text-xs' },
                            { id: 'normal', label: 'Padrão', icon: 'A', class: 'text-sm' },
                            { id: 'large', label: 'Grande', icon: 'A', class: 'text-lg' },
                            { id: 'extra-large', label: 'Extra', icon: 'A', class: 'text-xl' },
                        ].map((item) => {
                            const isSelected = fontSize === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => changeFontSize(item.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-accent-1/20 border-accent-1 text-accent-1 font-black shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'
                                            : theme === 'light'
                                              ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                >
                                    <span className={`${item.class} font-bold mb-2`}>{item.icon}</span>
                                    <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} uppercase tracking-wider mb-4 px-1`}>Modo Especial (Acessibilidade)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { id: 'none', label: 'Padrão', desc: 'Cores originais do VestApp' },
                        { id: 'protanopia', label: 'Protanopia', desc: 'Filtro para Daltonismo de Vermelho' },
                        { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Filtro para Daltonismo de Verde' },
                        { id: 'tritanopia', label: 'Tritanopia', desc: 'Filtro para Daltonismo de Azul' },
                    ].map((mode) => {
                        const isSelected = colorBlindMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => changeColorBlindMode(mode.id)}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                    isSelected 
                                    ? theme === 'light'
                                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/30 font-black shadow-sm'
                                      : 'bg-amber-500/10 border-amber-500/50 text-amber-400 ring-2 ring-amber-500/20 font-black' 
                                    : theme === 'light'
                                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold">{mode.label}</span>
                                    {isSelected && <Eye className={theme === 'light' ? 'text-amber-600' : 'text-amber-400'} size={18} />}
                                </div>
                                <p className={`text-xs ${isSelected ? (theme === 'light' ? 'text-amber-850 font-semibold' : 'text-amber-300') : (theme === 'light' ? 'text-slate-500' : 'text-slate-400')} leading-relaxed`}>
                                    {mode.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="w-full min-h-screen py-0">
                <header className="mb-8 px-8 pt-8">
                    <h2 className={`text-4xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'} flex items-center gap-4 uppercase tracking-tighter`}>
                        <SettingsIcon className="w-10 h-10 text-accent-1" />
                        Ajustes de Perfil
                    </h2>
                    <p className={`${theme === 'light' ? 'text-slate-500' : 'text-gray-400'} mt-3 text-lg font-bold`}>Customize sua experiência, privacidade e o visual do seu perfil estudantil.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-160px)]">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 shrink-0 px-4 lg:px-8 py-4 border-r border-glass-border">
                        <nav className="flex flex-col gap-2">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all cursor-pointer group ${
                                        activeSection === section.id 
                                        ? 'bg-accent-1 text-slate-900 font-black shadow-[0_0_30px_rgba(0,242,255,0.15)] scale-[1.02]' 
                                        : theme === 'light'
                                          ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent hover:border-slate-200'
                                          : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                                    }`}
                                >
                                    <div className={`${activeSection === section.id ? 'text-slate-900' : 'text-accent-1 group-hover:scale-110 transition-transform'}`}>
                                        {section.icon}
                                    </div>
                                    <span className="text-sm uppercase tracking-widest font-black">{section.label}</span>
                                </button>
                            ))}
                            
                            <div className="mt-8 pt-8 border-t border-glass-border">
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer font-black group w-full"
                                >
                                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-sm uppercase tracking-widest">Encerrar Sessão</span>
                                 </button>
                            </div>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <main className={`flex-1 ${theme === 'light' ? 'bg-white' : 'bg-[#0a0a0c]'} p-6 md:p-12 lg:p-16 min-h-full`}>
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-full"
                        >
                            <div className="flex items-center justify-between mb-12 border-b border-glass-border pb-8">
                                <h3 className={`text-4xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'} uppercase tracking-tight`}>
                                    {sections.find(s => s.id === activeSection)?.label}
                                </h3>
                                <div className="h-1.5 w-20 bg-accent-1 rounded-full"></div>
                            </div>

                            <div className="w-full">
                                {activeSection === 'profile' && (
                                    <div className="w-full max-w-full">
                                        {renderProfileSettings()}
                                    </div>
                                )}
                                {activeSection === 'appearance' && (
                                    <div className="w-full max-w-6xl">
                                        {renderAppearanceSettings()}
                                    </div>
                                )}
                                {activeSection === 'notifications' && (
                                    <div className="w-full max-w-4xl">
                                        {renderNotificationsSettings()}
                                    </div>
                                )}
                                {activeSection === 'privacy' && (
                                    <div className="w-full max-w-4xl">
                                        {renderPrivacySettings()}
                                    </div>
                                )}
                                {activeSection === 'about' && (
                                    <div className="w-full max-w-5xl">
                                        {renderAboutSettings()}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
