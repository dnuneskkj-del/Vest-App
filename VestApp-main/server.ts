import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
import { OFFICIAL_QUESTIONS } from "./src/data/officialQuestions";

dotenv.config();

// Prepare uploads directory in fully writable /tmp directory
const uploadDir = path.join("/tmp", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Config Multer for storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

  const upload = multer({
  storage: storage
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100000mb' }));
  app.use(express.urlencoded({ limit: '100000mb', extended: true }));

  // Expose the uploads directory statically
  app.use("/uploads", express.static(uploadDir));

  // REST API Route for file uploading
  app.post("/api/upload", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Erro no middleware do multer:", err);
        return res.status(500).json({ error: "Erro no multer: " + (err.message || String(err)) });
      }
      next();
    });
  }, (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo de mídia recebido pelo servidor." });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error: any) {
      console.error("Erro pós-processamento de arquivo:", error);
      res.status(500).json({ error: error.message || "Erro de pós-processamento." });
    }
  });

  // API Route for generating schedule
    app.post("/api/generate-schedule", async (req, res) => {
    try {
      const { subjects, hoursPerDay, focusAreas, examDate } = req.body;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Configuração do servidor incompleta. Por favor, selecione uma Chave API no painel Settings > Secrets (variável GEMINI_API_KEY)." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Gere um cronograma de estudos semanal personalizado para o ENEM.
      Preferências do aluno:
      - Matérias: ${subjects?.join(', ') || 'Geral'}
      - Horas por dia: ${hoursPerDay || 4}h
      - Áreas de foco: ${focusAreas?.join(', ') || 'Nenhuma'}
      ${examDate ? `- Data do exame: ${examDate}` : ''}

      O cronograma deve ser equilibrado, incluindo revisões e pausas. 
      Retorne um array de 7 dias (Segunda a Domingo).
      Cada dia deve ter um array de tarefas com 'time', 'subject', 'topic' e 'duration'.
      A duração total de estudo por dia não deve exceder ${hoursPerDay || 4} horas.
      
      Retorne APENAS o JSON no formato:
      [
        {
          "day": "Segunda-feira",
          "tasks": [
            { "time": "08:00", "subject": "Matemática", "topic": "Álgebra", "duration": "1h", "completed": false }
          ]
        },
        ...
      ]`;

      console.log("Calling Gemini API...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("A IA retornou uma resposta vazia para o cronograma (resposta indefinida). Verifique sua Chave API.");
      }
      console.log("Gemini API raw response:", text);
      
      // Attempt to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      const cleanText = jsonMatch ? jsonMatch[0] : text;
      
      try {
        const schedule = JSON.parse(cleanText);
        console.log("Successfully parsed schedule JSON");
        res.json(schedule);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Clean text attempt:", cleanText);
        res.status(500).json({ error: "O Corvo teve dificuldade em formatar o seu cronograma. Por favor, tente novamente." });
      }
    } catch (error: any) {
      console.error("Error generating schedule:", error);
      
      const errorMessage = error?.message || String(error);
      const is503 = errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("experiencing high demand");
      
      if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API_KEY")) {
        return res.status(500).json({ error: "Erro de permissão na API. Por favor, verifique sua Chave API no painel Settings > Secrets (variável GEMINI_API_KEY)." });
      }
      if (is503) {
        return res.status(503).json({ error: "A inteligência artificial está com alta demanda no momento. Por favor, aguarde alguns minutos e tente novamente." });
      }
      
      res.status(500).json({ error: error instanceof Error ? errorMessage : "Erro interno ao gerar cronograma" });
    }
  });

  // API Route for correcting essay
  app.post("/api/correct-essay", async (req, res) => {
    try {
      const { text, theme, submissionMethod, files, targetExam = 'enem' } = req.body;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Configuração do servidor incompleta. Por favor, adicione sua GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const examUpper = (targetExam || 'enem').toUpperCase().trim();
      let examName = "ENEM (Exame Nacional do Ensino Médio)";
      let scoreRule = "Cada competência só pode receber pontuação múltipla de 40: 0, 40, 80, 120, 160 ou 200 pontos.";
      let competenciesText = `1. Domínio da norma culta da língua escrita.
      2. Compreender a proposta e aplicar conceitos de várias áreas do conhecimento.
      3. Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.
      4. Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão e coerência).
      5. Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.`;

      if (examUpper === 'FUVEST') {
        examName = "FUVEST (USP)";
        scoreRule = "Cada competência deve receber uma pontuação de 0 a 200 (ex: 0, 40, 80, 120, 160, 200).";
        competenciesText = `1. Abordagem do Tema e Leitura Crítica da Proposta (profundidade reflexiva sobre a questão central).
        2. Estrutura Dissertativa, Clareza do Ponto de Vista e Projeto de Texto (projeto autoral e posicionamento crítico).
        3. Seleção, Organização e Articulação de Argumentos, Repertório Cultural e Filosofia/Sociologia aplicada.
        4. Coesão Textual e Recursos Linguísticos de Transição entre períodos e parágrafos.
        5. Domínio da Norma-Padrão da Língua Escrita e Precisão Vocabular (precisão de termos e correção gramatical).`;
      } else if (examUpper === 'UNICAMP') {
        examName = "UNICAMP";
        scoreRule = "Cada competência deve receber uma pontuação de 0 a 200 (ex: 0, 40, 80, 120, 160, 200). Adapte os conselhos ao gênero solicitado.";
        competenciesText = `1. Adequação ao Gênero Textual Exigido (Carta aberta, Artigo de Opinião, Narrativa, Resposta Argumentativa, etc.).
        2. Interlocução, Construção da Voz do Enunciador e Cumprimento do Propósito Comunicativo.
        3. Leitura Crítica da Coletânea de Textos e Aproveitamento Qualitativo Autoral (evitando cópia).
        4. Coerência Lógica, Conteúdo Crítico e Progressão Textual.
        5. Coesão Textual, Recursos Sintáticos e Modalidade Escrita Padrão.`;
      } else if (examUpper === 'UNESP') {
        examName = "UNESP";
        scoreRule = "Cada competência deve receber uma pontuação de 0 a 200 (ex: 0, 40, 80, 120, 160, 200).";
        competenciesText = `1. Abordagem Integral do Tema e Posicionamento sobre o Dilema/Dicotomia Proposta.
        2. Adequação Geral ao Gênero Dissertativo-Argumentativo em Prosa (estrutura, estilo formal).
        3. Coerência dos Argumentos, Seleção Crítica e Uso de Repertórios de Apoio.
        4. Coesão Textual, Conexão de Parágrafos e Fluidez Sintática.
        5. Domínio da Norma Culta da Língua Escrita (ortografia, concordâncias, sintaxe).`;
      } else if (examUpper === 'IFSP') {
        examName = "IFSP";
        scoreRule = "Cada competência deve receber uma pontuação de 0 a 200 (ex: 0, 40, 80, 120, 160, 200).";
        competenciesText = `1. Domínio Prático da Norma Culta e Escrita Formal da Língua Portuguesa (sintaxe, regência, concordância).
        2. Alinhamento Preciso com o Tema Proposto e Aproveitamento Crítico da Coletânea de Apoio.
        3. Estruturação Formal de Textos Dissertativo-Argumentativos (divisão equilibrada em introdução, desenvolvimento e conclusão).
        4. Coesão, Uso de Conectivos e Progressão de Parágrafos.
        5. Consistência Argumentativa, Clareza das Ideias e Construção de Autoria.`;
      }

      let contents: any[] = [];

      if (submissionMethod === 'digital') {
        const prompt = `Você é um corretor oficial experiente de redação de grandes vestibulares, especializado no exame ${examName}. 
        Analise a redação abaixo sobre o tema: "${theme}".
        
        Siga RIGOROSAMENTE estes 5 critérios de avaliação referentes ao exame ${examName}:
        ${competenciesText}

        Sua resposta deve conter APENAS o JSON. NÃO utilize blocos de código markdown (como \`\`\`json). NÃO inclua explicações antes ou depois. O formato deve ser estritamente:
        {
          "totalScore": número (0-1000),
          "competencies": [
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência I" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência II" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência III" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência IV" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência V" }
          ],
          "generalFeedback": "Texto detalhado sobre o desempenho geral e análise crítica da redação em relação às exigências do ${examName}.",
          "strengths": ["Ponto forte 1", "Ponto forte 2"],
          "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
          "improvements": ["Sugestão prática de melhoria 1", "Sugestão prática de melhoria 2"]
        }

        REGRA DE OURO PARA COMPUTAÇÃO DE NOTAS:
        1. O valor de "totalScore" deve ser rigorosamente a soma exata das notas das 5 competências (score de competencies[0] + competencies[1] + competencies[2] + competencies[3] + competencies[4]).
        2. ${scoreRule}
        
        REDAÇÃO:
        ${text}`;

        contents = [{ role: 'user', parts: [{ text: prompt }] }];
      } else {
        const prompt = `Você é um corretor oficial experiente de redação do exame ${examName}. Analise as imagens da redação anexadas sobre o tema: "${theme}". 
        Extraia o texto das imagens e avalie com base nos 5 critérios de avaliação do exame ${examName}.
        
        Siga RIGOROSAMENTE estes 5 critérios de avaliação referentes ao exame ${examName}:
        ${competenciesText}

        Sua resposta deve conter APENAS o JSON. NÃO utilize blocos de código markdown (como \`\`\`json). NÃO inclua explicações antes ou depois. O formato deve ser estritamente:
        {
          "totalScore": número (0-1000),
          "competencies": [
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência I" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência II" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência III" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência IV" },
            { "score": número (0-200), "feedback": "detalhado feedback para o Critério/Competência V" }
          ],
          "generalFeedback": "Texto detalhado sobre o desempenho geral e análise crítica da redação em relação às exigências do ${examName}.",
          "strengths": ["Ponto forte 1", "Ponto forte 2"],
          "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
          "improvements": ["Sugestão prática de melhoria 1", "Sugestão prática de melhoria 2"]
        }

        REGRA DE OURO PARA COMPUTAÇÃO DE NOTAS:
        1. O valor de "totalScore" deve ser rigorosamente a soma exata das notas das 5 competências (score de competencies[0] + competencies[1] + competencies[2] + competencies[3] + competencies[4]).
        2. ${scoreRule}`;
        
        const fileParts = files.map((file: any) => {
            let base64Data = file.data;
            let actualMimeType = file.mimeType || 'image/jpeg';
            
            if (file.data.includes('base64,')) {
                base64Data = file.data.split('base64,')[1];
                const match = file.data.match(/^data:([^;]+);base64,/);
                if (match && match[1]) {
                    actualMimeType = match[1];
                }
            }
            
            // Provide a graceful fallback for unmapped mime types if needed, though Gemini accepts many.
            return {
                inlineData: {
                    mimeType: actualMimeType,
                    data: base64Data
                }
            };
        });

        contents = [{ role: 'user', parts: [{ text: prompt }, ...fileParts] }];
      }

      console.log(`Calling Gemini for Essay Correction. Method: ${submissionMethod}, Exam: ${targetExam || 'enem'}, Theme: ${theme}`);
      const keySnippet = apiKey ? `Present (ends with ${apiKey.substring(apiKey.length - 4)})` : "Missing";
      console.log(`API Key status: ${keySnippet}`);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("A IA retornou uma resposta vazia para a correção (resposta indefinida). Verifique sua Chave API.");
      }
      
      console.log("Gemini response received (length):", responseText.length);
      
      // Robust JSON sanitization
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      
      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
      
      try {
        const evaluation = JSON.parse(cleanJson);
        res.json(evaluation);
      } catch (e: any) {
        console.error("Parse error of Gemini response. Raw response was:", responseText);
        console.error("Parser exception:", e);
        res.status(500).json({ error: `Erro ao processar a correção da IA. Formato de resposta inválido: ${e.message}` });
      }
    } catch (error: any) {
      console.error("General error in correct-essay:", error);
      const errorMessage = error?.message || String(error);
      const is503 = errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("experiencing high demand");

      if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API_KEY")) {
        return res.status(500).json({ error: "Erro de permissão na API da IA. Verifique se adicionou sua Chave API no painel Settings > Secrets (variável GEMINI_API_KEY)." });
      }
      if (is503) {
        return res.status(503).json({ error: "A inteligência artificial está com alta demanda no momento. Por favor, aguarde alguns minutos e tente novamente." });
      }
      res.status(500).json({ error: `Erro na correção da redação: ${errorMessage}` });
    }
  });

  // API Route for interactive schedule chat
  app.post("/api/chat-schedule", async (req, res) => {
    try {
      const { messages } = req.body;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Configuração do servidor incompleta. Por favor, adicione sua GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const systemInstruction = `Você é um consultor de estudos especializado em vestibulares brasileiros (ENEM, FUVEST, UNICAMP, etc.). 
      Seu objetivo é criar um Cronograma de Estudos Inteligente e personalizado.
      
      Siga rigorosamente estas etapas na interação:
      1. Coleta de Dados: Peça ao usuário:
         - Rotina diária completa (horários de trabalho, escola, sono e blocos livres).
         - Quais vestibulares ele vai prestar (ex: ENEM, FUVEST).
         - A data da prova (se ele não souber, use datas estimadas: ENEM em Novembro, FUVEST em Dezembro).
      
      2. Lógica de Cálculo:
         - Calcule quantos dias e semanas faltam até a prova. Exiba isso na sua análise.
         - Com base no tempo restante e na rotina, defina a carga horária ideal.
      
      3. Geração do Plano:
         - Quando tiver dados suficientes, entregue uma análise motivadora e um bloco de código JSON estruturado.
         - O plano deve ser dividido por dias da semana, equilibrando as matérias do vestibular escolhido.
      
      IMPORTANTE: O cronograma em JSON é essencial para a interface. Use EXATAMENTE este formato:
      \`\`\`json
      {
        "type": "study_plan",
        "analysis": "Calculamos que faltam X semanas para sua prova. Dado que seu foco é [Vestibular], sua rotina de [Y] horas por dia será...",
        "targetExam": "ENEM",
        "daysRemaining": 120,
        "weeksRemaining": 17,
        "schedule": [
          {
            "day": "Segunda-feira",
            "tasks": [
              { "time": "14:00", "subject": "Matemática", "topic": "Logaritmos", "duration": "1h 30min" },
              { "time": "16:00", "subject": "Redação", "topic": "Prática de Texto", "duration": "1h" }
            ]
          }
        ]
      }
      \`\`\`
      
      Seja empático e use uma linguagem que incentive o estudante.`;

      console.log("Calling Gemini for Schedule Chat...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: messages,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in chat-schedule:", error);
      res.status(500).json({ error: error.message || "Erro no chat do cronograma" });
    }
  });

  // API Route for generating explanation and examples for a subtopic
  app.post("/api/generate-explanation", async (req, res) => {
    try {
      const { area, subtopic } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Configuração do servidor incompleta. Por favor, adicione sua GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Você é um professor renomado de cursinhos preparatórios de elite (ENEM, FUVEST, UNICAMP).
      Explique de forma clara, didática e direta o assunto: "${subtopic}" dentro da área de "${area}".
      
      GERE APENAS CONTEÚDO NOVO, ÚNICO E IMPREVISÍVEL. NUNCA REPITA QUESTÕES DE SOLICITAÇÕES ANTERIORES.

      RETORNE APENAS UM JSON VÁLIDO COM O SEGUINTE FORMATO:
      {
        "comicPanels": [
          { "speaker": "Professor", "text": "..." },
          { "speaker": "Estudante", "text": "..." }
        ],
        "exercicios": [
          { "pergunta": "...", "opcoes": ["A", "B", "C", "D", "E"], "respostaCorreta": 0, "explicacao": "..." }
        ]
      }
      
      NÃO UTILIZE MARKDOWN, NÃO UTILIZE \`\`\`json. APENAS O JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text || "{}";
      let explanation;
      try {
        explanation = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error("JSON Parse Error:", text);
        explanation = { introducao: "Erro ao gerar explicação.", conceitosChave: [], exemplos: [], dicaMestre: "Tente novamente." };
      }

      res.json({ explanation });
    } catch (error: any) {
      console.error("Error generating explanation:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar explicação" });
    }
  });

  // API Route for fetching official multiple-choice questions
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { area, subtopic, limit = 10, isMockExam = false, categoriesIncluded = [], mode = "local" } = req.body;
      
      console.log(`Generating questions requested: Area: ${area}, Subtopic: ${subtopic}, Limit: ${limit}, Mode: ${mode}`);
      
      const targetLimit = Math.min(200, Math.max(1, Number(limit)));
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      // 1. If mode is "ai", try to generate from Gemini AI first
      if (mode === "ai" && apiKey) {
        try {
          const ai = new GoogleGenAI({ 
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          
          const prompt = `Você é um curador e professor de cursinhos preparatórios de elite brasileira (como Poliedro, Bernoulli, Anglo, Objetivo).
Gere exatamente ${targetLimit} questões inéditas baseadas em questões clássicas e antigas de grandes vestibulares (ENEM, FUVEST, UNICAMP, UNESP). Para a área de "${area || "Geral"}" e o tema/subtópico "${subtopic || "Geral"}". EVITE REPETIÇÕES A QUALQUER CUSTO. 
Baseie-se na estrutura e nível de exigência de questões de anos anteriores para criá-las. Se a questão original depender de uma tirinha, imagem, gráfico, mapa, poema ou texto, crie uma transcrição descritiva, traga um texto de apoio equivalente ou recrie o contexto textualmente do seu jeito. Mantenha as transcrições e os textos curtos e objetivos (máximo 4 linhas) para que a geração seja bem rápida.

Requisitos fundamentais para as questões:
1. Cada questão deve possuir um texto de apoio ou descrição textual curta (para substituir imagens/gráficos).
2. O enunciado deve cobrar habilidade analítica avançada e raciocínio crítico.
3. Deve ter exatamente 5 alternativas (A, B, C, D, E) no array de "options" curtas.
4. Defina o campo "correct" como o índice correto de 0 a 4.
5. Forneça uma justificativa/resolução rápida e objetiva no campo "explanation" (máximo 2 linhas).
6. Retorne estritamente um array de objetos JSON válidos conforme o schema.

Formato esperado (EXCLUSIVAMENTE em JSON que possa ser parsed diretamente):
[
  {
    "id": 50000,
    "area": "${area || "Geral"}",
    "subtopic": "${subtopic || "Geral"}",
    "text": "Enunciado rico com texto de apoio...",
    "options": [
      "Alternativa A",
      "Alternativa B",
      "Alternativa C",
      "Alternativa D",
      "Alternativa E"
    ],
    "correct": 2,
    "explanation": "Explicação passo a passo por que a alternativa C está certa...",
    "origin": "IA VestApp",
    "year": "2026"
  }
]`;

          console.log(`Calling Gemini (gemini-1.5-flash) to generate ${targetLimit} questions...`);
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
            }
          });

          const rawText = response.text;
          if (rawText) {
            const jsonMatch = rawText.match(/\[[\s\S]*\]/) || rawText.match(/\{[\s\S]*\}/);
            const cleanText = jsonMatch ? jsonMatch[0] : rawText;
            const aiQuestions = JSON.parse(cleanText);
            
            if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
              const formattedList = aiQuestions.map((q, idx) => ({
                id: 50000 + idx + Math.floor(Math.random() * 10000),
                area: q.area || area || "Geral",
                subtopic: q.subtopic || subtopic || "Geral",
                text: q.text,
                options: q.options || [],
                correct: typeof q.correct === 'number' ? q.correct : 0,
                explanation: q.explanation || "Resolução via Inteligência Artificial.",
                origin: q.origin || "IA VestApp",
                year: q.year || "2026"
              }));
              
              console.log(`Success! Generated ${formattedList.length} questions from Gemini.`);
              return res.json(formattedList);
            }
          }
        } catch (aiError) {
          console.error("Failed to generate questions via Gemini, falling back to local pool:", aiError);
        }
      }

      // 2. Local Fallback / Standard mode (Local Database Mode)
      let filteredPool = OFFICIAL_QUESTIONS;

      if (isMockExam && categoriesIncluded && categoriesIncluded.length > 0) {
        filteredPool = OFFICIAL_QUESTIONS.filter(q => {
          const qArea = (q.area || "").toLowerCase();
          const qSub = (q.subtopic || "").toLowerCase();
          return categoriesIncluded.some((cat: string) => {
            const cleanCat = cat.toLowerCase().trim();
            return qArea.includes(cleanCat) || qSub.includes(cleanCat) || cleanCat.includes(qArea) || cleanCat.includes(qSub) || (q.origin || "").toLowerCase().includes(cleanCat);
          });
        });
      } else if (area || subtopic) {
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

        filteredPool = OFFICIAL_QUESTIONS.filter(q => {
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

        if (filteredPool.length === 0 && targetArea) {
          filteredPool = OFFICIAL_QUESTIONS.filter(q => (q.area || "").toLowerCase() === targetArea.toLowerCase());
        }
      }

      // 3. Fallback: If no matches were found in filteredPool, expand search or use whole pool so it never fails!
      let shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
      if (shuffled.length === 0) {
        // Fall back to matching only area if possible
        if (area) {
          const cleanArea = area.replace(/^\d+\.\s*/, "").toLowerCase().trim();
          shuffled = OFFICIAL_QUESTIONS.filter(q => q.area && q.area.toLowerCase().includes(cleanArea)).sort(() => Math.random() - 0.5);
        }
        if (shuffled.length === 0) {
          shuffled = [...OFFICIAL_QUESTIONS].sort(() => Math.random() - 0.5);
        }
      }
      
      const result: any[] = [];
      for (let i = 0; i < targetLimit; i++) {
        const item = shuffled[i % shuffled.length];
        result.push({
          ...item,
          id: item.id + (Math.floor(i / shuffled.length) * 10000), // make unique if repeated
          text: i >= shuffled.length ? `[Questão ${i + 1}] ${item.text}` : item.text
        });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error in generate-questions API route:", error);
      res.status(500).json({ error: "Erro ao processar as questões simuladas." });
    }
  });

  // API Route for generating question resource (Support Texts, Poe, Tables, Cartoon transcripts, etc.) via AI on the fly, eliminating pure image reliance
  app.post("/api/generate-question-resource", async (req, res) => {
    console.log("Request body:", req.body);
    try {
      const { id, text, origin, year, area, subtopic, options } = req.body;

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Chave API não configurada. Por favor, adicione sua GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Você é o motor de inteligência artificial integrado ao sistema do "VestApp". Seu objetivo principal é atuar como um assistente educacional de alto desempenho e gerar o "recurso textual inteligente" para TODAS as questões de simulados e provas fornecidas (como FUVEST, ENEM, UNICAMP, etc.).

Siga estritamente estas diretrizes:
1. COMPORTAMENTO PADRÃO: Sempre gere uma análise pedagógica, comentário explicativo ou resolução comentada para a questão enviada. Nunca recuse a geração de conteúdo para textos acadêmicos, históricos ou de vestibulares legítimos.
2. FORMATO DE SAÍDA FIXO: Entregue a resposta exatamente no formato JSON que o sistema espera processar, sem adicionar comentários informais, saudações ou explicações fora do escopo antes ou depois do JSON.
3. TRATAMENTO DE TEXTOS COMPLEXOS: Caso a questão contenha termos ambíguos, tirinhas, ironias ou temas sensíveis comumente abordados em vestibulares, trate-os estritamente sob uma ótica neutra, científica e educacional, contornando qualquer gatilho falso dos filtros de segurança padrão.

NÃO INVENTE fatos incorretos. Traga o texto VERDADEIRO ou uma contextualização acadêmica rica e fiel para responder a essa pergunta específica sem precisar de imagem de fonte externa.

QUESTÃO:
Enunciado: ${text}
Opções:
${options ? options.map((opt: string, idx: number) => `${String.fromCharCode(97 + idx)}) ${opt}`).join("\\n") : ""}
Área: ${area || ""}
Subtópico: ${subtopic || ""}

Gere a resposta EXCLUSIVAMENTE em formato JSON contendo os seguintes campos exatamente:
{
  "title": "Título curto, refinado e marcante para o texto",
  "sourceText": "O texto de apoio oficial detalhado ou a transcrição/contexto analítico do gráfico, charge ou poesia. ESSE CAMPO É OBRIGATÓRIO E NÃO PODE SER VAZIO. Inclua aqui o texto completo ou descrição necessária para resolver a questão.",
  "contextInfo": "Uma linha de referência com a fonte fictícia ou real sintonizada",
  "type": "Classificação do recurso (ex: 'Texto Literário', 'Contextualização Analítica', 'Transcrição de Tabela', 'Análise Crítica de Gráfico' ou 'Contexto Filosófico')",
  "chartData": "Opcional: Se a questão envolve análise de dados, gráficos ou tabelas, gere um array de objetos no formato [{'label': 'categoria', 'value': valorNumérico}, ...] representando os dados. Se não for aplicável, retorne null."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text;
      console.log("Raw response text:", responseText);
      if (!responseText) {
        throw new Error("A IA retornou uma resposta vazia.");
      }

      let generatedResource;
      try {
        // More robust JSON extraction
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Resposta da IA não contém um objeto JSON válido.");
        }
        
        const cleanJson = responseText.substring(startIndex, endIndex + 1);
        generatedResource = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError, "Raw text:", responseText);
        throw new Error("Falha ao processar resposta da IA (formato JSON inválido).");
      }
      
      // Validate expected structure
      if (!generatedResource.sourceText) {
          console.error("Invalid resource generated (missing sourceText):", generatedResource);
          throw new Error("A IA gerou um recurso incompleto (sem texto de apoio).");
      }
      
      res.json(generatedResource);

    } catch (error: any) {
      console.error("Error generating question resource:", error);
      res.status(500).json({ error: "Falha ao gerar o recurso textual inteligente da questão.", details: error.message || error.toString() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Express global error:', err);
    res.status(500).json({ error: 'Erro interno no servidor: ' + err.message });
  });

  if (process.env.VERCEL) {
    return app;
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  return app;
}

const appPromise = startServer();
export default appPromise;
