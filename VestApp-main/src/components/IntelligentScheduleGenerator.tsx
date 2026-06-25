import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, Target, Zap, ChevronRight, BarChart3, Save } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface StudyTask {
    time: string;
    subject: string;
    topic: string;
    duration: string;
    completed?: boolean;
}

interface StudyDay {
    day: string;
    tasks: StudyTask[];
}

interface PersonalizedStudyPlan {
    type: string;
    analysis: string;
    targetExam?: string;
    daysRemaining?: number;
    weeksRemaining?: number;
    schedule: StudyDay[];
}

interface IntelligentScheduleGeneratorProps {
    userId: string;
    isOwner: boolean;
    onPlanGenerated?: (plan: StudyDay[]) => void;
}

const IntelligentScheduleGenerator: React.FC<IntelligentScheduleGeneratorProps> = ({ userId, isOwner, onPlanGenerated }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [personalizedPlan, setPersonalizedPlan] = useState<PersonalizedStudyPlan | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<'chat' | 'display'>('chat');
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (step === 'chat') {
            scrollToBottom();
        }
    }, [messages, step]);

    useEffect(() => {
        // Initial greeting
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'model',
                    parts: [{ text: 'Olá! Sou seu Consultor de Estudos IA. Vou te ajudar a criar um cronograma imbatível para sua aprovação. Para começar, qual vestibular você vai prestar e como é sua rotina diária (trabalho, escola, horários livres)?' }]
                }
            ]);
        }
    }, []);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isSending) return;

        const newMessages: ChatMessage[] = [
            ...messages,
            { role: 'user', parts: [{ text }] }
        ];

        setMessages(newMessages);
        setInputValue('');
        setIsSending(true);

        try {
            const response = await fetch('/api/chat-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) throw new Error('Falha na comunicação com a IA');

            const data = await response.json();
            const aiText = data.text;

            // Try to extract JSON from AI response
            const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/{[\s\S]*?}/);
            let extractedPlan : PersonalizedStudyPlan | null = null;

            if (jsonMatch) {
                try {
                    const jsonStr = jsonMatch[1] || jsonMatch[0];
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.type === 'study_plan' && parsed.schedule) {
                        extractedPlan = parsed;
                    }
                } catch (e) {
                    console.error("Erro ao parsear JSON do cronograma", e);
                }
            }

            setMessages(prev => [...prev, { role: 'model', parts: [{ text: aiText.replace(/```json[\s\S]*?```/g, '').trim() }] }]);
            
            if (extractedPlan) {
                setPersonalizedPlan(extractedPlan);
                toast.success('🎉 Cronograma Inteligente Gerado!');
                setStep('display');
            }

        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Ocorreu um erro ao conversar com a IA.");
        } finally {
            setIsSending(false);
        }
    };

    const saveToFirestore = async () => {
        if (!personalizedPlan || !isOwner || !userId) return;

        setIsSaving(true);
        try {
            const planWithComp = personalizedPlan.schedule.map(day => ({
                ...day,
                tasks: day.tasks.map(t => ({ ...t, completed: false }))
            }));

            await setDoc(doc(db, 'schedules', userId), {
                userId,
                plan: planWithComp,
                analysis: personalizedPlan.analysis,
                targetExam: personalizedPlan.targetExam || '',
                daysRemaining: personalizedPlan.daysRemaining || 0,
                updatedAt: serverTimestamp(),
                preferences: {
                    examDate: new Date(Date.now() + (personalizedPlan.daysRemaining || 0) * 86400000).toISOString()
                }
            }, { merge: true });

            toast.success('Cronograma salvo no seu perfil!');
            if (onPlanGenerated) onPlanGenerated(planWithComp);
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            handleFirestoreError(error, OperationType.WRITE, `schedules/${userId}`);
        } finally {
            setIsSaving(false);
        }
    };

    const renderChat = () => (
        <div className="flex flex-col h-[600px] bg-white/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent-1/20 border border-accent-1/30 flex items-center justify-center text-accent-1">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Arquiteto de Rotina IA</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">Pronto para calcular sua aprovação</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
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
                                    ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400' 
                                    : 'bg-accent-1 border-accent-1 text-slate-950'
                            }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-accent-1 text-slate-950 font-medium rounded-tr-none'
                                    : 'bg-slate-50/80 dark:bg-bg-main border border-slate-200 dark:border-glass-border text-slate-700 dark:text-zinc-300 rounded-tl-none shadow-sm'
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
                            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-bg-main border border-slate-200 dark:border-glass-border text-slate-500 dark:text-zinc-500 rounded-tl-none flex items-center gap-2 shadow-sm">
                                <Loader2 size={16} className="animate-spin text-accent-1" />
                                <span className="text-xs font-bold uppercase tracking-widest">IA está calculando sua rota...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }} className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
                <div className="relative group">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ex: Trabalho das 8h às 17h, quero passar em Med na USP..."
                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-glass-border rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-accent-1/50 transition-all text-slate-900 dark:text-zinc-200 shadow-inner"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-accent-1 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer shadow-lg shadow-accent-1/20"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );

    const renderDisplay = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-accent-1/10 border border-accent-1/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-1/20 flex items-center justify-center text-accent-1">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-accent-1 uppercase tracking-widest">Foco Principal</p>
                        <h4 className="text-lg font-black dark:text-white uppercase truncate">{personalizedPlan?.targetExam || 'Vestibular'}</h4>
                    </div>
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tempo Restante</p>
                        <h4 className="text-lg font-black dark:text-white uppercase">
                            {personalizedPlan?.weeksRemaining} Semanas
                        </h4>
                    </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                         <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Status da Rota</p>
                        <h4 className="text-lg font-black dark:text-white uppercase">Otimizada</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-2 bg-accent-1/20 rounded-xl text-accent-1">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Análise Estratégica da IA</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium mt-1">{personalizedPlan?.analysis}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalizedPlan?.schedule.map((day, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col h-full">
                            <h5 className="text-[10px] font-black text-accent-1 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-1" />
                                {day.day}
                            </h5>
                            <div className="space-y-3 flex-1">
                                {day.tasks.map((task, tidx) => (
                                    <div key={tidx} className="p-3 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase">{task.time}</span>
                                            <span className="text-[8px] font-bold text-accent-1 bg-accent-1/10 px-1.5 py-0.5 rounded uppercase">{task.duration}</span>
                                        </div>
                                        <h6 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{task.subject}</h6>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1 line-clamp-1">{task.topic}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-1/20 flex items-center justify-center text-accent-1">
                            <AlertCircle size={20} />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest max-w-[250px]">
                            Salve este cronograma para ativá-lo no seu perfil e monitorar seu progresso diário.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button 
                            onClick={() => setStep('chat')}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            Ajustar Rotina
                        </button>
                        <button 
                            onClick={saveToFirestore}
                            disabled={isSaving}
                            className="px-8 py-2.5 rounded-xl bg-accent-1 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-accent-1/20"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Salvar Cronograma
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-4">
            <div className="mb-10 text-center space-y-4">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-accent-1/10 border border-accent-1/20 text-accent-1">
                    <Sparkles size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tecnologia Antigravity</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">
                    Gerador de <span className="text-accent-1">Cronograma</span> Inteligente
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-[0.3em] max-w-xl mx-auto">
                    Converse com nossa IA para otimizar sua rotina e garantir sua vaga.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'chat' ? (
                    <motion.div
                        key="chat-view"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        {renderChat()}
                    </motion.div>
                ) : (
                    <motion.div
                        key="display-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {renderDisplay()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntelligentScheduleGenerator;
