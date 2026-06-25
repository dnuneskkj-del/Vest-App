import { BookOpen, Calculator, Leaf, Globe, PenTool } from 'lucide-react';

export const knowledgeAreas = [
    { 
        id: 'linguagens', 
        name: 'Linguagens', 
        icon: <BookOpen size={16} />, 
        subjects: ["Português", "Literatura", "Inglês", "Espanhol", "Artes"] 
    },
    { 
        id: 'matematica', 
        name: 'Matemática', 
        icon: <Calculator size={16} />, 
        subjects: ["Matemática"] 
    },
    { 
        id: 'natureza', 
        name: 'Natureza', 
        icon: <Leaf size={16} />, 
        subjects: ["Biologia", "Física", "Química"] 
    },
    { 
        id: 'humanas', 
        name: 'Humanas', 
        icon: <Globe size={16} />, 
        subjects: ["História", "Geografia", "Filosofia", "Sociologia"] 
    },
    { 
        id: 'redacao', 
        name: 'Redação', 
        icon: <PenTool size={16} />, 
        subjects: ["Redação"] 
    }
];

export const motivationalPhrases = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia. Mantenha o foco no ENEM!",
    "Acredite em você e no seu potencial. Cada hora de estudo te deixa mais perto da vaga!",
    "Não pare até se orgulhar. O ninho está torcendo pela sua aprovação!",
    "Sua dedicação de hoje é o seu sucesso de amanhã no ENEM. Voa, corvo!",
    "O segredo do sucesso é a constância. Continue firme nos seus objetivos!",
    "Não olhe para o relógio; faça o que ele faz. Continue seguindo em frente!",
    "Grandes conquistas exigem grandes sacrifícios. Sua vaga está te esperando!",
    "A educação é a arma mais poderosa que você pode usar para mudar o mundo.",
    "Persistência é a trilha para o êxito. Cada questão resolvida é uma vitória!",
    "O aprendizado é um tesouro que seguirá seu dono em qualquer lugar.",
    "Comece onde você está, use o que você tem e faça o que puder.",
    "Desafios são o que tornam a vida interessante; superá-los é o que dá sentido a ela.",
    "Se foque no progresso, não na perfeição. Todo dia um pouco melhor!",
    "Sua mente é sua ferramenta mais forte. Treine-a para o sucesso!",
    "O caminho para o sonho é pavimentado com livros e dedicação.",
    "Transforme sua ansiedade em energia para estudar. Você consegue!",
    "Lembre-se do porquê você começou. A vitória no ENEM está próxima!",
    "Você é capaz de feitos incríveis. Acredite no seu brilho!",
    "O esforço de hoje será a sua alegria no dia do resultado.",
    "Nenhum pássaro nasce voando, ele aprende. Você está aprendendo a voar alto!",
    "Mantenha a calma e confie no que você estudou. O conhecimento está aí!",
    "O ENEM é apenas uma etapa. Você é muito maior que qualquer prova.",
    "A vitória pertence àqueles que acreditam na beleza de seus sonhos.",
    "Não deixe que o medo de errar te impeça de tentar a questão difícil.",
    "Cada parágrafo lido é um passo a mais rumo à universidade.",
    "Sua inteligência é única. Use-a a seu favor no dia da prova!",
    "A disciplina é a ponte entre as metas e as realizações.",
    "Respire fundo, beba água e continue. Você está indo muito bem!",
    "O ninho é o lugar de quem não tem medo de voar alto. Vamos juntos!",
    "Sua jornada é inspiradora. Continue trilhando seu caminho com garra!",
    "O conhecimento abre portas que ninguém pode fechar."
];

export const getPhraseOfTheDay = () => {
    const today = new Date();
    // Use the date (day/month/year) to create a consistent index
    const dateString = `${today.getDate()}-${today.getMonth()}-${today.getFullYear()}`;
    // Simple hash to get a consistent number from the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % motivationalPhrases.length;
    return motivationalPhrases[index];
};
