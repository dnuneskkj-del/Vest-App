import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface StudyTask {
    time: string;
    subject: string;
    topic: string;
    duration: string;
}

interface StudyDay {
    day: string;
    tasks: StudyTask[];
}

interface PersonalizedStudyPlan {
    type: string;
    analysis: string;
    schedule: StudyDay[];
}

interface PersonalizedScheduleProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isSending: boolean;
    personalizedPlan: PersonalizedStudyPlan | null;
}

const PersonalizedSchedule = ({ messages, onSendMessage, isSending, personalizedPlan }: PersonalizedScheduleProps) => {
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isSending) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chat Section */}
                <div className="flex flex-col h-[600px] bg-bg-secondary border border-glass-border rounded-[2.5rem] overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-glass-border bg-black/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent-1/20 border border-accent-1/30 flex items-center justify-center text-accent-1">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Consultor de Rotina IA</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Online agora</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                        msg.role === 'user' 
                                            ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
                                            : 'bg-accent-1 border-accent-1 text-slate-950'
                                    }`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-accent-1 text-slate-950 font-medium rounded-tr-none'
                                            : 'bg-bg-main border border-glass-border text-zinc-300 rounded-tl-none'
                                    }`}>
                                        {msg.parts[0].text}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isSending && (
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-accent-1 border-accent-1 text-slate-950">
                                        <Bot size={14} />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-bg-main border border-glass-border text-zinc-500 rounded-tl-none flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-xs font-bold uppercase tracking-widest">IA está analisando sua rotina...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 border-t border-glass-border bg-black/5">
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Conte-me sobre sua rotina..."
                                className="w-full bg-bg-main border border-glass-border rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-accent-1/50 transition-all text-zinc-200"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-accent-1 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Plan Display Section */}
                <div className="bg-bg-secondary border border-glass-border rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col h-[600px]">
                    <div className="p-6 border-b border-glass-border bg-black/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Seu Cronograma Personalizado</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gerado por IA</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
                        <AnimatePresence mode="wait">
                            {personalizedPlan ? (
                                <motion.div
                                    key="plan-content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-3xl">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Análise da IA</h4>
                                                <p className="text-xs text-zinc-400 leading-relaxed font-medium">{personalizedPlan.analysis}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {personalizedPlan.schedule.map((day, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <h5 className="text-xs font-black text-accent-1 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-accent-1" />
                                                    {day.day}
                                                </h5>
                                                <div className="grid gap-3">
                                                    {day.tasks.map((task, tidx) => (
                                                        <div key={tidx} className="bg-bg-main border border-glass-border p-4 rounded-2xl flex items-center justify-between group hover:border-accent-1/30 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex flex-col items-center justify-center shrink-0 border border-zinc-700/50">
                                                                    <span className="text-[10px] font-black text-zinc-400 leading-none">{task.time}</span>
                                                                </div>
                                                                <div>
                                                                    <h6 className="text-[13px] font-black text-zinc-200 uppercase tracking-tight">{task.subject}</h6>
                                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{task.topic}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                                                                <Clock size={12} className="text-zinc-500" />
                                                                <span className="text-[10px] font-black text-zinc-400">{task.duration}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-plan"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-6 px-10"
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-800/50 flex items-center justify-center text-zinc-600 border border-zinc-700/50 border-dashed">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Nenhum plano disponível</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed font-medium">Use o chat ao lado para descrever sua rotina e eu gerarei um cronograma otimizado para você!</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizedSchedule;
