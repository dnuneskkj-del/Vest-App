import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BrainCircuit } from 'lucide-react';

export default function ComicExercises() {
    const { area, subtopic } = useParams<{ area: string; subtopic: string }>();
    const [explanation, setExplanation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExercises = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/generate-explanation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ area, subtopic }),
                });
                const data = await response.json();
                setExplanation(data.explanation);
            } catch (error) {
                console.error("Error fetching exercises:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExercises();
    }, [area, subtopic]);

    if (isLoading) return <div className="text-center p-10 text-white">Gerando exercícios em quadrinhos...</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-white">
            <button
                onClick={() => navigate('/simulado')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
            >
                <ChevronLeft size={20} /> Voltar para o Simulado
            </button>
            <h1 className="text-3xl font-bold mb-8 text-center text-accent-1">Tema: {subtopic}</h1>
            
            <div className="grid gap-6 mb-12">
                {explanation?.comicPanels?.map((panel: any, i: number) => (
                    <div key={i} className={`p-6 rounded-3xl border ${panel.speaker === 'Professor' ? 'bg-accent-1/10 border-accent-1/20 ml-0 mr-12' : 'bg-white/[0.05] border-white/10 ml-12 mr-0'}`}>
                        <h4 className="font-bold text-xs uppercase mb-2 text-zinc-400">{panel.speaker}</h4>
                        <p className="text-lg leading-relaxed">{panel.text}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-2xl font-bold mb-6 text-center">Exercícios</h2>
            <div className="grid gap-6">
                {explanation?.exercicios?.map((ex: any, i: number) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 shadow-lg">
                        <p className="text-lg font-medium mb-4">{ex.pergunta}</p>
                        <div className="space-y-2">
                             {ex.opcoes.map((op: string, j: number) => (
                                 <button key={j} className="block w-full text-left p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition flex items-center gap-3">
                                     <span className="font-bold text-accent-1">{(String.fromCharCode(65+j))}</span> {op}
                                 </button>
                             ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
