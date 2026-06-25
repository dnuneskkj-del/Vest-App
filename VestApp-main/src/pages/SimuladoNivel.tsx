import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, BarChart3, Info, CheckCircle2, ChevronRight, ChevronLeft, Trophy, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';
import { STATIC_SIMULADOS } from '../data/staticSimulados';
import { auth, db, getSimuladoHistory, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { TriDashboard, calculateDetailedTri } from '../components/TriDashboard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const SimuladoNivel = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [validado, setValidado] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const filteredSimulados = useMemo(() => {
    if (!STATIC_SIMULADOS || !Array.isArray(STATIC_SIMULADOS)) return [];
    
    let result = [...STATIC_SIMULADOS];

    // Filter by Level
    if (level && level !== 'todos') {
      result = result.filter(q => q.dificuldade === level);
    }

    // Filter by Topic (if provided via query param)
    const searchParams = new URLSearchParams(location.search);
    const subtopic = searchParams.get('subtopic');
    const materia = searchParams.get('materia');

    if (subtopic) {
        const normSub = subtopic.toLowerCase();
        result = result.filter(q => 
            (q.materia && q.materia.toLowerCase().includes(normSub)) || 
            (q.categoria && q.categoria.toLowerCase().includes(normSub)) ||
            (q.enunciado && q.enunciado.toLowerCase().includes(normSub))
        );
    }

    if (materia) {
        const normMat = materia.toLowerCase();
        result = result.filter(q => 
            (q.categoria && q.categoria.toLowerCase().includes(normMat)) || 
            (q.materia && q.materia.toLowerCase().includes(normMat))
        );
    }

    // Shuffle result and limit
    // If it's a general level (no subtopic/materia) and it's 'facil', use 15 questions
    const isGeneral = !subtopic && !materia;
    let limit = 30;
    if (isGeneral && level === 'facil') limit = 15;
    else if (isGeneral) limit = 20; // Default for others for variety

    return result.sort(() => Math.random() - 0.5).slice(0, limit);
  }, [level, location.search]);

  const questao = filteredSimulados[currentIdx] || null;

  // Reset index when level or filters change
  useEffect(() => {
    setCurrentIdx(0);
    setAnswers({});
    setValidado({});
    setShowResults(false);
    setHasSaved(false);
  }, [filteredSimulados]);

  useEffect(() => {
    if (showResults && !hasSaved && auth.currentUser && db) {
      const correct = Object.keys(answers).reduce((acc, qId) => {
        const q = filteredSimulados.find(f => f.id === parseInt(qId));
        return (q && answers[parseInt(qId)] === q.correctAnswer) ? acc + 1 : acc;
      }, 0);

      const totalQuestions = filteredSimulados.length;
      const { scoreTri } = calculateDetailedTri(filteredSimulados, answers, true);

      addDoc(collection(db, 'simulado_results'), {
        userId: auth.currentUser.uid,
        examTitle: `Prática: ${level?.toUpperCase() || 'GERAL'}`,
        isFullExam: false,
        correctAnswers: correct,
        totalQuestions: totalQuestions,
        scoreTri: scoreTri,
        timeSeconds: 0,
        area: (questao && questao.materia) || 'Geral',
        createdAt: serverTimestamp()
      }).then(async () => {
        // Update user XP
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        await updateDoc(userRef, {
            xp: increment(correct * 60),
            simuladosCount: increment(1)
        });
        
        setHasSaved(true);
        return getSimuladoHistory(auth.currentUser!.uid);
      }).then(setHistory).catch(err => {
        console.error("Erro ao salvar/buscar histórico:", err);
        handleFirestoreError(err, OperationType.WRITE, 'simulado_results');
      });
    }
  }, [showResults, hasSaved, questao]);

  const [aiResource, setAiResource] = useState<{
    title: string;
    sourceText: string;
    contextInfo: string;
    type: string;
    chartData?: any[];
  } | null>(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [errorResource, setErrorResource] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch AI question support resource on-the-fly when index/question ID changes
  useEffect(() => {
    if (!questao) return;

    let isMounted = true;
    setAiResource(null);
    setErrorResource(null);
    setLoadingResource(true);

    const fetchResource = async () => {
      try {
        const res = await fetch("/api/generate-question-resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: questao.id,
            text: questao.enunciado,
            origin: questao.vestibular,
            area: questao.materia,
            options: questao.alternativas?.map((a: any) => a.text) || []
          })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Erro na requisição");
        }
        const data = await res.json();
        console.log("DEBUG: aiResource data received:", data);
        if (isMounted) {
          setAiResource(data);
        }
      } catch (err: any) {
        console.error("Erro ao carregar recurso da IA:", err);
        if (isMounted) {
          setErrorResource(err.message || "Erro desconhecido");
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
  }, [questao?.id, retryCount]);

  // Safe navigation if no questions are found for this level
  if (!questao && !showResults) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-white p-8">
          <Info size={48} className="text-accent-1 mb-4" />
          <p className="text-xl font-bold mb-2">Nenhuma questão encontrada.</p>
          <p className="text-zinc-500 mb-6">Não conseguimos encontrar itens para este filtro específico.</p>
          <button 
            onClick={() => navigate('/simulado')}
            className="px-6 py-3 bg-accent-1 text-slate-950 font-bold rounded-2xl"
          >
            Voltar para Temas
          </button>
        </div>
      </Layout>
    );
  }

  const handleSelect = (letra: string) => {
    if (!questao || validado[questao.id]) return;
    setAnswers(prev => ({ ...prev, [questao.id]: letra }));
  };

  const handleValidar = () => {
    if (!questao) return;
    setValidado(prev => ({ ...prev, [questao.id]: true }));
  };

  const handleNext = () => {
    if (currentIdx < filteredSimulados.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    filteredSimulados.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return {
      correct,
      total: filteredSimulados.length,
      percentage: Math.round((correct / filteredSimulados.length) * 100)
    };
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <Layout>
        <div className="min-h-[60vh] pt-12 pb-20 px-4 flex items-center justify-center">
          <div className="max-w-4xl w-full bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 md:p-12 text-center shadow-2xl space-y-8">
            <div>
              <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-6 border-4 border-blue-600/20 animate-bounce">
                  <Trophy size={40} className="text-blue-600" />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Simulado Finalizado</h2>
              <p className="text-sm text-slate-400">Desempenho Geral e Inteligência TRI</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Acertos Totais</p>
                    <p className="text-4xl font-black text-white">{score.correct} / {score.total}</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Aproveitamento Lógico</p>
                    <p className="text-4xl font-black text-blue-500">{score.percentage}%</p>
                </div>
            </div>

            {/* INTEGRATED DETAILED TRI DIAGNOSTIC AND LAB */}
            <TriDashboard 
              questions={filteredSimulados} 
              answers={answers} 
              isSimuladoNivel={true} 
            />
            
            {history.length > 0 && (
                <div className="mt-8 p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800/80 text-left">
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Sua Evolução nos Simulados</h4>
                    <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
                <button 
                    onClick={() => {
                        setCurrentIdx(0);
                        setAnswers({});
                        setValidado({});
                        setShowResults(false);
                        setHasSaved(false);
                    }}
                    className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                >
                    <RotateCcw size={16} />
                    Refazer Simulado
                </button>
                <button 
                    onClick={() => navigate('/simulado')}
                    className="flex-1 h-14 rounded-2xl bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <ArrowLeft size={16} />
                    Voltar ao Início
                </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-2 sm:px-4 w-full">
        <div className="flex flex-col w-full mx-auto" style={{ maxWidth: '850px', paddingBottom: '80px', borderRadius: '24px', border: '1px solid #1e293b', padding: '24px', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-bold uppercase transition-colors"
            >
              <ArrowLeft size={14} />
              Sair do Simulado
            </button>
            <div className="text-[10px] sm:text-xs font-black text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-2">
               TREINAMENTO NATIVO • {level?.toUpperCase()}
            </div>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Questão {currentIdx + 1} de {filteredSimulados.length} • {questao?.vestibular || 'Geral'}
          </div>
          
          {/* RECURSO VISUAL NATIVO OU SUPORTE DE IA */}
          <div style={{ width: '100%', marginBottom: '30px', backgroundColor: '#020617', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            {(() => {
              if (loadingResource) {
                return (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '180px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#a855f7', letterSpacing: '0.1em', margin: 0 }}>
                      Corvo IA: Restaurando Texto de Apoio Real...
                    </p>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Consultando acervo de provas e recuperando conteúdo original</span>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                  {/* CHART (if available) - ALWAYS SHOW THIS FIRST! */}
                  {(questao?.chartData || aiResource?.chartData) && (
                    <div style={{ height: '300px', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#3b82f6' }}>
                          <BarChart3 size={20} />
                          <span style={{ fontSize: '12px', fontWeight: 'black', textTransform: 'uppercase' }}>Gráfico Gerado em Código</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={questao?.chartData || aiResource?.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis 
                            dataKey="label" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {(questao?.chartData || aiResource?.chartData).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === (questao?.chartData || aiResource?.chartData).length - 1 ? '#3b82f6' : '#1e293b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* AI RESOURCE (if available) */}
                  {loadingResource ? (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b' }}>
                      <div className="animate-spin" style={{ display: 'inline-block', color: '#3b82f6', marginBottom: '16px' }}>
                        <Sparkles size={32} />
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>O Corvo está gerando recursos inteligentes...</p>
                    </div>
                  ) : errorResource ? (
                    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <AlertCircle size={32} className="text-red-500" style={{ marginBottom: '12px', margin: '0 auto' }} />
                      <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }}>{errorResource}</p>
                      <button 
                        onClick={() => setRetryCount(prev => prev + 1)} // Trigger re-fetch
                        style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : aiResource && aiResource.sourceText ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
                          <Info size={16} />
                          <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {aiResource.type || "Texto de Apoio Acadêmico"}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'black', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                          ASSISTENTE CORVO
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h6 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', textTransform: 'uppercase', margin: 0 }}>
                          {aiResource.title}
                        </h6>
                        <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.7', backgroundColor: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', whiteSpace: 'pre-line', fontFamily: 'sans-serif' }}>
                          {aiResource.sourceText}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
                        <span>{aiResource.contextInfo || `Material da Prova: ${questao?.vestibular || 'N/A'}`}</span>
                        <span>ID: #{questao?.id || currentIdx}</span>
                      </div>
                    </div>
                  ) : (
                    /* Only show standard vestibular card if there is NO aiResource and NO chartData */
                    !questao?.chartData && (
                      <div style={{ padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                                 <Info size={16} />
                                 <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Questão do Vestibular</span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                 Fonte Oficial: {questao?.vestibular || 'Geral'}
                              </span>
                          </div>
                      </div>
                    )
                  )}
                </div>
              );
            })()}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.6', marginBottom: '32px', color: '#f8fafc' }}>{questao?.enunciado || 'Carregando enunciado...'}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {questao?.alternativas?.map((alt) => {
              const isSelected = questao && answers[questao.id] === alt.id;
              const isCorrect = questao && alt.id === questao.correctAnswer;
              const hasValidated = questao && validado[questao.id];
              
              let backgroundColor = '#1e293b';
              let border = '1px solid #334155';
              let textColor = '#cbd5e1';
              
              if (isSelected && !hasValidated) {
                border = '2px solid #3b82f6';
                backgroundColor = 'rgba(59, 130, 246, 0.05)';
                textColor = '#fff';
              } else if (hasValidated) {
                if (isCorrect) {
                  backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  border = '1px solid #10b981';
                  textColor = '#10b981';
                } else if (isSelected && !isCorrect) {
                  backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  border = '1px solid #ef4444';
                  textColor = '#ef4444';
                }
              }

              return (
                <button
                  key={alt.id}
                  disabled={hasValidated}
                  onClick={() => handleSelect(alt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '18px 24px',
                    backgroundColor,
                    border,
                    borderRadius: '16px',
                    color: textColor,
                    textAlign: 'left',
                    cursor: hasValidated ? 'default' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px'
                  }}
                >
                  <strong style={{ 
                    marginRight: '16px', 
                    width: '32px', 
                    height: '32px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '8px', 
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#3b82f6' : '#475569',
                    fontSize: '12px'
                  }}>{alt.id}</strong> 
                  {alt.text}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {!validado[questao?.id || -1] ? (
              <button
                disabled={!questao || !answers[questao.id]}
                onClick={handleValidar}
                style={{
                  flex: 1,
                  padding: '18px',
                  backgroundColor: (questao && answers[questao.id]) ? '#3b82f6' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: (questao && answers[questao.id]) ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  boxShadow: (questao && answers[questao.id]) ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Validar Questão
              </button>
            ) : (
                <button
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: '18px',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {currentIdx === filteredSimulados.length - 1 ? 'Finalizar Simulado' : 'Próxima Questão'}
                  <ChevronRight size={18} />
                </button>
            )}
            
            {currentIdx > 0 && questao && !validado[questao.id] && (
                <button
                    onClick={handlePrev}
                    style={{
                        padding: '18px',
                        backgroundColor: '#1e293b',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={18} />
                </button>
            )}
          </div>

          {questao && validado[questao.id] && (
            <div style={{ marginTop: '30px', padding: '24px', backgroundColor: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#3b82f6' }}>
                 <CheckCircle2 size={18} />
                 <h4 style={{ margin: '0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolução Comentada</h4>
              </div>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{questao.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SimuladoNivel;
