import React, { useState, useEffect } from 'react';
import { LayoutGrid, Quote, Target, Award } from 'lucide-react';
import { motivationalPhrases } from '../constants';

interface KnowledgeSidebarProps {
    filter?: string;
    setFilter?: (filter: string) => void;
    setActiveArea?: (area: string) => void;
    setActiveTrendView?: (view: { name: string; category: string }) => void;
    setTrendTab?: (tab: string) => void;
}

const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({ 
    filter, 
    setFilter, 
    setActiveArea, 
    setActiveTrendView,
    setTrendTab 
}) => {
    const [phraseOfDay, setPhraseOfDay] = useState("");

    useEffect(() => {
        // Pick a random phrase
        const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
        setPhraseOfDay(randomPhrase);
    }, []);

    return (
        <aside className="knowledge-sidebar space-y-6">
            <div className="bg-bg-secondary border-2 border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-1/10 rounded-full blur-3xl group-hover:bg-accent-1/20 transition-all pointer-events-none" />
                
                <span className="text-[10px] text-accent-1 uppercase tracking-[4px] font-black mb-6 block flex items-center gap-2">
                    <Quote size={14} /> Inspiração do Dia
                </span>
                
                <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed text-sm italic relative z-10">
                    "{phraseOfDay}"
                </p>
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center text-xs font-black text-black dark:text-white uppercase tracking-wider">
                        <span>Foco no ENEM</span>
                        <span>🔥 100%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-accent-1 h-1.5 rounded-full w-[85%] relative">
                            <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default KnowledgeSidebar;
