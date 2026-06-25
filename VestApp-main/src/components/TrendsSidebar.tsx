import React from 'react';
import { TrendingUp, Heart, Video, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post as PostType, UserProfile } from '../types';
import UserAvatar from './UserAvatar';

interface TrendsSidebarProps {
    userProfile: UserProfile | null;
    currentUser: any;
    trendingSubjects: any[];
    topTrendingPhotos: PostType[];
    topTrendingPosts: PostType[];
    onlineUsers: any[];
    setFilter?: (filter: string) => void;
    setActiveArea?: (area: string) => void;
    setActiveTrendView?: (view: { name: string; category: string }) => void;
    openPostModal: (post: PostType) => void;
}

const TrendsSidebar: React.FC<TrendsSidebarProps> = ({
    userProfile,
    currentUser,
    trendingSubjects,
    topTrendingPhotos,
    topTrendingPosts,
    onlineUsers,
    setFilter,
    setActiveArea,
    setActiveTrendView,
    openPostModal
}) => {
    const navigate = useNavigate();

    return (
        <aside className="online-sidebar space-y-6">
            {/* User Mini Profile Card */}
            <div className="bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 rounded-[2rem]">
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <UserAvatar 
                            uid={currentUser?.uid} 
                            fallbackPhoto={userProfile?.photoURL || currentUser?.photoURL || ""} 
                            fallbackName={userProfile?.displayName || currentUser?.displayName || "Usuário"} 
                            size={80} 
                            className="rounded-[1.5rem] object-cover border-4 border-accent-1 p-1 bg-bg-main" 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-accent-1 text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-bg-secondary" style={{ color: 'var(--btn-text-color, white)' }}>
                            NÍVEL {userProfile?.xp !== undefined ? Math.floor(userProfile.xp / 1000) + 1 : (userProfile?.level || 1)}
                        </div>
                    </div>
                    <h4 className="text-xl font-black text-black dark:text-white mb-1">
                        {userProfile?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || "Estudante"}
                    </h4>
                    <p className="text-xs text-black dark:text-zinc-500 font-bold uppercase tracking-widest mb-6">
                        ESTUDANTE DEDICADO(A) 🎓
                    </p>
                    
                    <div className="w-full">
                        <div className="bg-bg-main border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group flex items-center justify-center gap-3">
                            <div className="absolute top-0 right-0 p-0.5 opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
                            <div className="text-2xl">🔥</div>
                            <div className="text-left">
                                <div className="text-orange-500 font-black text-xl leading-none mb-1">{userProfile?.streak || 0} Dias</div>
                                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">ESTUDO DIÁRIO</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Eventos Especiais Alinhados */}
            <div className="flex flex-col gap-4">
                {/* Evento de Simulados */}
                <div className="relative group cursor-pointer" onClick={() => navigate('/simulado')}>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-[2rem] blur opacity-15 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <div className="relative bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-5 rounded-[2rem] overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -mr-8 -mt-8 blur-2xl"></div>
                        <div className="flex items-center gap-4 relative z-10 font-sans">
                            <div className="w-12 h-12 bg-bg-main rounded-2xl flex items-center justify-center text-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl group-hover:rotate-12 transition-transform shrink-0">
                                📝
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1 flex flex-wrap items-center gap-1.5 leading-tight">
                                Simulados VestApp <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shrink-0"></span>
                              </h5>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-tight break-words">Resolva testes com cronômetro e melhore suas notas!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evento de Desafios Normais */}
                <div className="relative group cursor-pointer" onClick={() => navigate('/desafios')}>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-[2rem] blur opacity-15 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <div className="relative bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-5 rounded-[2rem] overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -ml-8 -mt-8 blur-2xl"></div>
                        <div className="flex items-center gap-4 relative z-10 font-sans">
                            <div className="w-12 h-12 bg-bg-main rounded-2xl flex items-center justify-center text-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl group-hover:-rotate-12 transition-transform text-center shrink-0">
                                🎮
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1 flex flex-wrap items-center gap-1.5 leading-tight">
                                Arena de Gamificação <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-1 animate-pulse shrink-0">EM ALTA</span>
                              </h5>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-tight break-words">Estude brincando com Math Zombies, Lab de Química e mais!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trending Section (Em Alta) */}
            <div className="bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 rounded-[2rem]">
                <div className="flex items-center gap-5 mb-6">
                    <TrendingUp size={28} className="text-accent-1" />
                    <span className="text-lg text-black dark:text-zinc-300 uppercase tracking-[3px] font-black">
                        Em Alta no Ninho
                    </span>
                </div>
                
                <div className="space-y-8">
                    {/* Popular Hashtags/Subjects */}
                    <div className="flex flex-wrap gap-2">
                        {trendingSubjects.map((trend, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    setFilter?.(trend.name);
                                    setActiveArea?.(trend.category);
                                    setActiveTrendView?.({ name: trend.name, category: trend.category });
                                }}
                                className="px-4 py-2 rounded-full bg-accent-1/5 border-2 border-accent-1/10 hover:border-accent-1/40 hover:bg-accent-1/10 transition-all text-[10px] font-black text-accent-1 uppercase"
                            >
                                #{trend.name}
                            </button>
                        ))}
                    </div>

                    {/* Top Content Sneak Peek */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-[3px]">Fotos mais curtidas</span>
                        <div className="grid grid-cols-3 gap-3">
                            {topTrendingPhotos.length > 0 ? topTrendingPhotos.slice(0, 3).map((post) => (
                                <div 
                                    key={post.id} 
                                    onClick={() => openPostModal(post)}
                                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer group/photo relative"
                                >
                                    <img src={post.imageURL} className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-500" alt="Trending" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end p-2">
                                        <span className="text-[10px] font-black text-white flex items-center gap-1">
                                            <Heart size={10} className="fill-current" /> {post.likesCount || 0}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="aspect-square rounded-2xl bg-zinc-800/20 animate-pulse" />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">Conteúdos em destaque</span>
                        <div className="flex flex-col gap-3">
                            {topTrendingPosts.slice(0, 3).map((post) => (
                                <div 
                                    key={post.id} 
                                    onClick={() => openPostModal(post)}
                                    className="group cursor-pointer p-3 bg-bg-main border-2 border-slate-200 dark:border-zinc-800 rounded-[1.25rem] hover:border-accent-1/30 transition-all"
                                >
                                    <div className="flex gap-3">
                                        {post.imageURL ? (
                                            <img src={post.imageURL} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="Thumb" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-accent-1/5 flex items-center justify-center text-accent-1 shrink-0">
                                                {post.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-black dark:text-zinc-300 line-clamp-2 leading-tight mb-1.5 break-words">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-black text-accent-1 uppercase px-1.5 py-0.5 bg-accent-1/5 rounded border border-accent-1/10">{post.subject}</span>
                                                <span className="text-[10px] font-black text-zinc-500 flex items-center gap-1 bg-zinc-800/10 px-1 py-0.5 rounded">
                                                    <Heart size={10} className="fill-current text-rose-500" /> {post.likesCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Online Users Section */}
            <div className="bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 rounded-[2rem]">
                <div className="flex items-center gap-5 mb-6">
                    <Users size={28} className="text-accent-1" />
                    <span className="text-lg text-black dark:text-zinc-300 uppercase tracking-[3px] font-black">
                        Ninheiros On-line
                    </span>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-accent-1 animate-pulse" />
                </div>
                <div className="space-y-4">
                    {onlineUsers.length > 0 ? onlineUsers.slice(0, 5).map((u) => {
                        const isSelf = u.id === currentUser?.uid;
                        const dispName = isSelf 
                            ? (userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || "Estudante")
                            : u.displayName;
                        const photo = isSelf 
                            ? (userProfile?.photoURL || currentUser?.photoURL || "")
                            : (u.photoURL || "");
                        const lvl = isSelf 
                            ? (userProfile?.xp !== undefined ? Math.floor(userProfile.xp / 1000) + 1 : (userProfile?.level || 1))
                            : (u.level || 1);

                        return (
                            <div 
                                key={u.id} 
                                className="flex items-center gap-4 cursor-pointer group"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: { uid: u.id } }))}
                            >
                                <div className="relative shrink-0">
                                    <UserAvatar 
                                        uid={u.id} 
                                        fallbackPhoto={photo} 
                                        fallbackName={dispName} 
                                        size={48} 
                                        className="rounded-xl object-cover border-2 border-white/10 group-hover:border-accent-1 transition-colors" 
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-1 rounded-full border-2 border-bg-secondary"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-black text-base text-black dark:text-white truncate group-hover:text-accent-1 transition-colors">
                                        {dispName}{isSelf ? " (Você)" : ""}
                                    </span>
                                    <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-[1px]">Level {lvl}</span>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-xs text-zinc-500 italic font-black">Ninguém on-line agora...</p>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default TrendsSidebar;
