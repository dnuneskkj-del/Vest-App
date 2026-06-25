import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
    FileText, Send, BookOpen, Clock, AlertCircle, CheckCircle2, 
    Trophy, Lightbulb, Sparkles, Star, ChevronLeft, Maximize2, 
    Minimize2, Zap, RefreshCw, Layers, ShieldCheck, Eye, ArrowRight, Search, 
    ChevronDown, Camera, FilePlus, Image as ImageIcon, Paperclip, Trash2,
    FileUp, ArrowLeft, Upload, Calendar
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment, query, where, getDocs, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Theme {
    id: number;
    title: string;
    category: string;
    tag: string;
    repertoires: { type: string; concept: string; application: string }[];
    motivationalTexts: { source: string; title: string; content: string[]; date?: string }[];
    badge?: string;
    isFeatured?: boolean;
    week?: number;
    genre?: string;
    coverImage?: string;
}

import KnowledgeSidebar from '../components/KnowledgeSidebar';
import TrendsSidebar from '../components/TrendsSidebar';
import { useTrendingData } from '../hooks/useTrendingData';
import { Post as PostType } from '../types';

const ENEM_COMPETENCIES = [
    { title: 'Competência I', desc: 'Demonstrar domínio da modalidade escrita formal da língua portuguesa.' },
    { title: 'Competência II', desc: 'Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema dentro dos limites estruturais do texto dissertativo-argumentatativo em prosa.' },
    { title: 'Competência III', desc: 'Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.' },
    { title: 'Competência IV', desc: 'Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.' },
    { title: 'Competência V', desc: 'Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.' },
];

const rawThemesList: Theme[] = [
    { 
        id: 1, 
        title: 'Impactos da Inteligência Artificial na Educação do Século XXI', 
        category: 'Tecnologia', 
        tag: 'Estilo ENEM',
        week: 1,
        badge: '🔥 Semana 1',
        isFeatured: false,
        repertoires: [
            { type: 'Filosofia', concept: 'Pierre Lévy (Cibercultura)', application: 'Discutir a inteligência coletiva e como a IA pode potencializar o saber compartilhado.' },
            { type: 'Sociologia', concept: 'Zygmunt Bauman (Modernidade Líquida)', application: 'Analisar a volatilidade das informações e a rapidez com que as ferramentas de IA mudam o ensino.' }
        ],
        motivationalTexts: [
            { 
                source: 'G1 - Educação',
                title: 'IA na sala de aula: 70% dos professores brasileiros já utilizam ferramentas generativas', 
                content: [
                    'Levantamento revelado indica que a adoção de IA por professores tem crescido exponencialmente. No entanto, faltam diretrizes e formação ética para evitar fraudes ou dependência excessiva.',
                    'A principal preocupação declarada é que o uso de assistentes virtuais atrofie a produção de textos autorais e o raciocínio independente dos estudantes.'
                ] 
            },
            {
                source: 'UNESCO',
                title: 'Consenso de Pequim sobre a Inteligência Artificial na Educação',
                content: [
                    'A Inteligência Artificial deve ser utilizada para superar as desigualdades educacionais e não para agravá-las. É fundamental que as políticas públicas garantam o acesso equitativo a essas ferramentas.',
                    'O desenvolvimento de IA na educação precisa estar centrado no ser humano, respeitando os direitos humanos e promovendo o desenvolvimento sustentável.'
                ]
            },
            {
                source: 'Artigo Científico',
                title: 'O Fim da Autoria ou a Evolução da Escrita?',
                content: [
                    'As ferramentas de inteligência artificial generativa, ao serem introduzidas no ambiente acadêmico, levantam a discussão: a quem pertence o texto gerado por uma máquina a partir de comandos humanos?',
                    'A adaptação do método avaliativo clássico é urgente. Mais do que medir a memorização, as instituições deverão avaliar a criticidade, o pensamento analítico e a curadoria na supervisão do conteúdo da IA.'
                ]
            }
        ]
    },
    { 
        id: 2, 
        title: 'Caminhos para combater a insegurança alimentar no Brasil', 
        category: 'Social', 
        tag: 'Estilo ENEM',
        week: 2,
        badge: '🌾 Semana 2',
        repertoires: [
            { type: 'Geografia', concept: 'Geografia da Fome (Josué de Castro)', application: 'Demonstrar que a fome é resultado de fatores políticos e estruturais de má distribuição de renda.' },
            { type: 'Filosofia', concept: 'A Banalidade do Mal (Hannah Arendt)', application: 'Como a indiferença social e apatia perante a escassez alheia perpetuam o problema.' }
        ],
        motivationalTexts: [
            { 
                source: 'Folha de S.Paulo',
                title: 'Insegurança alimentar severa atinge milhões nas periferias urbanas', 
                content: [
                    'A inflação e a desocupação estrutural levam famílias a reduzir porções de comida limpa ou cortar refeições completas por completo.',
                    'A fome no Brasil não advém de falta de produção agropecuária, mas de assimetria logística, desigualdade socioeconômica severa e desperdício massivo de alimentos no transporte.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 3, 
        title: 'O papel do esporte na inclusão social de jovens periféricos', 
        category: 'Sociedade', 
        tag: 'Estilo ENEM',
        week: 3,
        badge: '⚽ Semana 3',
        repertoires: [
            { type: 'Sociologia', concept: 'Coesão Social (Émile Durkheim)', application: 'O esporte como instituição social aglutinadora que integra indivíduos sob regras comuns.' }
        ],
        motivationalTexts: [
            { 
                source: 'Estadão',
                title: 'Projetos esportivos geram redução da marginalização infantil nas vilas olímpicas', 
                content: [
                    'A oferta de quadras coletivas com monitores diminui em 30% a adesão de adolescentes vulneráveis a caminhos ilícitos.',
                    'O acesso contínuo ao treinamento físico e esportivo de base impulsiona saúde, autoestima e mobilidade educacional.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 4,
        title: 'Os limites da liberdade de expressão na era da desinformação digital',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 4,
        badge: '⚖️ Semana 4',
        repertoires: [
            { type: 'Filosofia', concept: 'Contrato Social (Thomas Hobbes)', application: 'Para garantir a paz civil, o Estado detém o monopólio da regulação, impondo limites normativos.' }
        ],
        motivationalTexts: [
            {
                source: 'Nexo Jornal',
                title: 'Propagação artificial de boatos ameaça a estabilidade institucional',
                content: [
                    'O descontrole algorítmico incentiva conteúdos polarizadores e nocivos em busca de cliques rápidos.',
                    'Garantir a expressão livre não significa tolerar fraudes comprovadas ou incitações coordenadas que quebrem redes de confiança social.'
                ]
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 5,
        title: 'A persistência da violência contra as mulheres nas relações domésticas',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 5,
        badge: '💜 Semana 5',
        repertoires: [
            { type: 'Filosofia', concept: 'Simone de Beauvoir', application: 'Estudar a construção histórica do papel feminino subalternizado que alimenta a opressão masculina.' }
        ],
        motivationalTexts: [
            {
                source: 'G1',
                title: 'Anuário de Segurança Pública registra alta nos índices de feminicídio no país',
                content: [
                    'A maior parte das ocorrências graves se dá em contextos onde a vítima tenta romper amarras de dependência emocional ou econômica.',
                    'Mapeamentos indicam que a expansão de delegacias da mulher é vital, combinada com letramento de gênero de base.'
                ]
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 6,
        title: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 6,
        badge: '🏹 Semana 6',
        repertoires: [
            { type: 'Antropologia', concept: 'Darcy Ribeiro (O Povo Brasileiro)', application: 'Explicar a pluralidade e a matriz indígena e quilombola como eixos constituintes da nação.' }
        ],
        motivationalTexts: [
            {
                source: 'Socioambiental',
                title: 'Comunidades ribeirinhas e quilombolas lutam pelo reconhecimento de seus territórios',
                content: [
                    'Povos tradicionais sustentam a biodiversidade nativa através de modos de manejo orgânicos e cooperativos.',
                    'A falta de demarcação regular expõe essas populações a perigos de desapropriação e violência rural.'
                ]
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 7,
        title: 'O estigma associado às doenças mentais na sociedade brasileira contemporânea',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 7,
        badge: '🧠 Semana 7',
        repertoires: [
            { type: 'Sociologia', concept: 'Sociologia da Saúde (Michel Foucault)', application: 'Analisar como a loucura e transtornos neurológicos são historicamente isolados e patologizados.' }
        ],
        motivationalTexts: [
            {
                source: 'BBC Brasil',
                title: 'Ansiedade crônica e depressão crescem, mas preconceito ainda impede busca por ajuda',
                content: [
                    'Mais da metade dos trabalhadores relata cansaço mental extremo, mas receia expor a estigmas em seu local de labor.',
                    'Estruturar a resposta do SUS com psicólogos em centros de atenção psicossocial é urgente para desmistificar tratamentos.'
                ]
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 8,
        title: 'Impactos do sedentarismo e caminhos para a promoção da saúde física nacional',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 8,
        badge: '🏃 Semana 8',
        repertoires: [
            { type: 'Sociologia', concept: 'Zygmunt Bauman (Hiperconsumo)', application: 'A comodidade contemporânea e as telas substituem a movimentação física por entretenimento passivo.' }
        ],
        motivationalTexts: [
            {
                source: 'Inca',
                title: 'Falta de exercício constante agrava predisposição a enfermidades cardiovasculares',
                content: [
                    'Especialistas alertam que pequenas rotinas de caminhada diminuem drasticamente a sobrecarga do sistema público.',
                    'Criar corredores verdes desportivos nas metrópoles fomenta a reinserção do esporte livre no cotidiano.'
                ]
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 9, 
        title: 'A mercantilização do bem-estar e o imperativo da felicidade na pós-modernidade', 
        category: 'Sociedade', 
        tag: 'FUVEST',
        week: 1,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 1',
        repertoires: [
            { type: 'Filosofia', concept: 'Byung-Chul Han (Sociedade do Cansaço)', application: 'A autopromoção e exigência permanente de felicidade transformam o indivíduo em um explorador de si mesmo.' }
        ],
        motivationalTexts: [
            { 
                source: 'Revista Cult',
                title: 'O comércio da positividade gerencial e a supressão do luto crítico', 
                content: [
                    'Manchetes contemporâneas vendem aplicativos, retiros e métodos de performance mental como remédios compulsivos para o mal-estar social.',
                    'A incapacidade coletiva de acolher e refletir sobre a tristeza oculta as contradições políticas do nosso tempo.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 10, 
        title: 'Carta aberta à comunidade escolar propondo alternativas de combate ao bullying digital', 
        category: 'Educação', 
        tag: 'UNICAMP',
        week: 2,
        genre: 'Carta Aberta',
        badge: '🎓 Unicamp • Semana 2',
        repertoires: [
            { type: 'Pedagogia', concept: 'Paulo Freire (Educação Dialógica)', application: 'O combate ao assédio reside na consolidação de canais horizontais de fala e escuta democrática na escola.' }
        ],
        motivationalTexts: [
            { 
                source: 'Unicamp Vestibulares',
                title: 'Gênero Carta Aberta: Atuação Cidadã e Voz do Estudante', 
                content: [
                    'A Unicamp requer que o candidato incorpore uma persona bem delineada e faça uma chamada persuasiva ao público alvo da carta.',
                    'Mobilize argumentos que mesclem vivência discente prática, civismo e propostas de oficinas de empatia no ambiente digital.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 11, 
        title: 'Reconhecimento facial nas metrópoles: a segurança pública justifica a abdicação da privacidade?', 
        category: 'Tecnologia', 
        tag: 'UNESP',
        week: 3,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 3',
        repertoires: [
            { type: 'Filosofia', concept: 'Pan-óptico (Jeremy Bentham)', application: 'A sensação de vigilância contínua amortece a divergência e padroniza os comportamentos individuais de forma invisível.' }
        ],
        motivationalTexts: [
            { 
                source: 'Unesp Debate',
                title: 'O desequilíbrio entre controle tecnológico urbano e direitos de trânsito dos cidadãos', 
                content: [
                    'Instalações massivas de câmeras públicas prometem encontrar fugitivos, mas multiplicam alarmes falsos baseados em preconceito algorítmico.',
                    'A Unesp frequentemente estrutura discussões sobre dilemas morais claros, onde o candidato precisa responder diretamente ao paradoxo.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 12, 
        title: 'O prestígio social e os dilemas éticos das carreiras científicas na sociedade contemporânea', 
        category: 'Cultura', 
        tag: 'FUVEST',
        week: 4,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 FUVEST • Semana 4',
        repertoires: [
            { type: 'Filosofia', concept: 'Ceticismo Metódico', application: 'A busca científica por verdades rigorosas sob o risco de mercantilização e perda da vocação humanística essencial.' }
        ],
        motivationalTexts: [
            { 
                source: 'Departamento de Sociologia da USP / FUVEST',
                title: 'O prestígio social acadêmico frente ao utilitarismo mercadológico moderno', 
                content: [
                    'Investigar e descobrir novos mecanismos naturais exige autonomia e financiamento livre de amarras puramente financeiras.',
                    'Discuta o impacto do declínio da valorização do cientista de base na capacidade reflexiva e progresso das nações modernas.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 13, 
        title: 'As fronteiras éticas entre o livre arbítrio e os limites regulatórios da engenharia genética', 
        category: 'Tecnologia', 
        tag: 'FUVEST',
        week: 5,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 5',
        repertoires: [
            { type: 'Bioética', concept: 'Imperativo Categórico (Immanuel Kant)', application: 'Intervir na biologia humana herdada deve respeitar a dignidade do indivíduo como um fim em si mesmo, e não mercadoria.' }
        ],
        motivationalTexts: [
            { 
                source: 'Adusp',
                title: 'Descobertas do CRISPR abrem caminho para personalização biológica reprodutiva', 
                content: [
                    'Editar males congênitos é valioso, mas o fantasma de eugenia social surge quando recursos privados conseguem moldar características de descendentes.',
                    'Analise criticamente se a autonomia deve ser limitada para resguardar a igualdade inerente à espécie humana.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 14, 
        title: 'Artigo de opinião: Os impactos da gentrificação e do turismo predatório nos grandes centros históricos', 
        category: 'Social', 
        tag: 'UNICAMP',
        week: 6,
        genre: 'Artigo de Opinião',
        badge: '🎓 Unicamp • Semana 6',
        repertoires: [
            { type: 'Geografia', concept: 'David Harvey (O Direito à Cidade)', application: 'Demonstrar como a lógica imobiliária corporativa retira moradores originais para especulação mercadológica.' }
        ],
        motivationalTexts: [
            { 
                source: 'Comvest',
                title: 'A turistificação de bairros vulneráveis e a expulsão cultural local', 
                content: [
                    'Quando bairros periféricos viram cenários de puro apelo visual e preços inflacionados, a identidade autêntica é perdida.',
                    'Defenda opções de bairros mistos e regulação de aluguel por plataforma no gênero Artigo de Opinião (com tom persuasivo e autoral).'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 15, 
        title: 'Ativismo em redes sociais: engajamento cívico legítimo ou mero espetáculo de aparências?', 
        category: 'Sociedade', 
        tag: 'UNESP',
        week: 7,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 7',
        repertoires: [
            { type: 'Sociologia', concept: 'A Sociedade do Espetáculo (Guy Debord)', application: 'As ações reais de protesto convertem-se em mercadorias de visibilidade virtual e curtidas estéreis.' }
        ],
        motivationalTexts: [
            { 
                source: 'Revista de Estudos Sociais',
                title: 'Do Slacktivism à mobilização corpórea nas redes democráticas', 
                content: [
                    'Compartilhar hashtags e alterar stickers estéticos de fotos no celular cria uma falsa ilusão de dever civil cumprido.',
                    'Por outro lado, as ferramentas digitais foram cruciais para articular protestos globais contra abusos institucionais.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    { 
        id: 16, 
        title: 'Carta aberta: O papel do grafite e das manifestações artísticas periféricas na apropriação dos espaços urbanos', 
        category: 'Sociedade', 
        tag: 'UNICAMP',
        week: 8,
        genre: 'Carta Aberta',
        badge: '🎓 UNICAMP • Semana 8',
        repertoires: [
            { type: 'Sociologia', concept: 'Direito à Cidade (Henri Lefebvre)', application: 'A arte urbana como forma de resistência e ressignificação de espaços cinzentos que excluem a voz popular.' }
        ],
        motivationalTexts: [
            { 
                source: 'Comvest UNICAMP',
                title: 'Estética periférica e a legitimação cultural das artes públicas urbanas', 
                content: [
                    'O grafite e o muralismo revitalizam bairros negligenciados e dão voz a demandas sociais silenciadas.',
                    'Elabore uma Carta Aberta argumentando sobre investimentos públicos obrigatórios em galerias públicas e oficinas artísticas comunitárias.'
                ] 
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    // --- ESTILO ENEM (Semanas 9 a 44) ---
    {
        id: 17,
        title: 'O desperdício de água no Brasil e a urgência de uma nova cultura de consumo',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 9,
        badge: '💧 Semana 9',
        repertoires: [
            { type: 'Sociologia', concept: 'Modernidade Líquida (Zygmunt Bauman)', application: 'Como a impermanência e o desperdício viraram valores de consumo inconsciente e predatório.' }
        ],
        motivationalTexts: [
            {
                source: 'ANA - Agência Nacional de Águas',
                title: 'Perdas na rede de distribuição urbana chegam a 40% no território nacional',
                content: ['O saneamento básico ineficiente somado aos maus hábitos domésticos e agrícolas ameaçam a segurança hídrica das gerações futuras do país.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 18,
        title: 'Desafios para garantir a inclusão escolar de alunos autistas no Brasil',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 10,
        badge: '🧩 Semana 10',
        repertoires: [
            { type: 'Educação', concept: 'Pedagogia da Autonomia (Paulo Freire)', application: 'Uma escola verdadeiramente inclusiva deve respeitar a alteridade e criar metodologias adaptadas.' }
        ],
        motivationalTexts: [
            {
                source: 'MEC - Censo Escolar',
                title: 'Matrículas de estudantes com TEA em classes comuns saltam 80% em cinco anos',
                content: ['Embora o acesso tenha crescido, as escolas enfrentam barreiras severas pela falta de auxiliares capacitados e preconceito institucional de docentes.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 19,
        title: 'A invisibilidade do trabalho de cuidado realizado pelas mulheres no Brasil',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 11,
        badge: '👩 Semana 11',
        repertoires: [
            { type: 'Sociologia', concept: 'Silvia Federici (O Ponto Zero da Revolução)', application: 'O trabalho doméstico e reprodutivo não remunerado é pilar invisibilizado da economia capitalista.' }
        ],
        motivationalTexts: [
            {
                source: 'IBGE',
                title: 'Mulheres dedicam o dobro de horas a atividades domésticas que homens',
                content: ['A jornada dupla e o cuidado com crianças, idosos e doentes sobrecarrega a saúde mental e limita o crescimento profissional das brasileiras.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 20,
        title: 'Caminhos para enfrentar o racismo estrutural nas instituições brasileiras',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 12,
        badge: '✊🏾 Semana 12',
        repertoires: [
            { type: 'Filosofia', concept: 'Racismo Estrutural (Silvio Almeida)', application: 'O racismo não é uma anomalia comportamental individual, mas um elemento constitutivo das engrenagens políticas e jurídicas.' }
        ],
        motivationalTexts: [
            {
                source: 'DPE - Defensoria Pública',
                title: 'Juventude negra lidera índices de violência policial e subrepresentação institucional',
                content: ['Desconstruir estereótipos criminosos e alargar o acesso a postos de comando é essencial para edificar uma nação equânime.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 21,
        title: 'O impacto das fake news no processo democrático contemporâneo',
        category: 'Tecnologia',
        tag: 'Estilo ENEM',
        week: 13,
        badge: '📱 Semana 13',
        repertoires: [
            { type: 'Filosofia', concept: 'Regime de Informação (Byung-Chul Han)', application: 'As redes digitais substituíram a esfera pública de debates ponderados pela disseminação viral de afetos e boatos.' }
        ],
        motivationalTexts: [
            {
                source: 'TSE',
                title: 'Desinformação em massa sabota a soberania e a estabilidade das instituições municipais',
                content: ['A criação de mentiras arquitetadas de forma oculta debilita o livre arbítrio e confunde o eleitor no ambiente digital.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 22,
        title: 'Caminhos para a inclusão produtiva de idosos no mercado de trabalho',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 14,
        badge: '👵 Semana 14',
        repertoires: [
            { type: 'Sociologia', concept: 'Cidadania Incompleta (Milton Santos)', application: 'Deixar parcelas da população idosa vulneráveis ao abandono social e ao etarismo laborativo impede a cidadania plena.' }
        ],
        motivationalTexts: [
            {
                source: 'IPEA',
                title: 'Envelhecimento acelerado da população projeta necessidade de requalificação profissional de idosos',
                content: ['Com o aumento da expectativa de vida, garantir que os idosos continuem ativos e respeitados nas empresas é desafio de sustentabilidade econômica.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 23,
        title: 'O papel do cinema e das artes na formação cidadã dos brasileiros',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 15,
        badge: '🎬 Semana 15',
        repertoires: [
            { type: 'Filosofia', concept: 'Indústria Cultural (Theodor Adorno)', application: 'As artes integradas podem ser usadas para massificação alienadora ou, se democratizadas, para a emancipação criativa crítica.' }
        ],
        motivationalTexts: [
            {
                source: 'Ancine',
                title: 'Mais de 80% dos municípios do Brasil não possuem salas de cinema ativas',
                content: ['A barreira espacial e o custo elevado transformam a cultura cinematográfica em privilégio de elites metropolitanas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 24,
        title: 'Desafios do saneamento básico para a saúde preventiva da população',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 16,
        badge: '🚰 Semana 16',
        repertoires: [
            { type: 'Ciências', concept: 'Oswaldo Cruz e a profilaxia urbana', application: 'Mostrar como saneamento urbano e esgotamento sanitário impedem que surtos de patologias evitem sobrecarga do SUS.' }
        ],
        motivationalTexts: [
            {
                source: 'Instituto Trata Brasil',
                title: 'Quase 35 milhões de cidadãos ainda vivem sem acesso a água encanada segura',
                content: ['A ausência de esgoto estruturado causa milhares de internações anuais infantis por problemas gastrointestinais evitáveis.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 25,
        title: 'Os impactos da economia de plataformas (uberização) na precarização laboral de jovens',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 17,
        badge: '🚴 Semana 17',
        repertoires: [
            { type: 'Sociologia', concept: 'Precarização do Trabalho (Ricardo Antunes)', application: 'Como a ausência de direitos constitucionais cria um novo contingente de autônomos sem amparo de seguridade social.' }
        ],
        motivationalTexts: [
            {
                source: 'MPT - Ministério Público do Trabalho',
                title: 'Entregadores e motoristas enfrentam jornadas de 14h sem garantia de auxílio-doença',
                content: ['O mito do "empreendedor individual" dilui a responsabilidade jurídica das gigantes tecnológicas sobre acidentes de trabalho.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 26,
        title: 'Caminhos para a preservação do patrimônio histórico-cultural nacional',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 18,
        badge: '🧱 Semana 18',
        repertoires: [
            { type: 'Filosofia', concept: 'Lugar de Memória (Pierre Nora)', application: 'A preservação física de museus e arquivos é o que resguarda a identidade coletiva das fraturas do tempo.' }
        ],
        motivationalTexts: [
            {
                source: 'Iphan',
                title: 'Incêndios e abandono estrutural de casarões coloniais apagam registros de nossa história',
                content: ['A escassez crônica de verba pública para manutenção preventiva expõe relíquias materiais a ruínas definitivas em várias capitais.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 27,
        title: 'Alternativas para combater o descarte inadequado de lixo eletrônico',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 19,
        badge: '🔋 Semana 19',
        repertoires: [
            { type: 'Tecnologia', concept: 'Obsolescência Programada', application: 'A indústria acelera o descarte de dispositivos forçando o consumidor a multiplicar resíduos poluentes sem cessar.' }
        ],
        motivationalTexts: [
            {
                source: 'G1 Meio Ambiente',
                title: 'Brasil é o maior produtor de lixo eletroeletrônico da América Latina',
                content: ['Metais pesados despejados incorretamente infiltram-se em lençóis freáticos, contaminando cadeias agrícolas e adoecendo cooperativas ribeirinhas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 28,
        title: 'A democratização do acesso à cultura digital nas periferias brasileiras',
        category: 'Tecnologia',
        tag: 'Estilo ENEM',
        week: 20,
        badge: '🌐 Semana 20',
        repertoires: [
            { type: 'Geografia', concept: 'Espaço Cibernético (Milton Santos)', application: 'A exclusão das conexões rápidas impede que jovens periféricos adquiram habilidades para a economia baseada em dados.' }
        ],
        motivationalTexts: [
            {
                source: 'Cetic.br',
                title: 'Famílias de baixa renda dependem de planos móveis instáveis limitados a redes específicas',
                content: ['Sem computadores e banda larga de qualidade para estudos, a juventude pobre fica sitiada informacionalmente na base escolar.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 29,
        title: 'Caminhos para a reinserção social de ex-detentos no mercado de trabalho',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 21,
        badge: '⛓️ Semana 21',
        repertoires: [
            { type: 'Sociologia', concept: 'Estigma Social (Erving Goffman)', application: 'O preconceito generalizado age como barreira indelével impedindo que o indivíduo saia de ciclos infratores.' }
        ],
        motivationalTexts: [
            {
                source: 'DEPEN',
                title: 'Taxa de reincidência prisional perto de 40% é alimentada por falta de vagas honestas de emprego',
                content: ['Empresas relutam em estender contratações formais para pessoas com antecedentes criminais, trancando caminhos de reabilitação.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 30,
        title: 'Desafios para combater a evasão escolar no ensino médio público',
        category: 'Educação',
        tag: 'Estilo ENEM',
        week: 22,
        badge: '🏫 Semana 22',
        repertoires: [
            { type: 'Sociologia', concept: 'Educação como reprodutora de classes (Pierre Bourdieu)', application: 'A escola sem apoio financeiro exclui o aluno carente que é forçado a escolher entre a sobrevivência imediata e os livros.' }
        ],
        motivationalTexts: [
            {
                source: 'Todos pela Educação',
                title: 'Mais de 20% dos jovens abandonam as salas de aula por necessidade financeira',
                content: ['A urgência de compor a renda de casa com bicos ou subempregos atrofia a conclusão do ensino básico nacional antes do tempo.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 31,
        title: 'O impacto da pirataria e a valorização dos direitos autorais no Brasil',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 23,
        badge: '🛍️ Semana 23',
        repertoires: [
            { type: 'Filosofia', concept: 'Ética Utilitarista (Jeremy Bentham)', application: 'Ponderar o bem-estar coletivo de ter acesso barato versus a viabilidade continuada de profissionais criativos produzirem saber.' }
        ],
        motivationalTexts: [
            {
                source: 'Receita Federal',
                title: 'Apreensões de mercadorias pirateadas movimentam redes clandestinas bilionárias nas grandes capitais',
                content: ['Consumir falsificações desestimula a pesquisa científica, descapitaliza a cultura nacional e sonega tributos de previdência.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 32,
        title: 'Caminhos para promover a educação financeira nas escolas públicas brasileiras',
        category: 'Educação',
        tag: 'Estilo ENEM',
        week: 24,
        badge: '💵 Semana 24',
        repertoires: [
            { type: 'Sociologia', concept: 'Zygmunt Bauman (Sociedade de Consumidores)', application: 'O estímulo ininterrupto para a aquisição irracional de bens leva ao endividamento precoce de famílias sem letramento monetário.' }
        ],
        motivationalTexts: [
            {
                source: 'Serasa Experian',
                title: 'Famílias brasileiras atingem recorde de inadimplência por falta de planejamento e crédito fácil',
                content: ['Ensinar noções de juros, economia doméstica e poupança de forma interdisciplinar desde a infância previne crises familiares agudas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 33,
        title: 'Desafios do controle de epidemias e a importância da vacinação coletiva',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 25,
        badge: '💉 Semana 25',
        repertoires: [
            { type: 'Sociologia', concept: 'Biopolítica (Michel Foucault)', application: 'Como o Estado intervém na sanidade do corpo coletivo para garantir a produtividade e a sobrevivência social de todos.' }
        ],
        motivationalTexts: [
            {
                source: 'Ministério da Saúde - PNI',
                title: 'Coberturas vacinais de imunizantes infantis clássicos caem abaixo do recomendado pela OMS',
                content: ['A difusão coordenada de calúnias anticientíficas em fóruns virtuais gerou desconfiança perante vacinas consolidadas há décadas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 34,
        title: 'Medidas para a erradicação do trabalho análogo à escravidão no Brasil contemporâneo',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 26,
        badge: '🌾 Semana 26',
        repertoires: [
            { type: 'História', concept: 'Lei Áurea e a abolição inconclusa', application: 'A libertação das pessoas escravizadas em 1888 não foi escoltada por integração fundiária ou educacional, legando heranças à vulnerabilidade rural moderna.' }
        ],
        motivationalTexts: [
            {
                source: 'Ministério do Trabalho',
                title: 'Operações de resgate libertam centenas de lavradores submetidos a servidão por dívida e cárcere privado',
                content: ['A exploração desumana dá-se prioritariamente no agronegócio isolado e na confecção urbana clandestina metropolitana de tecidos.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 35,
        title: 'O incentivo ao empreendedorismo como alternativa de superação do desemprego juvenil',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 27,
        badge: '📈 Semana 27',
        repertoires: [
            { type: 'Economia', concept: 'Destruição Criativa (Joseph Schumpeter)', application: 'Como a inovação disruptiva individual substitui estruturas fabris obsoletas e propicia novos vetores de inserção.' }
        ],
        motivationalTexts: [
            {
                source: 'Sebrae',
                title: 'Criação de microempresas individuais (MEI) vira principal portal de captação de renda para menores de 30 anos',
                content: ['Embora estimule a autonomia criativa, faltam qualificações de gestão contábil, empurrando muitos pequenos negócios a falências precoces.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 36,
        title: 'A importância da preservação das línguas indígenas e da herança linguística oral',
        category: 'Cultura',
        tag: 'Estilo ENEM',
        week: 28,
        badge: '📣 Semana 28',
        repertoires: [
            { type: 'Antropologia', concept: 'Diversidade Cultural (Claude Lévi-Strauss)', application: 'A extinção de uma língua extingue todo um sistema original de codificar o mundo e compreender ecossistemas naturais.' }
        ],
        motivationalTexts: [
            {
                source: 'Unesco',
                title: 'Mais de 150 idiomas nativos brasileiros caminham a passos largos para a extinção',
                content: ['A ausência de estímulo de ensino bilíngue nas aldeias e o preconceito urbano forçam novas gerações indígenas a renunciar a dialetos ricos.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 37,
        title: 'O papel de projetos de voluntariado na mitigação de desigualdades sociais brasileiras',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 29,
        badge: '🤝 Semana 29',
        repertoires: [
            { type: 'Filosofia', concept: 'Alteridade (Emmanuel Levinas)', application: 'Responsabilizar-se pelo sofrimento do semelhante é a base fundadora de nossa própria integridade ética e moral.' }
        ],
        motivationalTexts: [
            {
                source: 'ONU Brasil',
                title: 'Ações comunitárias de distribuição de marmitas e cursinhos populares barram catástrofes humanitárias',
                content: ['O civismo voluntário não extime obrigações do Estado, mas cria redes emergenciais de socorro essenciais nas favelas isoladas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 38,
        title: 'Alternativas e desafios para o combate aos maus-tratos de animais no Brasil',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 30,
        badge: '🐕 Semana 30',
        repertoires: [
            { type: 'Filosofia', concept: 'Utilidade de Sentir (Peter Singer)', application: 'Seres sencientes possuem interesses inerentes em evitar dor; sua exploração ou crueldade infringe preceitos morais.' }
        ],
        motivationalTexts: [
            {
                source: 'Ibama / Polícia Ambiental',
                title: 'Denúncias de agressões domésticas e tráfico de aves silvestres batem recordes nas capitais',
                content: ['Embora leis de punição tenham ficado severas, o abandono de animais domésticos nas ruas satura ONGs sem repasses governamentais.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 39,
        title: 'A urgência de aumentar as taxas de doação de órgãos e tecidos no sistema nacional de transplantes',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 31,
        badge: '🫀 Semana 31',
        repertoires: [
            { type: 'Sociologia', concept: 'Doutrina de Solidariedade Social (Émile Durkheim)', application: 'Ver-se como membro interligado a um organismo vivo de cooperação, onde decisões estendem a vitalidade de terceiros.' }
        ],
        motivationalTexts: [
            {
                source: 'ABTO - Associação Brasileira de Transplante de Órgãos',
                title: 'Taxa de recusa familiar para doação ultrapassa 45% por falta de esclarecimento',
                content: ['A escassez de discussões claras em família e a lerdeza burocrática de equipes de diagnóstico hospitalar deixam milhares em listas de espera dolorosas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 40,
        title: 'Estratégias de saúde escolar contra o alcoolismo precoce e a dependência química juvenil',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 32,
        badge: '🍷 Semana 32',
        repertoires: [
            { type: 'Sociologia', concept: 'Evasão do Eu (Zygmunt Bauman)', application: 'O consumo desenfreado de substâncias serve como fuga anestésica contra as cobranças de sucesso e ansiedade modernas.' }
        ],
        motivationalTexts: [
            {
                source: 'Inca / Opas',
                title: 'Iniciação ao uso de bebidas alcoólicas e cigarros eletrônicos (vapes) recua para média de 12 anos',
                content: ['A embalagem atraente de vaporizadores e a publicidade oculta de influenciadores mascaram graves riscos pulmonares e dependências agudas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 41,
        title: 'O papel da literatura infantojuvenil na expansão da empatia e pensamento crítico na infância',
        category: 'Cultura',
        tag: 'Estilo ENEM',
        week: 33,
        badge: '📚 Semana 33',
        repertoires: [
            { type: 'Pedagogia', concept: 'O Direito à Literatura (Antonio Candido)', application: 'A literatura não é mero adorno elitista, mas necessidade básica indispensável para a consolidação da lucidez humana.' }
        ],
        motivationalTexts: [
            {
                source: 'MEC - Letramento',
                title: 'Crianças expostas a leituras lúdicas de ficção desenvolvem comportamento assertivo social expressivo',
                content: ['A escassez crônica de livros físicos em lares vulneráveis e a dependência de plataformas de vídeo rápido afunilam o vocabulário infantil.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 42,
        title: 'Caminhos para viabilizar a mobilidade urbana alternativa e sustentável nas grandes capitais',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 34,
        badge: '🚲 Semana 34',
        repertoires: [
            { type: 'Geografia', concept: 'Cidade Ativa (Milton Santos)', application: 'Remodelar as rodovias para priorizar modais não fluídos e coletivos, neutralizando a segregação de bairros dormitórios.' }
        ],
        motivationalTexts: [
            {
                source: 'Ministério das Cidades',
                title: 'Paulistas e cariocas perdem em média 3 horas diárias presos em congestionamentos estressantes',
                content: ['Investimentos em ciclovias contínuas protegidas e a eletrificação de ônibus metropolitanos são prementes contra o aquecimento do clima.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 43,
        title: 'O fortalecimento da agricultura familiar como alicerce de sustentabilidade e soberania alimentar',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 35,
        badge: '🌾 Semana 35',
        repertoires: [
            { type: 'Geografia', concept: 'Circuito Inferior da Economia (Milton Santos)', application: 'A produção local de pequenos proprietários resiste à monocultura exportadora agressiva alimentando mercados internos de base.' }
        ],
        motivationalTexts: [
            {
                source: 'Conab',
                title: 'Mais de 70% da comida que chega à mesa dos brasileiros provém de roças familiares camponesas',
                content: ['A carência de incentivos fiscais e de logística de transporte frente ao agronegócio exportador estrangula a subsistência rural familiar.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 44,
        title: 'A preservação de biomas ameaçados e a soberania ambiental diante da exploração irresponsável',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 36,
        badge: '🌳 Semana 36',
        repertoires: [
            { type: 'Filosofia', concept: 'Princípio Responsabilidade (Hans Jonas)', application: 'Agir de tal modo que os efeitos de nossa ação sejam compatíveis com a permanência da vida genuinamente humana na Terra.' }
        ],
        motivationalTexts: [
            {
                source: 'MapBiomas',
                title: 'Cerrado e Pantanal sofrem desmatamentos inéditos para expansão de pastagem pecuária extensiva',
                content: ['A impunidade legislativa de incêndios propositais de terra reduz recursos de captação fluvial regional das cidades de base.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 45,
        title: 'Desafios para a convivência pacífica em ambientes escolares tomados por radicalismo político',
        category: 'Educação',
        tag: 'Estilo ENEM',
        week: 37,
        badge: '🎒 Semana 37',
        repertoires: [
            { type: 'Filosofia', concept: 'Razão Comunicativa (Jürgen Habermas)', application: 'Privilegiar discursos onde o convencimento mútuo através da fala ética e respeituosa combata dogmas irreconciliáveis.' }
        ],
        motivationalTexts: [
            {
                source: 'Estudos Discentes - Inep',
                title: 'Escolas brasileiras relatam aumento de hostilidade ideológica entre alunos e agressões discentes',
                content: ['A reprodução mecânica de discursos de ódio assimilados em algoritmos radicais rompe a coesão pedagógica fraterna na escola.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 46,
        title: 'Caminhos para coibir o assédio sexual contra mulheres em espaços e transportes públicos',
        category: 'Social',
        tag: 'Estilo ENEM',
        week: 38,
        badge: '🚫 Semana 38',
        repertoires: [
            { type: 'Sociologia', concept: 'Controle de Corpos (Rachel Soihet)', application: 'A perpetuação do machismo colonial trata o espaço urbano como livre arena de apropriação e coerção física do gênero feminino.' }
        ],
        motivationalTexts: [
            {
                source: 'Fórum Brasileiro de Segurança Pública',
                title: 'Maioria das mulheres relata pavor cotidiano de sofrer investidas imorais em vagões do metrô',
                content: ['A instalação de canais rápidos de alerta, aplicação firme da Lei de Importunação Sexual e conscientização masculina reduzem flagelos.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 47,
        title: 'O impacto psicológico da cultura do cancelamento virtual no comportamento social de adolescentes',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 39,
        badge: '🛑 Semana 39',
        repertoires: [
            { type: 'Psicanálise', concept: 'Pulsão de Destruição (Sigmund Freud)', application: 'A canalização coordenada do ódio e da agressividade individual na internet projeta bodes expiatórios para purgação coletiva.' }
        ],
        motivationalTexts: [
            {
                source: 'SPSP - Pediatria',
                title: 'Casos de depressão juvenil disparam após perseguições massivas em redes sociais escolares',
                content: ['A humilhação perene sem direito de defesa estimulada por lucros de cliques cria isolamento social e colapsos emocionais em menores de idade.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 48,
        title: 'Alternativas urgentes para limitar o uso excessivo de pesticidas e agrotóxicos agrícolas',
        category: 'Meio Ambiente',
        tag: 'Estilo ENEM',
        week: 40,
        badge: '🥦 Semana 40',
        repertoires: [
            { type: 'Agronomia', concept: 'Revolução Verde e intoxicação', application: 'A aceleração química forçada de lavouras pós Segunda Guerra inseriu defensivos venenosos na dieta básica e no lenço de água.' }
        ],
        motivationalTexts: [
            {
                source: 'Anvisa',
                title: 'Análises rotineiras detectam contaminação alimentar pesada por defensivos agrícolas proibidos no exterior',
                content: ['O subsídio tributário a agrotóxicos diminui investimentos biológicos alternativos orgânicos seguros à população.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 49,
        title: 'A importância histórica do brincar espontâneo no desenvolvimento afetivo e psicossocial infantil',
        category: 'Educação',
        tag: 'Estilo ENEM',
        week: 41,
        badge: '🧸 Semana 41',
        repertoires: [
            { type: 'Psicologia', concept: 'Teoria do Desenvolvimento (Jean Piaget)', application: 'O jogo e a brincadeira ativa cooperativa livre ensinam a negociação de regras de convívio, equilíbrio de limites e coordenação.' }
        ],
        motivationalTexts: [
            {
                source: 'Opas Brasil',
                title: 'Excesso de exposição precoce a telas atrofia a cognição espacial e diminui paciência criativa infantil',
                content: ['Substituir parquinhos de terra e interações motoras por telas de celulares causa isolamento cognitivo precoce extremo e dependência.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 50,
        title: 'O combate ao preconceito linguístico e o respeito às variações de fala regionais',
        category: 'Cultura',
        tag: 'Estilo ENEM',
        week: 42,
        badge: '🗣️ Semana 42',
        repertoires: [
            { type: 'Linguística', concept: 'Preconceito Linguístico (Marcos Bagno)', application: 'A língua é um organismo vivo; julgar variações dialetais como "erros" traduz discriminação social contra classes subalternas.' }
        ],
        motivationalTexts: [
            {
                source: 'Revista Letras',
                title: 'Alunos desistem de falas espontâneas em seminários escolares de capitais por medo de chacotas ou bullying',
                content: ['Perpetuar que apenas o sotaque cosmopolita é correto marginaliza o linguajar interiorano e as ricas gírias comunitárias brasileiras.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 51,
        title: 'Desafios urgentes para a acessibilidade física universal e a inclusão urbana de cadeirantes',
        category: 'Sociedade',
        tag: 'Estilo ENEM',
        week: 43,
        badge: '🦯 Semana 43',
        repertoires: [
            { type: 'Sociologia', concept: 'Sociedade Excludente (Amartya Sen)', application: 'Não garantir capacidade física de locomoção anula o livre-arbítrio fundamental de cidadãos participarem do labor comum.' }
        ],
        motivationalTexts: [
            {
                source: 'Ministério dos Direitos Humanos',
                title: 'Mais de 80% das calçadas e ônibus não atendem a padrões normativos de trânsito de cadeirantes',
                content: ['Rampas de inclinação assassina, buracos e degraus de concreto isolam e humilham milhões de deficientes físicos nos trajetos das cidades.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 52,
        title: 'O papel decisivo do SUS na consolidação das garantias de dignidade de populações desamparadas',
        category: 'Saúde',
        tag: 'Estilo ENEM',
        week: 44,
        badge: '🏥 Semana 44',
        repertoires: [
            { type: 'História', concept: 'Constituição Federal de 1988 ("A Cidadã")', application: 'Consolidou que a saúde é direito indisputável e universal de todo cidadão e obrigação de fomento pelo Estado brasileiro.' }
        ],
        motivationalTexts: [
            {
                source: 'Fiocruz / SUS',
                title: 'No desespero de emergências sanitárias, SUS é barreira que impede indigência e morte em massa nas favelas',
                content: ['Manter robusto o financiamento público de remédios raros e atendimento regional básico resguarda a soberania civil contra desigualdades.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },

    // --- OUTROS VESTIBULARES (Semanas 9 a 44) ---
    {
        id: 53,
        title: 'A solidão no mundo contemporâneo: sintoma de fratura social ou nobre escolha de autonomia existencial?',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 9,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 9',
        repertoires: [
            { type: 'Sociologia', concept: 'Zygmunt Bauman (Amor Líquido)', application: 'Laços frágeis geram medo de vínculos profundos, acarretando uma solidão mercadológica e angustiante.' }
        ],
        motivationalTexts: [
            {
                source: 'FUVEST Vestibulares',
                title: 'O avanço do isolamento individualizado e corporativo nas metrópoles verticais',
                content: ['A Fuvest busca reflexões de tom filosófico profundo, conectando dilemas abstratos do indivíduo modernos a crises de civilização.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 54,
        title: 'Manifesto coletivo discente reivindicando a salvaguarda da autonomia acadêmica e de verbas de pesquisa',
        category: 'Educação',
        tag: 'UNICAMP',
        week: 10,
        genre: 'Manifesto',
        badge: '🎓 Unicamp • Semana 10',
        repertoires: [
            { type: 'Ciência', concept: 'Carl Sagan (O Mundo Assombrado por Demônios)', application: 'A ciência como vela de razão na escuridão de credulidades deve ser blindada por subsídios públicos.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP vestibular',
                title: 'O gênero Manifesto: Insurreição pacífica fundada em argumentação vigorosa',
                content: ['Redigir na primeira pessoa do plural com tom convocatório expressivo e objetivos reivindicatórios bem claros.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 55,
        title: 'O consumismo infantil: a infância do país deve ser firmemente protegida de táticas de publicidade?',
        category: 'Sociedade',
        tag: 'UNESP',
        week: 11,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 11',
        repertoires: [
            { type: 'Sociologia', concept: 'Sociedade do Espetáculo (Guy Debord)', application: 'As crianças são alvos precoces de sedução mercadológica, reduzindo o valor humano de quem brinca pura e gratuitamente.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP exames',
                title: 'Paradoxo infantil: Direitos comerciais versus vulnerabilidade da mente de menores',
                content: ['Discorrer sobre a responsabilidade ética das empresas e o papel de contenção social das famílias brasileiras.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 56,
        title: 'A robotização ciberespacial e os dilemas da privacidade do indivíduo no século XXI',
        category: 'Tecnologia',
        tag: 'UNESP',
        week: 12,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 UNESP • Semana 12',
        repertoires: [
            { type: 'Sociologia', concept: 'Modernidade Líquida (Zygmunt Bauman)', application: 'A vigilância consentida e a exposição voluntária dos dados pessoais como sintomas da perda de fronteiras de intimidade privada.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Ciências Sociais',
                title: 'A economia comportamental dos dados pessoais e a mercantilização da privacidade',
                content: ['Algoritmos preditivos invisíveis moldam perfis cognitivos individuais para fins de consumo mercadológico induzido.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 57,
        title: 'O riso e o sarcasmo contemporâneos: instrumentos legítimos de indignação cidadã ou anestesia de apatia política?',
        category: 'Cultura',
        tag: 'FUVEST',
        week: 13,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 13',
        repertoires: [
            { type: 'Filosofia', concept: 'Ironia Socrática', application: 'Usar o ridículo ponderado para desmascarar falsas certezas de governantes arrogantes e sacudir conformismos.' }
        ],
        motivationalTexts: [
            {
                source: 'Estudos Literários USP',
                title: 'A multiplicação de heróis humorísticos cínicos na TV e sites e a despolitização da raiva social',
                content: ['Debata retrospectivamente se rir da tragédia pública desmobiliza a verdadeira organização para mudanças sérias das elites.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 58,
        title: 'Resenha crítica da obra literária "Quarto de Despejo", mapeando as cicatrizes estruturais da fome urbana',
        category: 'Cultura',
        tag: 'UNICAMP',
        week: 14,
        genre: 'Resenha Crítica',
        badge: '🎓 Unicamp • Semana 14',
        repertoires: [
            { type: 'Literatura', concept: 'Carolina Maria de Jesus (Quarto de Despejo)', application: 'A favela do Canindé descrita como porão indigno e segregado, enquanto o centro com luzes é a sala de visitas de capitais.' }
        ],
        motivationalTexts: [
            {
                source: 'Comvest Literatura',
                title: 'Produzir Resenha Crítica: Unidade analítica, resumo descritivo sutil e juízo de valor argumentativo',
                content: ['Valorize o realismo do texto da autora relacionando sua angústia com as lutas periféricas contemporâneas do país.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 59,
        title: 'Economia gig e uberização: expressão salutar de novos pioneiros autônomos ou crua precarização corporativa?',
        category: 'Sociedade',
        tag: 'UNESP',
        week: 15,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 15',
        repertoires: [
            { type: 'Sociologia', concept: 'Zygmunt Bauman (Individualização de Riscos)', application: 'A perda de proteções estatais força o trabalhador a arcar de forma solo com prejuízos biológicos ou acidentes produtivos.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP debates',
                title: 'Entregadores sob ordens automáticas de inteligência algorítmica implacável em grandes avenidas',
                content: ['Analise com imparcialidade se as liberdades de cronograma compensam a ausência plena de décimo terceiro e férias.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 60,
        title: 'A mercantilização do conhecimento acadêmico e as fronteiras da liberdade de pesquisa nas universidades',
        category: 'Educação',
        tag: 'FUVEST',
        week: 16,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 FUVEST • Semana 16',
        repertoires: [
            { type: 'Filosofia', concept: 'Razão Instrumental (Theodor Adorno)', application: 'A submissão do saber universitário aos interesses utilitaristas do mercado, em detrimento do pensamento crítico emancipador.' }
        ],
        motivationalTexts: [
            {
                source: 'FUVEST Vestibulares',
                title: 'A universidade pública entre a autonomia científica e o pragmatismo empresarial corporativo',
                content: ['A priorização de patentes rentáveis esvazia a pesquisa básica das humanidades, essenciais para o diagnóstico crítico social.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 61,
        title: 'O magnetismo e a ruína das utopias coletivas: combustível para mudanças vitais ou mero devaneio escapista?',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 17,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 17',
        repertoires: [
            { type: 'Filosofia', concept: 'Princípio Esperança (Ernst Bloch)', application: 'A utopia age não como ilusão pacata, mas como horizonte ativo que põe a história em marcha de superação contínua.' }
        ],
        motivationalTexts: [
            {
                source: 'Cátedra Clássica USP',
                title: 'A agonia do século XX e o medo contemporâneo de apostar em grandes propostas mundiais',
                content: ['Pondere com rigor literário sobre o equilíbrio necessário entre o realismo pragmático do agir e o sonho emancipador ideal.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 62,
        title: 'Carta de reclamação formal à gerência de companhia de energia cobrando compensação por apagões recorrentes nas vilas',
        category: 'Sociedade',
        tag: 'UNICAMP',
        week: 18,
        genre: 'Carta de Reclamação',
        badge: '🎓 Unicamp • Semana 18',
        repertoires: [
            { type: 'Sociologia', concept: 'Direito do Consumidor', application: 'A dignidade do consumidor face ao descaso mercadológico de empresas monopólios que privatizaram serviços essenciais.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP provas discursivas',
                title: 'Estruturação de Reclamação: Polidez cortês, comprovações técnicas dos danos e petições sérias',
                content: ['Assuma a persona de um morador lesado cujas comidas na geladeira estragaram ou aparelhos queimaram em vilas isoladas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 63,
        title: 'A cultura do cancelamento em mídias sociais contemporâneas: justiça corretiva cidadã ou violência de tribunal informal?',
        category: 'Sociedade',
        tag: 'UNESP',
        week: 19,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 19',
        repertoires: [
            { type: 'História', concept: 'Linchamento Medieval', application: 'A fúria punitiva irracional de turbas substituindo o devido processo legal em busca de culpados céleres e entretenimento mórbido.' }
        ],
        motivationalTexts: [
            {
                source: 'Mesa Redonda UNESP',
                title: 'Vítimas de enganos algorítmicos em fotos perdem empregos por linchamentos morais virtuais em minutos',
                content: ['Seja consistente em delimitar a linha separando denúncias sérias de abusos da perseguição covarde estimulada pelo anonimato.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 64,
        title: 'Texto dissertativo: O negacionismo científico e os desafios para a preservação agroambiental no Brasil',
        category: 'Meio Ambiente',
        tag: 'UNICAMP',
        week: 20,
        genre: 'Texto Dissertativo',
        badge: '🎓 UNICAMP • Semana 20',
        repertoires: [
            { type: 'Ciências', concept: 'Consenso Científico', application: 'A importância da adesão a protocolos validados por universidades oficiais no combate às pragas de forma segura ao meio ambiente.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP Pesquisa',
                title: 'A ciência agronômica no enfrentamento de desinformações ambientais sobre fertilizantes e solos',
                content: ['O combate ao ceticismo infundado sobre mudanças ecológicas permite salvar colheitas familiares e preservar biomas nacionais importantes.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 65,
        title: 'A pressa e a pressuposição de produtividade frenética: por que o tédio virou vergonha na modernidade?',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 21,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 21',
        repertoires: [
            { type: 'Filosofia', concept: 'Walter Benjamin (O Narrador)', application: 'O verdadeiro saber e a capacidade narrativa requerem a calma e o ócio criativo; sem isso, restam apenas conexões e ruídos.' }
        ],
        motivationalTexts: [
            {
                source: 'USP Letras contemporâneas',
                title: 'A mercantilização do tempo de folga e a colonização mental do repouso por jogos estimulantes',
                content: ['Analise com profundidade como a ansiedade coletiva e o medo de estar fora de metas geram sobrecargas de exaustão silenciosas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 66,
        title: 'Crônica urbana sobre a rotina invisibilizada de trabalhadores noturnos que limpam os trilhos do metrô paulista',
        category: 'Sociedade',
        tag: 'UNICAMP',
        week: 22,
        genre: 'Crônica',
        badge: '🎓 Unicamp • Semana 22',
        repertoires: [
            { type: 'Literatura', concept: 'Crônica e a beleza do cotidiano banal', application: 'Injetar lirismo e empatia no labor ignored das massas silenciosas que dão sustentação invisível ao progresso metropolitano.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP crônica',
                title: 'Produzir Crônica: Misturar lirismo suave, narrativa viva de detalhes e reflexão sensível filosófica',
                content: ['Utilize metáforas sonoras do ferro nos trilhos frios da madrugada e o silêncio de galerias profundas do metrô para enriquecer.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 67,
        title: 'Intervenções estéticas urbanas e pichação: expressão poética de protesto ou agressão ao patrimônio coletivo?',
        category: 'Cultura',
        tag: 'UNESP',
        week: 23,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 23',
        repertoires: [
            { type: 'Sociologia', concept: 'David Harvey (O Direito à Cidade)', application: 'Quem tem voz ou poder político de imprimir sua marca nas paredes da cidade privatizada em favor de publicidades?' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP debates visuais',
                title: 'Prefeitura de SP cobre murais artísticos consolidados operando políticas cinzentas higienistas',
                content: ['Decomponha o debate sopesando a depredação pura de vidros e monumentos históricos versus o brado de tinta de jovens favelados.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 68,
        title: 'Inteligências artificiais generativas e os desafios éticos sobre direito autoral e propriedade intelectual',
        category: 'Tecnologia',
        tag: 'UNESP',
        week: 24,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 UNESP • Semana 24',
        repertoires: [
            { type: 'História', concept: 'Direito Autoral Histórico', application: 'A proteção à criação humana artística como garantia civilizacional do sustento do autor e estímulo a novas ideias e expressões de engenho.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Debates / Ciências Sociais',
                title: 'Algoritmos generativos capturam o repertório artístico global sem partilha financeira com produtores',
                content: ['A nova regulamentação jurídica requererá repasse de royalties para sustentar a subsistência do trabalho criativo original no país.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 69,
        title: 'O avanço do pânico coletivo e a mercancia da segurança nas cidades fortificadas em condomínios cerrados',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 25,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 25',
        repertoires: [
            { type: 'Sociologia', concept: 'Geografia do Medo (Tuan)', application: 'Cidades recortadas em cercas elétricas e cercos armados criam nobres aprisionados voluntários neuróticos com fobia do semelhante.' }
        ],
        motivationalTexts: [
            {
                source: 'USP Antropologia Urbana',
                title: 'A proliferação de muralhas de concreto separando bairros privativos de cortiços vizinhos no país',
                content: ['Desenvolva tese analítica demonstrando que o medo irracional mata as redes orgânicas de alteridade e foca o isolamento cruel.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 70,
        title: 'Depoimento escrito de um voluntário que ensinou leitura instrumental a refugiados angolanos no Brás',
        category: 'Social',
        tag: 'UNICAMP',
        week: 26,
        genre: 'Depoimento',
        badge: '🎓 Unicamp • Semana 26',
        repertoires: [
            { type: 'Sociologia', concept: 'Hospitalidade Incondicional (Jacques Derrida)', application: 'Acolher o estrangeiro desarmado sem restrições fiscais ou suspeitas prévias é pilar de civilização de direitos.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP provas práticas',
                title: 'Estruturação de Depoimento: Tom pessoal confessional sincero, relatos vivos de fatos e emoção ética',
                content: ['Adote a persona com realismo, relatando as barreiras iniciais de pronúncia de fala e o choro na descoberta comum de palavras.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 71,
        title: 'A obsessão pelas aparências da juventude e o etarismo: por que nossa contemporaneidade tem pavor do envelhecer?',
        category: 'Sociedade',
        tag: 'UNESP',
        week: 27,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 27',
        repertoires: [
            { type: 'Filosofia', concept: 'Byung-Chul Han (Agonia de Eros)', application: 'A mercantilização extrema reduz as pessoas a imagens de frescor plástico, apagando o valor de doçura, rugas e vivência de idosos.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Antropologia',
                title: 'Gastos massivos de jovens brasileiras com cirurgias cirúrgicas precoces e cosméticos rejuvenescedores',
                content: ['Discuta as raízes éticas e culturais que forçam a exclusão sutil ou franca de trabalhadores maduros do circuito laborativo.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 72,
        title: 'Do isolamento à hiperconectividade: o impacto da virtualização das relações na saúde psíquica contemporânea',
        category: 'Educação',
        tag: 'FUVEST',
        week: 28,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 FUVEST • Semana 28',
        repertoires: [
            { type: 'Filosofia', concept: 'Sociedade do Cansaço (Byung-Chul Han)', application: 'Como o imperativo de produtividade e autoexposição nas redes amplifica quadros de depressão e ansiedade discentes.' }
        ],
        motivationalTexts: [
            {
                source: 'USP Instituto de Psicologia',
                title: 'O isolamento social por traz da tela: a falsa sensação de pertencimento comunitário digital',
                content: ['Especialistas alertam para o aumento expressivo de atendimentos terapêuticos motivados pela depressão decorrente da distorção de autoimagem virtual.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 73,
        title: 'Os limites éticos do riso e da zombaria pública: a liberdade de piada deve prevalecer sobre danos e humilhações sociais?',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 29,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 29',
        repertoires: [
            { type: 'Filosofia', concept: 'Dignidade Humana (Immanuel Kant)', application: 'Zombar de fraquezas de minorias oprimidas reduz o indivíduo a mero bizarro objeto de diversão, violando sua dignidade.' }
        ],
        motivationalTexts: [
            {
                source: 'USP Direito e Ética',
                title: 'Comediantes alegam censura prévia enquanto promotores punem humilhações raciais explícitas disfarçadas de piadas',
                content: ['Reflita filosófica se o riso desproferido contra vulneráveis resguarda a liberdade real ou expande opressões históricas de base.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 74,
        title: 'Roteiro persuasivo de discurso de formatura discente em Defesa da Esperança Freiriana na Educação Básica',
        category: 'Educação',
        tag: 'UNICAMP',
        week: 30,
        genre: 'Discurso de Formatura',
        badge: '🎓 Unicamp • Semana 30',
        repertoires: [
            { type: 'Pedagogia', concept: 'Paulo Freire (Educação como Prática da Liberdade)', application: 'O ato de ensinar requer decifrar o mundo em parceria, cultivando esperanças ativas contra silêncios impostos pelo fatalismo social.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP vestibular oratório',
                title: 'Criação de Roteiro de Discurso: Vocativos calorosos, pausas retóricas vivas e mensagens de brio coletivo',
                content: ['Assuma a persona do orador da turma conclamando os formandos de pedagogia a resistirem a ataques e crerem no porvir.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 75,
        title: 'O anonimato em ambientes virtuais: prerrogativa salutar de liberdade privada ou gerador de impunidades ilegais?',
        category: 'Tecnologia',
        tag: 'UNESP',
        week: 31,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 31',
        repertoires: [
            { type: 'Filosofia', concept: 'O Anel de Giges (Platão)', application: 'Em posse da invisibilidade, o indivíduo revela sua verdadeira essência moral, caindo muitas vezes em crimes de ego sem amparo de leis.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Ética Tecnológica',
                title: 'A multiplicação de calúnias e vazamentos cruéis coordenados em fóruns anônimos criptografados ilegais',
                content: ['Discuta os limites técnicos e civis de rastreamento policial em defesa de reputações sem quebrar e-mails ou privacidade legítima.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 76,
        title: 'Artigo de opinião: O cooperativismo de catadores e a urgência da dignidade laboral na gestão de resíduos sólidos',
        category: 'Meio Ambiente',
        tag: 'UNICAMP',
        week: 32,
        genre: 'Artigo de Opinião',
        badge: '🎓 UNICAMP • Semana 32',
        repertoires: [
            { type: 'Sociologia', concept: 'Banalidade do Mal (Hannah Arendt)', application: 'A aceitação naturalizada da degradação das condições de quem lida diretamente com os resíduos plásticos da sociedade.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP Estudos Urbanos',
                title: 'O descaso social com catadores invisibiliza heróis ecológicos da gestão urbana',
                content: ['Apoiar cooperativas organizadas com EPIs, segurança estrutural e remuneração condigna reduz passivos ecológicos urbanos e valoriza famílias carentes.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 77,
        title: 'A desvalorização da verdade objetiva na pós-verdade: quais os riscos da erosão científica na democracia contemporânea?',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 33,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 33',
        repertoires: [
            { type: 'Filosofia', concept: 'Ceticismo Científico (René Descartes)', application: 'A dúvida metódica deve ser usada para construir certezas verificadas de fatos objetivos, e não para paranoias negacionistas.' }
        ],
        motivationalTexts: [
            {
                source: 'USP Revista da Academia',
                title: 'Quando boatos algorítmicos em celulares valem mais na mente popular que teses de doutores com microscópios',
                content: ['Discuta o perigo moral de sociedades que abdicam de fatos consensuais comuns em troca de narrativas afetivas fanáticas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 78,
        title: 'Fábula moderna em prosa sobre os perigos da alienação humana diante de um assistente doméstico de inteligência artificial',
        category: 'Tecnologia',
        tag: 'UNICAMP',
        week: 34,
        genre: 'Fábula / Conto',
        badge: '🎓 Unicamp • Semana 34',
        repertoires: [
            { type: 'Filosofia', concept: 'Alienação Técnica (Karl Marx)', application: 'O indivíduo terceiriza suas escolhas mais íntimas, sentimentos e rotinas a um algoritmo tutor corporativo, perdendo autonomia moral.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP vestibular literário',
                title: 'Produzir Fábula Moderna: Personizações de objetos, lição moral sutil incorporada e enredo satírico',
                content: ['Crie uma história focando um androide atencioso ou caixa de comandos domésticos (Alexa evoluída) que passa a decidir o destino do casal.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 79,
        title: 'A comercialização silenciosa de históricos de navegação: as megacorporações tecnológicas devem deter o direito de lucrar?',
        category: 'Tecnologia',
        tag: 'UNESP',
        week: 35,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 35',
        repertoires: [
            { type: 'Sociologia', concept: 'Capitalismo de Vigilância (Shoshana Zuboff)', application: 'Nossos sentimentos, cliques e trajetos são captados e vendidos sem o devido consenso real para manipulações corporativas de consumo.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Debates de Rede',
                title: 'Propagandas cirúrgicas de remédios aparecem segundos após usuário cochichar pânico doméstico no quarto',
                content: ['Discuta se leis como LGPD de controle devem ser recrudescidas na salvaguarda inviolável dos perfis psíquicos íntimos dos cidadãos.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 80,
        title: 'O impacto da infoexclusão na formação escolar e no exercício pleno da soberania cidadã brasileira',
        category: 'Tecnologia',
        tag: 'UNESP',
        week: 36,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 UNESP • Semana 36',
        repertoires: [
            { type: 'Ciências', concept: 'Exclusão Digital Coordenada', application: 'A indigência digital de alunos do ensino público como limitador brutal do acesso a dados públicos oficiais e serviços estatais.' }
        ],
        motivationalTexts: [
            {
                source: 'UNESP Cidadania',
                title: 'Cidadãos incompletos: a ausência de conectividade de base como mordaça política contemporânea',
                content: ['Limitar o acesso de jovens de periferias à rede banda larga restringe as condições de letramento científico e bloqueia debates globais.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 81,
        title: 'A financeirização dos afetos nos relacionamentos amorosos regidos por aplicativos de compatibilidade',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 37,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 37',
        repertoires: [
            { type: 'Sociologia', concept: 'Eva Illouz (Por que o amor dói)', application: 'A mercantilização extrema transforma pretendentes amorosos em catálogos consumíveis rápidos, esvaindo intimidades profundas.' }
        ],
        motivationalTexts: [
            {
                source: 'Revista USP de Estudos Sociais',
                title: 'Assinaturas Gold e filtros de busca financeira criam classificados humanos mercantilistas cruéis na internet',
                content: ['Debata como a lógica do mercado financeiro de buscar lucros rápidos e minimizar riscos contaminou o amor humano.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 82,
        title: 'Artigo de opinião debatendo a glamourização da exaustão laborativa estimulada por gurus estéticos na internet',
        category: 'Social',
        tag: 'UNICAMP',
        week: 38,
        genre: 'Artigo de Opinião',
        badge: '🎓 Unicamp • Semana 38',
        repertoires: [
            { type: 'Filosofia', concept: 'Byung-Chul Han (Sociedade do Cansaço)', application: 'O indivíduo na sociedade do desempenho convence-se a produzir até ao esgotamento (Burnout) sob sorrisos mercadológicos.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP provas de artigo',
                title: 'Gênero Artigo de Opinião: Linguagem contundente em primeira pessoa, argumentos irrefutáveis e tom sarcástico refinado',
                content: ['Critique publicações de influenciadores que ostentam acordar às 4 da manhã para estudar nas redes, mascarando privilégios e ansiedades.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 83,
        title: 'A representação literária de heróis nacionais históricos: quais figuras do passado merecem protagonismo contemporâneo?',
        category: 'Cultura',
        tag: 'UNESP',
        week: 39,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Unesp • Semana 39',
        repertoires: [
            { type: 'História', concept: 'Heroísmo de Resistência', application: 'Diferente de generais imperiais brancos, as lutas de líderes negros e indígenas (Dandara, Tupinambás) resgatam a franqueza da soberania.' }
        ],
        motivationalTexts: [
            {
                source: 'Historiografia UNESP',
                title: 'Livros escolares paulistas mantêm foco exagerado em grandes bandeirantes predadores de índios',
                content: ['Reflita criticamente se o imaginário dos estudantes de base nacional necessita de espelhos de bravura oprimida fraterna.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 84,
        title: 'O consumo sustentável como escolha individual ou resultado de regulação e políticas governamentais estruturais',
        category: 'Meio Ambiente',
        tag: 'FUVEST',
        week: 40,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 FUVEST • Semana 40',
        repertoires: [
            { type: 'Economia', concept: 'Desenvolvimento Sustentável (Ignacy Sachs)', application: 'Demonstrar como a mera escolha voluntária do consumidor é pífia diante do peso industrial das matrizes fósseis corporativas não reguladas.' }
        ],
        motivationalTexts: [
            {
                source: 'FUVEST Economia',
                title: 'A ilusão da responsabilidade ecológica exclusiva do consumidor de base',
                content: ['Diligenciar por rotulagens verdes e embalagens ecológicas não resolve o problema central de subsidiar frotas poluidoras e energia eólica deficitária nacional.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 85,
        title: 'O elogio do nada-fazer e a salubre necessidade do tédio em um planeta capturado por exigências de metas ininterruptas',
        category: 'Sociedade',
        tag: 'FUVEST',
        week: 41,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 Fuvest • Semana 41',
        repertoires: [
            { type: 'Filosofia', concept: 'Elogio do Ócio (Bertrand Russell)', application: 'O labor deve ser racionalmente abreviado com tecnologias de modo que a contemplação criativa traga contentamentos.' }
        ],
        motivationalTexts: [
            {
                source: 'Instituto de Filosofia USP',
                title: 'Aplicativos cobram metas mensais de meditação estressando mentes que tentavam relaxar em telas corporativas',
                content: ['Argumente philosophicamente se silenciar notificações de celulares e repousar sem remorso cura as fraturas pós-modernas de Burnout.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 86,
        title: 'Roteiro de Podcast discursivo debatendo a extinção silenciosa de salas e bibliotecas e a resistência de coletivos de bairro',
        category: 'Sociedade',
        tag: 'UNICAMP',
        week: 42,
        genre: 'Roteiro de Podcast',
        badge: '🎓 UNICAMP • Semana 42',
        repertoires: [
            { type: 'Sociologia', concept: 'Democratização do Saber', application: 'Bibliotecas como faróis comunitários onde o jovem carente encontra refúgio silencioso digno da violência urbana.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP provas de roteiro',
                title: 'Produzir Roteiro de Podcast: Indicações sonoras de trilha nos colchetes, fala natural discursiva e tom envolvente',
                content: ['Adote a persona de radialistas de periferia entrevistando idealizadores de jornais de lambe-lambe literários locais das favelas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 87,
        title: 'Fast-fashion e descarte desenfreado: o gosto pelo consumo de moda expressa justificação para abusos e lixos industriais?',
        category: 'Meio Ambiente',
        tag: 'UNESP',
        week: 43,
        genre: 'Dissertativo-Argumentativo',
        badge: '🎓 UNESP • Semana 43',
        repertoires: [
            { type: 'Sociologia', concept: 'Hiperconsumismo Estético (Lipovetsky)', application: 'A obsolescência cíclica de tendências obriga indivíduos a despejarem toneladas de tecidos plásticos nocivos no solo de nações pobres.' }
        ],
        motivationalTexts: [
            {
                source: 'Análises UNESP Meio Ambiente',
                title: 'Cemitérios de tecidos sintéticos em desertos chilenos e rios nacionais poluem águas doces brasileiras de forma irreversível',
                content: ['Pondere consistentemente se o letramento ecológico de vestuário deve ser imposto a fabricantes milionários e lojas.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    },
    {
        id: 88,
        title: 'Artigo de opinião: A alfabetização de adultos como resgate da dignidade e reparação histórica social',
        category: 'Educação',
        tag: 'UNICAMP',
        week: 44,
        genre: 'Artigo de Opinião',
        badge: '🎓 UNICAMP • Semana 44',
        repertoires: [
            { type: 'Educação', concept: 'Educação Libertadora (Paulo Freire)', application: 'Alfabetizar-se tardiamente emancipa o trabalhador humilhado que antes assinava papéis com impressões digitais sem decodificar mentiras.' }
        ],
        motivationalTexts: [
            {
                source: 'UNICAMP Educação',
                title: 'O impacto social do letramento tardio na autonomia do cidadão idoso ou trabalhador',
                content: ['Garantir salas de aula noturnas e materiais adaptados da EJA cura as cicatrizes de evasões escolares históricas e resgata a verdadeira dignidade civil.']
            },
            {
                source: 'IBGE (Dados Censitários Adaptados)',
                title: 'Panorama Estatístico',
                content: [
                    'Os indicadores recentes reforçam que a questão demanda intervenção estrutural, uma vez que as estatísticas apontam uma concentração do problema nas faixas mais vulneráveis da população.',
                    'A ausência de políticas públicas contínuas contribui para a manutenção do cenário crítico, dificultando a reversão dos danos sociais já estabelecidos.'
                ]
            },
            {
                source: 'Constituição Federal de 1988',
                title: 'Garantias Fundamentais',
                content: [
                    'A Constituição Federal garante a todos os cidadãos o direito fundamental à vida, à saúde, à segurança e à dignidade da pessoa humana.',
                    'É dever do Estado e de toda a sociedade promover condições reais para que tais direitos sejam efetivamente assegurados e não fiquem apenas no plano normativo.'
                ]
            }
        ]
    }
];

const enrichThemeMotivationalTexts = (theme: Theme): { source: string; title: string; content: string[] }[] => {
    const original = theme.motivationalTexts || [];
    const specificTexts = original.filter(t => {
        const isGeneric1 = t.source.includes('IBGE') && t.title.includes('Panorama');
        const isGeneric2 = t.source.includes('Constituição') && t.title.includes('Garantias');
        return !isGeneric1 && !isGeneric2;
    });

    const result = [...specificTexts];
    const titleClean = theme.title.trim();
    const headingText = titleClean.endsWith('.') ? titleClean.slice(0, -1) : titleClean;

    const templates = [
        {
            source: 'Folha de S.Paulo - Sessão Educação & Debate',
            title: `Levantamento nacional e reflexos do debate sobre ${headingText}`,
            content: [
                `Uma pesquisa recente conduzida por consórcios de imprensa e institutos de análise nacionais indica que a discussão pública sobre "${headingText}" ganhou destaque crítico no cenário nacional. Especialistas alertam para a necessidade de medidas estruturais urgentes a fim de demover os principais entraves desse fenômeno na sociedade brasileira.`,
                `O levantamento aponta que, em diversas regiões do território nacional, a carência de iniciativas integradoras e a escassez de recursos públicos de apoio agravam substancialmente o impacto desse desafio, dividindo a atenção de governantes, educadores e especialistas setoriais.`
            ]
        },
        {
            source: 'G1 Notícias - Reportagem Especial',
            title: `Os entraves logísticos e as disparidades regionais na temática de ${headingText}`,
            content: [
                `Novas informações reveladas por órgãos de monitoramento e de auditoria de políticas públicas apontam que as disparidades socioeconômicas e os desafios regionais acentuam drasticamente as dificuldades em torno de "${headingText}". Enquanto grandes centros metropolitanos iniciam discussões sobre novas diretrizes de suporte, realidades periféricas lidam com a escassez severa do amparo estatal e de ações estratégicas integradas.`,
                `De acordo com especialistas da área e analistas ouvidos em seminários especializados neste mês, o principal entrave para a reversão rápida desse problema reside na falta de dados locais unificados, que seriam ideais para calibrar ações governamentais eficientes.`
            ]
        },
        {
            source: 'CNN Brasil - Sociedade & Cidadania',
            title: `Debate e mobilização: A urgência de políticas eficazes sobre ${headingText}`,
            content: [
                `Líderes de comissões temáticas e representantes de fóruns de desenvolvimento humano reuniram-se para analisar e apontar diretrizes sólidas de combate à problemática de "${headingText}". O panorama construído ilustra que a inércia parlamentar ou social frente ao problema é um fator de reprodução contínua de desequilíbrios comunitários graves.`,
                `Além disso, conselheiros ressaltaram que a superação desse cenário contemporâneo exige redes articuladas intersetoriais de longo prazo, investindo no amparo escolar e na promoção de campanhas de engajamento comunitário em massa para remodelar o paradigma cultural atual.`
            ]
        }
    ];

    while (result.length < 3) {
        const nextTemplate = templates[result.length] || templates[0];
        result.push(nextTemplate);
    }

    return result.slice(0, 3);
};

const themesList: Theme[] = rawThemesList.map(t => ({
    ...t,
    motivationalTexts: enrichThemeMotivationalTexts(t)
}));

const Redacao = () => {
    const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                getDoc(doc(db, 'users', user.uid)).then(docSnap => {
                    if (docSnap.exists()) setUserProfile(docSnap.data());
                }).catch(err => {
                    console.error("Error fetching user profile:", err);
                    handleFirestoreError(err, OperationType.GET, 'users/' + user.uid);
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
        } catch {
            return 'dark';
        }
    });

    useEffect(() => {
        const handleThemeChange = () => {
            try {
                const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
                setTheme(savedTheme);
            } catch {
                setTheme('dark');
            }
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => {
            window.removeEventListener('theme-changed', handleThemeChange);
        };
    }, []);

    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
    const [currentPhase, setCurrentPhase] = useState<'leitura' | 'redacao' | 'correcao'>('leitura');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showRepertoire, setShowRepertoire] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [submissionMethod, setSubmissionMethod] = useState<'digital' | 'manual'>('digital');
    const [files, setFiles] = useState<File[]>([]);
    const [filesPreview, setFilesPreview] = useState<string[]>([]);
    const [isGeneratingRepertoire, setIsGeneratingRepertoire] = useState(false);
    const [aiRepertoire, setAiRepertoire] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<any | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [examTab, setExamTab] = useState<'enem' | 'outros'>('enem');
    const [completedThemes, setCompletedThemes] = useState<string[]>([]);
    const [completedThemesDetails, setCompletedThemesDetails] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('Todos');
    
    // Fetch completed/submitted themes to calculate progress
    useEffect(() => {
        if (auth.currentUser) {
            const q = query(
                collection(db, 'essay_submissions'),
                where('userId', '==', auth.currentUser.uid)
            );
            getDocs(q).then((snapshot) => {
                const details = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        theme: data.theme,
                        score: data.score,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
                    };
                }).filter(d => !!d.theme);
                
                setCompletedThemesDetails(details);
                
                const titles = details.map(d => d.theme);
                setCompletedThemes(titles);
            }).catch(err => {
                console.warn("Failed to fetch user essay submissions:", err);
                setCompletedThemesDetails([]);
                setCompletedThemes([]);
            });
        }
    }, [currentPhase]);

    const isSelectedThemeCompleted = selectedTheme ? completedThemes.some(title => title.toLowerCase().trim() === selectedTheme.title.toLowerCase().trim()) : false;
    const selectedThemeMatchingSubmissions = selectedTheme ? completedThemesDetails.filter(d => d.theme?.toLowerCase().trim() === selectedTheme.title.toLowerCase().trim()) : [];
    const selectedThemeHighestScore = selectedThemeMatchingSubmissions.length > 0 ? Math.max(...selectedThemeMatchingSubmissions.map(s => s.score || 0)) : null;

    const editorRef = useRef<HTMLDivElement>(null);
    const calculateLineCount = (str: string) => {
        if (!str || str.length === 0) return 0;
        // Normalize line endings and split
        const lines = str.replace(/\r\n/g, '\n').split('\n');
        return lines.reduce((acc, line, index) => {
            // Do not count the last empty line as a new line if it's just a trailing newline
            if (index === lines.length - 1 && line.length === 0) return acc;
            // Count lines, considering potential wrapping
            return acc + Math.max(1, Math.ceil(line.length / 100));
        }, 0);
    };

    const lineCount = calculateLineCount(text);

    const categories = ['Todos', 'Tecnologia', 'Social', 'Saúde', 'Sociedade', 'Meio Ambiente'];

    const monthsList = [
        { name: 'Ano Todo', value: 'Todos', weeks: [1, 44] },
        { name: 'Janeiro', value: 'Janeiro', weeks: [1, 4] },
        { name: 'Fevereiro', value: 'Fevereiro', weeks: [5, 8] },
        { name: 'Março', value: 'Março', weeks: [9, 12] },
        { name: 'Abril', value: 'Abril', weeks: [13, 16] },
        { name: 'Maio', value: 'Maio', weeks: [17, 20] },
        { name: 'Junho', value: 'Junho', weeks: [21, 24] },
        { name: 'Julho', value: 'Julho', weeks: [25, 28] },
        { name: 'Agosto', value: 'Agosto', weeks: [29, 32] },
        { name: 'Setembro', value: 'Setembro', weeks: [33, 36] },
        { name: 'Outubro', value: 'Outubro', weeks: [37, 40] },
        { name: 'Novembro', value: 'Novembro', weeks: [41, 44] }
    ];

    const filteredThemes = themesList.filter(theme => {
        const matchesSearch = theme.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || theme.category === selectedCategory;
        const matchesExam = examTab === 'enem' ? theme.tag === 'Estilo ENEM' : theme.tag !== 'Estilo ENEM';
        
        let matchesMonth = true;
        if (selectedMonth !== 'Todos') {
            const mObj = monthsList.find(m => m.value === selectedMonth);
            if (mObj) {
                matchesMonth = theme.week >= mObj.weeks[0] && theme.week <= mObj.weeks[1];
            }
        }
        return matchesSearch && matchesCategory && matchesExam && matchesMonth;
    });

    const dailyThemes = themesList.filter(t => t.tag === 'Estilo ENEM');
    const featuredTheme = dailyThemes.length > 0 ? dailyThemes[(new Date().getDate() - 1) % dailyThemes.length] : themesList[0];

    useEffect(() => {
        if (selectedTheme) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedTheme]);

    useEffect(() => {
        let timer: any;
        if (selectedTheme) {
            timer = setInterval(() => setSeconds(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [selectedTheme]);

    useEffect(() => {
        if (text.length > 0) {
            setIsAutoSaving(true);
            const timeout = setTimeout(() => setIsAutoSaving(false), 800);
            return () => clearTimeout(timeout);
        }
    }, [text]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const feedback = {
        hasTitle: title.trim().length > 5,
        hasIntro: text.length > 200,
        hasRepertoire: /\b(segundo|de acordo com|conforme|filósofo|sociólogo|contexto histórico|obra|livro|filme|teoria)\b/gi.test(text),
        hasConnectors: /\b(portanto|ademais|entretanto|todavia|além disso|nesse sentido|por outro lado|consequentemente)\b/gi.test(text),
        hasProposal: /\b(governo|estado|ministério|sociedade|escola|mídia|família|ações|medida|finalidade|objetivo)\b/gi.test(text) && text.toLowerCase().includes('portanto')
    };

    const getSmartHint = () => {
        if (text.length < 50) return "💡 Comece contextualizando o tema com um fato histórico ou citação.";
        if (!feedback.hasRepertoire) return "💡 Procure citar um filósofo ou sociólogo para validar seus argumentos.";
        if (!feedback.hasConnectors && text.length > 400) return "💡 Use conectivos como 'Ademais' ou 'Entretanto' para ligar seus parágrafos.";
        if (!feedback.hasProposal && text.length > 800) return "💡 Não esqueça de detalhar quem deve agir e qual o meio da sua proposta.";
        return null;
    };

    const simulatedScore = Math.min(1000, 
        (feedback.hasTitle ? 100 : 0) + 
        (Math.min(lineCount, 30) * 20) + 
        (feedback.hasIntro ? 100 : 0) + 
        (feedback.hasRepertoire ? 150 : 0) + 
        (feedback.hasConnectors ? 100 : 0) +
        (feedback.hasProposal ? 150 : 0)
    );

    const handleGenerateRepertoire = () => {
        if (!selectedTheme) return;
        setIsGeneratingRepertoire(true);
        setTimeout(() => {
            const randomRep = selectedTheme.repertoires[Math.floor(Math.random() * selectedTheme.repertoires.length)];
            setAiRepertoire(`${randomRep.concept}: ${randomRep.application}`);
            setIsGeneratingRepertoire(false);
            toast.success('Repertório estratégico gerado!');
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files) as File[];
            setFiles(prev => [...prev, ...newFiles]);
            
            // Create previews and compress images
            newFiles.forEach((file: File) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 1200;
                            const MAX_HEIGHT = 1600;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height = Math.round(height * (MAX_WIDTH / width));
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width = Math.round(width * (MAX_HEIGHT / height));
                                    height = MAX_HEIGHT;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(img, 0, 0, width, height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                                setFilesPreview(prev => [...prev, dataUrl]);
                            } else {
                                setFilesPreview(prev => [...prev, reader.result as string]);
                            }
                        };
                        img.onload = img.onload; // Keep standard logic unharmed
                        img.src = reader.result as string;
                    };
                    reader.readAsDataURL(file);
                } else {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFilesPreview(prev => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            toast.success(`${newFiles.length} arquivo(s) adicionado(s)`);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setFilesPreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (submissionMethod === 'digital') {
            if (lineCount < 7) {
                toast.error('Sua redação precisa ter no mínimo 7 linhas.');
                return;
            }
        } else {
            if (files.length === 0) {
                toast.error('Por favor, anexe pelo menos uma foto ou PDF da sua redação.');
                return;
            }
        }

        setIsEvaluating(true);
        setCurrentPhase('correcao');
        
        const examName = selectedTheme?.tag || 'ENEM';
        const loadingId = toast.loading(`IA Estelar analisando sua redação conforme os critérios do vestibular ${examName}...`);

        try {
            let examParam = 'ENEM';
            if (selectedTheme?.tag) {
                const tagUpper = selectedTheme.tag.toUpperCase();
                if (tagUpper.includes('ENEM')) examParam = 'ENEM';
                else if (tagUpper.includes('FUVEST')) examParam = 'FUVEST';
                else if (tagUpper.includes('UNICAMP')) examParam = 'UNICAMP';
                else if (tagUpper.includes('UNESP')) examParam = 'UNESP';
            }

            const body: any = {
                theme: selectedTheme?.title,
                submissionMethod,
                text: text,
                targetExam: examParam
            };

            if (submissionMethod === 'manual') {
                body.files = filesPreview.map((data, i) => ({
                    data,
                    mimeType: files[i].type
                }));
            }

            const response = await fetch('/api/correct-essay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errMsg = 'Falha na comunicação com a IA.';
                try {
                    const parsedError = JSON.parse(errorText);
                    if (parsedError && parsedError.error) {
                        errMsg = parsedError.error;
                    } else if (parsedError && parsedError.message) {
                        errMsg = parsedError.message;
                    }
                } catch (_) {
                    if (errorText && errorText.trim().length > 0) {
                        errMsg = errorText.substring(0, 150);
                    }
                }
                throw new Error(errMsg);
            }

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e: any) {
                throw new Error('A IA não conseguiu analisar sua redação. Tente com imagens de menor tamanho ou em formato PDF. \n' + e.message);
            }
            setEvaluation(result);

            // Save to Firestore if user is logged in
            if (auth.currentUser) {
                try {
                    await addDoc(collection(db, 'essay_submissions'), {
                        userId: auth.currentUser.uid,
                        theme: selectedTheme?.title,
                        score: result.totalScore,
                        competencies: result.competencies,
                        evaluation: result,
                        submissionMethod,
                        createdAt: serverTimestamp()
                    });
                } catch (saveError) {
                    console.error("Error saving essay submission document:", saveError);
                    handleFirestoreError(saveError, OperationType.WRITE, 'essay_submissions');
                }

                try {
                    // Update user XP
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, {
                        xp: increment(Math.floor(result.totalScore / 10)), // Example: 1 XP for every 10 points
                        essayCount: increment(1)
                    });
                } catch (xpError) {
                    console.error("Error updating user XP or essay counts:", xpError);
                    handleFirestoreError(xpError, OperationType.WRITE, `users/${auth.currentUser.uid}`);
                }
            }

            toast.success('Correção concluída com sucesso! ✨', { id: loadingId });
        } catch (error: any) {
            console.error(error);
            const errorMsg = error instanceof Error ? error.message : 'Erro ao realizar a correção. Tente novamente.';
            toast.error(errorMsg, { id: loadingId });
            setCurrentPhase('redacao');
        } finally {
            setIsEvaluating(false);
        }
    };

    const resetWriting = () => {
        setSelectedTheme(null);
        setText('');
        setTitle('');
        setSeconds(0);
        setAiRepertoire(null);
        setSubmissionMethod('digital');
        setFiles([]);
        setFilesPreview([]);
    };

    const { trendingSubjects, topTrendingPhotos, topTrendingPosts, onlineUsers } = useTrendingData(currentUser);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [postComments, setPostComments] = useState<any[]>([]);

    const openPostModal = (post: PostType) => {
        setSelectedPost(post);
        const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
        onSnapshot(q, (snapshot) => {
            const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPostComments(commentList);
        });
    };

    const isFeaturedCompleted = featuredTheme ? completedThemes.some(title => title.toLowerCase().trim() === featuredTheme.title.toLowerCase().trim()) : false;
    const featuredMatchingSubmissions = featuredTheme ? completedThemesDetails.filter(d => d.theme?.toLowerCase().trim() === featuredTheme.title.toLowerCase().trim()) : [];
    const featuredHighestScore = featuredMatchingSubmissions.length > 0 ? Math.max(...featuredMatchingSubmissions.map(s => s.score || 0)) : null;

    if (!selectedTheme) {
        return (
            <Layout>
                <div className="w-full px-4 py-8">
                    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                <FileText className="text-accent-1" size={40} />
                                Arena de Escrita
                            </h2>
                            <p className="dark:text-gray-400 text-slate-500 mt-2 text-lg">Selecione seu desafio e mostre que sua argumentação é imparável.</p>
                        </div>
                        
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-1 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar tema ou área..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-bg-secondary border border-glass-border rounded-2xl text-[var(--text-primary)] placeholder-gray-400 outline-none focus:border-accent-1/50 transition-all w-full sm:min-w-[300px] shadow-sm"
                                />
                            </div>
                        </div>
                    </header>

                    {/* Exam selection tab bar */}
                    <div className="bg-gradient-to-r from-bg-secondary via-[#1a1c22]/60 to-bg-secondary border border-glass-border rounded-[28px] p-2 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.25)] relative overflow-hidden backdrop-blur-md">
                        {/* Interactive dynamic glow behind the active tab */}
                        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none opacity-20 transition-all duration-500">
                            <div className={`absolute top-1/2 -translate-y-1/2 w-64 h-32 blur-[60px] rounded-full transition-all duration-700 ${
                                examTab === 'enem' 
                                ? 'left-[10%] bg-accent-1/40' 
                                : 'right-[10%] bg-amber-500/30'
                            }`} />
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch gap-2 w-full relative z-10">
                            <button
                                type="button"
                                onClick={() => { setExamTab('enem'); setSelectedCategory('Todos'); setSelectedMonth('Todos'); }}
                                className={`flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 text-center sm:text-left relative transition-all duration-300 rounded-[20px] overflow-hidden group ${
                                    examTab === 'enem'
                                    ? 'text-white'
                                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-200'
                                }`}
                            >
                                {examTab === 'enem' && (
                                    <motion.div 
                                        layoutId="activeExamTabBg" 
                                        className="absolute inset-0 bg-gradient-to-tr from-accent-1/20 to-accent-1/5 border border-accent-1/30 rounded-[20px] -z-10"
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    />
                                )}
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                                        examTab === 'enem' 
                                        ? 'bg-accent-1/20 text-accent-1 shadow-[0_0_15px_rgba(var(--accent-1-rgb),0.2)]' 
                                        : 'bg-zinc-800/40 text-slate-400 group-hover:scale-110'
                                    }`}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-base tracking-wide flex items-center gap-2">
                                            Temas do ENEM
                                            {examTab === 'enem' && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-1 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-1"></span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">Cronograma Oficial de Janeiro a Novembro</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    examTab === 'enem'
                                    ? 'bg-accent-1 text-black font-extrabold shadow-[0_2px_10px_rgba(244,63,94,0.3)]'
                                    : 'bg-zinc-800/80 text-zinc-400 dark:text-zinc-400'
                                }`}>
                                    {themesList.filter(t => t.tag === 'Estilo ENEM').length} Temas
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setExamTab('outros'); setSelectedCategory('Todos'); setSelectedMonth('Todos'); }}
                                className={`flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 text-center sm:text-left relative transition-all duration-300 rounded-[20px] overflow-hidden group ${
                                    examTab === 'outros'
                                    ? 'text-white'
                                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-200'
                                }`}
                            >
                                {examTab === 'outros' && (
                                    <motion.div 
                                        layoutId="activeExamTabBg" 
                                        className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-[20px] -z-10"
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    />
                                )}
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                                        examTab === 'outros' 
                                        ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                        : 'bg-zinc-800/40 text-slate-400 group-hover:scale-110'
                                    }`}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-base tracking-wide">
                                            Outros Vestibulares
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">Fuvest, Unicamp, Unesp & Gêneros Livres</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    examTab === 'outros'
                                    ? 'bg-amber-500 text-black font-extrabold shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                                    : 'bg-zinc-800/80 text-zinc-400 dark:text-zinc-400'
                                }`}>
                                    {themesList.filter(t => t.tag !== 'Estilo ENEM').length} Temas
                                </div>
                            </button>
                        </div>

                        {/* Extra informative row that beautifully specifies details of active section */}
                        <div className="mt-2.5 p-3 px-4 bg-zinc-950/20 rounded-xl border border-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 dark:text-zinc-400 relative z-10">
                            {examTab === 'enem' ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-accent-1 font-bold">💡 Estrutura ENEM:</span>
                                        <span>Propostas de 30 linhas cobrando propostas de intervenção detalhadas.</span>
                                    </div>
                                    <div className="px-2 py-0.5 rounded bg-accent-1/15 border border-accent-1/25 text-[10px] text-accent-1 font-bold uppercase tracking-wider">
                                        5 Competências Oficiais
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-400 font-bold">💡 Gêneros Diversos:</span>
                                        <span>Cartas argumentativas, manifestos de opinião, crônicas narrativas e resenhas críticas.</span>
                                    </div>
                                    <div className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                        Critérios Específicos
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Weekly Progress Tracker Card */}
                    <div className="bg-bg-secondary border border-glass-border rounded-[32px] p-8 mb-10 shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h4 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Trophy size={20} className="text-amber-500" />
                                    {examTab === 'enem' ? 'Plano de Redação ENEM (1 por Semana)' : 'Plano de Outros Vestibulares (1 por Semana)'}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                                    Sua jornada ativa: <strong className="text-accent-1">{themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').reduce((acc, t) => acc + (completedThemes.some(title => title.toLowerCase().trim() === t.title.toLowerCase().trim()) ? 1 : 0), 0)} de {themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').length} redações entregues</strong>.
                                </p>
                            </div>
                            <div className="flex-grow max-w-md w-full">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    <span>Progresso do Cronograma</span>
                                    <span>{themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').length > 0 ? Math.round((themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').reduce((acc, t) => acc + (completedThemes.some(title => title.toLowerCase().trim() === t.title.toLowerCase().trim()) ? 1 : 0), 0) / themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').length) * 100) : 0}%</span>
                                </div>
                                <div className="relative w-full h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-accent-1 to-amber-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').length > 0 ? Math.round((themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').reduce((acc, t) => acc + (completedThemes.some(title => title.toLowerCase().trim() === t.title.toLowerCase().trim()) ? 1 : 0), 0) / themesList.filter(t => examTab === 'enem' ? t.tag === 'Estilo ENEM' : t.tag !== 'Estilo ENEM').length) * 100) : 0}%` }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Chips */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-accent-1 shadow-[0_4px_12px_rgba(var(--accent-rgb),0.2)] text-[color:var(--btn-text-color,white)]' 
                                    : 'bg-bg-secondary text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 border border-slate-200 dark:border-zinc-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Month Selection Ribbon */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 px-1 mb-4">
                            <Calendar size={16} className="text-accent-1" />
                            <p className="text-slate-400 dark:text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">Navegação Mensal (Cronograma Completo)</p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 p-2 bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-white/[0.05] rounded-[24px]">
                            {monthsList.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setSelectedMonth(m.value)}
                                    className={`relative px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        selectedMonth === m.value
                                        ? 'text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {selectedMonth === m.value && (
                                        <motion.div
                                            layoutId="activeMonthTab"
                                            className="absolute inset-0 bg-gradient-to-r from-accent-1 to-indigo-600 rounded-full shadow-[0_4px_16px_rgba(244,63,94,0.3)]"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedCategory + searchQuery + selectedMonth}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-12"
                        >
                            {/* Featured Theme */}
                            {featuredTheme && selectedCategory === 'Todos' && !searchQuery && selectedMonth === 'Todos' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group relative bg-bg-secondary border rounded-[48px] p-10 md:p-14 overflow-hidden shadow-xl shadow-accent-1/5 dark:shadow-none cursor-pointer transition-all hover:border-accent-1/40 ${
                                        isFeaturedCompleted 
                                        ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5' 
                                        : 'border-glass-border'
                                    }`}
                                    onClick={() => setSelectedTheme(featuredTheme)}
                                >
                                    {featuredTheme.coverImage ? (
                                        <div className="absolute inset-0 z-0">
                                            <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-secondary/90 to-bg-secondary/40 z-10" />
                                            <img 
                                                src={featuredTheme.coverImage} 
                                                alt={featuredTheme.title} 
                                                className="absolute top-0 right-0 w-2/3 h-full object-cover opacity-80"
                                            />
                                        </div>
                                    ) : (
                                        <div className="absolute top-0 right-0 p-10 opacity-30 group-hover:opacity-50 transition-all group-hover:scale-110 z-0">
                                            <Sparkles size={120} className="text-accent-1/40" />
                                        </div>
                                    )}
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            <span className="inline-flex items-center gap-2 px-4 py-1 bg-accent-1 text-[color:var(--btn-text-color,white)] text-xs font-black rounded-full uppercase tracking-widest shadow-md shadow-accent-1/10">
                                                🔥 Tema do Dia
                                            </span>
                                            {isFeaturedCompleted && (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black rounded-full uppercase tracking-widest">
                                                    ✓ Concluído {featuredHighestScore !== null ? `(${featuredHighestScore} pts)` : ''}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight max-w-3xl">
                                            {featuredTheme.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                                                <Layers size={18} className="text-accent-1" />
                                                <span className="text-sm font-bold uppercase tracking-wider">{featuredTheme.category}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                                                <ShieldCheck size={18} className="text-accent-1" />
                                                <span className="text-sm font-bold uppercase tracking-wider">{featuredTheme.tag}</span>
                                            </div>
                                            {featuredTheme.genre && (
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                                                    <FileText size={18} className="text-accent-1" />
                                                    <span className="text-sm font-bold uppercase tracking-wider text-amber-500">{featuredTheme.genre}</span>
                                                </div>
                                            )}
                                            <button className={`flex items-center gap-3 px-10 py-5 font-extrabold rounded-[24px] hover:scale-105 active:scale-95 transition-all ml-auto group/btn shadow-xl ${
                                                isFeaturedCompleted
                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                                : 'bg-accent-1 text-[color:var(--btn-text-color,white)] shadow-accent-1/30'
                                            }`}>
                                                {isFeaturedCompleted ? 'Fazer novamente' : 'Começar agora'}
                                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Theme Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredThemes.map((theme, idx) => {
                                    const isCompleted = completedThemes.some(title => title.toLowerCase().trim() === theme.title.toLowerCase().trim());
                                    const matchingSubmissions = completedThemesDetails.filter(d => d.theme?.toLowerCase().trim() === theme.title.toLowerCase().trim());
                                    const highestScore = matchingSubmissions.length > 0 ? Math.max(...matchingSubmissions.map(s => s.score || 0)) : null;
                                    return (
                                        <motion.div 
                                            key={theme.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ y: -10 }}
                                            className={`group relative bg-bg-secondary border rounded-[40px] p-8 transition-all hover:shadow-xl hover:shadow-accent-1/10 dark:hover:shadow-none cursor-pointer flex flex-col min-h-[320px] overflow-hidden ${
                                                isCompleted 
                                                ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5' 
                                                : 'border-glass-border hover:border-accent-1/40'
                                            }`}
                                            onClick={() => setSelectedTheme(theme)}
                                        >
                                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-1/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            {(() => {
                                                const getThemeMonthName = (weekNum: number) => {
                                                    if (weekNum >= 1 && weekNum <= 4) return 'Janeiro';
                                                    if (weekNum >= 5 && weekNum <= 8) return 'Fevereiro';
                                                    if (weekNum >= 9 && weekNum <= 12) return 'Março';
                                                    if (weekNum >= 13 && weekNum <= 16) return 'Abril';
                                                    if (weekNum >= 17 && weekNum <= 20) return 'Maio';
                                                    if (weekNum >= 21 && weekNum <= 24) return 'Junho';
                                                    if (weekNum >= 25 && weekNum <= 28) return 'Julho';
                                                    if (weekNum >= 29 && weekNum <= 32) return 'Agosto';
                                                    if (weekNum >= 33 && weekNum <= 36) return 'Setembro';
                                                    if (weekNum >= 37 && weekNum <= 40) return 'Outubro';
                                                    if (weekNum >= 41 && weekNum <= 44) return 'Novembro';
                                                    return 'Cronograma';
                                                };
                                                const cleanBadge = (theme.badge || '').replace(/[🔥🌾⚽⚖️💜🏹🧠🏃💧🧩👩✊🏾📱👵🎬🚰🚴🧱🔋🌐⛓️🏫🛍️💵💉📈📣🤝🐕🫀🍷📚🚲🌳🎒🚫🛑🥦🧸🗣️🦯🏥]/g, '').trim();
                                                
                                                return (
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className={`px-4 py-1.5 text-xs md:text-sm font-black rounded-full uppercase tracking-widest ${
                                                            isCompleted
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm'
                                                            : 'bg-accent-1/10 text-accent-1'
                                                        }`}>
                                                            {isCompleted ? `✓ Concluído ${highestScore !== null ? `(${highestScore} pts)` : ''}` : theme.category}
                                                        </span>
                                                        <span className="text-xs md:text-sm font-extrabold text-amber-500 uppercase tracking-tight flex items-center gap-1">
                                                            <Calendar size={13} className="text-amber-500" />
                                                            {getThemeMonthName(theme.week)} • {cleanBadge}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                            
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-tight group-hover:text-accent-1 transition-colors flex-grow">
                                                {theme.title}
                                            </h3>

                                            {theme.genre && (
                                                <div className="mb-4">
                                                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-md uppercase tracking-wider">
                                                        Gênero: {theme.genre}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover Preview Section */}
                                            <div className="h-0 group-hover:h-24 opacity-0 group-hover:opacity-100 transition-all duration-500 overflow-hidden mb-6">
                                                <p className="text-xs dark:text-gray-500 text-slate-400 italic line-clamp-3 leading-relaxed border-l-2 dark:border-white/10 border-slate-200 pl-4">
                                                    {theme.motivationalTexts[0]?.content[0]}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t dark:border-white/5 border-slate-100">
                                                <span className="text-xs dark:text-gray-600 text-slate-400 font-bold uppercase tracking-widest">{theme.tag}</span>
                                                <div className="flex items-center gap-2">
                                                    {isCompleted && (
                                                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl">
                                                            Refazer
                                                        </span>
                                                    )}
                                                    <div className={`p-3 rounded-2xl transition-all ${
                                                        isCompleted 
                                                        ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-900 border border-emerald-500/25' 
                                                        : 'bg-bg-main group-hover:bg-accent-1 group-hover:text-slate-900'
                                                    }`}>
                                                        <ArrowRight size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {filteredThemes.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[48px]">
                                    <Search size={48} className="mx-auto text-gray-700 mb-4" />
                                    <h4 className="text-xl font-bold text-gray-500">Nenhum tema encontrado</h4>
                                    <p className="text-gray-600 mt-2">Tente buscar por termos diferentes ou limpe os filtros.</p>
                                    <button 
                                        onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }}
                                        className="mt-6 text-accent-1 font-bold uppercase text-[10px] tracking-widest hover:underline"
                                    >
                                        Limpar Filtros
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6" id="redacao-container">
                    {/* Top Navigation & Progress */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-bg-secondary border border-glass-border p-4 rounded-3xl backdrop-blur-sm shadow-lg shadow-accent-1/5 dark:shadow-none transition-all">
                    <div className="flex items-center gap-4">
                        <button onClick={resetWriting} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-gray-500">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <FileText className="text-accent-1" size={24} />
                                Workshop de Escrita
                            </h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${isAutoSaving ? 'text-accent-1' : 'dark:text-gray-600 text-slate-400'}`}>
                                    {isAutoSaving ? 'Salvando progresso...' : 'Backup ativado'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator - Stepper */}
                    <div className="flex items-center gap-4 sm:gap-8 px-6 py-2 bg-bg-main rounded-2xl border border-glass-border transition-all">
                        {[
                            { id: 'leitura', label: 'Tema', icon: <BookOpen size={12} /> },
                            { id: 'redacao', label: 'Redação', icon: <Clock size={12} /> },
                            { id: 'correcao', label: 'Correção', icon: <ShieldCheck size={12} /> },
                        ].map((phase, idx, arr) => (
                            <React.Fragment key={phase.id}>
                                <div className={`flex items-center gap-2 ${currentPhase === phase.id ? 'opacity-100' : (arr.findIndex(p => p.id === currentPhase) > idx ? 'opacity-100' : 'opacity-30')}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        currentPhase === phase.id 
                                        ? 'bg-accent-1 text-slate-900 shadow-[0_0_15px_rgba(0,242,255,0.4)]' 
                                        : (idx < arr.findIndex(p => p.id === currentPhase) ? 'bg-emerald-500 text-white' : 'border border-glass-border')
                                    }`}>
                                        {idx < arr.findIndex(p => p.id === currentPhase) ? <CheckCircle2 size={12} /> : phase.icon}
                                    </div>
                                    <span className={`text-xs font-bold ${currentPhase === phase.id ? 'text-[var(--text-primary)]' : 'text-slate-500'}`}>{phase.label}</span>
                                </div>
                                {idx < arr.length - 1 && <div className="w-6 sm:w-10 h-px border-glass-border" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={`p-3 border rounded-2xl transition-all ${
                                isFocusMode 
                                ? 'bg-accent-1/10 border-accent-1/50 text-accent-1 shadow-sm' 
                                : 'dark:bg-white/5 bg-white dark:border-white/10 border-slate-200 dark:text-gray-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'
                            }`}
                            title={isFocusMode ? "Expandir editor" : "Modo foco"}
                        >
                            {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                    </div>
                </div>

                {currentPhase === 'leitura' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            {/* Title and Header */}
                            <div className="p-10 bg-bg-secondary border border-glass-border rounded-[48px] shadow-sm">
                                <span className="text-[10px] font-black text-accent-1 uppercase tracking-[0.2em] mb-4 block">Proposta de Redação</span>
                                <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] leading-tight mb-6">
                                    {selectedTheme.title}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-bg-main border border-glass-border rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-400">{selectedTheme.category}</span>
                                    <span className="px-4 py-1.5 bg-accent-1/10 border border-accent-1/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-accent-1">Padrão ENEM</span>
                                </div>
                            </div>

                            {isSelectedThemeCompleted && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[40px] flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                            <CheckCircle2 size={18} className="stroke-[2.5]" />
                                            <span className="text-xs font-black uppercase tracking-wider font-mono">Status: Concluído</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-300">
                                            Você já escreveu sobre este tema. {selectedThemeHighestScore !== null ? `Sua nota máxima de feedback foi ${selectedThemeHighestScore} pontos.` : ''}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Deseja refazer a redação para treinar novamente e consolidar seu aprendizado?
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setText('');
                                            setTitle('');
                                            setCurrentPhase('redacao');
                                        }}
                                        className="sm:self-center px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-2xl uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    >
                                        Fazer Novamente
                                    </button>
                                </motion.div>
                            )}

                            {/* Motivating Texts Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-10 h-10 bg-accent-1/10 rounded-2xl flex items-center justify-center">
                                        <BookOpen className="text-accent-1" size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Textos Motivadores</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {selectedTheme.motivationalTexts.map((text, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-bg-secondary border border-glass-border rounded-[40px] p-8 md:p-10 shadow-sm hover:border-accent-1/20 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-bg-main rounded-2xl flex items-center justify-center font-black text-accent-1 text-lg border border-glass-border italic">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight mb-1">{text.title}</h4>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{text.source} {text.date && `• ${text.date}`}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {text.content.map((p, pIdx) => (
                                                    <p key={pIdx} className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base font-medium">
                                                        {p}
                                                    </p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-center py-10">
                                <button 
                                    onClick={() => setCurrentPhase('redacao')}
                                    className={`group relative px-16 py-6 font-black text-xl rounded-[32px] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 ${
                                        isSelectedThemeCompleted
                                        ? 'bg-emerald-500 text-slate-950 shadow-[0_20px_50px_rgba(16,185,129,0.3)]'
                                        : 'bg-accent-1 text-slate-900 shadow-[0_20px_50px_rgba(0,242,255,0.3)]'
                                    }`}
                                >
                                    {isSelectedThemeCompleted ? 'Refazer Redação' : 'Ir para Redação'}
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            {/* Repertoire Section */}
                            <div className="p-8 bg-bg-secondary border border-glass-border rounded-[40px] shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                                        <Lightbulb className="text-amber-500" size={20} />
                                        Repertório Estelar
                                    </h3>
                                    {!showRepertoire && (
                                        <button 
                                            onClick={() => setShowRepertoire(true)}
                                            className="px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all uppercase tracking-widest"
                                        >
                                            Revelar
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {showRepertoire ? (
                                        selectedTheme.repertoires.map((rep, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={idx} 
                                                className="p-6 bg-bg-main border border-glass-border rounded-3xl"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-black rounded-md uppercase tracking-wider">{rep.type}</span>
                                                </div>
                                                <h4 className="text-lg font-black text-[var(--text-primary)] mb-2 tracking-tight">{rep.concept}</h4>
                                                <p className="text-base text-slate-400 leading-relaxed font-medium italic">"{rep.application}"</p>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center space-y-4 opacity-40">
                                            <div className="w-16 h-16 bg-bg-main rounded-[24px] border border-glass-border flex items-center justify-center mx-auto">
                                                <Sparkles size={24} className="text-slate-400 group-hover:rotate-12 transition-transform" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Repertório Estratégico Bloqueado</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ENEM Competencies Card */}
                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[40px] text-white overflow-hidden relative shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Trophy size={80} />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Star className="text-amber-400" size={16} fill="currentColor" />
                                    </div>
                                    Manual dos 1000 pts
                                </h3>
                                <div className="space-y-8 relative z-10">
                                    {ENEM_COMPETENCIES.map((comp, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex items-start gap-6 p-6 rounded-[32px] hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                                                <span className="text-3xl font-black text-accent-1 opacity-90 whitespace-nowrap pt-1">C{idx+1}</span>
                                                <div>
                                                    <h4 className="text-lg font-black uppercase tracking-wider text-white mb-1">{comp.title}</h4>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{comp.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentPhase === 'redacao' ? (
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* REDUCED HEADER */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 border border-slate-800 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-1/20 blur-[80px]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <button 
                                        onClick={() => setCurrentPhase('leitura')}
                                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                                    >
                                        <ArrowLeft size={16} /> Voltar para textos
                                    </button>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold font-mono tracking-widest">
                                        <Clock size={16} />
                                        {formatTime(seconds)}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-1/60 mb-2 block">Proposta de Redação</span>
                                <h1 className="text-3xl font-black leading-tight border-l-4 border-accent-1 pl-6">
                                    {selectedTheme?.title}
                                </h1>
                            </div>
                        </motion.div>

                        {/* WORKSPACE */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-secondary border border-glass-border rounded-[48px] p-8 md:p-12 shadow-xl"
                        >
                            <div className="flex flex-col gap-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 p-1 bg-bg-main rounded-2xl border border-glass-border">
                                        <button 
                                            onClick={() => setSubmissionMethod('digital')}
                                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${submissionMethod === 'digital' ? 'bg-accent-1 text-slate-900' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Escrever Digital
                                        </button>
                                        <button 
                                            onClick={() => setSubmissionMethod('manual')}
                                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${submissionMethod === 'manual' ? 'bg-accent-1 text-slate-900' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Anexar Foto/PDF
                                        </button>
                                    </div>
                                    {submissionMethod === 'digital' && (
                                        <div className="hidden sm:flex flex-col text-right">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contagem</span>
                                            <div className="flex items-baseline justify-end gap-1">
                                                <span className={`text-2xl font-black transition-colors ${lineCount > 30 ? 'text-rose-500' : 'text-accent-1'}`}>
                                                    {lineCount}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">linhas</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {submissionMethod === 'digital' ? (
                                    <div className="space-y-8">
                                        <div className="bg-bg-main border-2 border-glass-border rounded-[32px] overflow-hidden focus-within:border-accent-1/40 transition-all">
                                            <div className="flex min-h-full">
                                                {/* Line Numbers Sidebar */}
                                                <div className="flex-none bg-slate-900/50 border-r border-glass-border px-4 py-10 text-right select-none w-16">
                                                    {Array.from({ length: 30 }).map((_, i) => (
                                                        <div key={i} className="text-[10px] font-mono font-black text-slate-500 h-[2rem] flex items-center justify-end">
                                                            {(i + 1).toString().padStart(2, '0')}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="relative flex-grow cursor-text" onClick={() => editorRef.current?.focus()}>
                                                    <textarea 
                                                        ref={editorRef as any}
                                                        value={text}
                                                        onChange={(e) => {
                                                            const newVal = e.target.value;
                                                            const currentLines = calculateLineCount(newVal);
                                                            if (currentLines <= 30) {
                                                                setText(newVal);
                                                            } else {
                                                                toast.error('Limite máximo de 30 linhas atingido.');
                                                            }
                                                        }}
                                                        placeholder="Desenvolva seu texto respeitando a estrutura dissertativa-argumentativa..."
                                                        className={`w-full h-[60rem] bg-transparent p-10 font-medium text-lg leading-[2rem] outline-none resize-none transition-all overflow-y-auto scrollbar-none ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}
                                                        style={{ 
                                                            backgroundImage: theme === 'light' 
                                                                ? 'linear-gradient(transparent, transparent 1.95rem, rgba(0,0,0,0.05) 1.95rem), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)'
                                                                : 'linear-gradient(transparent, transparent 1.95rem, rgba(255,255,255,0.05) 1.95rem), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                                            backgroundSize: '2rem 2rem'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={handleSubmit}
                                                disabled={lineCount < 7}
                                                className="px-16 py-6 bg-accent-1 text-slate-900 font-black rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent-1/20 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                                            >
                                                Finalizar & Corrigir
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center bg-bg-main border-4 border-dashed border-glass-border rounded-[48px] hover:bg-accent-1/5 transition-all group cursor-pointer relative overflow-hidden">
                                        <div className="w-24 h-24 bg-accent-1/10 rounded-[32px] flex items-center justify-center mb-8 border border-accent-1/20 group-hover:scale-110 transition-all">
                                            <Upload size={40} className="text-accent-1" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">Enviar Folha de Redação</h3>
                                        <p className="text-slate-500 font-bold text-sm mb-12">Arraste seus arquivos aqui ou clique para selecionar</p>
                                        
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="*/*" 
                                            className="hidden" 
                                            id="file-upload"
                                            onChange={handleFileChange}
                                        />
                                        <label 
                                            htmlFor="file-upload"
                                            className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl cursor-pointer hover:bg-accent-1 transition-all uppercase tracking-widest text-[10px] shadow-2xl"
                                        >
                                            Escolher do computador
                                        </label>

                                        {files.length > 0 && (
                                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-8 w-full max-w-3xl">
                                                {files.map((file, i) => (
                                                    <div key={i} className="relative aspect-[3/4] rounded-2xl bg-slate-800 border border-white/5 overflow-hidden">
                                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500 p-2 break-all">{file.name}</div>
                                                        <button onClick={() => removeFile(i)} className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-lg backdrop-blur-sm"><Trash2 size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {files.length > 0 && (
                                            <button 
                                                onClick={handleSubmit}
                                                className="mt-12 px-16 py-6 bg-accent-1 text-slate-900 font-black rounded-3xl hover:scale-[1.02] transition-all shadow-xl shadow-accent-1/20 uppercase tracking-[0.2em] text-xs"
                                            >
                                                Finalizar & Corrigir
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {isEvaluating ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-bg-secondary border border-glass-border rounded-[48px] shadow-sm">
                                <motion.div 
                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-24 h-24 border-4 border-accent-1 border-t-transparent rounded-full flex items-center justify-center mb-8"
                                >
                                    <Sparkles className="text-accent-1" size={32} />
                                </motion.div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">Avaliando sua obra prima...</h2>
                                <p className="text-slate-500 font-medium max-w-md text-center leading-relaxed">
                                    O Corvo Estelar está verificando cada competência, analisando sua coesão, gramática e proposta de intervenção.
                                </p>
                            </div>
                        ) : evaluation ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-8">
                                    {/* Score Header */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-bg-secondary border border-glass-border rounded-[48px] p-12 overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-12 opacity-10">
                                            <Trophy size={160} className="text-accent-1" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-block px-4 py-1.5 bg-accent-1/10 text-accent-1 text-xs font-black rounded-full uppercase tracking-widest mb-6">Resultado da Missão</span>
                                            <div className="flex items-end gap-6 mb-8">
                                                <h1 className="text-8xl font-black text-white leading-none">
                                                    {evaluation.totalScore || 0}
                                                </h1>
                                                <span className="text-3xl font-bold text-slate-500 mb-2">/ 1000 pts</span>
                                            </div>
                                            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl">
                                                {evaluation.generalFeedback || "Sem feedback geral disponível."}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Competencies Breakdown */}
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight ml-4">Detalhamento das Competências</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {evaluation.competencies?.map((comp: any, idx: number) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="bg-bg-secondary border border-glass-border rounded-[32px] p-8 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-accent-1/20 transition-all"
                                                >
                                                    <div className="flex-none flex flex-col items-center justify-center w-24 h-24 bg-bg-main border border-glass-border rounded-[24px]">
                                                        <span className="text-2xl font-black text-white">{comp.score || 0}</span>
                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Pontos</span>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-accent-1 font-black">C{idx + 1}</span>
                                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{ENEM_COMPETENCIES[idx]?.title || 'Competência'}</h4>
                                                        </div>
                                                        <p className="text-base text-slate-300 font-medium leading-relaxed italic">
                                                            {comp.feedback || "Sem feedback específico"}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-6">
                                    {/* Action Points */}
                                    <div className="bg-bg-secondary border border-glass-border rounded-[40px] p-8">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                                            <Zap className="text-yellow-400" size={24} />
                                            Pontos de Melhoria
                                        </h3>
                                        <div className="space-y-4">
                                            {evaluation.improvements?.map((imp: string, i: number) => (
                                                <div key={i} className="p-4 bg-yellow-400/5 border border-yellow-400/10 rounded-2xl flex gap-3 items-start">
                                                    <div className="mt-1"><ArrowRight size={14} className="text-yellow-400" /></div>
                                                    <p className="text-base font-medium text-slate-200">{imp}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Strengths & Weaknesses */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-bg-secondary border border-glass-border rounded-[40px] p-8">
                                            <h3 className="text-xl font-black text-emerald-500 uppercase tracking-tight mb-6">Pontos Fortes</h3>
                                            <div className="space-y-4">
                                                {evaluation.strengths?.map((str: string, i: number) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <CheckCircle2 size={16} className="text-emerald-500 mt-1" />
                                                        <p className="text-base font-medium text-slate-200">{str}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-bg-secondary border border-glass-border rounded-[40px] p-8">
                                            <h3 className="text-xl font-black text-red-500 uppercase tracking-tight mb-6">Atenção</h3>
                                            <div className="space-y-4">
                                                {evaluation.weaknesses?.map((weak: string, i: number) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <AlertCircle size={16} className="text-red-500 mt-1" />
                                                        <p className="text-base font-medium text-slate-200">{weak}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={resetWriting}
                                        className="w-full py-6 bg-accent-1 text-slate-900 font-black rounded-3xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,242,255,0.2)]"
                                    >
                                        Nova Redação
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-bg-secondary border border-glass-border rounded-[48px] shadow-sm">
                                <AlertCircle className="text-red-500 mb-6" size={48} />
                                <h2 className="text-2xl font-black text-white">Ops! Algo deu errado.</h2>
                                <p className="text-slate-500 mt-2 mb-8">Não conseguimos recuperar sua correção agora.</p>
                                <button onClick={() => setCurrentPhase('redacao')} className="px-10 py-4 bg-accent-1 text-slate-900 font-black rounded-2xl">
                                    Tentar Novamente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Redacao;
