import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { OfficialQuestion } from '../data/officialQuestions';

interface InteractiveQuestionCardProps {
    question: OfficialQuestion;
    theme: 'light' | 'dark';
}

const InteractiveQuestionCard: React.FC<InteractiveQuestionCardProps> = ({ question, theme }) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    const [aiResource, setAiResource] = useState<{
        title: string;
        sourceText: string;
        contextInfo: string;
        type: string;
    } | null>(null);
    const [loadingResource, setLoadingResource] = useState(false);
    const [errorResource, setErrorResource] = useState(false);

    // Fetch the AI-generated resource on mount or when the question changes
    useEffect(() => {
        let isMounted = true;
        setAiResource(null);
        setErrorResource(false);
        setLoadingResource(true);

        const fetchResource = async () => {
            try {
                const res = await fetch("/api/generate-question-resource", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: question.id,
                        text: question.text,
                        origin: question.origin,
                        year: question.year,
                        area: question.area,
                        subtopic: question.subtopic,
                        options: question.options
                    })
                });
                if (!res.ok) throw new Error("Erro na requisição");
                const data = await res.json();
                if (isMounted) {
                    setAiResource(data);
                }
            } catch (err) {
                console.error("Erro ao carregar recurso da IA:", err);
                if (isMounted) {
                    setErrorResource(true);
                }
            } finally {
                if (isMounted) {
                    setLoadingResource(false);
                }
            }
        };

        fetchResource();

        return () => {
            isMounted = false;
        };
    }, [question.id]);

    useEffect(() => {
        setSelectedIdx(null);
        setIsRevealed(false);
    }, [question.id]);

    const handleSelect = (idx: number) => {
        if (isRevealed) return;
        setSelectedIdx(idx);
    };

    const handleValidate = () => {
        if (selectedIdx === null) return;
        setIsRevealed(true);
    };

    const isCorrect = selectedIdx === question.correct;

    return (
        <div className={`w-full border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-white/5'} rounded-[2rem] p-6 md:p-10 space-y-8`}>
            {/* Header: Area & ID */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-1 px-3 py-1 bg-accent-1/10 rounded-lg border border-accent-1/20">
                        {question.origin} {question.year}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {question.subtopic}
                    </span>
                </div>
                <div className="text-zinc-500">
                    <HelpCircle size={18} opacity={0.5} />
                </div>
            </div>

            {/* Visual Resource (Native Chart or AI-Generated Support Text) */}
            {(() => {
                if (loadingResource) {
                    return (
                        <div className="w-full bg-slate-900/30 p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-accent-1 animate-bounce">
                                Corvo IA: Carregando Recurso Textual...
                            </p>
                            <span className="text-[10px] text-zinc-500 font-semibold text-center">Recuperando dados da prova real</span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col gap-6 w-full">
                        {/* CHART (if available) - ALWAYS SHOW THIS FIRST! */}
                        {question.chartData && (
                            <div className="w-full bg-black/20 p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-3 mb-6 text-accent-1">
                                    <BarChart3 size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Gráfico Gerado em Código</span>
                                </div>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={question.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                            <XAxis 
                                                dataKey="label" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                                            />
                                            <RechartsTooltip 
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {question.chartData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === question.chartData!.length - 1 ? '#3b82f6' : '#1e293b'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* AI RESOURCE (if available) */}
                        {aiResource ? (
                            <div className="w-full bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-1/5 rounded-full filter blur-2xl transition-all group-hover:bg-accent-1/10" />
                                
                                <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/5 text-accent-1">
                                    <div className="flex items-center gap-3">
                                        <Info size={18} />
                                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                            {aiResource.type || "Recurso Acadêmico"}
                                        </span>
                                    </div>
                                    <span className="bg-accent-1/15 text-accent-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent-1/25">
                                        Corvo AI Assist
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <h6 className="text-[14px] font-black tracking-tight text-white uppercase sm:text-base">
                                        {aiResource.title}
                                    </h6>
                                    <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line p-5 rounded-2xl bg-black/20 border border-white/5">
                                        {aiResource.sourceText}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-2">
                                    <span>{aiResource.contextInfo || `Fonte Oficial: ${question.origin} ${question.year}`}</span>
                                    <span className="text-zinc-650">ID: #{question.id}</span>
                                </div>
                            </div>
                        ) : (
                            /* Only show standard vestibular card if there is NO aiResource and NO chartData */
                            !question.chartData && (
                                <div className="w-full bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3 text-accent-1">
                                        <Info size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none text-zinc-400">Questão do Vestibular</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-zinc-400 select-none bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        Fonte Oficial: {question.origin || "Vestibular"} {question.year || ""}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                );
            })()}

            {/* Question Text */}
            <h5 className={`text-lg md:text-xl font-bold leading-relaxed ${theme === 'light' ? 'text-slate-800' : 'text-zinc-100'}`}>
                {question.text}
            </h5>

            {/* Alternatives - Stacked Vertically as Requested */}
            <div className="flex flex-col gap-3">
                {question.options.map((opt, idx) => {
                    const isSelected = selectedIdx === idx;
                    const isCorrectAlt = idx === question.correct;
                    
                    let cardStyle = theme === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]';

                    if (isRevealed) {
                        if (isCorrectAlt) {
                            cardStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold';
                        } else if (isSelected) {
                            cardStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold';
                        }
                    } else if (isSelected) {
                        cardStyle = 'bg-accent-1/10 border-accent-1/40 text-accent-1 font-bold';
                    }

                    return (
                        <button
                            key={idx}
                            disabled={isRevealed}
                            onClick={() => handleSelect(idx)}
                            className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 group ${cardStyle}`}
                        >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black uppercase border transition-colors ${
                                isSelected ? 'bg-accent-1 border-accent-1 text-slate-950' : 'bg-white/5 border-white/10 group-hover:border-white/20'
                            }`}>
                                {String.fromCharCode(97 + idx)}
                            </span>
                            <span className="text-[15px] md:text-base leading-relaxed pt-0.5">
                                {opt}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Action Section */}
            <div className="pt-4">
                {!isRevealed ? (
                    <button
                        disabled={selectedIdx === null}
                        onClick={handleValidate}
                        className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            selectedIdx !== null
                                ? 'bg-accent-1 text-slate-950 shadow-lg shadow-accent-1/25 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        Validar Resposta
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                            isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                            {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {isCorrect ? 'Excelente! Você acertou!' : 'Quase lá! Veja a explicação abaixo.'}
                            </span>
                        </div>

                        <div className="bg-gradient-to-br from-accent-1/5 to-transparent border border-white/5 p-6 md:p-8 rounded-[2rem] space-y-3">
                            <div className="flex items-center gap-2 text-accent-1 mb-2">
                                <Info size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Resolução Comentada</span>
                            </div>
                            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-medium italic">
                                "{question.explanation}"
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedIdx(null);
                                setIsRevealed(false);
                            }}
                            className="w-full h-12 bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all"
                        >
                            Refazer Questão
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default InteractiveQuestionCard;
