import { OFFICIAL_QUESTIONS } from './officialQuestions';

export interface Question {
    id: number;
    text: string;
    options: string[];
    correct: number;
    explanation: string;
    contextText?: string;
    origin?: string;
    imageUrl?: string;
    year?: string;
}

// Group official questions for the Challenges page categories
const filterByTheme = (areaKeywords: string[], officialQuestions = OFFICIAL_QUESTIONS) => {
    return officialQuestions.filter(q => 
        areaKeywords.some(keyword => q.area.toLowerCase().includes(keyword.toLowerCase()))
    );
};

export const QUESTIONS_BY_TOPIC: Record<string, Question[]> = {
    'Interpretação_Fácil': filterByTheme(['linguagens', 'português']).slice(0, 5),
    'Interpretação_Médio': filterByTheme(['linguagens', 'português']).slice(5, 10),
    'Interpretação_Difícil': filterByTheme(['linguagens', 'português']).slice(10, 15),
    'Interpretação': filterByTheme(['linguagens', 'português']),
    'Gramática': filterByTheme(['linguagens', 'português']),
    'Matemática': filterByTheme(['matemática']),
    'Citologia': filterByTheme(['biologia']),
    'Literatura': filterByTheme(['linguagens', 'português']),
    'Geopolítica': filterByTheme(['geografia', 'humanas']),
    'Mecânica': filterByTheme(['física']),
    'Genética': filterByTheme(['biologia']),
    'Brasil': filterByTheme(['história']),
    'Gêneros': filterByTheme(['linguagens', 'português']),
    'Comunicação': filterByTheme(['linguagens']),
    'Inglês': filterByTheme(['inglês']),
    'Espanhol': filterByTheme(['espanhol']),
    'Artes': filterByTheme(['artes']),
    'Ed. Física': filterByTheme(['biologia']), // Fallback
    'Geral': OFFICIAL_QUESTIONS,
    'Ambiental': filterByTheme(['biologia', 'natureza']),
    'Física': filterByTheme(['física']),
    'Sociologia': filterByTheme(['sociologia']),
    'Filosofia': filterByTheme(['filosofia']),
    'Ecologia': filterByTheme(['biologia']),
    'Fisiologia': filterByTheme(['biologia']),
    'Eletricidade': filterByTheme(['física']),
    'Ondas': filterByTheme(['física']),
    'Termologia': filterByTheme(['física']),
    'Físico-Química': filterByTheme(['química']),
    'Orgânica': filterByTheme(['química']),
    'Geometria': filterByTheme(['matemática']),
    'Básica': filterByTheme(['matemática']),
    'Estatística': filterByTheme(['matemática']),
    'Álgebra': filterByTheme(['matemática']),
    'Mundial': filterByTheme(['geografia'])
};
