import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import KnowledgeSidebar from '../components/KnowledgeSidebar';
import TrendsSidebar from '../components/TrendsSidebar';
import { useTrendingData } from '../hooks/useTrendingData';
import { Post as PostType } from '../types';
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged } from '../firebase';
import { safeLocalStorage } from '../lib/storage';
import { TriDashboard, calculateDetailedTri } from '../components/TriDashboard';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment, query, where, getDocs, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { 
    TrendingUp,
    FileSignature,
    ShieldCheck,
    Trophy,
    Clock,
    BookOpen,
    Play,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Zap,
    HelpCircle,
    GraduationCap,
    ChevronDown,
    ChevronUp,
    Bookmark,
    ArrowRight,
    Star,
    Award,
    Sparkles,
    Sliders,
    BookMarked,
    Check,
    Calendar,
    Send,
    MessageSquare,
    Bot,
    User,
    Loader2,
    Info,
    BarChart3
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
import { toast } from 'sonner';
import { OFFICIAL_QUESTIONS } from '../data/officialQuestions';
import InteractiveQuestionCard from '../components/InteractiveQuestionCard';

// ==========================================
// TYPES FOR CHAT & SCHEDULE
// ==========================================
interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface StudyTask {
    time: string;
    subject: string;
    topic: string;
    duration: string;
    completed: boolean;
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

// ==========================================
// STATIC STUDY CONTENT & SYLLABUS DATA (AS REQUESTED)
// ==========================================
interface StudySubtopic {
    name: string;
    description: string;
    keyPoints: string[];
    tips: string;
}

interface StudyArea {
    id: number;
    title: string;
    icon: string;
    description: string;
    subtopics: StudySubtopic[];
}

const STUDY_AREAS: StudyArea[] = [
    {
        id: 1,
        title: "1. Linguagens, Códigos e suas Tecnologias",
        icon: "✨",
        description: "Compreensão, interpretação, análise estilística e domínio linguístico do Português, Literatura, Língua Estrangeira e Artes.",
        subtopics: [
            {
                name: "Português & Interpretação",
                description: "Estudo crítico de textos literários, científicos e publicitários. Compreensão global da intenção do autor, análise dos gêneros textuais e dos mecanismos que dão coesão e coerência ao discurso.",
                keyPoints: [
                    "Interpretação e compreensão textual profunda",
                    "Gêneros textuais (crônica, editorial, artigo de opinião, publicidade)",
                    "Funções da linguagem (fática, metalinguística, apelativa, expressiva, poética, referencial)",
                    "Figuras de linguagem (metáfora, metonímia, antítese, hipérbole, ironia)",
                    "Variação linguística e norma-padrão vs. linguagem coloquial"
                ],
                tips: "No ENEM, as questões de interpretação costumam focar na função social do texto. Pergunte-se sempre: 'Onde esse texto circula e qual o seu papel social?'"
            },
            {
                name: "Literatura Brasileira",
                description: "Análise histórica, ideológica e estética dos movimentos literários no Brasil, com foco especial no Modernismo e na produção poética e ficcional contemporânea.",
                keyPoints: [
                    "O Modernismo brasileiro (Semana de Arte Moderna de 1922, Fase Heroica, Fase Consolidadora e Fase de 45)",
                    "Literatura brasileira contemporânea e tendências atuais",
                    "Gêneros literários clássicos (lírico, dramático e épico/narrativo)",
                    "Análise crítica de grandes clássicos indispensáveis"
                ],
                tips: "Dom Casmurro e as obras de Machado de Assis exploram o Realismo sob o olhar da alta burguesia fluminense. Domine a técnica da ironia machadiana e do narrador pouco confiável."
            },
            {
                name: "Língua Estrangeira (Inglês ou Espanhol)",
                description: "Foco absoluto em competência leitora e instrumental. Uso de tirinhas, charges e notícias reais de circulação global para testar a sua habilidade comunicativa direta.",
                keyPoints: [
                    "Interpretação textual avançada em língua estrangeira",
                    "Leitura de tirinhas, charges humorísticas e infográficos",
                    "Vocabulário instrumental de alta frequência e compreensão contextual",
                    "Estudo de marcadores discursivos e conectivos"
                ],
                tips: "Não tente traduzir palavra por palavra. Busque palavras-chave (cognatos) e use recursos não-verbais, como as imagens da charge, para inferir o sentido."
            },
            {
                name: "Artes",
                description: "As artes plásticas e expressões visuais como representação social, manifestação política, patrimônio histórico e história da beleza estética nacional.",
                keyPoints: [
                    "História da Arte brasileira (do barroco mineiro ao modernismo de Tarsila)",
                    "Arte Contemporânea, instalações conceituais e performances de rua",
                    "Patrimônio cultural imaterial e memória material nacional"
                ],
                tips: "O Modernismo brasileiro é extremamente cobrado, especialmente a Semana de Arte Moderna de 1922 e a ruptura com as regras acadêmicas europeias tradicionais."
            }
        ]
    },
    {
        id: 2,
        title: "2. Ciências Humanas e suas Tecnologias",
        icon: "🏛️",
        description: "Estudo crítico da sociedade, da história, do espaço geográfico, da cidadania e dos pensadores que moldaram a nossa visão de mundo ocidental.",
        subtopics: [
            {
                name: "História",
                description: "Análise profunda dos processos sociais, revoluções econômicas e marcos de transição do Brasil e do mundo ocidental.",
                keyPoints: [
                    "Brasil Colônia (economia açucareira, mercantilismo, escravidão e resistência quilombola)",
                    "República Velha (coronelismo, política do café com leite e revoluções)",
                    "Era Vargas (Estado Novo, legislação trabalhista, populismo e industrialização)",
                    "Ditadura Militar (o golpe de 1964, Atos Institucionais, milagre econômico e redemocratização)",
                    "Idade Média (feudalismo) e Idade Moderna (renascimento urbano e comercial)",
                    "Revolução Industrial britânica e seus desdobramentos nas classes operárias"
                ],
                tips: "A Era Vargas é a mais cobrada. Lembre-se do caráter dual do governo: ao mesmo tempo em que garantiu direitos trabalhistas (trabalhismo), promoveu censura e forte controle político estatal."
            },
            {
                name: "Geografia",
                description: "Entendimento tridimensional do espaço geográfico, geopolítica militar mundial, dinâmicas climáticas locais e agronegócio.",
                keyPoints: [
                    "Questões ambientais globais e degradação de biomas brasileiros (Cerrado, Amazônia)",
                    "Processos de urbanização rápida e favelização periférica",
                    "Globalização econômica, redes de capital e fluxos informacionais",
                    "Geografia agrária (concentração fundiária, espaço rural e conflitos por terra)",
                    "Cartografia básica (escalas, projeções, fusos horários e curvas de nível)",
                    "Geopolítica das potências globais e focos contemporâneos de tensão"
                ],
                tips: "As questões ambientais sempre unem geografia física e ação humana. Entenda o impacto da agricultura mecanizada sobre o lençol freático e o cerrado central."
            },
            {
                name: "Sociologia",
                description: "Investigação científica sobre as estruturas de classe, constituição de identidades coletivas e lutas sindicais cotidianas.",
                keyPoints: [
                    "Movimentos sociais organizados (sindicalismo, feminismo, lutas antirracistas)",
                    "Cultura, etnocentrismo vs. relativismo cultural e multiculturalidade",
                    "Cidadania, direitos fundamentais e o papel das instituições estatais",
                    "Sociologia do trabalho ( Taylorismo, Fordismo e a uberização moderna)",
                    "Sociologia brasileira (as heranças coloniais analisas por clássicos nacionais)"
                ],
                tips: "A diferença entre Fordismo e Toyotismo é clássica: o Fordismo estoca e produz em massa; o Toyotismo elimina estoques e produz por demanda (just-in-time) de forma flexível."
            },
            {
                name: "Filosofia",
                description: "História do livre-pensamento, ética moral, correntes políticas epistemológicas da ciência grega clássica ao iluminismo contratual.",
                keyPoints: [
                    "Ética pessoal e justiça social nas sociedades democráticas",
                    "Filosofia Antiga grega (Sócrates, o mundo das ideias de Platão e a eudaimonia de Aristóteles)",
                    "Filosofia Política moderna com Nicolau Maquiavel",
                    "Teóricos Contratualistas clássicos (estado de natureza em Thomas Hobbes, John Locke e Jean-Jacques Rousseau)"
                ],
                tips: "Para Maquiavel, a política possui lógica própria desvinculada da moral cristã. A meta principal do governante (Príncipe) deve ser a manutenção do poder e a estabilidade social, usando a virtute e a fortuna."
            }
        ]
    },
    {
        id: 3,
        title: "3. Ciências da Natureza e suas Tecnologias",
        icon: "🌿",
        description: "As leis da matéria, a biologia dos sistemas vivos, a engenharia molecular da química e as equações matemáticas que modelam o universo físico.",
        subtopics: [
            {
                name: "Biologia",
                description: "Da mecânica microscópica celular, passando pelas leis de hereditariedade, até os equilíbrios dinâmicos da biosfera terrestre.",
                keyPoints: [
                    "Ecologia prática (cadeias alimentares, pirâmides de energia, ciclos biogeoquímicos e bioacumulação)",
                    "Citologia (compartimentação, transporte membranar e funções das organelas endossimbiontes)",
                    "Genética básica (leis de Mendel, cruzamentos, transcrição do DNA e biotecnologia)",
                    "Botânica geral (adaptações ecológicas de briófitas, pteridófitas, gimnospermas e angiospermas)",
                    "Fisiologia Humana integrada (sistemas endócrino, digestório, circulatório e renal)"
                ],
                tips: "A ecologia é o tema n° 1 do ENEM. Atente-se ao fenômeno da bioacumulação: substâncias bioacumulativas não excretadas (metais pesados) concentram-se cada vez mais no topo da cadeia trófica!"
            },
            {
                name: "Química",
                description: "Comportamento atômico, termoquímica geral das reações industriais, arranjos de hidrocarbonetos orgânicos e equilíbrio químico em meio aquoso.",
                keyPoints: [
                    "Físico-química (estequiometria clássica, cálculo de reagentes em excesso, soluções moleculares e termoquímica)",
                    "Química orgânica (identificação rápida de funções, nomenclatura padrão IUPAC e isomeria estrutural/espacial plano-enantiômeros)",
                    "Ligações químicas intermoleculares (dipolo-induzido, dipolo-permanente e ligações de hidrogênio)",
                    "Métodos de separação de misturas (destilação fracionada, flotação, decantação)"
                ],
                tips: "Em estequiometria, nunca se esqueça de balancear a equação química antes de montar as proporções molares. Use sempre a massa molar das tabelas de consulta com exatidão."
            },
            {
                name: "Física",
                description: "Leis de conservação do movimento, propriedades eletrodinâmicas do consumo residencial, ondas mecânicas e calorimetria.",
                keyPoints: [
                    "Mecânica vetorial (cinemática escalar, leis de Isaac Newton, atrito e força centrípeta)",
                    "Eletrodinâmica de circuitos (leis de Ohm, cálculo de kWh, consumo residencial e circuitos série/paralelo)",
                    "Ondulatória (equação fundamental V = f * lambda, reflexão, refração, difração, efeito Doppler)",
                    "Termologia (trocas de calor latente/sensível, termodinâmica e escalas térmicas)"
                ],
                tips: "Ondulatória sempre cai! Lembre-se: quando uma onda passa de um meio para outro (refração), a sua frequência nunca se altera. O que varia é a sua velocidade de propagação e o seu comprimento de onda."
            }
        ]
    },
    {
        id: 4,
        title: "4. Matemática e suas Tecnologias",
        icon: "📐",
        description: "Raciocínio lógico quantitativo, interpretação analítica de grandes volumes de dados, geometria espacial industrial e as leis de probabilidade.",
        subtopics: [
            {
                name: "Matemática Básica",
                description: "Operações cotidianas essenciais que servem de alicerce absoluto para o desempenho e velocidade de cálculo técnico em qualquer exame vestibular.",
                keyPoints: [
                    "Razão e proporção, escalas cartográficas e diagramas",
                    "Porcentagem comercial, lucros, descontos e aumentos sucessivos",
                    "Regra de três simples e composta (razões diretas e inversamente proporcionais)",
                    "Operações fracionárias complexas e simplificações",
                    "Leitura crítica e interpretação de gráficos cartesianos de linha, barra e pizza"
                ],
                tips: "Em regra de três composta, defina bem a coluna do 'Processo' versus a coluna do 'Produto' final. Isso evita inversões confusas de frações."
            },
            {
                name: "Geometria Geral",
                description: "A matemática das formas. Cálculo de áreas superficiais de terrenos planos e mensuração volumétrica tridimensional de tanques e reservatórios industriais.",
                keyPoints: [
                    "Geometria Plana (áreas de círculos, paralelogramos, trapézios, hexágonos e teorema de Pitágoras)",
                    "Geometria Espacial (cálculo de volumes de cubos, paralelepípedos, prismas retos, cilindros hidráulicos, cones e esferas)"
                ],
                tips: "Para cilindros e cones, a área da base é sempre pi*r². O volume do cilindro é Ab * h, enquanto o do cone é (Ab * h) / 3. Não confunda essas constantes nas provas!"
            },
            {
                name: "Análise de Dados, Funções e Finanças",
                description: "Estatística de amostragem social, álgebra escolar aplicada a modelagens reais e juros aplicados comercialmente.",
                keyPoints: [
                    "Estatística central (média aritmética simples e ponderada, termo modal/moda e mediana central)",
                    "Funções afins de 1º grau (gráficos lineares de receita) e polinomiais de 2º grau (parábolas de queda livre/lucro máximo)",
                    "Matemática financeira aplicada (juros simples e cálculo acumulativo de juros compostos)"
                ],
                tips: "Se o número de termos de uma amostra for par, a mediana é a média aritmética dos dois termos centrais dispostos em ordem crescente (rol). Nunca calcule a mediana sem organizar o conjunto."
            }
        ]
    }
];

// ==========================================
// PRECONFIGURED FULL EXAMS LIST (AS REQUESTED)
// ==========================================
interface FullExamConfig {
    id: string;
    name: string;
    description: string;
    badge: string;
    totalQuestions: number;
    timeMinutes: number;
    triBase: number;
    categoriesIncluded: string[];
}

const FULL_EXAMS_CONFIGS: FullExamConfig[] = [
    // ==========================================
    // === 20 SIMULADOS ENEM (Janeiro a Novembro) ===
    // ==========================================
    {
        id: "enem_01_janeiro",
        name: "Simulado ENEM • Janeiro (Volume 1: Diagnóstico de Entrada)",
        description: "Janeiro: Avaliação diagnóstica inicial cobrando as principais competências e habilidades recomendadas pelo MEC para iniciar o ano.",
        badge: "ENEM • VOL 1",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 350,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Sociologia", "Filosofia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "enem_02_janeiro",
        name: "Simulado ENEM • Janeiro (Volume 2: Linguagens & Códigos Integrados)",
        description: "Janeiro: Foco total na interpretação de textos literários, recursos multimodais, artes visuais e gêneros de comunicação e propaganda.",
        badge: "ENEM • VOL 2",
        totalQuestions: 90,
        timeMinutes: 330,
        triBase: 360,
        categoriesIncluded: ["Português", "Literatura", "Artes"]
    },
    {
        id: "enem_03_fevereiro",
        name: "Simulado ENEM • Fevereiro (Volume 3: Humanas e Filosofia Social)",
        description: "Fevereiro: Conselhos práticos das ciências humanas abordando Grécia Antiga, formação do feudalismo e cartografia básica.",
        badge: "ENEM • VOL 3",
        totalQuestions: 90,
        timeMinutes: 330,
        triBase: 365,
        categoriesIncluded: ["História", "Geografia", "Sociologia", "Filosofia"]
    },
    {
        id: "enem_04_fevereiro",
        name: "Simulado ENEM • Fevereiro (Volume 4: Matemática & Bases Numéricas)",
        description: "Fevereiro: Pratique a agilidade de contas em regras de três, proporções diretas, escalas cartográficas e porcentagem rápida.",
        badge: "ENEM • VOL 4",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 370,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "enem_05_marco",
        name: "Simulado ENEM • Março (Volume 5: Ecologia Humana e Biologia)",
        description: "Março: Treine o tema número 1 do ENEM. Teias tróficas, ciclos biogeoquímicos, poluição de rios e desmatamentos nacionais.",
        badge: "ENEM • VOL 5",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 375,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "enem_06_marco",
        name: "Simulado ENEM • Março (Volume 6: Linguagens & Atualidades Sociais)",
        description: "Março: Compreensão de novas mídias sociais digitais, variação linguística regional e patrimônio cultural nacional.",
        badge: "ENEM • VOL 6",
        totalQuestions: 90,
        timeMinutes: 330,
        triBase: 380,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "enem_07_abril",
        name: "Simulado ENEM • Abril (Volume 7: Química e Matéria Geral)",
        description: "Abril: Classificação periódica, ligações químicas intermoleculares e cálculos estequiométricos aplicados ao cotidiano escolar.",
        badge: "ENEM • VOL 7",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 385,
        categoriesIncluded: ["Química"]
    },
    {
        id: "enem_08_abril",
        name: "Simulado ENEM • Abril (Volume 8: Primeiro Simulado Integrado)",
        description: "Abril: Mistura de todas as matérias unindo história do Brasil República, funções polinomiais afins e citologia básica.",
        badge: "ENEM • VOL 8",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 390,
        categoriesIncluded: ["Português", "História", "Matemática", "Biologia"]
    },
    {
        id: "enem_09_maio",
        name: "Simulado ENEM • Maio (Volume 9: Mecânica & Cinemática Física)",
        description: "Maio: Resolução de questões do ENEM envolvendo leis de Newton aplicadas, energia mecânica, trabalho e potência de motores.",
        badge: "ENEM • VOL 9",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 395,
        categoriesIncluded: ["Física"]
    },
    {
        id: "enem_10_maio",
        name: "Simulado ENEM • Maio (Volume 10: Matemática Financeira & Lucros)",
        description: "Maio: Raciocínio matemático comercial focado em juros simples e compostos calculados cumulativamente, taxas e lucros municipais.",
        badge: "ENEM • VOL 10",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 400,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "enem_11_junho",
        name: "Simulado ENEM • Junho (Volume 11: Ciências Humanas Geopolíticas)",
        description: "Junho: Abordagem das grandes guerras mundiais, efeitos globais da Guerra Fria e a nova ordem econômica internacional no ENEM.",
        badge: "ENEM • VOL 11",
        totalQuestions: 90,
        timeMinutes: 330,
        triBase: 405,
        categoriesIncluded: ["História", "Geografia", "Sociologia", "Filosofia"]
    },
    {
        id: "enem_12_junho",
        name: "Simulado ENEM • Junho (Volume 12: Genética & Mendelismo Prático)",
        description: "Junho: Genética de populações, regras clássicas de probabilidade mendeliana, herança ligada ao sexo e clonagem.",
        badge: "ENEM • VOL 12",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 410,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "enem_13_julho",
        name: "Simulado ENEM • Julho (Volume 13: Linguagens & Humanidades Geral)",
        description: "Julho: Exame simulando integralmente as 90 questões de Humanas, Linguagens e Literatura de modo a treinar resistência estrita.",
        badge: "ENEM • VOL 13",
        totalQuestions: 90,
        timeMinutes: 330,
        triBase: 415,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Sociologia", "Filosofia"]
    },
    {
        id: "enem_14_julho",
        name: "Simulado ENEM • Julho (Volume 14: Ciências da Natureza & Matemática)",
        description: "Julho: Treino intenso com 90 questões fechadas de Ciências da Natureza e Matemática integradas com muitas fórmulas práticas.",
        badge: "ENEM • VOL 14",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 420,
        categoriesIncluded: ["Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "enem_15_agosto",
        name: "Simulado ENEM • Agosto (Volume 15: Ondulatória & Acústica)",
        description: "Agosto: Estudo rigoroso de ondas sonoras e luminosas, refração, fenômeno do efeito Doppler e interferências ondulatórias.",
        badge: "ENEM • VOL 15",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 425,
        categoriesIncluded: ["Física"]
    },
    {
        id: "enem_16_agosto",
        name: "Simulado ENEM • Agosto (Volume 16: Funções e Estatística ENEM)",
        description: "Agosto: Resolução rápida de termos modais, média ponderada, mediana de dados estruturados e tabelas oficiais integradas.",
        badge: "ENEM • VOL 16",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 430,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "enem_17_setembro",
        name: "Simulado ENEM • Setembro (Volume 17: Fisiologia & Sistemas Humanos)",
        description: "Setembro: Abordagem biológica integrada sobre o sistema digestivo, circulatório, imunológico e as principais vacinas.",
        badge: "ENEM • VOL 17",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 435,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "enem_18_setembro",
        name: "Simulado ENEM • Setembro (Volume 18: Termoquímica & Soluções)",
        description: "Setembro: Cálculo de entalpia, lei de Hess aplicada a queima de combustíveis limpos, soluções, molaridade e pH neutro.",
        badge: "ENEM • VOL 18",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 440,
        categoriesIncluded: ["Química"]
    },
    {
        id: "enem_19_outubro",
        name: "Simulado ENEM • Outubro (Volume 19: Penúltimo Ensaio Nacional)",
        description: "Outubro: Exame interdisciplinar total de fechamento de matérias unindo os principais pesos estatísticos da prova oficial.",
        badge: "ENEM • VOL 19",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 450,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "enem_20_novembro",
        name: "Simulado ENEM • Novembro (Volume 20: Teste Geral de Véspera)",
        description: "Novembro: O grandioso teste definitivo antes do ENEM. Cronometragem rígida sob condições de cansaço extremo.",
        badge: "ENEM • VOL 20",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 470,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },

    // ==========================================
    // === 20 SIMULADOS FUVEST (Janeiro a Novembro) ===
    // ==========================================
    {
        id: "fuvest_01_janeiro",
        name: "Simulado FUVEST • Janeiro (Volume 1: Aquecimento USP)",
        description: "Janeiro: Teste inicial das altas exigências intelectuais da FUVEST. Questões conceituais lógicas e precisas.",
        badge: "FUVEST • VOL 1",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 420,
        categoriesIncluded: ["Português", "Literatura", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Inglês"]
    },
    {
        id: "fuvest_02_janeiro",
        name: "Simulado FUVEST • Janeiro (Volume 2: Humanidades e Abordagem Crítica)",
        description: "Janeiro: Treine o pensamento sociopolítico exigido nos exames paulistas, com foco em história e sociologia na FUVEST.",
        badge: "FUVEST • VOL 2",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 425,
        categoriesIncluded: ["História", "Geografia", "Sociologia", "Filosofia"]
    },
    {
        id: "fuvest_03_fevereiro",
        name: "Simulado FUVEST • Fevereiro (Volume 3: Literatura Obrigatória USP I)",
        description: "Fevereiro: Questões focadas nos poemas medievais, barrocos e primeiros livros do cânone obrigatório da Fuvest.",
        badge: "FUVEST • VOL 3",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 430,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "fuvest_04_fevereiro",
        name: "Simulado FUVEST • Fevereiro (Volume 4: Mecânica Vetorial USP)",
        description: "Fevereiro: Leis de Newton sob decomposição de vetores no plano inclinado, dinâmica do movimento circular e estática.",
        badge: "FUVEST • VOL 4",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 435,
        categoriesIncluded: ["Física", "Matemática"]
    },
    {
        id: "fuvest_05_marco",
        name: "Simulado FUVEST • Março (Volume 5: Citologia e Organelas)",
        description: "Março: Questões sofisticadas da FUVEST de organelas celulares, membranas semipermeáveis de osmose e reprodução assexuada.",
        badge: "FUVEST • VOL 5",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 440,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "fuvest_06_marco",
        name: "Simulado FUVEST • Março (Volume 6: Álgebra de Funções e Trigonometria)",
        description: "Março: Estudo e modelagem complexa de equações trigonométricas no círculo, funções inversas e logaritmos.",
        badge: "FUVEST • VOL 6",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 445,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "fuvest_07_abril",
        name: "Simulado FUVEST • Abril (Volume 7: Química Geral & Físico-Química)",
        description: "Abril: Cálculos complexos de estequiometria com impurezas, gases ideais e lei de comportamento térmico.",
        badge: "FUVEST • VOL 7",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 450,
        categoriesIncluded: ["Química"]
    },
    {
        id: "fuvest_08_abril",
        name: "Simulado FUVEST • Abril (Volume 8: Clássico Brasil Colônia e Império)",
        description: "Abril: Análise documental e historiográfica do sistema escravista, ciclo do ouro cafeeiro e as revoltas provinciais paulistas.",
        badge: "FUVEST • VOL 8",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 455,
        categoriesIncluded: ["História", "Geografia"]
    },
    {
        id: "fuvest_09_maio",
        name: "Simulado FUVEST • Maio (Volume 9: Gramática & Sintaxe Erudita)",
        description: "Maio: Análise sintática rigorosa das orações coordenadas e subordinadas, vícios de linguagem e conjunções coordenadas.",
        badge: "FUVEST • VOL 9",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 460,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "fuvest_10_maio",
        name: "Simulado FUVEST • Maio (Volume 10: Circuitos Práticos de Física)",
        description: "Maio: Associação de resistores em série e paralelo, leis de Ohm aplicadas de circuitos elétricos comerciais e medidores.",
        badge: "FUVEST • VOL 10",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 462,
        categoriesIncluded: ["Física"]
    },
    {
        id: "fuvest_11_junho",
        name: "Simulado FUVEST • Junho (Volume 11: Ecologia Trófica & Evolução)",
        description: "Junho: Seleção natural de Darwin e Neodarwinismo, especiações geográficas simpátricas, fluxo de energia celular.",
        badge: "FUVEST • VOL 11",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 465,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "fuvest_12_junho",
        name: "Simulado FUVEST • Junho (Volume 12: Geometria Plana e Espacial)",
        description: "Junho: Cálculo de áreas, polígonos regulares congruentes, semelhança de triângulos retos e prismas espaciais USP.",
        badge: "FUVEST • VOL 12",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 468,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "fuvest_13_julho",
        name: "Simulado FUVEST • Julho (Volume 13: Maratona Especial Férias 1)",
        description: "Julho: Metade do caminho. Simulado geral cobrando todas as habilidades acumulativas da USP sob rigor técnico.",
        badge: "FUVEST • VOL 13",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 470,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "fuvest_14_julho",
        name: "Simulado FUVEST • Julho (Volume 14: Maratona Especial Férias 2)",
        description: "Julho: Segundo teste completo de férias, intensificando as questões interdisciplinares de biologia e geopolítica da FUVEST.",
        badge: "FUVEST • VOL 14",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 472,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "fuvest_15_agosto",
        name: "Simulado FUVEST • Agosto (Volume 15: Química Orgânica Fina)",
        description: "Agosto: Identificação estrutural de funções orgânicas, hibridização do carbono, isomeria óptica plana e reações de substituição.",
        badge: "FUVEST • VOL 15",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 475,
        categoriesIncluded: ["Química"]
    },
    {
        id: "fuvest_16_agosto",
        name: "Simulado FUVEST • Agosto (Volume 16: Literatura Prática USP II)",
        description: "Agosto: Análise aprofundada dos romances realistas, naturalismo brasileiro e modernismo de 1922 obrigatórios.",
        badge: "FUVEST • VOL 16",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 480,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "fuvest_17_setembro",
        name: "Simulado FUVEST • Setembro (Volume 17: Termodinâmica & Calor)",
        description: "Setembro: Transformações gasosas ideais térmicas, ciclo de Carnot e cálculo de eficiência energética física.",
        badge: "FUVEST • VOL 17",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 485,
        categoriesIncluded: ["Física"]
    },
    {
        id: "fuvest_18_setembro",
        name: "Simulado FUVEST • Setembro (Volume 18: Genética Molecular USP)",
        description: "Setembro: Organização genética, replicação de fitas de DNA, processos de transcrição e tradução protéica celular.",
        badge: "FUVEST • VOL 18",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 490,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "fuvest_19_outubro",
        name: "Simulado FUVEST • Outubro (Volume 19: Penúltimo Ensaio de Elite)",
        description: "Outubro: Teste completo simulando com altíssimo grau as tendências contemporâneas observadas na USP.",
        badge: "FUVEST • VOL 19",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 495,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "fuvest_20_novembro",
        name: "Simulado FUVEST • Novembro (Volume 20: Teste Decisivo Geral)",
        description: "Novembro: Revisão integrada final. Sente-se e simule a primeira fase da FUVEST em ritmo absoluto de provação real.",
        badge: "FUVEST • VOL 20",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 512,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },

    // ==========================================
    // === 20 SIMULADOS UNICAMP (Janeiro a Novembro) ===
    // ==========================================
    {
        id: "unicamp_01_janeiro",
        name: "Simulado UNICAMP • Janeiro (Volume 1: Aquecimento Campineiro)",
        description: "Janeiro: Introdução prática às famosas questões de interpretação científica, mídias e charges políticas e sociais da UNICAMP.",
        badge: "UNICAMP • VOL 1",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 400,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Física", "Química", "Biologia", "Matemática"]
    },
    {
        id: "unicamp_02_janeiro",
        name: "Simulado UNICAMP • Janeiro (Volume 2: Leitura Crítica e Chargismo)",
        description: "Janeiro: Foco total no entendimento semântico complexo de imagens, charges sociais, cartuns modernos e campanhas.",
        badge: "UNICAMP • VOL 2",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 405,
        categoriesIncluded: ["Português", "Artes"]
    },
    {
        id: "unicamp_03_fevereiro",
        name: "Simulado UNICAMP • Fevereiro (Volume 3: Humanidades Críticas)",
        description: "Fevereiro: Questões interdisciplinares abordando desigualdades estruturais, cidadania moderna, direitos e inclusões sociais.",
        badge: "UNICAMP • VOL 3",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 410,
        categoriesIncluded: ["História", "Geografia", "Sociologia", "Filosofia"]
    },
    {
        id: "unicamp_04_fevereiro",
        name: "Simulado UNICAMP • Fevereiro (Volume 4: Raciocínio Quantitativo I)",
        description: "Fevereiro: Raciocínio lógico focado em aplicações aritméticas diretas das ciências, estatística descritiva e mapas.",
        badge: "UNICAMP • VOL 4",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 415,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "unicamp_05_marco",
        name: "Simulado UNICAMP • Março (Volume 5: Ecossistemas e Meio Ambiente)",
        description: "Março: Questões sofisticadas sobre ecossistemas secos brasileiros, biomas locais, cerrado, caatinga e impactos no solo.",
        badge: "UNICAMP • VOL 5",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 420,
        categoriesIncluded: ["Biologia", "Geografia"]
    },
    {
        id: "unicamp_06_marco",
        name: "Simulado UNICAMP • Março (Volume 6: Literatura Obrigatória Unicamp I)",
        description: "Março: Questões literárias complexas sobre contos e antologias de poemas obrigatórios cobrados na Unicamp.",
        badge: "UNICAMP • VOL 6",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 422,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "unicamp_07_abril",
        name: "Simulado UNICAMP • Abril (Volume 7: Química Geral & Atmosfera)",
        description: "Abril: Equação de gases ideais, fenômenos estufa, reações químicas industriais e processos ecológicos da química.",
        badge: "UNICAMP • VOL 7",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 425,
        categoriesIncluded: ["Química"]
    },
    {
        id: "unicamp_08_abril",
        name: "Simulado UNICAMP • Abril (Volume 8: Primeiro Simulado Integrado)",
        description: "Abril: Simulado de matérias juntas para mapear no meio do primeiro semestre seus conhecimentos interdisciplinares.",
        badge: "UNICAMP • VOL 8",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 428,
        categoriesIncluded: ["Português", "História", "Matemática", "Biologia"]
    },
    {
        id: "unicamp_09_maio",
        name: "Simulado UNICAMP • Maio (Volume 9: Ondas e Radiações)",
        description: "Maio: Ondilatória campineira cobrando a velocidade da luz, frentes de onda acústicas e infravermelhos ambientais.",
        badge: "UNICAMP • VOL 9",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 430,
        categoriesIncluded: ["Física"]
    },
    {
        id: "unicamp_10_maio",
        name: "Simulado UNICAMP • Maio (Volume 10: Saúde Coletiva e Doenças)",
        description: "Maio: Imunização moderna de rebanho, análise de vírus emergentes, bactérias resistentes e epidemias regionais.",
        badge: "UNICAMP • VOL 10",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 432,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "unicamp_11_junho",
        name: "Simulado UNICAMP • Junho (Volume 11: Geopolítica & Território)",
        description: "Junho: Abordagem minuciosa dos fluxos populacionais migratórios, fronteiras nacionais fechadas e comércio.",
        badge: "UNICAMP • VOL 11",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 435,
        categoriesIncluded: ["Geografia", "Sociologia"]
    },
    {
        id: "unicamp_12_junho",
        name: "Simulado UNICAMP • Junho (Volume 12: Funções & Raciocínio)",
        description: "Junho: Estudo detalhado de funções exponenciais e suas aplicações no crescimento bacteriano populacional real.",
        badge: "UNICAMP • VOL 12",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 438,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "unicamp_13_julho",
        name: "Simulado UNICAMP • Julho (Volume 13: Maratona do Meio do Ano I)",
        description: "Julho: Exame completo com toda a cara de prova clássica da UNICAMP para treinar agilidade intelectual nas férias.",
        badge: "UNICAMP • VOL 13",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 440,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "unicamp_14_julho",
        name: "Simulado UNICAMP • Julho (Volume 14: Maratona do Meio do Ano II)",
        description: "Julho: Segundo volume técnico de férias focado na análise de dados, gráficos científicos complexos e biologia.",
        badge: "UNICAMP • VOL 14",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 442,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "unicamp_15_agosto",
        name: "Simulado UNICAMP • Agosto (Volume 15: Leis de Newton Ambientais)",
        description: "Agosto: Atritos estáticos, resistências do ar de veículos elétricos e dinâmica de polias com aplicações cotidianas.",
        badge: "UNICAMP • VOL 15",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 445,
        categoriesIncluded: ["Física"]
    },
    {
        id: "unicamp_16_agosto",
        name: "Simulado UNICAMP • Agosto (Volume 16: Literatura Obrigatória Unicamp II)",
        description: "Agosto: Foco total no romantismo brasileiro, lirismo lírico e clássicos literários contemporâneos cobrados.",
        badge: "UNICAMP • VOL 16",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 450,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "unicamp_17_setembro",
        name: "Simulado UNICAMP • Setembro (Volume 17: Físico-Química Campineira)",
        description: "Setembro: Soluções químicas aquosas corrosivas, entalpia em reações do cotidiano, oxirredução de metais e pilhas.",
        badge: "UNICAMP • VOL 17",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 455,
        categoriesIncluded: ["Química"]
    },
    {
        id: "unicamp_18_setembro",
        name: "Simulado UNICAMP • Setembro (Volume 18: Bioquímica e Células)",
        description: "Setembro: Enzimas catalisadoras de metabolismo, síntese proteica celular, replicação de DNA vegetal e respiração celular.",
        badge: "UNICAMP • VOL 18",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 460,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "unicamp_19_outubro",
        name: "Simulado UNICAMP • Outubro (Volume 19: Penúltimo Ensaio Geral)",
        description: "Outubro: Exame focado em treinar a rápida resolução de conexões lógicas entre matérias díspares sob cronometragem estrita.",
        badge: "UNICAMP • VOL 19",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 470,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },
    {
        id: "unicamp_20_novembro",
        name: "Simulado UNICAMP • Novembro (Volume 20: Teste de Véspera Unicamp)",
        description: "Novembro: O teste terminal definitivo antes da primeira fase. Encare charges afiadas e ciências sociais aplicadas.",
        badge: "UNICAMP • VOL 20",
        totalQuestions: 72,
        timeMinutes: 240,
        triBase: 490,
        categoriesIncluded: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"]
    },

    // ==========================================
    // === 20 SIMULADOS UNESP (Janeiro a Novembro) ===
    // ==========================================
    {
        id: "unesp_01_janeiro",
        name: "Simulado UNESP • Janeiro (Volume 1: Aquecimento Vunesp)",
        description: "Janeiro: Sinta a clareza teórica e objetividade da UNESP. Exercícios diretos de base sólida escolar de introdução ao ano.",
        badge: "UNESP • VOL 1",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 395,
        categoriesIncluded: ["Português", "Literatura", "Artes", "História", "Geografia", "Sociologia", "Filosofia", "Física", "Química", "Biologia", "Matemática"]
    },
    {
        id: "unesp_02_janeiro",
        name: "Simulado UNESP • Janeiro (Volume 2: Filosofia & Sociologia Crítica)",
        description: "Janeiro: Foco forte nas questões clássicas da Vunesp sobre moral grega, contratualismo moderno e pensamento de Descartes.",
        badge: "UNESP • VOL 2",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 400,
        categoriesIncluded: ["Sociologia", "Filosofia"]
    },
    {
        id: "unesp_03_fevereiro",
        name: "Simulado UNESP • Fevereiro (Volume 3: Gramática Prática & Norma)",
        description: "Fevereiro: Questões de regência nominal, ortografia e pontuação clara cobrada rotineiramente nos vestibulares do grupo.",
        badge: "UNESP • VOL 3",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 405,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "unesp_04_fevereiro",
        name: "Simulado UNESP • Fevereiro (Volume 4: Matemática Prática & Álgebra)",
        description: "Fevereiro: Equações lineares, polinômios, probabilidade clássica e contagem de agrupamentos simplificada.",
        badge: "UNESP • VOL 4",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 410,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "unesp_05_marco",
        name: "Simulado UNESP • Março (Volume 5: Ecologia Geral & Ambiental)",
        description: "Março: Treine questões ecológicas diretas sobre cadeias de energia tróficas, ciclos hídricos e poluição urbana paulista.",
        badge: "UNESP • VOL 5",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 412,
        categoriesIncluded: ["Biologia", "Geografia"]
    },
    {
        id: "unesp_06_marco",
        name: "Simulado UNESP • Março (Volume 6: Literatura Clássica Paulista)",
        description: "Março: Análise literária direta de poemas e contos realistas e modernistas brasileiros do vestibular.",
        badge: "UNESP • VOL 6",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 415,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "unesp_07_abril",
        name: "Simulado UNESP • Abril (Volume 7: Química e Matéria Pura)",
        description: "Abril: Ligações químicas atômicas, massa atômica de soluções, separação técnica industrial de misturas densas.",
        badge: "UNESP • VOL 7",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 418,
        categoriesIncluded: ["Química"]
    },
    {
        id: "unesp_08_abril",
        name: "Simulado UNESP • Abril (Volume 8: Primeiro Simulado Integrado)",
        description: "Abril: Simule o modelo Vunesp integrando todo o conteúdo das 4 grandes matrizes curriculares nacionais.",
        badge: "UNESP • VOL 8",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 420,
        categoriesIncluded: ["Português", "História", "Matemática", "Biologia"]
    },
    {
        id: "unesp_09_maio",
        name: "Simulado UNESP • Maio (Volume 9: Ondas e Som Vunesp)",
        description: "Maio: Resolução de questões ondulatórias envolvendo velocidade de propagação de som no ar e espelhos ópticos simples.",
        badge: "UNESP • VOL 9",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 422,
        categoriesIncluded: ["Física"]
    },
    {
        id: "unesp_10_maio",
        name: "Simulado UNESP • Maio (Volume 10: Fisiologia Animal e Humana)",
        description: "Maio: Compreensão conceitual direta dos sistemas funcionais respiratórios, urinários e circulatórios dos mamíferos.",
        badge: "UNESP • VOL 10",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 425,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "unesp_11_junho",
        name: "Simulado UNESP • Junho (Volume 11: História do Brasil & Sociedades)",
        description: "Junho: Abordagem objetiva sobre a cafeicultura do oeste paulista, economia do século XIX e a era Vargas.",
        badge: "UNESP • VOL 11",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 428,
        categoriesIncluded: ["História", "Geografia"]
    },
    {
        id: "unesp_12_junho",
        name: "Simulado UNESP • Junho (Volume 12: Geometria Espacial Vunesp)",
        description: "Junho: Cálculo de volumes, prismas congruentes, esferas perfeitas tridimensionais e cilindros industriais.",
        badge: "UNESP • VOL 12",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 430,
        categoriesIncluded: ["Matemática"]
    },
    {
        id: "unesp_13_julho",
        name: "Simulado UNESP • Julho (Volume 13: Maratona do Interior I)",
        description: "Julho: Exame simulando de cabo a rabo o formato clássico direto de 90 questões fechadas em condições de resistência de férias.",
        badge: "UNESP • VOL 13",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 432,
        categoriesIncluded: ["Português", "Literatura", "Artes", "História", "Geografia", "Sociologia", "Filosofia", "Física", "Química", "Biologia", "Matemática"]
    },
    {
        id: "unesp_14_julho",
        name: "Simulado UNESP • Julho (Volume 14: Maratona do Interior II)",
        description: "Julho: Segunda maratona de férias estruturando o raciocínio físico-trigonométrico e atualidades sociais da Vunesp.",
        badge: "UNESP • VOL 14",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 435,
        categoriesIncluded: ["Português", "Literatura", "Artes", "História", "Geografia", "Sociologia", "Filosofia", "Física", "Química", "Biologia", "Matemática"]
    },
    {
        id: "unesp_15_agosto",
        name: "Simulado UNESP • Agosto (Volume 15: Termodinâmica & Motores)",
        description: "Agosto: Equilíbrio térmico de gases ideais paulistas, dilatação linear de sólidos e o funcionamento de turbinas físicas.",
        badge: "UNESP • VOL 15",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 438,
        categoriesIncluded: ["Física"]
    },
    {
        id: "unesp_16_agosto",
        name: "Simulado UNESP • Agosto (Volume 16: Literatura Tradicional Paulista)",
        description: "Agosto: Estudo rigoroso de textos canônicos do romantismo e parnasianismo cobrados nas bancas tradicionais paulistas.",
        badge: "UNESP • VOL 16",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 440,
        categoriesIncluded: ["Português", "Literatura"]
    },
    {
        id: "unesp_17_setembro",
        name: "Simulado UNESP • Setembro (Volume 17: Físico-Química e Entalpia)",
        description: "Setembro: Mapeamento de variação de entalpia térmica, cinética química de conservação de alimentos industriais.",
        badge: "UNESP • VOL 17",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 442,
        categoriesIncluded: ["Química"]
    },
    {
        id: "unesp_18_setembro",
        name: "Simulado UNESP • Setembro (Volume 18: Bioquímica & Evolução Paulista)",
        description: "Setembro: Transcrição proteica, clonagem vegetal, cladogramas evolutivos didáticos e cadeia digestiva de vertebrados.",
        badge: "UNESP • VOL 18",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 445,
        categoriesIncluded: ["Biologia"]
    },
    {
        id: "unesp_19_outubro",
        name: "Simulado UNESP • Outubro (Volume 19: Penúltimo Ensaio Geral)",
        description: "Outubro: Quase lá! Penúltima prova em matriz completa de matérias juntas para consolidação fina de acertos na Vunesp.",
        badge: "UNESP • VOL 19",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 450,
        categoriesIncluded: ["Português", "Literatura", "Artes", "História", "Geografia", "Sociologia", "Filosofia", "Física", "Química", "Biologia", "Matemática"]
    },
    {
        id: "unesp_20_novembro",
        name: "Simulado UNESP • Novembro (Volume 20: O Grande Ensaio Decisivo)",
        description: "Novembro: O grandioso teste de véspera oficial da UNESP. Exercite todo o cronômetro para garantir sua vaga paulista.",
        badge: "UNESP • VOL 20",
        totalQuestions: 90,
        timeMinutes: 300,
        triBase: 460,
        categoriesIncluded: ["Português", "Literatura", "Artes", "História", "Geografia", "Sociologia", "Filosofia", "Física", "Química", "Biologia", "Matemática"]
    }
];

// ==========================================
// CENTRAL OFFICIAL QUESTION POOL (REAL DATA)
// ==========================================
interface MockQuestion {
    id: number;
    area: string;
    subtopic: string;
    text: string;
    imageUrl?: string;
    options: string[];
    correct: number;
    explanation: string;
    origin: string;
    year?: string | number;
    chartData?: any[];
}

const QUESTION_BANK: MockQuestion[] = OFFICIAL_QUESTIONS as any;

// ==========================================
// 52 WEEKS ANNUAL STUDY PLAN CRONOGRAMA CONFIGS
// ==========================================
const STUDY_PHASES = [
    { name: "Fase 1: Fundações & Adaptação", range: "Semanas 1-13", desc: "Consolidação teórica preliminar, conceitos-chave da base nacional e controle de ansiedade inicial." },
    { name: "Fase 2: Aprofundamento Crítico", range: "Semanas 14-26", desc: "Desenvolvimento de raciocínio espacial, interpretações complexas de vanguarda e ciências aplicadas." },
    { name: "Fase 3: Consolidação Técnica", range: "Semanas 27-39", desc: "Estudo intensivo de reações orgânicas complexas, física moderna e oratória para redação nota 1000." },
    { name: "Fase 4: Simulados de Elite & Revisão", range: "Semanas 40-52", desc: "Maratonas integradas oficiais cronometradas sob condições severas de performance de prova." }
];

const getWeekSyllabus = (weekNum: number) => {
    // Determine Phase
    let phaseIdx = 0;
    let phaseName = STUDY_PHASES[0].name;
    if (weekNum > 39) { phaseIdx = 3; phaseName = STUDY_PHASES[3].name; }
    else if (weekNum > 26) { phaseIdx = 2; phaseName = STUDY_PHASES[2].name; }
    else if (weekNum > 13) { phaseIdx = 1; phaseName = STUDY_PHASES[1].name; }

    const themes = [
        {
            title: "Diagnóstico Inicial de Competências",
            desc: "Avalie suas bases iniciais de vestibular para identificar pontos fracos prioritários no decorrer do ano.",
            categories: ["Português", "História", "Biologia", "Matemática"]
        },
        {
            title: "Interpretação Textual e Regras de Três",
            desc: "Foco total na interpretação lógica de enunciados complexos e matemática proporcional aplicativa.",
            categories: ["Português", "Matemática", "Filosofia"]
        },
        {
            title: "História Colonial e Introdução à Citologia",
            desc: "Estudo da formação do território brasileiro concomitante com as bases celulares de vida.",
            categories: ["História", "Biologia", "Geografia"]
        },
        {
            title: "Leis de Newton e Equações de 1º Grau",
            desc: "Treinamento intensivo de mecânica física básica aliado à modelagem linear em matemática geral.",
            categories: ["Física", "Matemática", "Química"]
        },
        {
            title: "Modernismo de 1922 e Era Vargas",
            desc: "Consolidação histórica brasileira da ruptura cultural artística e a estruturação de direitos sociais.",
            categories: ["Literatura", "História", "Português"]
        },
        {
            title: "Ecologia Aplicada e Geometria Plana",
            desc: "Cálculos de áreas e polígonos regulares integrados ao ciclo trófico da biodiversidade nacional.",
            categories: ["Biologia", "Matemática", "Geografia"]
        },
        {
            title: "Funções Polinomiais e Termologia",
            desc: "Estudo analítico de parábolas e crescimento quadrático integrado a trocas térmicas gasosas.",
            categories: ["Matemática", "Física", "Química"]
        },
        {
            title: "Revolução Industrial e Doutrinas Sociais",
            desc: "As transformações técnicas na Europa ocidental e as primeiras ciências humanas sociológicas.",
            categories: ["História", "Sociologia", "Filosofia"]
        },
        {
            title: "Química Orgânica Geral e Bioquímica",
            desc: "Identificação de cadeias de carbono associadas ao metabolismo celular de proteínas e carboidratos.",
            categories: ["Química", "Biologia", "Matemática"]
        },
        {
            title: "Geopolítica Mundial e Guerra Fria",
            desc: "Estudo espacial de blocos econômicos paralelos e a influência militar contemporânea no relevo geopolítico.",
            categories: ["Geografia", "História", "Sociologia"]
        },
        {
            title: "Estatística Básica e Genética de Mendel",
            desc: "Médias estatísticas correlacionadas a probabilidades de cruzamento biológico hereditário.",
            categories: ["Matemática", "Biologia", "Português"]
        },
        {
            title: "Ondulatória e Fenômenos Acústicos",
            desc: "Comportamento de pulso, ondas sonoras, light waves e efeito Doppler para diagnósticos.",
            categories: ["Física", "Química", "Literatura"]
        },
        {
            title: "Filosofia Política Clássica e Contrato Social",
            desc: "As teorias do Estado de Thomas Hobbes, John Locke e Rousseau pautando direitos modernos.",
            categories: ["Filosofia", "Sociologia", "História"]
        }
    ];

    const themeIdx = (weekNum - 1) % themes.length;
    let baseTheme = themes[themeIdx];

    let weekTitle = `Semana ${weekNum.toString().padStart(2, '0')}: ${baseTheme.title}`;
    let weekDesc = baseTheme.desc;
    let weekCategories = [...baseTheme.categories];

    if (weekNum > 39) {
        const phase4Exams = [
            { title: "Maratona Pré-ENEM de Humanidades & Redação", desc: "Iniciando com foco em Ciências Humanas, Linguagens, Literatura e Redação Avançada.", cats: ["Português", "Literatura", "História", "Geografia", "Sociologia", "Filosofia"] },
            { title: "Maratona Pré-ENEM de Ciências & Exatas", desc: "Simulando a prova nacional com foco abrangente em Exatas, Natureza e Matemática.", cats: ["Matemática", "Física", "Química", "Biologia"] },
            { title: "Simulado de Elite FUVEST 1ª Fase USP", desc: "Alta exigência teórica da USP para fixação fina de conteúdo geral.", cats: ["Português", "Literatura", "História", "Geografia", "Matemática", "Física", "Química", "Biologia"] },
            { title: "Revisão Geral sob Pressão de Tempo", desc: "Estratégia prática de prova de matemática e interpretação rápida para evitar fadiga.", cats: ["Matemática", "Português", "História", "Física"] }
        ];
        const exam = phase4Exams[(weekNum - 40) % phase4Exams.length];
        weekTitle = `Semana ${weekNum.toString().padStart(2, '0')}: ${exam.title}`;
        weekDesc = exam.desc;
        weekCategories = exam.cats;
    } else if (weekNum > 26) {
        weekTitle = `Semana ${weekNum.toString().padStart(2, '0')}: Avançado - ${baseTheme.title}`;
        weekDesc = weekDesc.replace("básico", "avançado").replace("básica", "avançada").replace("Introdução", "Aprofundamento Complexo");
    } else if (weekNum > 13) {
        weekTitle = `Semana ${weekNum.toString().padStart(2, '0')}: Intermediário - ${baseTheme.title}`;
    }

    const totalQuestions = 90;
    const timeMinutes = totalQuestions === 90 ? 300 : (weekCategories.length * 10 > 90 ? 180 : 90);
    const triBase = 320 + (phaseIdx * 50);

    return {
        id: `week_exam_${weekNum}`,
        name: weekTitle,
        description: weekDesc,
        badge: `Semana ${weekNum.toString().padStart(2, '0')}`,
        totalQuestions,
        timeMinutes,
        triBase,
        categoriesIncluded: weekCategories
    };
};

const getQuestionIllustration = (q: any) => {
    if (!q) return null;
    if (q.imageUrl) return q.imageUrl;
    return null;
};

const Simulado = () => {
    console.log("[Simulado] Component rendering...");
    // Tab Navigation
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
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

    const { trendingSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers } = useTrendingData(currentUser);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);

    const openPostModal = (post: PostType) => {
        setSelectedPost(post);
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
        onSnapshot(q, (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostComments(commentList);
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                getDoc(doc(db, 'users', user.uid)).then(docSnap => {
                    if (docSnap.exists()) setUserProfile(docSnap.data());
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const [activeTab, setActiveTab] = useState<'temas' | 'niveis' | 'completos' | 'redacao'>('temas');
    console.log("[Simulado] Initial state loaded, activeTab:", activeTab);
    const [selectedPhase, setSelectedPhase] = useState<number>(0);
    const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
    const [magicalHouse, setMagicalHouse] = useState<'Corvinal' | 'Grifinória' | 'Sonserina' | 'Lufa-Lufa'>('Corvinal');
    const [selectedInstitution, setSelectedInstitution] = useState<'todos' | 'enem' | 'fuvest' | 'unicamp' | 'unesp'>('todos');
    
    // Accordion for themes
    const [expandedArea, setExpandedArea] = useState<number | null>(null);

    // Schedule AI Chat States
    const [scheduleMessages, setScheduleMessages] = useState<ChatMessage[]>(() => {
        const saved = safeLocalStorage.getItem('schedule_chat_history');
        return saved ? JSON.parse(saved) : [{
            role: 'model',
            parts: [{ text: "Olá! Eu sou seu consultor de estudos IA. Para que eu possa criar um cronograma perfeito para você, me conte um pouco sobre sua rotina. Que horas você acorda? Trabalha ou estuda? Quais matérias sente mais dificuldade?" }]
        }];
    });
    const [isSendingScheduleMsg, setIsSendingScheduleMsg] = useState(false);
    const [personalizedPlan, setPersonalizedPlan] = useState<PersonalizedStudyPlan | null>(() => {
        const saved = safeLocalStorage.getItem('personalized_study_plan');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        safeLocalStorage.setItem('schedule_chat_history', JSON.stringify(scheduleMessages));
    }, [scheduleMessages]);

    useEffect(() => {
        if (personalizedPlan) {
            safeLocalStorage.setItem('personalized_study_plan', JSON.stringify(personalizedPlan));
        }
    }, [personalizedPlan]);

    const handleSendScheduleMessage = async (text: string) => {
        if (!text.trim() || isSendingScheduleMsg) return;

        const newMessages: ChatMessage[] = [...scheduleMessages, { role: 'user', parts: [{ text }] }];
        setScheduleMessages(newMessages);
        setIsSendingScheduleMsg(true);

        try {
            const response = await fetch('/api/chat-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) throw new Error('Falha na comunicação com a IA');

            const data = await response.json();
            const aiText = data.text;

            // Try to extract JSON study plan if present
            const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
                try {
                    const plan = JSON.parse(jsonMatch[1]);
                    if (plan.type === 'study_plan') {
                        setPersonalizedPlan(plan);
                        toast.success('🎉 Cronograma personalizado gerado com sucesso!');
                    }
                } catch (e) {
                    console.error('Erro ao processar plano de estudos JSON', e);
                }
            }

            setScheduleMessages(prev => [...prev, { role: 'model', parts: [{ text: aiText.replace(/```json[\s\S]*?```/g, '').trim() }] }]);
        } catch (error: any) {
            toast.error('Erro ao enviar mensagem: ' + error.message);
        } finally {
            setIsSendingScheduleMsg(false);
        }
    };

    // Active Quiz Execution States
    const [currentQuizQuestions, setCurrentQuizQuestions] = useState<MockQuestion[]>([]);
    const [quizTitle, setQuizTitle] = useState<string>("");
    const [isTakingQuiz, setIsTakingQuiz] = useState<boolean>(false);
    const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState<boolean>(false);
    const [showUnansweredConfirm, setShowUnansweredConfirm] = useState<boolean>(false);
    const [unansweredCountForConfirm, setUnansweredCountForConfirm] = useState<number>(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizRevealed, setQuizRevealed] = useState<Record<number, boolean>>({});
    const [quizIsFinalized, setQuizIsFinalized] = useState<boolean>(false);
    const [quizTimer, setQuizTimer] = useState<number>(0);
    const [isFullExam, setIsFullExam] = useState<boolean>(false);
    const [activeExamConfig, setActiveExamConfig] = useState<FullExamConfig | null>(null);

    useEffect(() => {
        if (isTakingQuiz) {
            document.body.classList.add('quiz-active');
        } else {
            document.body.classList.remove('quiz-active');
        }
        return () => {
            document.body.classList.remove('quiz-active');
        };
    }, [isTakingQuiz]);

    const finalizeRef = useRef<() => void>(() => {});

    const [simuladoAiResource, setSimuladoAiResource] = useState<{
        title: string;
        sourceText: string;
        contextInfo: string;
        type: string;
    } | null>(null);
    const [loadingSimuladoResource, setLoadingSimuladoResource] = useState(false);
    const [errorSimuladoResource, setErrorSimuladoResource] = useState(false);

    // Fetch AI supporting textual resource on-the-fly for the current quiz question
    useEffect(() => {
        const activeQ = currentQuizQuestions[currentQuestionIndex];
        if (!activeQ) {
            setSimuladoAiResource(null);
            return;
        }

        let isMounted = true;
        setSimuladoAiResource(null);
        setErrorSimuladoResource(false);
        setLoadingSimuladoResource(true);

        const fetchResource = async () => {
            try {
                const res = await fetch("/api/generate-question-resource", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: activeQ.id,
                        text: activeQ.text,
                        origin: activeQ.origin,
                        year: activeQ.year,
                        area: activeQ.area,
                        subtopic: activeQ.subtopic,
                        options: activeQ.options
                    })
                });
                if (!res.ok) throw new Error("Erro na requisição");
                const data = await res.json();
                if (isMounted) {
                    setSimuladoAiResource(data);
                }
            } catch (err) {
                console.error("Erro ao carregar recurso da IA:", err);
                if (isMounted) {
                    setErrorSimuladoResource(true);
                }
            } finally {
                if (isMounted) {
                    setLoadingSimuladoResource(false);
                }
            }
        };

        fetchResource();

        return () => {
            isMounted = false;
        };
    }, [currentQuestionIndex, currentQuizQuestions]);

    // Dynamic setups for custom volumes (50 questions target) and full 90 exam marathons
    const [studyConfigModal, setStudyConfigModal] = useState<{
        isOpen: boolean;
        subtopicName: string;
        areaName: string;
    } | null>(null);

    const [examConfigModal, setExamConfigModal] = useState<{
        isOpen: boolean;
        config: FullExamConfig;
    } | null>(null);

    useEffect(() => {
        if (!studyConfigModal) {
            setIsShowingExplanation(false);
            setExplanation(null);
        }
    }, [studyConfigModal]);

    const navigate = useNavigate();
    const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(15);
    const [selectedExamSubject, setSelectedExamSubject] = useState<string>("");
    const [selectedGenMode, setSelectedGenMode] = useState<'local' | 'ai'>('ai');
    const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
    const [explanation, setExplanation] = useState<any | null>(null);
    const [isShowingExplanation, setIsShowingExplanation] = useState<boolean>(false);

    const navigateToExercises = async (area: string, subtopic: string) => {
        setIsLoadingQuestions(true);
        try {
            navigate(`/comic-exercises/${encodeURIComponent(area)}/${encodeURIComponent(subtopic)}`);
        } catch (error) {
            console.error("Error navigating to exercises:", error);
            // Fallback
            loadCustomQuestions(area, subtopic, selectedQuestionCount, 'ai');
        } finally {
            setIsLoadingQuestions(false);
        }
    };
    const [stats, setStats] = useState<{
        avgTri: string | number;
        completedCount: number;
        ranking: string;
        studyHours: string;
    } | null>(null);

    const [currentQuizArea, setCurrentQuizArea] = useState<string>("Geral");
    const [statsLoading, setStatsLoading] = useState<boolean>(false);

    // Real-time or dynamic averages state per subject
    const [subjectAverages, setSubjectAverages] = useState<Record<string, { avgTri: number; total: number; correct: number; totalQuestionsCount: number }>>({
        "Linguagens": { avgTri: 740, total: 5, correct: 45, totalQuestionsCount: 60 },
        "Ciências Humanas": { avgTri: 685, total: 4, correct: 35, totalQuestionsCount: 50 },
        "Ciências da Natureza": { avgTri: 710, total: 3, correct: 28, totalQuestionsCount: 45 },
        "Matemática": { avgTri: 780, total: 4, correct: 42, totalQuestionsCount: 55 },
        "Redação": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
    });

    const loadRealUserStats = async (userId: string) => {
        setStatsLoading(true);
        try {
            // 1. Fetch user profile
            const userDocSnap = await getDoc(doc(db, 'users', userId));
            let currentXp = 100;
            let focusSeconds = 0;
            let dbSimuladosCount = 0;

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                currentXp = userData.xp || 100;
                focusSeconds = userData.totalFocusSeconds || 0;
                dbSimuladosCount = userData.simuladosCount || 0;
                const fetchedHouse = userData.magicalHouse || userData.house;
                if (fetchedHouse) {
                    setMagicalHouse(fetchedHouse as any);
                }
            }

            // 2. Fetch all simulado_results for the user
            const resultsQuery = query(
                collection(db, 'simulado_results'),
                where('userId', '==', userId)
            );
            const resultsSnap = await getDocs(resultsQuery);
            
            const completedWeeksArr: number[] = [];
            resultsSnap.forEach((docSnap) => {
                const data = docSnap.data();
                const examTitle = data.examTitle || "";
                const weekMatch = examTitle.match(/Semana\s+(\d+)/i);
                if (weekMatch) {
                    const wNum = parseInt(weekMatch[1], 10);
                    if (!completedWeeksArr.includes(wNum)) {
                        completedWeeksArr.push(wNum);
                    }
                }
            });
            setCompletedWeeks(completedWeeksArr);
            
            let totalSimulados = 0;
            let grandTotalTri = 0;
            
            // Map to aggregate metrics per subject
            const subjectStats: Record<string, { correct: number; totalQuestionsCount: number; totalDocs: number; sumTri: number }> = {
                "Linguagens": { correct: 0, totalQuestionsCount: 0, totalDocs: 0, sumTri: 0 },
                "Ciências Humanas": { correct: 0, totalQuestionsCount: 0, totalDocs: 0, sumTri: 0 },
                "Ciências da Natureza": { correct: 0, totalQuestionsCount: 0, totalDocs: 0, sumTri: 0 },
                "Matemática": { correct: 0, totalQuestionsCount: 0, totalDocs: 0, sumTri: 0 },
            };

            resultsSnap.forEach((docSnap) => {
                const data = docSnap.data();
                totalSimulados += 1;
                const scoreTri = data.scoreTri || 0;
                grandTotalTri += scoreTri;

                const area = data.area || "Geral";
                const correct = data.correctAnswers || 0;
                const totalQ = data.totalQuestions || 0;

                // Normalize area strings if needed
                let finalArea = area;
                if (area.includes("Linguagens")) finalArea = "Linguagens";
                else if (area.includes("Humanas")) finalArea = "Ciências Humanas";
                else if (area.includes("Natureza")) finalArea = "Ciências da Natureza";
                else if (area.includes("Matemática")) finalArea = "Matemática";

                // If breakdown exists, we use it to avoid double-counting!
                if (data.subjectsBreakdown) {
                    Object.entries(data.subjectsBreakdown).forEach(([subj, metrics]: [string, any]) => {
                        let normSubj = subj;
                        if (subj.includes("Linguagens")) normSubj = "Linguagens";
                        else if (subj.includes("Humanas")) normSubj = "Ciências Humanas";
                        else if (subj.includes("Natureza")) normSubj = "Ciências da Natureza";
                        else if (subj.includes("Matemática")) normSubj = "Matemática";

                        if (subjectStats[normSubj]) {
                            const subCorrect = metrics.correct || 0;
                            const subTotal = metrics.total || 0;

                            subjectStats[normSubj].correct += subCorrect;
                            subjectStats[normSubj].totalQuestionsCount += subTotal;
                            subjectStats[normSubj].totalDocs += 1;

                            // Calculate an estimated subject-specific TRI score
                            const subBase = 320;
                            const subTri = subTotal > 0 ? Math.round(subBase + (subCorrect / subTotal) * (1000 - subBase)) : scoreTri;
                            subjectStats[normSubj].sumTri += subTri;
                        }
                    });
                } else if (finalArea && finalArea !== "Geral" && subjectStats[finalArea]) {
                    subjectStats[finalArea].correct += correct;
                    subjectStats[finalArea].totalQuestionsCount += totalQ;
                    subjectStats[finalArea].totalDocs += 1;
                    subjectStats[finalArea].sumTri += scoreTri;
                }
            });

            // 3. Fetch Essay results to get Redação average (from essay_submissions)
            const essaysQuery = query(
                collection(db, 'essay_submissions'),
                where('userId', '==', userId)
            );
            const essaysSnap = await getDocs(essaysQuery);
            let totalEssays = 0;
            let sumEssaysScore = 0;
            essaysSnap.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.score !== undefined) {
                    sumEssaysScore += data.score;
                    totalEssays += 1;
                }
            });

            // Compute actual TRI average per subject (Redação is excluded as requested to avoid displaying non-objective metrics)
            const finalSubjectAverages: Record<string, { avgTri: number; total: number; correct: number; totalQuestionsCount: number }> = {
                "Linguagens": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
                "Ciências Humanas": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
                "Ciências da Natureza": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
                "Matemática": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
                "Redação": { avgTri: 0, total: 0, correct: 0, totalQuestionsCount: 0 },
            };

            Object.keys(subjectStats).forEach((subj) => {
                const sData = subjectStats[subj];
                let avg = 0;
                if (sData.totalDocs > 0 && sData.sumTri > 0) {
                    avg = Math.round(sData.sumTri / sData.totalDocs);
                } else if (sData.totalQuestionsCount > 0) {
                    avg = Math.round(320 + (sData.correct / sData.totalQuestionsCount) * 680);
                }
                finalSubjectAverages[subj] = {
                    avgTri: avg,
                    total: sData.totalDocs,
                    correct: sData.correct,
                    totalQuestionsCount: sData.totalQuestionsCount,
                };
            });

            // Fallbacks for empty results to keep the dashboard encouraging
            if (totalSimulados === 0) {
                finalSubjectAverages["Linguagens"].avgTri = 0;
                finalSubjectAverages["Ciências Humanas"].avgTri = 0;
                finalSubjectAverages["Ciências da Natureza"].avgTri = 0;
                finalSubjectAverages["Matemática"].avgTri = 0;
            }

            setSubjectAverages(finalSubjectAverages);

            // 4. Calculate Unified Ranking
            const usersQuery = query(collection(db, 'users'), orderBy('xp', 'desc'));
            const usersSnap = await getDocs(usersQuery);
            let userRankValue = "#--";
            let rankCounter = 1;
            usersSnap.forEach((uDoc) => {
                if (uDoc.id === userId) {
                    userRankValue = `#${rankCounter}`;
                }
                rankCounter += 1;
            });

            // Adjust focus time display formatting
            let studyHoursStr = "0h";
            if (focusSeconds > 0) {
                const h = Math.floor(focusSeconds / 3600);
                const m = Math.round((focusSeconds % 3600) / 60);
                studyHoursStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
            }

            // Calculate global overall average
            const calculatedAvgTri = totalSimulados > 0 ? Math.round(grandTotalTri / totalSimulados) : 0;
            
            console.log("Stats loaded: ", {
                avgTri: calculatedAvgTri,
                completedCount: Math.max(totalSimulados, dbSimuladosCount),
                ranking: userRankValue,
                studyHours: studyHoursStr
            });

            setStats({
                avgTri: calculatedAvgTri > 0 ? calculatedAvgTri : 350, // default placeholder
                completedCount: Math.max(totalSimulados, dbSimuladosCount),
                ranking: userRankValue,
                studyHours: studyHoursStr
            });

        } catch (error) {
            console.error("Erro ao carregar estatísticas reais do usuário:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                loadRealUserStats(user.uid);
            } else {
                setStats({
                    avgTri: 724.8,
                    completedCount: 6,
                    ranking: "#48",
                    studyHours: "24h"
                });
                setSubjectAverages({
                    "Linguagens": { avgTri: 740, total: 5, correct: 45, totalQuestionsCount: 60 },
                    "Ciências Humanas": { avgTri: 685, total: 4, correct: 35, totalQuestionsCount: 50 },
                    "Ciências da Natureza": { avgTri: 710, total: 3, correct: 28, totalQuestionsCount: 45 },
                    "Matemática": { avgTri: 780, total: 4, correct: 42, totalQuestionsCount: 55 },
                });
                setCompletedWeeks([1, 2, 3]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Handle background interval for countdown/timer
    useEffect(() => {
        let interval: any;
        if (isTakingQuiz && !quizIsFinalized) {
            const timeLimit = currentQuizQuestions.length === 90
                ? 300 * 60 // 5 hours exactly
                : (currentQuizQuestions.length > 0
                    ? (isFullExam && activeExamConfig
                        ? Math.floor(((activeExamConfig.timeMinutes * 60) / activeExamConfig.totalQuestions) * currentQuizQuestions.length)
                        : currentQuizQuestions.length * 180)
                    : 180 * 15);

            interval = setInterval(() => {
                setQuizTimer(prev => {
                    const nextTime = prev + 1;
                    if (nextTime >= timeLimit) {
                        clearInterval(interval);
                        toast.dismiss();
                        toast.error("⏱️ O tempo limite do simulado se esgotou! Suas respostas foram enviadas.");
                        finalizeRef.current();
                        return timeLimit;
                    }
                    return nextTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTakingQuiz, quizIsFinalized, currentQuizQuestions.length, isFullExam, activeExamConfig]);

    const formatTimer = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatCountdown = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Standard loading engine for subtopics
    const loadCustomQuestions = async (area: string, subtopic: string, count: number, mode: 'local' | 'ai') => {
        setIsLoadingQuestions(true);
        setCurrentQuizArea(area);
        toast.loading(`Gerando caderno com ${count} questões para ${subtopic}...`);
        try {
            const response = await fetch("/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    area,
                    subtopic,
                    limit: count,
                    isMockExam: false,
                    mode
                })
            });
            
            if (!response.ok) {
                throw new Error("Erro de conexão.");
            }
            
            const list = await response.json();
            if (Array.isArray(list) && list.length > 0) {
                toast.dismiss();
                setCurrentQuizQuestions(list);
                setQuizTitle(`Prática: ${subtopic}`);
                setIsTakingQuiz(true);
                setCurrentQuestionIndex(0);
                setQuizAnswers({});
                setQuizRevealed({});
                setQuizIsFinalized(false);
                setQuizTimer(0);
                setIsFullExam(false);
                setActiveExamConfig(null);
                setStudyConfigModal(null);
                toast.success(`Caderno preparado com ${list.length} questões! Responda com atenção.`);
            } else {
                throw new Error("Problema na estrutura física.");
            }
        } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.error("Instabilidade de rede. Carregando banco interno estruturado.");
            
            // Build fallback from QUESTION_BANK matching subtopic, padded up to count if needed
            const normArea = (area || "").toLowerCase();
            const normSub = (subtopic || "").toLowerCase();

            let targetArea = "";
            if (normArea.includes("linguagens") || normSub.includes("linguagens") || normSub.includes("português") || normSub.includes("literatura") || normSub.includes("ingles") || normSub.includes("inglês") || normSub.includes("espanhol") || normSub.includes("artes")) {
                targetArea = "Linguagens";
            } else if (normArea.includes("humanas") || normSub.includes("história") || normSub.includes("geografia") || normSub.includes("sociologia") || normSub.includes("filosofia")) {
                targetArea = "Ciências Humanas";
            } else if (normArea.includes("natureza") || normSub.includes("biologia") || normSub.includes("física") || normSub.includes("química")) {
                targetArea = "Ciências da Natureza";
            } else if (normArea.includes("matematica") || normArea.includes("matemática") || normSub.includes("matemática") || normSub.includes("geometria") || normSub.includes("probabilidade") || normSub.includes("estatística") || normSub.includes("dados") || normSub.includes("básica")) {
                targetArea = "Matemática";
            }

            let subtopicKeywords: string[] = [];
            if (normSub.includes("português") || normSub.includes("linguagem") || normSub.includes("interpretação")) {
                subtopicKeywords = ["Português", "Português - Interpretação"];
            } else if (normSub.includes("literatura")) {
                subtopicKeywords = ["Português", "Português - Interpretação"];
            } else if (normSub.includes("inglês") || normSub.includes("ingles") || normSub.includes("espanhol") || normSub.includes("estrangeira")) {
                subtopicKeywords = ["Inglês"];
            } else if (normSub.includes("artes") || normSub.includes("educação física")) {
                subtopicKeywords = ["Artes"];
            } else if (normSub.includes("história")) {
                subtopicKeywords = ["História"];
            } else if (normSub.includes("geografia")) {
                subtopicKeywords = ["Geografia"];
            } else if (normSub.includes("sociologia")) {
                subtopicKeywords = ["Sociologia"];
            } else if (normSub.includes("filosofia")) {
                subtopicKeywords = ["Filosofia"];
            } else if (normSub.includes("biologia")) {
                subtopicKeywords = ["Biologia"];
            } else if (normSub.includes("química") || normSub.includes("quimica")) {
                subtopicKeywords = ["Química"];
            } else if (normSub.includes("física") || normSub.includes("fisica")) {
                subtopicKeywords = ["Física"];
            } else if (normSub.includes("matemática básica") || normSub.includes("básica") || normSub.includes("analise") || normSub.includes("análise")) {
                subtopicKeywords = ["Análise de Dados", "Estatística", "Probabilidade"];
            } else if (normSub.includes("geometria")) {
                subtopicKeywords = ["Geometria"];
            }

            let subFilter = QUESTION_BANK.filter(q => {
                const qArea = q.area || "";
                const qSub = q.subtopic || "";
                
                let areaMatch = true;
                if (targetArea) {
                    areaMatch = qArea.toLowerCase() === targetArea.toLowerCase();
                }
                
                let subtopicMatch = true;
                if (subtopicKeywords.length > 0) {
                    subtopicMatch = subtopicKeywords.some(kw => qSub.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(qSub.toLowerCase()));
                }
                
                return areaMatch && subtopicMatch;
            });

            if (subFilter.length === 0 && targetArea) {
                subFilter = QUESTION_BANK.filter(q => (q.area || "").toLowerCase() === targetArea.toLowerCase());
            }

            const finalPool = subFilter.length > 0 ? subFilter : QUESTION_BANK.slice(0, 5);

            const paddedList: MockQuestion[] = [];
            for (let i = 0; i < count; i++) {
                const item = finalPool[i % finalPool.length];
                paddedList.push({
                    ...item,
                    id: 20000 + i,
                    text: i >= finalPool.length ? `[Variação ${i - finalPool.length + 1}] ${item.text}` : item.text
                });
            }
            
            setCurrentQuizQuestions(paddedList);
            setQuizTitle(`Prática (Offline): ${subtopic}`);
            setIsTakingQuiz(true);
            setCurrentQuestionIndex(0);
            setQuizAnswers({});
            setQuizRevealed({});
            setQuizIsFinalized(false);
            setQuizTimer(0);
            setIsFullExam(false);
            setActiveExamConfig(null);
            setStudyConfigModal(null);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    // Standard loading engine for complete exam simulations (ENEM, FUVEST, etc)
    const loadFullMockExam = async (config: FullExamConfig, count: number) => {
        setIsLoadingQuestions(true);
        setCurrentQuizArea("Geral");
        
        const actualSubject = (count !== config.totalQuestions) 
            ? (selectedExamSubject && config.categoriesIncluded.includes(selectedExamSubject) ? selectedExamSubject : config.categoriesIncluded[0])
            : null;
        
        const finalCategories = actualSubject ? [actualSubject] : config.categoriesIncluded;
        const msgSubject = actualSubject ? `Foco: ${actualSubject}` : "Geral Integrado";
        
        toast.loading(`Baixando caderno oficial do ${config.badge} (${count} questões, ${msgSubject})...`);
        try {
            const response = await fetch("/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    limit: count,
                    isMockExam: true,
                    categoriesIncluded: finalCategories
                })
            });
            
            if (!response.ok) {
                throw new Error("Erro de resposta.");
            }
            
            const list = await response.json();
            if (Array.isArray(list) && list.length > 0) {
                toast.dismiss();
                setCurrentQuizQuestions(list);
                setQuizTitle(actualSubject ? `${config.name} (${actualSubject})` : config.name);
                setIsTakingQuiz(true);
                setCurrentQuestionIndex(0);
                setQuizAnswers({});
                setQuizRevealed({});
                setQuizIsFinalized(false);
                setQuizTimer(0);
                setIsFullExam(true);
                setActiveExamConfig(config);
                setExamConfigModal(null);
                toast.success(`Caderno do ${config.badge} pronto! Total: ${list.length} questões. Comece!`);
            } else {
                throw new Error("Caderno nulo.");
            }
        } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.error("Formatando simulado com banco offline representativo...");
            
            const pool = QUESTION_BANK.filter(q => finalCategories.includes(q.area) || finalCategories.includes(q.subtopic)) || [...QUESTION_BANK];
            const fallbackList: MockQuestion[] = [];
            for (let i = 0; i < count; i++) {
                const item = pool[i % pool.length];
                fallbackList.push({
                    ...item,
                    id: 30000 + i,
                    text: i >= pool.length ? `[Questão ${i+1}] ${item.text}` : item.text
                });
            }
            
            setCurrentQuizQuestions(fallbackList);
            setQuizTitle(actualSubject ? `${config.name} (${actualSubject})` : config.name);
            setIsTakingQuiz(true);
            setCurrentQuestionIndex(0);
            setQuizAnswers({});
            setQuizRevealed({});
            setQuizIsFinalized(false);
            setQuizTimer(0);
            setIsFullExam(true);
            setActiveExamConfig(config);
            setExamConfigModal(null);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    // Starts a mini-simulado for a selected subtopic
    const startMiniSimulado = (subtopicName: string) => {
        loadCustomQuestions("Geral", subtopicName, 15, 'ai');
    };

    // Starts a complete preconfigured exam (ENEM, FUVEST, etc)
    const startFullSimulado = (config: FullExamConfig) => {
        loadFullMockExam(config, 15);
    };

    const handleQuizOptionSelect = (optionIndex: number) => {
        const activeLimit = currentQuizQuestions.length > 0
            ? (isFullExam && activeExamConfig
                ? Math.floor(((activeExamConfig.timeMinutes * 60) / activeExamConfig.totalQuestions) * currentQuizQuestions.length)
                : currentQuizQuestions.length * 180)
            : 0;

        if (quizIsFinalized || quizRevealed[currentQuestionIndex] || (activeLimit > 0 && quizTimer >= activeLimit)) {
            return;
        }
        setQuizAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
        setQuizRevealed(prev => ({ ...prev, [currentQuestionIndex]: true }));
    };

    const finalizeQuizSession = async () => {
        setQuizIsFinalized(true);
        let correctCount = 0;
        currentQuizQuestions.forEach((q, idx) => {
            if (quizAnswers[idx] === q.correct) {
                correctCount += 1;
            }
        });

        // Save progress to Firestore persistence
        if (auth.currentUser) {
            try {
                // Calculate simulated TRI premium score
                const { scoreTri: finalSimulatedScore } = calculateDetailedTri(currentQuizQuestions, quizAnswers, false);

                // Calculate subject-wise breakdown for this specific quiz session
                const subjectsBreakdown: Record<string, { correct: number; total: number }> = {};
                currentQuizQuestions.forEach((q, idx) => {
                    const isCorrect = quizAnswers[idx] === q.correct;
                    let qArea = q.area || "Geral";
                    if (qArea.includes("Linguagens")) qArea = "Linguagens";
                    else if (qArea.includes("Humanas")) qArea = "Ciências Humanas";
                    else if (qArea.includes("Natureza")) qArea = "Ciências da Natureza";
                    else if (qArea.includes("Matemática")) qArea = "Matemática";

                    if (!subjectsBreakdown[qArea]) {
                        subjectsBreakdown[qArea] = { correct: 0, total: 0 };
                    }
                    subjectsBreakdown[qArea].total += 1;
                    if (isCorrect) {
                        subjectsBreakdown[qArea].correct += 1;
                    }
                });

                if (!auth.currentUser) {
                    toast.error("Usuário não autenticado. Resultado não pode ser salvo na nuvem.");
                    return;
                }

                await addDoc(collection(db, 'simulado_results'), {
                    userId: auth.currentUser.uid,
                    examTitle: quizTitle,
                    isFullExam: isFullExam,
                    correctAnswers: correctCount,
                    totalQuestions: currentQuizQuestions.length,
                    scoreTri: finalSimulatedScore,
                    timeSeconds: quizTimer,
                    area: currentQuizArea,
                    subjectsBreakdown: subjectsBreakdown,
                    createdAt: serverTimestamp()
                });

                // Increment user XP & counter
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    xp: increment(correctCount * 60), // 60 XP for every correct answer in the new system!
                    simuladosCount: increment(1)
                });

                toast.success(`Simulado salvo na nuvem com sucesso! +${correctCount * 60} XP!`);

                // Instantly refresh states from the backend/database
                await loadRealUserStats(auth.currentUser.uid);
            } catch (err) {
                console.error("Erro para gravar resultado:", err);
                handleFirestoreError(err, OperationType.WRITE, 'simulado_results');
            }
        } else {
            toast.warning("Demonstração concluída! Faça login para salvar seus resultados.");
        }
    };

    useEffect(() => {
        finalizeRef.current = finalizeQuizSession;
    }, [finalizeQuizSession]);

    const calculatedLimit = currentQuizQuestions.length === 90
        ? 300 * 60 // 5 hours exactly
        : (currentQuizQuestions.length > 0
            ? (isFullExam && activeExamConfig
                ? Math.floor(((activeExamConfig.timeMinutes * 60) / activeExamConfig.totalQuestions) * currentQuizQuestions.length)
                : currentQuizQuestions.length * 180)
            : 180 * 15);

    const timeRemaining = Math.max(0, calculatedLimit - quizTimer);
    const isLowTime = timeRemaining <= 60 && timeRemaining > 0;

    console.log("[Simulado] Rendering main JSX. isTakingQuiz:", isTakingQuiz, "activeTab:", activeTab, "questionsLength:", currentQuizQuestions.length, "finalized:", quizIsFinalized);

    return (
        <Layout>
            <div id={!isTakingQuiz ? "simulado-container" : undefined} className={`min-h-screen pt-4 pb-20 w-full px-4 sm:px-6 lg:px-8 ${isTakingQuiz ? 'overflow-hidden' : ''}`}>
                <div className="w-full max-w-full mx-auto py-2">
                    
                    <AnimatePresence>
                        {isTakingQuiz && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`fixed inset-0 ${theme === 'light' ? 'bg-[#f1f5f9] text-slate-800' : 'bg-[#07070a] text-white'} z-50 overflow-y-auto`}
                            >
                                <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col">
                                    
                                    {/* Exam Header bar */}
                                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b ${theme === 'light' ? 'border-slate-200' : 'border-white/5'} mb-10`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-accent-1/10 flex items-center justify-center text-accent-1 border border-accent-1/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]">
                                                <GraduationCap size={24} />
                                            </div>
                                            <div>
                                                <h2 className={`text-xl md:text-2xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tight uppercase font-anton`}>{quizTitle}</h2>
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                                    Questão {currentQuestionIndex + 1} de {currentQuizQuestions.length} • {isFullExam ? "Caderno Geral e Simulado Realista" : "Foco Técnico e Aprendizado"}
                                                </p>
                                            </div>
                                        </div>
 
                                        <div className="flex items-center gap-4 self-end md:self-auto uppercase tracking-wider">
                                            <div className={`flex items-center gap-3 ${
                                                    isLowTime 
                                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-[pulse_1s_infinite]' 
                                                        : (theme === 'light' ? 'bg-slate-200/50 border-slate-300/60 text-slate-700' : 'bg-white/[0.03] border-white/5')
                                                } border px-5 py-2.5 rounded-full font-mono text-sm shadow-md transition-all duration-350`}
                                            >
                                                <Clock size={16} className={`text-accent-1 ${isLowTime ? 'text-rose-500 animate-[pulse_0.5s_infinite]' : 'animate-pulse'}`} />
                                                <span className="font-bold">
                                                    {isLowTime ? `TEMPO LIMITE EXTRA: ${formatCountdown(timeRemaining)}` : `Tempo Restante: ${formatCountdown(timeRemaining)}`}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setShowExitConfirm(true);
                                                }}
                                                className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-widest rounded-full transition-all"
                                            >
                                                Sair da Arena
                                            </button>
                                        </div>
                                    </div>
                                    {/* Question Grid Map Navigation for Full Exams */}
                                    {isFullExam && (
                                        <div className={`border rounded-3xl p-5 mb-8 ${theme === 'light' ? 'bg-slate-200/50 border-slate-300/60' : 'bg-white/[0.01] border-white/5'}`}>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Navegdor de Questões (Gabarito)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {currentQuizQuestions.map((_, idx) => {
                                                    const isAnswered = quizAnswers[idx] !== undefined;
                                                    const isCurrent = idx === currentQuestionIndex;
                                                    const isCorrect = isAnswered && quizAnswers[idx] === currentQuizQuestions[idx].correct;
                                                    
                                                    let mapClass = theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200' : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:bg-white/[0.06]';
                                                    if (isCurrent) {
                                                        mapClass = "bg-accent-1 border-accent-1 text-slate-950 scale-115 shadow-lg shadow-accent-1/25";
                                                    } else if (isAnswered) {
                                                        if (isCorrect) {
                                                            mapClass = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                                                        } else {
                                                            mapClass = "bg-rose-500/10 border-rose-500/40 text-rose-400";
                                                        }
                                                    }

                                                    return (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setCurrentQuestionIndex(idx)}
                                                            className={`w-9 h-9 rounded-xl font-bold font-mono text-xs transition-all flex items-center justify-center border ${mapClass}`}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Question Content Box */}
                                    {quizIsFinalized ? (
                                        // Finalized Result Interface with full checklist and explanation answers
                                        <div className="bg-bg-secondary border border-glass-border p-8 md:p-14 rounded-[3rem] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden my-3">
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-accent-1 to-indigo-500"></div>
                                            <div className="w-20 h-20 bg-accent-1/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-accent-1 border border-accent-1/20 shadow-xl mb-8">
                                                <Trophy size={36} />
                                            </div>
                                            
                                            <h3 className="text-3xl md:text-4xl font-black text-white font-anton uppercase tracking-tight mb-2">Simulado Concluído!</h3>
                                            <p className="text-xs text-zinc-500 font-extrabold uppercase tracking-widest mb-8">Nível Master de Vôo Alcançado</p>

                                            <div className="grid grid-cols-2 gap-6 mb-10 text-left">
                                                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Acertos Gerais</span>
                                                    <span className="text-3xl font-black text-emerald-400 font-outfit">
                                                        {currentQuizQuestions.reduce((acc, q, idx) => acc + (quizAnswers[idx] === q.correct ? 1 : 0), 0)}
                                                        <span className="text-sm font-bold text-zinc-600 ml-1">/ {currentQuizQuestions.length}</span>
                                                    </span>
                                                </div>
                                                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Estudo de Tempo</span>
                                                    <span className="text-2xl font-black text-white font-mono">{formatTimer(quizTimer)}</span>
                                                </div>
                                            </div>

                                            {/* INTEGRATED DETAILED TRI DIAGNOSTIC AND LAB */}
                                            <div className="mb-10 text-left">
                                                <TriDashboard 
                                                    questions={currentQuizQuestions} 
                                                    answers={quizAnswers} 
                                                    isSimuladoNivel={false} 
                                                />
                                            </div>

                                            {/* Scrollable list of corrections with explanation details */}
                                            <div className="text-left border-t border-white/5 pt-8 max-h-[450px] overflow-y-auto pr-2 gap-4 flex flex-col mb-10 custom-scrollbar">
                                                <h4 className="text-base font-black text-white uppercase tracking-widest mb-2">Gabarito com Explicações</h4>
                                                {currentQuizQuestions.map((q, idx) => {
                                                    const isCorrect = quizAnswers[idx] === q.correct;
                                                    return (
                                                        <div key={idx} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs md:text-sm font-black text-zinc-400">ITEM {idx + 1}</span>
                                                                {isCorrect ? (
                                                                    <span className="text-xs font-black uppercase text-emerald-400 px-3 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">Correto</span>
                                                                ) : (
                                                                    <span className="text-xs font-black uppercase text-rose-400 px-3 py-1 bg-rose-400/10 rounded-full border border-rose-400/20">Incorreto</span>
                                                                )}
                                                            </div>
                                                            <p className="text-base md:text-lg font-bold text-white leading-relaxed">{q.text}</p>
                                                            <p className="text-sm text-zinc-300 font-semibold"><strong className="text-emerald-400 font-black">Gabarito:</strong> {q.options?.[q.correct] || ''}</p>
                                                            {!isCorrect && quizAnswers[idx] !== undefined && (
                                                                <p className="text-sm text-zinc-300 font-semibold"><strong className="text-rose-400 font-black">Sua resposta:</strong> {q.options?.[quizAnswers[idx]] || ''}</p>
                                                            )}
                                                            <div className="bg-gradient-to-br from-indigo-950/10 to-slate-900/30 border border-white/5 p-5 rounded-[2rem] animate-fade-in relative overflow-hidden flex gap-4 items-start">
                                                                <div className="shrink-0 w-12 h-12 rounded-xl bg-accent-1/10 flex items-center justify-center font-bold text-xl relative">
                                                                    <img 
                                                                        src="/Vestapp/img/vest.png" 
                                                                        alt="Vest" 
                                                                        className="w-10 h-10 object-contain"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const p2 = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (p2) p2.style.display = 'block';
                                                                        }}
                                                                    />
                                                                    <span className="hidden text-xl">🦉</span>
                                                                </div>
                                                                <div className="space-y-1 text-left">
                                                                    <span className="text-[9px] font-black uppercase text-accent-1 tracking-widest font-mono block">Explicação do Vest 🎓</span>
                                                                    <p className="text-sm text-zinc-300 leading-relaxed font-semibold italic">"{q.explanation}"</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button 
                                                onClick={() => setIsTakingQuiz(false)}
                                                    className="w-full h-14 bg-accent-1 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-1/25"
                                                >
                                                    Retornar ao Painel
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            // Active Question answering page interface
                                            <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-4">
                                            
                                            {/* Primary Question Statement card */}
                                            <div className={`w-full border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/[0.01] border-white/5'} p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden min-h-[300px] flex flex-col`}>
                                                
                                                {/* Header Exams Style */}
                                                <h3 className={`text-2xl md:text-3xl font-extrabold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                                                    {currentQuizQuestions[currentQuestionIndex]?.subtopic || currentQuizQuestions[currentQuestionIndex]?.area || "Área do Conhecimento"}
                                                </h3>
                                                
                                                {/* 1. (Enem/2013) style numbering and origin */}
                                                <div className={`text-base md:text-lg font-medium mb-8 flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                                                    <span>{currentQuestionIndex + 1}.</span>
                                                    <span>
                                                        ({currentQuizQuestions[currentQuestionIndex]?.origin}
                                                        {(() => {
                                                            const q = currentQuizQuestions[currentQuestionIndex];
                                                            const originText = q?.origin || "";
                                                            const yearMatch = originText.match(/\b(20\d{2}|19\d{2})\b/) || (q?.text || "").match(/\b(20\d{2}|19\d{2})\b/);
                                                            const yearDisplay = yearMatch ? yearMatch[0] : null;
                                                            return yearDisplay && !originText.includes(yearDisplay) ? `/${yearDisplay}` : "";
                                                         })()})
                                                     </span>
                                                 </div>

                                                 {/* Visual Support Resource (Native Chart or on-the-fly AI Text Support) */}
                                                 {(() => {
                                                     const q = currentQuizQuestions[currentQuestionIndex];
                                                     if (!q) return null;

                                                     if (loadingSimuladoResource) {
                                                         return (
                                                             <div className="mb-10 w-full bg-slate-900/30 p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
                                                                 <div className="w-8 h-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin" />
                                                                 <p className="text-xs font-black uppercase tracking-widest text-[#a855f7] animate-bounce">
                                                                     Corvo IA: Restaurando Texto de Apoio Real...
                                                                 </p>
                                                                 <span className="text-[10px] text-zinc-500 font-semibold text-center">Buscando fontes e transcrevendo dados para a prova real</span>
                                                             </div>
                                                         );
                                                     }

                                                     return (
                                                         <div className="flex flex-col gap-6 w-full mb-10">
                                                             {/* CHART (if available) - ALWAYS SHOW THIS FIRST! */}
                                                             {q.chartData && (
                                                                 <div className="w-full bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                                                                     <div className="flex items-center gap-3 mb-6 text-accent-1">
                                                                         <BarChart3 size={18} />
                                                                         <span className="text-[10px] font-black uppercase tracking-widest">Gráfico Gerado em Código</span>
                                                                     </div>
                                                                     <div className="h-[300px] w-full">
                                                                         <ResponsiveContainer width="100%" height="100%">
                                                                             <BarChart data={q.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                                                                     {q.chartData.map((_entry, index) => (
                                                                                         <Cell key={`cell-${index}`} fill={index === q.chartData!.length - 1 ? '#3b82f6' : '#1e293b'} />
                                                                                     ))}
                                                                                 </Bar>
                                                                             </BarChart>
                                                                         </ResponsiveContainer>
                                                                     </div>
                                                                 </div>
                                                             )}

                                                             {/* AI RESOURCE (if available) */}
                                                             {simuladoAiResource ? (
                                                                 <div className="w-full bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-5 shadow-2xl relative overflow-hidden group">
                                                                     <div className="absolute top-0 right-0 w-32 h-32 bg-accent-1/5 rounded-full filter blur-2xl transition-all group-hover:bg-accent-1/10" />
                                                                     
                                                                     <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/5 text-accent-1">
                                                                         <div className="flex items-center gap-3">
                                                                             <Info size={18} />
                                                                             <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                                                                 {simuladoAiResource.type || "Recurso Acadêmico"}
                                                                             </span>
                                                                         </div>
                                                                         <span className="bg-accent-1/15 text-accent-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent-1/25">
                                                                             Corvo AI Assist
                                                                         </span>
                                                                     </div>

                                                                     <div className="space-y-4">
                                                                         <h6 className="text-[14px] font-black tracking-tight text-white uppercase sm:text-base">
                                                                             {simuladoAiResource.title}
                                                                         </h6>
                                                                         <p className="text-sm md:text-base text-zinc-350 leading-relaxed font-sans whitespace-pre-line p-5 rounded-2xl bg-black/20 border border-white/5">
                                                                             {simuladoAiResource.sourceText}
                                                                         </p>
                                                                     </div>

                                                                     <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-2">
                                                                         <span>{simuladoAiResource.contextInfo || `Material da Prova: ${q.origin} ${q.year || ""}`}</span>
                                                                         <span className="text-zinc-650">ID: #{q.id}</span>
                                                                     </div>
                                                                 </div>
                                                             ) : (
                                                                 /* Only show standard vestibular card if there is NO simuladoAiResource and NO chartData */
                                                                 !q.chartData && (
                                                                     <div className="w-full bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4 flex-wrap">
                                                                         <div className="flex items-center gap-3 text-accent-1">
                                                                             <Info size={16} />
                                                                             <span className="text-[10px] font-black uppercase tracking-widest leading-none text-zinc-400">Questão do Vestibular</span>
                                                                         </div>
                                                                         <span className="text-[11px] font-bold text-zinc-400 select-none bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                                             Fonte Oficial: {q.origin || "Vestibular"} {q.year || ""}
                                                                         </span>
                                                                     </div>
                                                                 )
                                                             )}
                                                         </div>
                                                     );
                                                 })()}

                                                 <p className={`text-[19px] md:text-[21px] ${theme === 'light' ? 'text-slate-800' : 'text-zinc-200'} leading-relaxed whitespace-pre-line mb-6 font-sans`}>
                                                    {currentQuizQuestions[currentQuestionIndex]?.text}
                                                </p>

                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-1/5 rounded-full blur-3xl -z-10"></div>
                                            </div>

                                            {/* Interactive Options Cards */}
                                            <div className="space-y-2 flex flex-col justify-center mt-2">
                                                {currentQuizQuestions[currentQuestionIndex]?.options?.map((option, idx) => {
                                                    const isSelected = quizAnswers[currentQuestionIndex] === idx;
                                                    const isCorrect = currentQuizQuestions[currentQuestionIndex]?.correct === idx;
                                                    const isRevealed = quizRevealed[currentQuestionIndex];

                                                    let cardClass = theme === 'light' 
                                                        ? "bg-transparent text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-200" 
                                                        : "bg-transparent text-zinc-300 hover:bg-white/[0.02] border-transparent hover:border-white/5";
                                                    
                                                    let textWrapperClass = "";

                                                    if (isRevealed) {
                                                        if (isCorrect) {
                                                            cardClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium";
                                                        } else if (isSelected) {
                                                            cardClass = "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium";
                                                            textWrapperClass = "line-through opacity-70";
                                                        }
                                                    } else if (isSelected) {
                                                        cardClass = "bg-accent-1/10 border-accent-1/30 text-accent-1 font-medium";
                                                    }

                                                    return (
                                                        <button 
                                                            key={idx}
                                                            disabled={isRevealed}
                                                            onClick={() => handleQuizOptionSelect(idx)}
                                                            className={`px-5 py-4 md:px-7 md:py-5 rounded-[1.5rem] border text-left transition-all duration-300 flex items-start gap-3 group cursor-pointer ${cardClass}`}
                                                        >
                                                            <div className="font-bold text-[17px] md:text-[19px] shrink-0 mt-[1px]">
                                                                {String.fromCharCode(97 + idx)})
                                                            </div>
                                                            <span className={`text-[17px] md:text-[19px] leading-relaxed ${textWrapperClass}`}>
                                                                {option}
                                                            </span>
                                                        </button>
                                                    );
                                                })}

                                                {/* In situ question-level explainer insights with Mascot Vest */}
                                                {quizRevealed[currentQuestionIndex] && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`mt-6 p-6 rounded-[2.5rem] border ${
                                                            theme === 'light' 
                                                                ? 'bg-slate-100/80 border-slate-200/60' 
                                                                : 'bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border-white/5 shadow-2xl'
                                                        } relative overflow-hidden`}
                                                    >
                                                        <div className="flex gap-5 items-start">
                                                            <div className="shrink-0 relative">
                                                                <div className="w-16 h-16 rounded-2xl bg-accent-1/10 border border-accent-1/20 overflow-hidden flex items-center justify-center shadow-lg">
                                                                    <img 
                                                                        src="/Vestapp/img/vest.png" 
                                                                        alt="Mascote Vest" 
                                                                        className="w-12 h-12 object-contain"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const p = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (p) p.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <div className="hidden text-3xl">🦉</div>
                                                                </div>
                                                                <span className="absolute -bottom-1 -right-1 bg-accent-1 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest leading-none border border-black/10 font-mono">Vest</span>
                                                            </div>
                                                            <div className="space-y-2 flex-1 text-left">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-accent-1 font-mono">
                                                                        Explicação do Vest 🎓
                                                                    </span>
                                                                </div>
                                                                <p className={`text-sm md:text-base ${theme === 'light' ? 'text-slate-700' : 'text-zinc-300'} leading-relaxed font-bold italic whitespace-pre-wrap`}>
                                                                    "{currentQuizQuestions[currentQuestionIndex]?.explanation}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Decoration spark */}
                                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-accent-1/5 rounded-full blur-2xl"></div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Footers navigation */}
                                    {!quizIsFinalized && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5 mt-10">
                                            <button 
                                                disabled={currentQuestionIndex === 0}
                                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                                className="w-full sm:w-auto h-14 px-8 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-zinc-400 hover:text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                                            >
                                                &larr; Voltar
                                            </button>

                                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                                {/* Voluntary early finalization button, enabled at all times */}
                                                {currentQuestionIndex < currentQuizQuestions.length - 1 && (
                                                    <button 
                                                        onClick={() => {
                                                            setShowFinalizeConfirm(true);
                                                        }}
                                                        className="w-full sm:w-auto h-14 px-8 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Finalizar Agora 🎯
                                                    </button>
                                                )}

                                                {currentQuestionIndex === currentQuizQuestions.length - 1 ? (
                                                    <button 
                                                        onClick={() => {
                                                            const unansweredCount = currentQuizQuestions.length - Object.keys(quizAnswers).length;
                                                            if (unansweredCount > 0) {
                                                                setUnansweredCountForConfirm(unansweredCount);
                                                                setShowUnansweredConfirm(true);
                                                            } else {
                                                                finalizeQuizSession();
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto h-14 px-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        Finalizar Simulado &rarr;
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                                        className="w-full sm:w-auto h-14 px-12 bg-accent-1 text-slate-950 font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-accent-1/25 flex items-center justify-center gap-2"
                                                    >
                                                        Próxima Questão &rarr;
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Confirmation Dialog Overlays */}
                                    <AnimatePresence>
                                        {showExitConfirm && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                                            >
                                                <motion.div 
                                                    initial={{ scale: 0.95, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    exit={{ scale: 0.95, y: 20 }}
                                                    className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full space-y-6 text-center shadow-2xl relative overflow-hidden text-white"
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
                                                    <h3 className="text-2xl font-black text-rose-500 uppercase font-anton tracking-tight">Sair da Arena</h3>
                                                    <p className="text-sm text-zinc-350 leading-relaxed font-semibold">
                                                        Deseja mesmo abandonar este simulado? O progresso desta seção será perdido e não será salvo.
                                                    </p>
                                                    <div className="flex gap-4 pt-2">
                                                        <button 
                                                            onClick={() => setShowExitConfirm(false)}
                                                            className="flex-1 h-12 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                                                        >
                                                            Voltar à Prova
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setShowExitConfirm(false);
                                                                setIsTakingQuiz(false);
                                                            }}
                                                            className="flex-1 h-12 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                                                        >
                                                            Sim, Sair
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {showFinalizeConfirm && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                                            >
                                                <motion.div 
                                                    initial={{ scale: 0.95, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    exit={{ scale: 0.95, y: 20 }}
                                                    className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full space-y-6 text-center shadow-2xl relative overflow-hidden text-white"
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                                                    <h3 className="text-2xl font-black text-amber-500 uppercase font-anton tracking-tight">Finalizar Simulado</h3>
                                                    <p className="text-sm text-zinc-350 leading-relaxed font-semibold">
                                                        Deseja mesmo finalizar o simulado agora? As questões não respondidas serão contadas como erradas.
                                                    </p>
                                                    <div className="flex gap-4 pt-2">
                                                        <button 
                                                            onClick={() => setShowFinalizeConfirm(false)}
                                                            className="flex-1 h-12 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                                                        >
                                                            Continuar Teste
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setShowFinalizeConfirm(false);
                                                                finalizeQuizSession();
                                                            }}
                                                            className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                                                        >
                                                            Finalizar
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {showUnansweredConfirm && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                                            >
                                                <motion.div 
                                                    initial={{ scale: 0.95, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    exit={{ scale: 0.95, y: 20 }}
                                                    className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full space-y-6 text-center shadow-2xl relative overflow-hidden text-white"
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                                                    <h3 className="text-2xl font-black text-amber-500 uppercase font-anton tracking-tight">Questões Sem Resposta</h3>
                                                    <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
                                                        Você tem <span className="text-amber-400 font-bold">{unansweredCountForConfirm} questões</span> sem responder. Deseja finalizar mesmo assim? Elas serão contadas como erradas.
                                                    </p>
                                                    <div className="flex gap-4 pt-2">
                                                        <button 
                                                            onClick={() => setShowUnansweredConfirm(false)}
                                                            className="flex-1 h-12 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                                                        >
                                                            Rever Questões
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setShowUnansweredConfirm(false);
                                                                finalizeQuizSession();
                                                            }}
                                                            className="flex-1 h-12 bg-amber-550 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                                                        >
                                                            Finalizar Mesmo Assim
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ==========================================
                        STUDY CONFIGURATION OVERLAYS (MODALS)
                       ========================================== */}
                    <AnimatePresence>
                        {studyConfigModal?.isOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] overflow-y-auto flex justify-center p-4 py-6 md:py-12"
                            >
                                <motion.div 
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="bg-bg-secondary border border-glass-border rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full space-y-6 md:space-y-8 relative overflow-hidden my-auto"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-accent-1 to-transparent opacity-60"></div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase text-accent-1 tracking-widest px-3 py-1 bg-accent-1/10 border border-accent-1/20 rounded-full">Configurar Treino</span>
                                            <button 
                                                onClick={() => setStudyConfigModal(null)}
                                                className="text-zinc-500 hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase font-anton tracking-tight">{studyConfigModal.subtopicName}</h3>
                                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{studyConfigModal.areaName}</p>
                                    </div>

                                    {isShowingExplanation && explanation ? (
                                        <div className="space-y-4 text-zinc-300">
                                            <h4 className="font-bold text-accent-1 text-center text-lg">Explicação do Tema</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
                                                    <h5 className="font-bold text-xs uppercase text-accent-1 mb-2">Introdução</h5>
                                                    <p className="text-sm leading-relaxed">{explanation.introducao}</p>
                                                </div>
                                                {explanation.conceitosChave && (
                                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
                                                        <h5 className="font-bold text-xs uppercase text-accent-1 mb-3">Conceitos-chave</h5>
                                                        <ul className="list-disc list-inside text-sm space-y-1.5 text-zinc-300">
                                                            {explanation.conceitosChave.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {explanation.exemplos && (
                                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
                                                        <h5 className="font-bold text-xs uppercase text-accent-1 mb-3">Exemplos Práticos</h5>
                                                        <ul className="list-disc list-inside text-sm space-y-1.5 text-zinc-300">
                                                            {explanation.exemplos.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {explanation.exercicios && explanation.exercicios.length > 0 && (
                                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
                                                        <h5 className="font-bold text-xs uppercase text-accent-1 mb-3">Exercícios Práticos</h5>
                                                        <div className="space-y-4">
                                                            {explanation.exercicios.map((ex: any, i: number) => (
                                                                <div key={i} className="text-zinc-300">
                                                                    <p className="text-sm font-semibold">{ex.pergunta}</p>
                                                                    <ul className="text-sm space-y-1 mt-2">
                                                                        {ex.opcoes.map((op: string, j: number) => <li key={j}>{String.fromCharCode(65+j)}. {op}</li>)}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-5 rounded-2xl bg-accent-1/10 border border-accent-1/20 shadow-lg">
                                                    <h5 className="font-bold text-xs uppercase text-accent-1 mb-2">Dica de Mestre</h5>
                                                    <p className="text-sm leading-relaxed text-white font-medium">{explanation.dicaMestre}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => loadCustomQuestions(studyConfigModal.areaName, studyConfigModal.subtopicName, selectedQuestionCount, 'ai')}
                                                className="w-full h-14 bg-accent-1 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 mt-4 hover:opacity-90 transition-opacity"
                                            >
                                                Praticar Exercício do Tema
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-accent-1/5 border border-accent-1/20 p-6 rounded-3xl text-center">
                                                <h4 className="text-sm font-black text-accent-1 uppercase tracking-tight mb-2">Estudo Customizado</h4>
                                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Prepare-se para uma bateria de exercícios focada exclusivamente em <strong className="text-white">{studyConfigModal.subtopicName}</strong>.</p>
                                            </div>
                                            <button
                                                disabled={isLoadingQuestions}
                                                onClick={() => loadCustomQuestions(studyConfigModal.areaName, studyConfigModal.subtopicName, selectedQuestionCount, 'ai')}
                                                className="w-full h-14 bg-accent-1 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-1/25 disabled:opacity-45"
                                            >
                                                {isLoadingQuestions ? "Gerando exercícios..." : "Começar Prática Técnica"}
                                                <Play size={12} fill="currentColor" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {examConfigModal?.isOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] overflow-y-auto flex justify-center p-4 py-6 md:py-12"
                            >
                                <motion.div 
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="bg-bg-secondary border border-glass-border rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full space-y-6 relative overflow-hidden my-auto"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-accent-1 to-transparent opacity-60"></div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase text-accent-1 tracking-widest px-3 py-1 bg-accent-1/10 border border-accent-1/20 rounded-full">Simulado Oficial</span>
                                            <button 
                                                onClick={() => setExamConfigModal(null)}
                                                className="text-zinc-500 hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase font-anton tracking-tight">{examConfigModal.config.name}</h3>
                                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">{examConfigModal.config.description}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Tamanho da Prova</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { count: 15, label: "Rápido", desc: "15 questões" },
                                                { count: 30, label: "Foco (30)", desc: "30 questões" },
                                                { count: examConfigModal.config.totalQuestions, label: `Oficial`, desc: `${examConfigModal.config.totalQuestions} q.` }
                                            ].map(item => (
                                                <button
                                                    key={item.count}
                                                    onClick={() => setSelectedQuestionCount(item.count)}
                                                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                                        selectedQuestionCount === item.count
                                                            ? "bg-accent-1/10 border-accent-1 text-accent-1"
                                                            : "bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/[0.04]"
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                                                    <span className="text-[9px] font-bold opacity-60 leading-none">{item.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedQuestionCount !== examConfigModal.config.totalQuestions ? (
                                        <div className="space-y-4 p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Dividir por Matéria</span>
                                                <span className="text-[9px] text-amber-505/80 font-black uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Selecione uma</span>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 font-medium leading-normal">
                                                Como você escolheu um tamanho menor que o oficial, divida o simulado focando em uma única matéria:
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1">
                                                {examConfigModal.config.categoriesIncluded.map((subj) => {
                                                    const isSelected = selectedExamSubject === subj || (!selectedExamSubject && examConfigModal.config.categoriesIncluded[0] === subj);
                                                    return (
                                                        <button
                                                            key={subj}
                                                            type="button"
                                                            onClick={() => setSelectedExamSubject(subj)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? "bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md shadow-amber-500/15"
                                                                    : "bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                                                            }`}
                                                        >
                                                            {subj}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-[11px] text-emerald-400 font-medium leading-relaxed">
                                            ✨ <strong>Maratona Completa</strong>: Com a quantidade original do vestibular ({examConfigModal.config.totalQuestions} questões), todas as matérias estarão agrupadas e integradas ("matérias juntas").
                                        </div>
                                    )}

                                    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-xs text-zinc-400 leading-relaxed font-medium space-y-1">
                                        <span className="font-bold text-white uppercase text-[10px] tracking-wider block mb-1">Informações de Sessão</span>
                                        <p>⏱ Tempo Total Alocado: {examConfigModal.config.timeMinutes} minutos</p>
                                        <p>📚 Categorias Ativas: {examConfigModal.config.categoriesIncluded.join(", ")}</p>
                                    </div>

                                    <button
                                        disabled={isLoadingQuestions}
                                        onClick={() => loadFullMockExam(examConfigModal.config, selectedQuestionCount)}
                                        className="w-full h-14 bg-accent-1 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-1/25"
                                    >
                                        {isLoadingQuestions ? "Baixando caderno..." : "Iniciar Simulado Oficial"}
                                        <ArrowRight size={14} />
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ==========================================
                        MAIN VISUAL PORTAL LAYOUT BOARD
                       ========================================== */}
                    
                    {/* Header Banner */}
                    <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-12 pb-10 border-b border-white/[0.08] mb-10 w-full">
                        {/* Title Block (Column 1) */}
                        <div className="space-y-5 max-w-xl text-center lg:text-left flex-1 w-full">
                            <div className="flex flex-col lg:items-start lg:text-left items-center text-center space-y-4">
                                <div className="p-3 bg-accent-1/10 rounded-full border border-accent-1/20 shrink-0">
                                    <GraduationCap size={42} className="text-accent-1" />
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-1/10 rounded-full border border-accent-1/20 shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-1 animate-pulse"></div>
                                    <span className="text-[10px] md:text-xs font-black text-accent-1 uppercase tracking-[0.2em]">Vestibular Master</span>
                                </div>
                                
                                <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-7xl font-black tracking-tight leading-[0.95] text-black dark:text-white uppercase font-anton break-words">
                                    Arena de <br className="hidden sm:block" />
                                    <span className="text-accent-1">Simulados VestApp</span>
                                </h1>
                                
                                <p className="text-xs sm:text-sm md:text-base leading-relaxed text-black dark:text-zinc-200 tracking-tight max-w-lg">
                                    Prepare-se para FUVEST, ENEM, UNICAMP, UNESP e mais. Simulados organizados com gabarito imediato, cronometragem inteligente e cronograma anual de 52 semanas.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-xs">
                                    <div className={`px-4 py-2.5 rounded-xl border text-center ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border border-zinc-700'}`}>
                                        <p className={`text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-white/50'} uppercase tracking-widest font-black`}>Nível</p>
                                        <p className={`text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'} font-black`}>Nível 3</p>
                                    </div>
                                    <div className="px-4 py-2.5 rounded-xl bg-accent-1/10 border border-accent-1/20 text-center">
                                        <p className="text-[9px] text-accent-1 uppercase tracking-widest font-black">Simulados</p>
                                        <p className={`text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'} font-black`}>{stats?.completedCount || 0}/52</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Interactive Personal Stats widget + Subject breakdown */}
                        <div className="flex flex-col gap-4 w-full lg:max-w-xl xl:max-w-3xl flex-1 shrink-0">
                            <div className="grid grid-cols-2 gap-3 w-full animate-fadeIn">
                                {[
                                    { label: 'Média de Notas', value: stats ? `${stats.avgTri}/1k` : '--', icon: <TrendingUp size={16} />, color: 'var(--accent-1)' },
                                    { label: 'Simulados Feitos', value: stats ? stats.completedCount.toString() : '0', icon: <ShieldCheck size={16} />, color: '#10b981' },
                                    { label: 'Ranking Unificado', value: stats ? stats.ranking : '--', icon: <Trophy size={16} />, color: '#f59e0b' },
                                    { label: 'Tempo de Foco', value: stats ? stats.studyHours : '--', icon: <Clock size={16} />, color: 'var(--accent-1)' }
                                ].map((stat, i) => (
                                    <div 
                                        key={i}
                                        className="bg-bg-secondary border border-glass-border p-4 sm:p-5 rounded-[1.75rem] flex flex-col justify-start gap-1 w-full shadow-lg hover:scale-[1.03] transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-1.5" style={{ color: stat.color }}>
                                            {stat.icon}
                                            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest truncate">{stat.label}</span>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-black text-black dark:text-white font-outfit tracking-tight truncate">{stat.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Média por Matéria Breakdown */}
                            <div className="bg-bg-secondary border border-glass-border p-5 sm:p-6 rounded-[2rem] shadow-xl space-y-4 sm:space-y-5">
                                <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-accent-1 flex items-center gap-1.5">🎯 Aproveitamento por Matéria (Média TRI)</span>
                                    {statsLoading && <div className="w-2.5 h-2.5 rounded-full bg-accent-1 animate-pulse shrink-0"></div>}
                                </div>
                                <div className="space-y-5">
                                    {Object.entries(subjectAverages).map(([subj, rawData]) => {
                                        const data = rawData as { avgTri: number; total: number; correct: number; totalQuestionsCount: number };
                                        const score = data.avgTri;
                                        const percentage = Math.min(100, Math.max(0, (score / 1000) * 100));
                                        
                                        // Accent themes matching subjects
                                        let themeColor = "bg-accent-1";
                                        if (subj === "Matemática") themeColor = "bg-amber-500 dark:bg-amber-400";
                                        else if (subj === "Ciências Humanas") themeColor = "bg-indigo-500 dark:bg-indigo-400";
                                        else if (subj === "Ciências da Natureza") themeColor = "bg-emerald-500 dark:bg-emerald-400";
                                        else if (subj === "Redação") themeColor = "bg-rose-500 dark:bg-rose-400";

                                        return (
                                            <div key={subj} className="space-y-2">
                                                <div className="flex justify-between text-sm md:text-base font-black">
                                                    <span className="text-zinc-650 dark:text-zinc-200 tracking-wide font-bold">{subj}</span>
                                                    <span className="text-black dark:text-white font-outfit text-base">{score > 0 ? `${score}/1000` : "Ainda sem dados"}</span>
                                                </div>
                                                <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full ${themeColor} transition-all duration-[800ms] rounded-full`} 
                                                        style={{ width: `${percentage || 5}%` }}
                                                    ></div>
                                                </div>
                                                {data.totalQuestionsCount > 0 && (
                                                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold font-mono tracking-wide">
                                                        <span>{data.correct} acertos em {data.totalQuestionsCount} questões</span>
                                                        <span>{subj !== "Redação" && `${data.total} práticas`}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tab Switching Controls */}
                    <div className="flex justify-center mb-16">
                        <div className="bg-[var(--text-primary)]/[0.04] border border-[var(--glass-border)] p-1.5 rounded-3xl backdrop-blur-xl flex flex-wrap items-center gap-1 max-w-full">
                            {[
                                { id: 'temas', label: 'Temas & Explicações', icon: <BookBlockIcon /> },
                                { id: 'completos', label: 'Simulados Completos', icon: <GraduationCap size={15} /> },
                                { id: 'niveis', label: 'Níveis Gerais', icon: <Sliders size={15} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                                        activeTab === tab.id
                                            ? 'text-white'
                                            : 'text-[var(--text-secondary)] opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="activePortalTab"
                                            className="absolute inset-0 bg-accent-1 rounded-2xl shadow-md shadow-accent-1/25"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tab.icon}
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ==========================================
                        TAB CONTENT PANELS
                       ========================================== */}
                    <AnimatePresence mode="wait">
                        
                        {/* TAB: TEMAS & EXPLICAÇÕES */}
                        {activeTab === 'temas' && (
                            <motion.section 
                                key="temas-tab"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center max-w-2xl mx-auto mb-10">
                                    <h2 className="text-3xl font-black text-black dark:text-white uppercase font-anton tracking-tight">Ementa de Estudos VestApp</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Explore a teoria sintética condensada com os itens fundamentais cobrados e treine instantaneamente.</p>
                                </div>

                                <div className="space-y-4 w-full max-w-full">
                                    {STUDY_AREAS.map(area => {
                                        const isOpened = expandedArea === area.id;
                                        return (
                                            <div 
                                                key={area.id}
                                                className="bg-bg-secondary border border-glass-border rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-sm"
                                            >
                                                {/* Area Header Button Trigger */}
                                                <button 
                                                    onClick={() => setExpandedArea(isOpened ? null : area.id)}
                                                    className="w-full p-8 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.01] transition-all"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`text-3xl ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.03] border-white/5'} w-14 h-14 flex items-center justify-center rounded-2xl border shadow-inner`}>
                                                            {area.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white uppercase tracking-tight">{area.title}</h3>
                                                            <p className="text-xs text-zinc-500 font-medium mt-1 line-clamp-1">{area.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-zinc-500 transition-transform duration-300">
                                                        {isOpened ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                                    </div>
                                                </button>

                                                {/* Expanded Area Subtopics & Explanations Detail List */}
                                                <AnimatePresence>
                                                    {isOpened && (
                                                        <motion.div 
                                                            initial={{ height: 0 }}
                                                            animate={{ height: "auto" }}
                                                            exit={{ height: 0 }}
                                                            className="overflow-hidden border-t border-glass-border"
                                                        >
                                                            <div className="p-8 space-y-8 bg-black/5 dark:bg-[#0a0a0c]/20">
                                                                {area.subtopics.map((sub, idx) => (
                                                                    <div 
                                                                        key={idx}
                                                                        className="bg-bg-main/50 border border-glass-border rounded-[2.5rem] p-6 md:p-10 space-y-8 hover:border-accent-1/25 transition-all shadow-md"
                                                                    >
                                                                        {/* Header Area & Play Action */}
                                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glass-border pb-6">
                                                                            <div>
                                                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Tema Principal</span>
                                                                                <h4 className="text-xl md:text-2xl font-black text-white uppercase font-anton tracking-tight">{sub.name}</h4>
                                                                            </div>
                                                                            
                                                                            <button 
                                                                                onClick={() => setStudyConfigModal({ isOpen: true, subtopicName: sub.name, areaName: area.title })}
                                                                                className="px-6 py-3 bg-accent-1 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-103 active:scale-97 transition-all flex items-center gap-2 self-start md:self-auto shadow-md"
                                                                            >
                                                                                <Play size={12} fill="currentColor" />
                                                                                Praticar Exercícios
                                                                            </button>
                                                                        </div>

                                                                        {/* Interactive Persona Explanations Grid */}
                                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                                                                            {/* Left: O Vest Falando */}
                                                                            <div className="lg:col-span-8 flex flex-col justify-between">
                                                                                <div className="bg-gradient-to-br from-indigo-500/10 via-accent-1/[0.03] to-transparent border border-indigo-500/10 p-6 md:p-8 rounded-[2rem] relative overflow-hidden space-y-4 shadow-xl">
                                                                                    <div className="absolute top-6 right-6 text-7xl opacity-5 select-none font-black pointer-events-none">🎓</div>
                                                                                    
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-10 h-10 rounded-full bg-accent-1/10 flex items-center justify-center border border-accent-1/20 text-accent-1 font-bold text-center">
                                                                                            🏫
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-accent-1 block">A Banca Examinadora Fala</span>
                                                                                            <span className="text-[9px] font-semibold text-zinc-500 tracking-wider">Conselhos Diretos do Vestibular</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="space-y-4">
                                                                                        <p className="text-[15px] md:text-base font-medium italic leading-relaxed text-zinc-150 font-sans">
                                                                                            "Preste atenção, candidato! Quando eu elaboro questões sobre <strong className="text-accent-1 font-bold">{sub.name}</strong> nas minhas provas de vestibular, meu objetivo não é ver se você decorou fórmulas mecânicas ou regrinhas vazias. O que eu quero avaliar em você de verdade é isso: <span className="text-zinc-300 font-medium">{sub.description}</span>"
                                                                                        </p>
                                                                                        
                                                                                        <div className="bg-black/35 border border-white/5 p-5 rounded-2xl space-y-2">
                                                                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] block">✔ O que eu cobro constantemente</span>
                                                                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-semibold text-zinc-400">
                                                                                                {sub.keyPoints.map((point, pIdx) => (
                                                                                                    <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                                                                                                        <span className="text-emerald-400 font-bold shrink-0">✔</span>
                                                                                                        <span>{point}</span>
                                                                                                    </li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Right: Golden Tips */}
                                                                            <div className="lg:col-span-4 flex">
                                                                                <div className="bg-gradient-to-b from-amber-400/[0.08] to-amber-400/[0.01] border border-amber-400/20 p-6 md:p-8 rounded-[2rem] flex flex-col justify-between w-full space-y-4 shadow-xl">
                                                                                    <div className="space-y-3">
                                                                                        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-amber-400">
                                                                                            <Sparkles size={14} className="text-amber-400 animate-pulse" /> Minha Dica de Ouro de Examinador:
                                                                                        </div>
                                                                                        <p className="text-sm text-zinc-300 italic font-medium leading-relaxed">
                                                                                            "{sub.tips}"
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="pt-4 border-t border-amber-400/10 text-[10px] text-zinc-500 font-semibold tracking-wide">
                                                                                        Dica compilada com base nas últimas estatísticas das bancas brasileiras.
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* INLINE INTERACTIVE QUESTIONS FOR THE TOPIC */}
                                                                        <div className="pt-6 space-y-6">
                                                                            <div className="flex items-center gap-4 mb-4">
                                                                                <div className="h-px flex-1 bg-white/5"></div>
                                                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Exercícios Práticos Recomendados</span>
                                                                                <div className="h-px flex-1 bg-white/5"></div>
                                                                            </div>
                                                                            
                                                                            <div className="space-y-8">
                                                                                {OFFICIAL_QUESTIONS
                                                                                    .filter(q => q.subtopic === sub.name || q.area === area.title.replace(/^\d+\.\s*/, ''))
                                                                                    .slice(0, 1) // Show at least one representative question inline
                                                                                    .map(q => (
                                                                                        <InteractiveQuestionCard 
                                                                                            key={q.id} 
                                                                                            question={q as any} 
                                                                                            theme={theme} 
                                                                                        />
                                                                                    ))
                                                                                }
                                                                                
                                                                                {OFFICIAL_QUESTIONS.filter(q => q.subtopic === sub.name || q.area === area.title.replace(/^\d+\.\s*/, '')).length === 0 && (
                                                                                    <div className="bg-white/[0.01] border border-dashed border-white/5 p-10 rounded-3xl text-center">
                                                                                        <HelpCircle size={32} className="mx-auto text-zinc-600 mb-4" />
                                                                                        <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Prepare-se: Questões Reais Chegando</p>
                                                                                        <p className="text-xs text-zinc-600 mt-2">Estamos processando novas questões oficiais para este tópico específico.</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}

                        {/* TAB 2: DETAILED COMPLETE SIMULATED EXAMS LIST (AS REQUESTED) */}
                        {activeTab === 'completos' && (
                            <motion.section 
                                key="completos-tab"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-10"
                            >
                                <div className="space-y-2 text-center max-w-2xl mx-auto">
                                    <h2 className="text-3xl font-black text-black dark:text-white uppercase font-anton tracking-tight">Simulados Completos Vestibulares</h2>
                                    <p className="text-sm text-zinc-500 font-medium">As maiores maratonas de estudo brasileiras. Cronômetro integral e gabarito imediato de correção.</p>
                                </div>

                                {/* INSTITUTION SELECTOR TABS */}
                                <div className="flex flex-wrap items-center justify-center gap-3 w-full py-2">
                                    {[
                                        { id: "todos", name: "Todos Simulados", count: FULL_EXAMS_CONFIGS.length, color: "hover:border-accent-1/50" },
                                        { id: "enem", name: "ENEM", count: FULL_EXAMS_CONFIGS.filter(e => e.id.startsWith("enem")).length, color: "hover:border-amber-400/50 text-amber-300" },
                                        { id: "fuvest", name: "FUVEST", count: FULL_EXAMS_CONFIGS.filter(e => e.id.startsWith("fuvest")).length, color: "hover:border-blue-400/50 text-blue-300" },
                                        { id: "unicamp", name: "UNICAMP", count: FULL_EXAMS_CONFIGS.filter(e => e.id.startsWith("unicamp")).length, color: "hover:border-purple-400/50 text-purple-355" },
                                        { id: "unesp", name: "UNESP", count: FULL_EXAMS_CONFIGS.filter(e => e.id.startsWith("unesp")).length, color: "hover:border-teal-400/50 text-teal-300" },
                                    ].map(inst => {
                                        const isActive = selectedInstitution === inst.id;
                                        return (
                                            <button
                                                key={inst.id}
                                                id={`filter-btn-${inst.id}`}
                                                onClick={() => setSelectedInstitution(inst.id as any)}
                                                className={`px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                                                    isActive 
                                                        ? 'bg-accent-1 text-slate-950 border-accent-1 scale-[1.03] shadow-lg shadow-accent-1/25' 
                                                        : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white ' + inst.color
                                                }`}
                                            >
                                                <span>{inst.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${
                                                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/5 text-zinc-500'
                                                }`}>
                                                    {inst.count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-full">
                                    {FULL_EXAMS_CONFIGS.filter(config => {
                                        if (selectedInstitution === 'todos') return true;
                                        return config.id.startsWith(selectedInstitution);
                                    }).map(config => (
                                        <div 
                                            key={config.id}
                                            className="bento-card p-8 flex flex-col justify-between group h-full relative overflow-hidden"
                                        >
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-accent-1/10 text-accent-1 border border-accent-1/20 rounded-xl">
                                                        {config.badge}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-accent-1 transition-colors">
                                                        <Zap size={18} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-black text-black dark:text-white leading-tight uppercase font-anton">{config.name}</h3>
                                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{config.description}</p>
                                                </div>

                                                <div className="flex items-center gap-3 py-2 border-t border-b border-white/5">
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-black uppercase">
                                                        <Clock size={13} className="text-zinc-500" />
                                                        <span>{config.timeMinutes} MINutos</span>
                                                    </div>
                                                    <span className="text-zinc-600 block">|</span>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-black uppercase">
                                                        <BookOpen size={13} className="text-zinc-500" />
                                                        <span>{config.totalQuestions} Questões</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    if (config.id.includes('redacao')) {
                                                        setActiveTab('redacao' as any);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    } else {
                                                        setExamConfigModal({ isOpen: true, config });
                                                    }
                                                }}
                                                className="w-full h-12 mt-8 bg-accent-1 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-1/25 cursor-pointer"
                                            >
                                                Entrar na Prova
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* TAB 3: DIFFICULTY LEVELS POINTING FOR COMPATIBILITY */}
                        {activeTab === 'niveis' && (
                            <motion.section 
                                key="niveis-tab"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center max-w-2xl mx-auto mb-4">
                                    <h2 className="text-3xl font-black text-black dark:text-white uppercase font-anton tracking-tight">Estágios de Desempenho</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Acelere sua performance por categorias de exercícios rápidos.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        {
                                            name: 'Vôo Suave',
                                            display: 'Fácil',
                                            path: 'facil',
                                            description: 'Simulados conceituais focados em revisão rápida de conceitos acadêmicos chaves.',
                                            color: 'text-emerald-400',
                                            bgColor: 'bg-emerald-400'
                                        },
                                        {
                                            name: 'Correntes Fortes',
                                            display: 'Médio',
                                            path: 'medio',
                                            description: 'Blocos intermediários exigindo formulação e raciocínio técnico moderado.',
                                            color: 'text-yellow-400',
                                            bgColor: 'bg-yellow-400'
                                        },
                                        {
                                            name: 'Olho do Furacão',
                                            display: 'Difícil',
                                            path: 'dificil',
                                            description: 'Questões master repletas de cálculos extensos dadas nos vestibulares mais difíceis.',
                                            color: 'text-rose-400',
                                            bgColor: 'bg-rose-400'
                                        }
                                    ].map((level) => (
                                        <div
                                            key={level.name}
                                            className="bento-card p-10 flex flex-col items-center gap-8 text-center group relative"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{level.name}</span>
                                            <h2 className={`text-5xl font-black uppercase font-anton ${level.color} tracking-tight`}>{level.display}</h2>
                                            <p className="text-sm text-zinc-400 font-medium leading-relaxed min-h-[4rem]">{level.description}</p>
                                            <Link 
                                                to={`/simulados/${level.path}`}
                                                className="w-full h-12 bg-accent-1 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all mt-auto"
                                            >
                                                Começar
                                                <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
};

// Simple Custom Icon for Syllabus list
const BookBlockIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

class SimuladoErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-8">
                    <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-3xl max-w-2xl">
                        <h2 className="text-2xl font-black text-rose-500 mb-4">Erro Crítico no Simulado</h2>
                        <p className="text-zinc-300 mb-4">Ocorreu um erro ao renderizar esta página. Detalhes técnicos:</p>
                        <pre className="bg-black/50 p-4 rounded-xl overflow-auto text-xs font-mono text-rose-300">
                            {this.state.error?.message}
                            <br />
                            {this.state.error?.stack}
                        </pre>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function SimuladoWrapper() {
    return (
        <SimuladoErrorBoundary>
            <Simulado />
        </SimuladoErrorBoundary>
    );
}
