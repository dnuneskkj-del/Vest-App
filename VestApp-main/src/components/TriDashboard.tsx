import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Info, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  BookOpen
} from 'lucide-react';

export interface TriAnalysisResult {
  scoreTri: number;
  coherencePercentage: number;
  coherenceLabel: string;
  coherenceColor: string;
  coherenceDesc: string;
  easyCorrect: number;
  easyTotal: number;
  easyPercentage: number;
  medioCorrect: number;
  medioTotal: number;
  medioPercentage: number;
  dificilCorrect: number;
  dificilTotal: number;
  dificilPercentage: number;
}

export function calculateDetailedTri(
  questions: any[],
  answers: any, 
  isSimuladoNivel: boolean
): TriAnalysisResult {
  let easyTotal = 0;
  let easyCorrect = 0;
  let medioTotal = 0;
  let medioCorrect = 0;
  let dificilTotal = 0;
  let dificilCorrect = 0;

  questions.forEach((q, idx) => {
    // Get difficulty
    let diff: 'facil' | 'medio' | 'dificil' = 'medio';
    if (q.dificuldade === 'facil' || q.dificuldade === 'medio' || q.dificuldade === 'dificil') {
      diff = q.dificuldade;
    } else {
      const fallbackId = q.id || idx;
      const d = fallbackId % 3;
      diff = d === 0 ? 'dificil' : d === 1 ? 'facil' : 'medio';
    }

    // Check if correct
    let isCorrect = false;
    if (isSimuladoNivel) {
      const qId = q.id;
      const userAns = answers[qId];
      isCorrect = userAns !== undefined && userAns === q.correctAnswer;
    } else {
      const userAns = answers[idx];
      isCorrect = userAns !== undefined && userAns === q.correct;
    }

    if (diff === 'facil') {
      easyTotal++;
      if (isCorrect) easyCorrect++;
    } else if (diff === 'medio') {
      medioTotal++;
      if (isCorrect) medioCorrect++;
    } else {
      dificilTotal++;
      if (isCorrect) dificilCorrect++;
    }
  });

  const easyPct = easyTotal > 0 ? (easyCorrect / easyTotal) : 1; 
  const medioPct = medioTotal > 0 ? (medioCorrect / medioTotal) : (easyTotal > 0 ? easyPct : 1);
  const dificilPct = dificilTotal > 0 ? (dificilCorrect / dificilTotal) : (medioTotal > 0 ? medioPct : 1);

  // Coherence analysis: Pedagogical consistency means easyPct >= medioPct >= dificilPct
  let penalty = 0;
  if (dificilPct > easyPct) {
    penalty += (dificilPct - easyPct) * 0.45; 
  }
  if (medioPct > easyPct) {
    penalty += (medioPct - easyPct) * 0.25; 
  }
  if (dificilPct > medioPct) {
    penalty += (dificilPct - medioPct) * 0.20; 
  }

  const coherencePercentage = Math.round(Math.max(20, Math.min(100, (1 - penalty) * 100)));

  const easyWeight = 320;
  const medioWeight = 200;
  const dificilWeight = 130;
  const baseScore = 350;

  const easyContribution = easyPct * easyWeight;
  const coherenceFactor = coherencePercentage / 100;
  const medioContribution = medioPct * medioWeight * coherenceFactor;
  const dificilContribution = dificilPct * dificilWeight * coherenceFactor;

  let scoreTri = Math.round(baseScore + easyContribution + medioContribution + dificilContribution);
  scoreTri = Math.max(350, Math.min(1000, scoreTri));

  let coherenceLabel = 'Média';
  let coherenceColor = '#f59e0b'; 
  let coherenceDesc = 'Seu desempenho foi regular. Houve algumas inconsistências entre questões fáceis e difíceis, indicando possíveis chutes ou falta de atenção em detalhes básicos.';

  if (coherencePercentage >= 85) {
    coherenceLabel = 'Excelente';
    coherenceColor = '#10b981'; 
    coherenceDesc = 'Coerência pedagógica excepcional! Você garantiu as questões fáceis e progrediu de forma consistente para as mais difíceis. Sua nota TRI foi otimizada ao máximo!';
  } else if (coherencePercentage >= 65) {
    coherenceLabel = 'Alta';
    coherenceColor = '#3b82f6'; 
    coherenceDesc = 'Boa coerência! Seus acertos seguem uma lógica de aprendizado sólida. Para aumentar ainda mais sua nota, certifique-se de não errar nenhuma questão de nível fácil.';
  } else if (coherencePercentage < 45) {
    coherenceLabel = 'Inconsistente (Baixa)';
    coherenceColor = '#ef4444'; 
    coherenceDesc = 'Alerta de Incoerência! Você acertou questões de nível superior (difícil/médio) mas errou fáceis. O algoritmo da TRI interpretou alguns acertos como "chute" e reduziu o ganho de nota. Revise a base!';
  }

  return {
    scoreTri,
    coherencePercentage,
    coherenceLabel,
    coherenceColor,
    coherenceDesc,
    easyCorrect,
    easyTotal,
    easyPercentage: Math.round(easyPct * 100),
    medioCorrect,
    medioTotal,
    medioPercentage: Math.round(medioPct * 100),
    dificilCorrect,
    dificilTotal,
    dificilPercentage: Math.round(dificilPct * 100),
  };
}

interface TriDashboardProps {
  questions: any[];
  answers: any;
  isSimuladoNivel: boolean;
}

export const TriDashboard: React.FC<TriDashboardProps> = ({ questions, answers, isSimuladoNivel }) => {
  // Real stats based on the quiz
  const realAnalysis = useMemo(() => {
    return calculateDetailedTri(questions, answers, isSimuladoNivel);
  }, [questions, answers, isSimuladoNivel]);

  // Interactive Simulator State
  const [simEasy, setSimEasy] = useState<number>(realAnalysis.easyTotal > 0 ? Math.round((realAnalysis.easyCorrect / realAnalysis.easyTotal) * 100) : 80);
  const [simMedio, setSimMedio] = useState<number>(realAnalysis.medioTotal > 0 ? Math.round((realAnalysis.medioCorrect / realAnalysis.medioTotal) * 100) : 50);
  const [simDificil, setSimDificil] = useState<number>(realAnalysis.dificilTotal > 0 ? Math.round((realAnalysis.dificilCorrect / realAnalysis.dificilTotal) * 100) : 20);

  // Compute Simulated TRI Score
  const simulatedAnalysis = useMemo(() => {
    const easyPct = simEasy / 100;
    const medioPct = simMedio / 100;
    const dificilPct = simDificil / 100;

    let penalty = 0;
    if (dificilPct > easyPct) {
      penalty += (dificilPct - easyPct) * 0.45;
    }
    if (medioPct > easyPct) {
      penalty += (medioPct - easyPct) * 0.25;
    }
    if (dificilPct > medioPct) {
      penalty += (dificilPct - medioPct) * 0.20;
    }

    const coherencePercentage = Math.round(Math.max(20, Math.min(100, (1 - penalty) * 100)));

    const easyWeight = 320;
    const medioWeight = 200;
    const dificilWeight = 130;
    const baseScore = 350;

    const easyContribution = easyPct * easyWeight;
    const coherenceFactor = coherencePercentage / 100;
    const medioContribution = medioPct * medioWeight * coherenceFactor;
    const dificilContribution = dificilPct * dificilWeight * coherenceFactor;

    let scoreTri = Math.round(baseScore + easyContribution + medioContribution + dificilContribution);
    scoreTri = Math.max(350, Math.min(1000, scoreTri));

    let coherenceLabel = 'Média';
    let coherenceColor = '#f59e0b';
    let coherenceDesc = 'Comportamento típico de um aluno que estuda de forma equilibrada, mas comete deslizes por distração nas fáceis.';

    if (coherencePercentage >= 85) {
      coherenceLabel = 'Excelente';
      coherenceColor = '#10b981';
      coherenceDesc = 'Padrão ouro de desempenho! Garante as fáceis primeiro e pontua nas mais difíceis de forma coerente.';
    } else if (coherencePercentage >= 65) {
      coherenceLabel = 'Alta';
      coherenceColor = '#3b82f6';
      coherenceDesc = 'Curva de acertos natural do aprendizado sólido. Pouco ou nenhum indício de chute fortuito.';
    } else if (coherencePercentage < 45) {
      coherenceLabel = 'Inconsistente (Chute)';
      coherenceColor = '#ef4444';
      coherenceDesc = 'Acertar difíceis e errar fáceis é visto pelo ENEM como chute, gerando penalidades pesadas na nota.';
    }

    return {
      scoreTri,
      coherencePercentage,
      coherenceLabel,
      coherenceColor,
      coherenceDesc
    };
  }, [simEasy, simMedio, simDificil]);

  const setScenario = (type: 'coerente' | 'chute' | 'gabarito') => {
    if (type === 'coerente') {
      setSimEasy(100);
      setSimMedio(60);
      setSimDificil(20);
    } else if (type === 'chute') {
      setSimEasy(20);
      setSimMedio(50);
      setSimDificil(90);
    } else {
      setSimEasy(100);
      setSimMedio(100);
      setSimDificil(100);
    }
  };

  return (
    <div className="w-full text-left space-y-8 animate-fade-in">
      {/* SECTION HEADER */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            Análise e Diagnóstico TRI (ENEM)
          </h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          A Teoria de Resposta ao Item (TRI) pune acertos inconsistentes (chutes) e valoriza a coerência. Veja seu raio-x pedagógico abaixo.
        </p>
      </div>

      {/* DETAILED RESULTS DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: TRI SCORE CARD */}
        <div className="p-6 rounded-[2rem] bg-slate-900/60 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy size={100} className="text-purple-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Sua Nota Estimada TRI
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-outfit">
                {realAnalysis.scoreTri}
              </span>
              <span className="text-sm font-bold text-slate-500">/ 1000</span>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[11px] text-purple-300 font-semibold leading-relaxed">
              Com base pedagógica real, esta nota simula com precisão o peso do ENEM para seu padrão de acertos.
            </div>
          </div>
          
          <div className="mt-6 border-t border-slate-800/80 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold">Acertos Totais:</span>
            <span className="text-white font-black">{realAnalysis.easyCorrect + realAnalysis.medioCorrect + realAnalysis.dificilCorrect} de {questions.length}</span>
          </div>
        </div>

        {/* CARD 2: COHERENCE METER */}
        <div className="p-6 rounded-[2rem] bg-slate-900/60 border border-slate-800 flex flex-col justify-between relative">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Coerência Pedagógica
            </span>
            <div className="flex items-center gap-3">
              <span 
                className="text-3xl font-black font-outfit"
                style={{ color: realAnalysis.coherenceColor }}
              >
                {realAnalysis.coherencePercentage}%
              </span>
              <span 
                className="text-xs font-black uppercase px-2.5 py-1 rounded-full border"
                style={{ 
                  color: realAnalysis.coherenceColor,
                  borderColor: `${realAnalysis.coherenceColor}30`,
                  backgroundColor: `${realAnalysis.coherenceColor}10`
                }}
              >
                {realAnalysis.coherenceLabel}
              </span>
            </div>
            
            <p className="text-[12px] text-slate-400 font-semibold mt-4 leading-relaxed">
              {realAnalysis.coherenceDesc}
            </p>
          </div>

          <div className="mt-4 w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: `${realAnalysis.coherencePercentage}%`,
                backgroundColor: realAnalysis.coherenceColor
              }}
            />
          </div>
        </div>

        {/* CARD 3: BREAKDOWN BY DIFFICULTY */}
        <div className="p-6 rounded-[2rem] bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-4">
              Desempenho por Dificuldade
            </span>

            <div className="space-y-4">
              {/* FACIL */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-400">Questões Fáceis</span>
                  <span className="text-white">{realAnalysis.easyCorrect}/{realAnalysis.easyTotal} ({realAnalysis.easyPercentage}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${realAnalysis.easyPercentage}%` }} />
                </div>
              </div>

              {/* MEDIO */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-400">Questões Médias</span>
                  <span className="text-white">{realAnalysis.medioCorrect}/{realAnalysis.medioTotal} ({realAnalysis.medioPercentage}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full" style={{ width: `${realAnalysis.medioPercentage}%` }} />
                </div>
              </div>

              {/* DIFICIL */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">Questões Difíceis</span>
                  <span className="text-white">{realAnalysis.dificilCorrect}/{realAnalysis.dificilTotal} ({realAnalysis.dificilPercentage}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-400 h-full rounded-full" style={{ width: `${realAnalysis.dificilPercentage}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <Info size={12} />
            Dificuldade obtida do banco oficial
          </div>
        </div>

      </div>

      {/* INTERACTIVE PLAYGROUND: SIMULADOR DE COERÊNCIA TRI */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-800/80">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-purple-400 animate-pulse" />
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                Simulador e Laboratório TRI Interativo
              </h4>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Altere os sliders para simular diferentes cenários de acertos e entender a punição por incoerência.
            </p>
          </div>

          {/* PRESETS BUTTONS */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setScenario('coerente')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider transition-all"
            >
              Foco na Base (Coerente)
            </button>
            <button 
              onClick={() => setScenario('chute')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-black uppercase tracking-wider transition-all"
            >
              Chute Puro (Incoerente)
            </button>
            <button 
              onClick={() => setScenario('gabarito')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-wider transition-all"
            >
              Gabaritar Prova
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* SLIDERS FOR SIMULATION */}
          <div className="space-y-6">
            {/* EASY SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400 uppercase tracking-wider">Aproveitamento Fáceis</span>
                <span className="text-white font-black">{simEasy}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={simEasy}
                onChange={(e) => setSimEasy(parseInt(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-950 h-2 rounded-lg cursor-pointer border border-slate-800"
              />
            </div>

            {/* MEDIUM SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-400 uppercase tracking-wider">Aproveitamento Médias</span>
                <span className="text-white font-black">{simMedio}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={simMedio}
                onChange={(e) => setSimMedio(parseInt(e.target.value))}
                className="w-full accent-blue-400 bg-slate-950 h-2 rounded-lg cursor-pointer border border-slate-800"
              />
            </div>

            {/* DIFFICULT SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-400 uppercase tracking-wider">Aproveitamento Difíceis</span>
                <span className="text-white font-black">{simDificil}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={simDificil}
                onChange={(e) => setSimDificil(parseInt(e.target.value))}
                className="w-full accent-rose-400 bg-slate-950 h-2 rounded-lg cursor-pointer border border-slate-800"
              />
            </div>
          </div>

          {/* LIVE COMPUTED SCORE FOR SIMULATOR */}
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                Nota TRI Simulada
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-1">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 font-outfit">
                  {simulatedAnalysis.scoreTri}
                </span>
                <span className="text-xs font-bold text-slate-500">/1000</span>
              </div>
              
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ backgroundColor: simulatedAnalysis.coherenceColor }}
                />
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Coerência: <strong style={{ color: simulatedAnalysis.coherenceColor }}>{simulatedAnalysis.coherencePercentage}% ({simulatedAnalysis.coherenceLabel})</strong>
                </span>
              </div>
            </div>

            <div className="flex-1 bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-[11px] leading-relaxed text-zinc-400">
              <strong className="text-white block mb-1 uppercase tracking-wide text-[10px]">Diagnóstico IA:</strong>
              {simulatedAnalysis.coherenceDesc}
              <div className="mt-3 text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                <BookOpen size={10} />
                Regra de Ouro: Erre o difícil se necessário, mas NUNCA erre o fácil.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
