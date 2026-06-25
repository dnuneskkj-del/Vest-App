import { OFFICIAL_QUESTIONS } from './officialQuestions';

export interface SimulationQuestion {
    id: number;
    text: string;
    imageUrl?: string;
    options: string[];
    correct: number;
    explanation: string;
    origin: string;
}

export interface SimulationExam {
    id: number;
    questions: SimulationQuestion[];
}

// Map official questions back to the simulation format if needed, 
// using category IDs that correspond to the UI expectations.
const getQuestionsForCategory = (categoryName: string, officialQuestions = OFFICIAL_QUESTIONS) => {
    return officialQuestions
        .filter(q => q.area.toLowerCase().includes(categoryName.toLowerCase()))
        .map(q => ({
            id: q.id,
            text: q.text,
            imageUrl: q.imageUrl,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            origin: q.origin
        }));
};

export const SIMULADOS_QUESTIONS: Record<number, SimulationQuestion[]> = {
    1: getQuestionsForCategory('linguagens'),
    2: getQuestionsForCategory('matemática'),
    7: getQuestionsForCategory('história'),
    8: getQuestionsForCategory('biologia'),
    14: getQuestionsForCategory('inglês'),
    15: getQuestionsForCategory('matemática'), // Geometria
    16: getQuestionsForCategory('geografia'),
    17: getQuestionsForCategory('química'),
    18: getQuestionsForCategory('física'),
    19: getQuestionsForCategory('sociologia'),
    3: getQuestionsForCategory('matemática'), // Geometria Espacial
    4: getQuestionsForCategory('biologia'),   // Biologia Celular
    5: getQuestionsForCategory('física'),     // Física Moderna
    6: getQuestionsForCategory('química'),    // Química Orgânica
    9: getQuestionsForCategory('linguagens')  // Literatura
};
