import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Newspaper, Eye, PenTool, BookOpen, Users } from 'lucide-react';
import vestMascot from '../assets/images/vest_mascot_1782258764651.jpg';

const features = [
  {
    id: 'gamification',
    title: "Gamificação",
    vestSpeak: "Ei! Sei que às vezes dá um sono danado estudar. Por isso, eu criei desafios interativos que transformam o estudo num verdadeiro jogo.",
    desc: "Transformamos questões e vídeos em desafios interativos, tornando o estudo leve e produtivo."
  },
  {
    id: 'feed',
    title: "Feed de Notícias",
    vestSpeak: "Ficar por fora das atualidades? Nem pensar! Eu vasculho o mundo para trazer o que realmente importa para a sua redação.",
    desc: "Mantenha-se atualizado com as principais notícias do Brasil e do mundo."
  },
  {
    id: 'redacao',
    title: "Redação 1000",
    vestSpeak: "Escrever é arte, e eu te ajudo a ser o Picasso da redação! Eu te guio na estrutura, nos argumentos e deixo seus textos prontos.",
    desc: "Pratique redação com temas atuais e receba orientações para estruturar seus textos."
  },
  {
    id: 'simulados',
    title: "Simulados",
    vestSpeak: "Treino é treino, jogo é jogo. Aqui eu coloco você no ritmo real do ENEM, com questões selecionadas para você perder o medo.",
    desc: "Uma base completa de exercícios organizados por nível de dificuldade."
  },
  {
    id: 'acessibilidade',
    title: "Acessibilidade",
    vestSpeak: "O VestApp é pra todo mundo! Se precisar de um contraste maior ou letras maiores, eu ajusto tudo aqui pra ninguém ficar de fora.",
    desc: "Modos de visualização com alto contraste e fontes ajustáveis."
  },
  {
    id: 'comunidade',
    title: "Comunidade",
    vestSpeak: "Ninguém conquista o mundo sozinho. Aqui no ninho a gente se ajuda, compartilha vitórias e mantém o foco no objetivo!",
    desc: "Conecte-se com outros estudantes e mantenha o foco no seu objetivo."
  }
];

const Sobre = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <button 
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors group font-semibold uppercase tracking-widest text-sm"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="max-w-4xl mx-auto">
        <header className="mb-20 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white tracking-tight">
            O que é o <span className="text-purple-400">VestApp</span>?
            </h1>
            <p className="text-xl text-slate-400 font-medium">
            Seu guia pessoal para a aprovação, com uma experiência moderna e inteligente.
            </p>
        </header>
        
        <div className="space-y-12">
            {features.map((feature) => (
                <FeatureSection key={feature.id} {...feature} />
            ))}
        </div>

        <div className="mt-20 p-10 bg-slate-900/50 border border-slate-700/50 rounded-3xl text-center backdrop-blur-xl">
            <h2 className="text-3xl font-bold mb-4 text-white">Pronto para começar sua história?</h2>
            <p className="text-slate-400 mb-8 text-lg">
                Junte-se ao nosso ninho e prepare-se para alcançar sua sonhada vaga na universidade!
            </p>
            <button 
                onClick={() => navigate('/cadastro')}
                className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-purple-900/20"
            >
                Criar minha conta agora
            </button>
        </div>
      </div>
    </div>
  );
};

const FeatureSection = ({ id, title, vestSpeak, desc }: { id: string, title: string, vestSpeak: string, desc: string }) => (
    <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-900/40 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-md">
        <div className="relative flex-shrink-0">
            <img src={vestMascot} alt="Vest" className="w-32 h-32 rounded-full border-4 border-slate-700 shadow-xl" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-4 border-slate-900" />
        </div>
        <div className="flex-grow">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">{title}</h3>
            <div className="bg-slate-800/50 p-5 rounded-2xl relative mb-4">
                <p className="text-slate-200 leading-relaxed italic">"{vestSpeak}"</p>
            </div>
            <p className="text-slate-400 text-sm font-medium">
                {desc}
            </p>
        </div>
    </div>
);

export default Sobre;
