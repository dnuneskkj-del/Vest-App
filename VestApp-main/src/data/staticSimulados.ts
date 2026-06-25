// PHYSICAL_SAVE_VERIFIED: 2026-06-21
export interface StaticAlternative {
  id: string;
  text: string;
}

export interface StaticQuestion {
  id: number;
  vestibular: string;
  materia: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  categoria: string; // ex: 'Humanas', 'Exatas', 'Biológicas'
  enunciado: string;
  url_imagem?: string;
  accessibilityText?: string;
  chartData?: { label: string; value: number }[];
  alternativas: StaticAlternative[];
  correctAnswer: string;
  explanation: string;
}

export const STATIC_SIMULADOS: StaticQuestion[] = [
  {
    id: 1,
    vestibular: "FUVEST 2021",
    materia: "Português",
    dificuldade: "facil",
    categoria: "Linguagens",
    enunciado: "Examine a descrição da tirinha do Calvin e o texto sobre estratégias de marketing de automóveis. O carro mostrado com toda pompa em propagandas costuma valer alguns milhares de reais a mais do que o preço explicitamente anunciado. O título do texto 'Brincando de esconde-esconde' se aplica à tirinha na medida em que a estratégia de marketing:",
    alternativas: [
      { id: "A", text: "Revela de forma explícita todos os custos ocultos do produto desde o primeiro momento." },
      { id: "B", text: "Esconde o preço real por trás de restrições das versões de entrada, assim como o humor da tirinha brinca com omissões e expectativas." },
      { id: "C", text: "Visa unicamente a distribution gratuita de bens de consumo para a população infantil." },
      { id: "D", text: "Desconsidera o uso de personagens ilustrados e tirinhas para a criação de campanhas visuais." },
      { id: "E", text: "Baseia-se na transparência absoluta dos valores exibidos nas campanhas de televisão." }
    ],
    correctAnswer: "B",
    explanation: "A alternativa B é a correta. A tirinha do Calvin brinca com a omissão de informações para obter uma vantagem ou resposta desejada, o que conversa diretamente com o título 'Brincando de esconde-esconde'."
  },
  {
    id: 2,
    vestibular: "UNICAMP 2021",
    materia: "Física",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "Um atleta de salto em altura, de massa m = 70 kg, consegue ultrapassar o sarrafo a uma altura h = 2,1 m. Considere que, no momento do salto, o centro de massa do atleta se eleva de uma altura H = 1,4 m. A energia cinética mínima que o atleta deve ter no momento do salto é (considere g = 10 m/s^2):",
    alternativas: [
      { id: "A", text: "980 J." },
      { id: "B", text: "1470 J." },
      { id: "C", text: "490 J." },
      { id: "D", text: "700 J." },
      { id: "E", text: "2100 J." }
    ],
    correctAnswer: "A",
    explanation: "A energia cinética mínima necessária é igual à variação da energia potencial gravitacional (E = mgh). E = 70 * 10 * 1.4 = 980 J."
  },
  {
    id: 3,
    vestibular: "ENEM 2024",
    materia: "Linguagens",
    dificuldade: "medio",
    categoria: "Linguagens",
    enunciado: "A relação estabelecida entre a linguagem verbal e não verbal nos quadrinhos da Laerte constrói o sentido do texto por meio de:",
    alternativas: [
      { id: "A", text: "Uma ironia fina sobre o cotidiano urbano e as percepções visuais dos personagens." },
      { id: "B", text: "Uma contradição intencional entre o que é falado e a expressão geométrica dos elementos." },
      { id: "C", text: "Um apelo focado exclusivamente no público infantil sem critérios de crítica social." },
      { id: "D", text: "Um uso redundante de adjetivos que poluem a compreensão da tirinha." },
      { id: "E", text: "Um foco técnico sobre o daltonismo sem correlação com o humor dos quadrinhos." }
    ],
    correctAnswer: "A",
    explanation: "A obra de Laerte utiliza o contraste sutil entre as falas cotidianas e o comportamento visual dos personagens para construir uma crítica e uma ironia urbana."
  },
  {
    id: 4,
    vestibular: "ENEM 2023",
    materia: "Matemática",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "(ENEM 2023) O gráfico a seguir apresenta a evolução das exportações de soja do Brasil para a China entre os anos de 2012 e 2021 (em milhões de toneladas). De acordo com o gráfico, em qual ano houve a maior variação absoluta positiva no volume de exportações em relação ao ano anterior?",
    chartData: [
      { label: "2016", value: 38.6 },
      { label: "2017", value: 53.8 },
      { label: "2018", value: 66.1 }
    ],
    alternativas: [
      { id: "A", text: "2013" },
      { id: "B", text: "2015" },
      { id: "C", text: "2017" },
      { id: "D", text: "2018" },
      { id: "E", text: "2020" }
    ],
    correctAnswer: "C",
    explanation: "O salto em 2017 (53,8) em relação a 2016 (38,6) foi de +15,2, a maior variação do período."
  },
  {
    id: 5,
    vestibular: "UNESP 2022",
    materia: "Biologia",
    dificuldade: "facil",
    categoria: "Biológicas",
    enunciado: "O processo de respiração celular aeróbica ocorre em três etapas principais. Identifique a etapa que ocorre no citosol da célula:",
    alternativas: [
      { id: "A", text: "Cadeia Respiratória" },
      { id: "B", text: "Ciclo de Krebs" },
      { id: "C", text: "Glicólise" },
      { id: "D", text: "Fotólise da água" },
      { id: "E", text: "Fermentação Lática" }
    ],
    correctAnswer: "C",
    explanation: "A glicólise é a única etapa da respiração aeróbica que ocorre inteiramente no citosol, antes da entrada dos produtos na mitocôndria."
  },
  {
    id: 6,
    vestibular: "FUVEST 2023",
    materia: "Química",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Qual das misturas abaixo constitui um sistema heterogêneo bifásico?",
    alternativas: [
      { id: "A", text: "Água e sal de cozinha totalmente dissolvido" },
      { id: "B", text: "Água e óleo" },
      { id: "C", text: "Ar atmosférico filtrado" },
      { id: "D", text: "Água e álcool" },
      { id: "E", text: "Liga metálica de bronze" }
    ],
    correctAnswer: "B",
    explanation: "Água e óleo são imiscíveis, formando duas fases distintas, caracterizando um sistema heterogêneo bifásico."
  },
  {
    id: 7,
    vestibular: "ENEM 2022",
    materia: "História",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "O período da História do Brasil conhecido como 'Era Vargas' (1930-1945) foi marcado por intensas transformações. Qual característica define o 'Estado Novo'?",
    alternativas: [
      { id: "A", text: "Democratização plena com voto feminino garantido e eleições livres." },
      { id: "B", text: "Regime autoritário, centralização do poder e censura através do DIP." },
      { id: "C", text: "Alinhamento total com o bloco soviético durante a Guerra Fria." },
      { id: "D", text: "Ausência total de leis trabalhistas e incentivo apenas ao agronegócio." },
      { id: "E", text: "Monarquia constitucional com Vargas como imperador regente." }
    ],
    correctAnswer: "B",
    explanation: "O Estado Novo (1937-1945) foi a fase ditatorial de Getúlio Vargas, caracterizada pelo autoritarismo e controle da informação."
  },
  {
    id: 8,
    vestibular: "FUVEST 2020",
    materia: "Geografia",
    dificuldade: "dificil",
    categoria: "Humanas",
    enunciado: "Sobre a estrutura geológica do Brasil, é correto afirmar que:",
    alternativas: [
      { id: "A", text: "O território brasileiro situa-se no centro de uma placa tectônica, o que justifica a ausência de grandes cordilheiras modernas." },
      { id: "B", text: "O Brasil possui extensas áreas de dobramentos modernos ativos, resultando em frequentes terremotos de grande magnitude." },
      { id: "C", text: "A maior parte do relevo brasileiro formou-se durante a era Cenozoica, sendo geologicamente muito jovem." },
      { id: "D", text: "Os escudos cristalinos, ricos em minerais metálicos, ocupam a totalidade das bacias sedimentares do país." },
      { id: "E", text: "O Brasil não possui recursos minerais de origem fóssil, como petróleo ou carvão." }
    ],
    correctAnswer: "A",
    explanation: "O Brasil está localizado no centro da Placa Sul-Americana, o que lhe confere estabilidade geológica e ausência de dobramentos modernos."
  },
  {
    id: 9,
    vestibular: "UNICAMP 2023",
    materia: "Literatura",
    dificuldade: "dificil",
    categoria: "Linguagens",
    enunciado: "Em 'Dom Casmurro', de Machado de Assis, a técnica narrativa de Bento Santiago (Bentinho) caracteriza-se por:",
    alternativas: [
      { id: "A", text: "Uma objetividade científica, típica do Naturalismo, que prova a traição de Capitu." },
      { id: "B", text: "Um narrador onisciente que revela os pensamentos íntimos de todos os personagens." },
      { id: "C", text: "Uma narrativa em primeira pessoa marcada pela ambiguidade e pela tentativa de convencer o leitor de sua versão dos fatos." },
      { id: "D", text: "Um foco narrativo focado apenas nos diálogos, sem descrições psicológicas." },
      { id: "E", text: "Ser uma autobiografia real do autor escondida sob um pseudônimo." }
    ],
    correctAnswer: "C",
    explanation: "Bento Santiago é um narrador pouco confiável, que reconstrói suas memórias de forma a justificar seu ciúme retrospectivo."
  },
  {
    id: 10,
    vestibular: "UFRGS 2021",
    materia: "Matemática",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "A soma dos ângulos internos de um hexágono regular é:",
    alternativas: [
      { id: "A", text: "360°" },
      { id: "B", text: "540°" },
      { id: "C", text: "720°" },
      { id: "D", text: "900°" },
      { id: "E", text: "1080°" }
    ],
    correctAnswer: "C",
    explanation: "A fórmula é S = (n - 2) * 180. Para um hexágono (n=6), S = (6 - 2) * 180 = 4 * 180 = 720°."
  },
  {
    id: 11,
    vestibular: "OBMEP 2023",
    materia: "Matemática",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Se x + y = 10 e xy = 21, qual o valor de x^2 + y^2?",
    alternativas: [
      { id: "A", text: "58" },
      { id: "B", text: "79" },
      { id: "C", text: "100" },
      { id: "D", text: "42" },
      { id: "E", text: "31" }
    ],
    correctAnswer: "A",
    explanation: "(x + y)^2 = x^2 + 2xy + y^2. 10^2 = x^2 + y^2 + 2(21) => 100 = x^2 + y^2 + 42 => x^2 + y^2 = 58."
  },
  {
    id: 12,
    vestibular: "ENEM 2021",
    materia: "Biologia",
    dificuldade: "medio",
    categoria: "Biológicas",
    enunciado: "A vacina de mRNA, como as utilizadas contra a COVID-19, funciona instruindo as células do corpo a produzirem:",
    alternativas: [
      { id: "A", text: "O vírus inteiro em sua forma enfraquecida." },
      { id: "B", text: "Antibióticos naturais que matam o vírus imediatamente." },
      { id: "C", text: "Uma proteína específica do vírus (proteína spike) que estimula o sistema imune." },
      { id: "D", text: "Glóbulos brancos sintéticos que circulam no sangue." },
      { id: "E", text: "Venenos que impedem a entrada do vírus nas células pulmonares." }
    ],
    correctAnswer: "C",
    explanation: "As vacinas de mRNA fornecem o código genético para que as células do próprio indivíduo produzam a proteína spike, reconhecida pelo sistema imune como invasora."
  },
  {
    id: 13,
    vestibular: "FUVEST 2022",
    materia: "Português",
    dificuldade: "facil",
    categoria: "Linguagens",
    enunciado: "Assinale a alternativa em que a palavra destacada é um adjetivo:",
    alternativas: [
      { id: "A", text: "Ele fala *muito*." },
      { id: "B", text: "O dia está *belo*." },
      { id: "C", text: "Eu *estudei* para a prova." },
      { id: "D", text: "Os alunos *correram*." },
      { id: "E", text: "*Ontem* choveu." }
    ],
    correctAnswer: "B",
    explanation: "'Belo' qualifica o substantivo 'dia', sendo, portanto, um adjetivo."
  },
  {
    id: 14,
    vestibular: "UNICAMP 2022",
    materia: "Física",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Um raio de luz incide em um espelho plano com um ângulo de 30° em relação à normal. Qual o ângulo de reflexão?",
    alternativas: [
      { id: "A", text: "15°" },
      { id: "B", text: "30°" },
      { id: "C", text: "60°" },
      { id: "D", text: "90°" },
      { id: "E", text: "45°" }
    ],
    correctAnswer: "B",
    explanation: "Na reflexão em espelhos planos, o ângulo de incidência é sempre igual ao ângulo de reflexão em relação à normal."
  },
  {
    id: 15,
    vestibular: "ENEM 2020",
    materia: "Química",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "O pH de uma solução neutra a 25°C é:",
    alternativas: [
      { id: "A", text: "0" },
      { id: "B", text: "1" },
      { id: "C", text: "7" },
      { id: "D", text: "14" },
      { id: "E", text: "10" }
    ],
    correctAnswer: "C",
    explanation: "O valor 7 na escala de pH representa a neutralidade absoluta para soluções aquosas a 25°C."
  },
  {
    id: 16,
    vestibular: "UNESP 2021",
    materia: "História",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "A Revolução Francesa teve como um de seus marcos a Queda da Bastilha. Este evento simbolizou:",
    alternativas: [
      { id: "A", text: "O início da hegemonia napoleônica na Europa." },
      { id: "B", text: "O fim do absolutismo monárquico e do poder arbitrário do rei." },
      { id: "C", text: "A vitória francesa sobre as tropas inglesas na América." },
      { id: "D", text: "O restabelecimento da paz entre a Igreja e o Estado." },
      { id: "E", text: "A assinatura do Tratado de Versalhes." }
    ],
    correctAnswer: "B",
    explanation: "A Bastilha era uma prisão política e símbolo do poder real absolutista. Sua queda simboliza a derrocada do Antigo Regime."
  },
  {
    id: 17,
    vestibular: "FUVEST 2019",
    materia: "Geografia",
    dificuldade: "dificil",
    categoria: "Humanas",
    enunciado: "O fenômeno do El Niño caracteriza-se por:",
    alternativas: [
      { id: "A", text: "Resfriamento anômalo das águas do Oceano Atlântico Norte." },
      { id: "B", text: "Aquecimento anômalo das águas superficiais do Oceano Pacífico Equatorial." },
      { id: "C", text: "Aumento da intensidade dos ventos alísios em direção à Austrália." },
      { id: "D", text: "Redução total das chuvas na região Sul do Brasil." },
      { id: "E", text: "Congelamento das águas da Antártida durante o verão." }
    ],
    correctAnswer: "B",
    explanation: "O El Niño é o aquecimento cíclico das águas do Pacífico, alterando os padrões globais de circulação atmosférica."
  },
  {
    id: 18,
    vestibular: "UNICAMP 2020",
    materia: "Biologia",
    dificuldade: "dificil",
    categoria: "Biológicas",
    enunciado: "O sistema imunológico humano possui duas linhas de defesa. Os anticorpos são produzidos especificamente pelos:",
    alternativas: [
      { id: "A", text: "Neutrófilos" },
      { id: "B", text: "Macrófagos" },
      { id: "C", text: "Linfócitos B (Plasmócitos)" },
      { id: "D", text: "Plaquetas" },
      { id: "E", text: "Hemácias" }
    ],
    correctAnswer: "C",
    explanation: "Os linfócitos B, ao se diferenciarem em plasmócitos, são os responsáveis pela síntese e secreção de anticorpos."
  },
  {
    id: 19,
    vestibular: "ENEM 1998",
    materia: "Matemática",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "Se um corredor percorre 100 metros em 10 segundos, qual sua velocidade média em km/h?",
    alternativas: [
      { id: "A", text: "10 km/h" },
      { id: "B", text: "20 km/h" },
      { id: "C", text: "36 km/h" },
      { id: "D", text: "40 km/h" },
      { id: "E", text: "100 km/h" }
    ],
    correctAnswer: "C",
    explanation: "100m/10s = 10m/s. Para converter de m/s para km/h, multiplicamos por 3,6. 10 * 3,6 = 36 km/h."
  },
  {
    id: 20,
    vestibular: "ENEM 2023",
    materia: "Física",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Qual a cor resultante da mistura das cores primárias da luz (Verde, Vermelho e Azul)?",
    alternativas: [
      { id: "A", text: "Preto" },
      { id: "B", text: "Marrom" },
      { id: "C", text: "Branco" },
      { id: "D", text: "Cinza" },
      { id: "E", text: "Amarelo" }
    ],
    correctAnswer: "C",
    explanation: "A síntese aditiva das cores primárias da luz (padrão RGB) resulta na luz branca."
  },
  {
    id: 21,
    vestibular: "FUVEST 2022",
    materia: "História",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "A abolição da escravidão no Brasil, em 1888, foi precedida por um longo processo legislativo. Qual lei extinguiu o tráfico negreiro para o Brasil?",
    alternativas: [
      { id: "A", text: "Lei Áurea" },
      { id: "B", text: "Lei Eusébio de Queirós" },
      { id: "C", text: "Lei do Ventre Livre" },
      { id: "D", text: "Lei dos Sexagenários" },
      { id: "E", text: "Lei de Terras" }
    ],
    correctAnswer: "B",
    explanation: "A Lei Eusébio de Queirós (1850) proibiu efetivamente a entrada de novos escravizados no território brasileiro."
  },
  {
    id: 22,
    vestibular: "VUNESP 2023",
    materia: "Biologia",
    dificuldade: "facil",
    categoria: "Biológicas",
    enunciado: "Qual o principal pigmento responsável pela captação de luz durante a fotossíntese nas plantas?",
    alternativas: [
      { id: "A", text: "Hemoglobina" },
      { id: "B", text: "Melanina" },
      { id: "C", text: "Clorofila" },
      { id: "D", text: "Queratina" },
      { id: "E", text: "Caroteno" }
    ],
    correctAnswer: "C",
    explanation: "A clorofila é o pigmento verde que absorve a energia luminosa para a conversão em energia química."
  },
  {
    id: 23,
    vestibular: "ENEM 2022",
    materia: "Matemática",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Se um triângulo retângulo possui catetos de 3cm e 4cm, qual a medida da sua hipotenusa?",
    alternativas: [
      { id: "A", text: "5 cm" },
      { id: "B", text: "6 cm" },
      { id: "C", text: "7 cm" },
      { id: "D", text: "12 cm" },
      { id: "E", text: "25 cm" }
    ],
    correctAnswer: "A",
    explanation: "Pelo Teorema de Pitágoras: a² + b² = c² => 3² + 4² = 9 + 16 = 25. Hipotenusa = sqrt(25) = 5 cm."
  },
  {
    id: 24,
    vestibular: "UNICAMP 2023",
    materia: "Português",
    dificuldade: "dificil",
    categoria: "Linguagens",
    enunciado: "Na frase 'Oxalá chova amanhã', o modo verbal expressa:",
    alternativas: [
      { id: "A", text: "Uma certeza absoluta (Indicativo)." },
      { id: "B", text: "Um desejo ou hipótese (Subjuntivo)." },
      { id: "C", text: "Uma ordem direta (Imperativo)." },
      { id: "D", text: "Uma ação concluída no passado." },
      { id: "E", text: "Uma condição impossível." }
    ],
    correctAnswer: "B",
    explanation: "O termo 'Oxalá' introduz uma oração no presente do subjuntivo, indicando desejo."
  },
  {
    id: 25,
    vestibular: "ENEM 2021",
    materia: "Geografia",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "O processo de 'gentrificação' em áreas urbanas refere-se à:",
    alternativas: [
      { id: "A", text: "Valorização imobiliária que expulsa moradores de baixa renda de centros históricos." },
      { id: "B", text: "Criação de hortas comunitárias em favelas." },
      { id: "C", text: "Industrialização acelerada de cidades do interior." },
      { id: "D", text: "Redução do número de carros nos centros das cidades." },
      { id: "E", text: "Plantação de árvores nativas em parques públicos." }
    ],
    correctAnswer: "A",
    explanation: "Gentrificação é a transformação de bairros populares em áreas de elite, resultando na segregação socioespacial."
  },
  {
    id: 26,
    vestibular: "PUC 2022",
    materia: "Física",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "Um objeto de 2kg é acelerado a 5m/s². Qual a força resultante aplicada sobre ele?",
    alternativas: [
      { id: "A", text: "0.4 N" },
      { id: "B", text: "2.5 N" },
      { id: "C", text: "7 N" },
      { id: "D", text: "10 N" },
      { id: "E", text: "20 N" }
    ],
    correctAnswer: "D",
    explanation: "F = m * a => F = 2 * 5 = 10 N."
  },
  {
    id: 27,
    vestibular: "FUVEST 2021",
    materia: "Química",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "O gelo seco é a forma sólida do:",
    alternativas: [
      { id: "A", text: "Oxigênio (O2)" },
      { id: "B", text: "Nitrogênio (N2)" },
      { id: "C", text: "Dióxido de Carbono (CO2)" },
      { id: "D", text: "Monóxido de Carbono (CO)" },
      { id: "E", text: "Hidrogênio (H2)" }
    ],
    correctAnswer: "C",
    explanation: "O gelo seco é CO2 solidificado, que sublima diretamente para o estado gasoso em condições normais."
  },
  {
    id: 28,
    vestibular: "ENEM 2020",
    materia: "Filosofia",
    dificuldade: "dificil",
    categoria: "Humanas",
    enunciado: "Para Maquiavel, em sua obra 'O Príncipe', a política deve se basear na:",
    alternativas: [
      { id: "A", text: "Moral cristã e na caridade absoluta." },
      { id: "B", text: "Manutenção do poder através da 'virtù' e da 'fortuna', agindo conforme a necessidade." },
      { id: "C", text: "Vontade divina e no direito hereditário sagrado." },
      { id: "D", text: "Eliminação total das leis em favor da anarquia organizada." },
      { id: "E", text: "Igualdade social plena e distribuição de terras." }
    ],
    correctAnswer: "B",
    explanation: "Maquiavel defende o realismo político, onde as ações do governante são julgadas pela sua eficácia em manter o Estado."
  },
  {
    id: 29,
    vestibular: "UNICAMP 2021",
    materia: "Sociologia",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "O conceito de 'Alienação' em Karl Marx descreve:",
    alternativas: [
      { id: "A", text: "O estado de felicidade plena do trabalhador ao produzir algo." },
      { id: "B", text: "O estranhamento do trabalhador em relação ao produto de seu próprio trabalho." },
      { id: "C", text: "A união dos operários com os donos das fábricas." },
      { id: "D", text: "O uso de máquinas modernas na colheita de grãos." },
      { id: "E", text: "O aumento dos salários em países desenvolvidos." }
    ],
    correctAnswer: "B",
    explanation: "No capitalismo, o trabalhador perde o controle sobre o que produz e sobre o processo produtivo, tornando-se alheio ao seu próprio trabalho."
  },
  {
    id: 30,
    vestibular: "ENEM 2023",
    materia: "Biologia",
    dificuldade: "facil",
    categoria: "Biológicas",
    enunciado: "Qual reino inclui organismos procariontes, como as bactérias?",
    alternativas: [
      { id: "A", text: "Reino Animalia" },
      { id: "B", text: "Reino Plantae" },
      { id: "C", text: "Reino Fungi" },
      { id: "D", text: "Reino Monera" },
      { id: "E", text: "Reino Protista" }
    ],
    correctAnswer: "D",
    explanation: "O reino Monera agrupa seres unicelulares procariontes (sem núcleo definido)."
  },
  {
    id: 31,
    vestibular: "FUVEST 2023",
    materia: "Matemática",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Qual o valor de log10(1000)?",
    alternativas: [
      { id: "A", text: "1" },
      { id: "B", text: "2" },
      { id: "C", text: "3" },
      { id: "D", text: "10" },
      { id: "E", text: "100" }
    ],
    correctAnswer: "C",
    explanation: "Logaritmo na base 10 de 1000 é 3, pois 10³ = 1000."
  },
  {
    id: 32,
    vestibular: "UERJ 2022",
    materia: "Física",
    dificuldade: "medio",
    categoria: "Exatas",
    enunciado: "Um espelho côncavo produz uma imagem real e invertida quando o objeto está:",
    alternativas: [
      { id: "A", text: "Entre o foco e o vértice." },
      { id: "B", text: "Sobre o foco." },
      { id: "C", text: "Além do centro de curvatura." },
      { id: "D", text: "Em um espelho plano." },
      { id: "E", text: "No vácuo absoluto." }
    ],
    correctAnswer: "C",
    explanation: "Objetos fora do centro de curvatura em espelhos côncavos geram imagens reais, invertidas e menores."
  },
  {
    id: 33,
    vestibular: "ENEM 2021",
    materia: "Geografia",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "O 'Cerrado' brasileiro é considerado um 'hotspot' de biodiversidade, mas sofre com o avanço acelerado do(a):",
    alternativas: [
      { id: "A", text: "Turismo religioso." },
      { id: "B", text: "Agronegócio e fronteira agrícola." },
      { id: "C", text: "Reflorestamento de pinus." },
      { id: "D", text: "Pesca predatória marinha." },
      { id: "E", text: "Exploração de petróleo no mar." }
    ],
    correctAnswer: "B",
    explanation: "A expansão da soja e da pecuária nas chapadas do bioma Cerrado causou perdas massivas de vegetação nativa."
  },
  {
    id: 34,
    vestibular: "UNICAMP 2022",
    materia: "História",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "A Guerra Fria (1947-1991) foi marcada por qual tipo de conflito?",
    alternativas: [
      { id: "A", text: "Guerra direta e nuclear entre EUA e URSS em solo americano." },
      { id: "B", text: "Disputa ideológica, econômica e tecnológica sem confronto militar direto entre as superpotências." },
      { id: "C", text: "Uma série de ataques piratas no Mediterrâneo." },
      { id: "D", text: "Unificação total de todos os países sob um único governo." },
      { id: "E", text: "Guerra exclusiva entre Japão e China." }
    ],
    correctAnswer: "B",
    explanation: "A 'paz armada' envolveu corrida espacial e armamentista, além de zonas de influência regional."
  },
  {
    id: 35,
    vestibular: "ENEM 2020",
    materia: "Química",
    dificuldade: "dificil",
    categoria: "Exatas",
    enunciado: "A destilação fracionada do petróleo baseia-se na diferença de:",
    alternativas: [
      { id: "A", text: "Solubilidade em água." },
      { id: "B", text: "Ponto de ebulição dos hidrocarbonetos." },
      { id: "C", text: "Cor das substâncias." },
      { id: "D", text: "Sabor dos derivados." },
      { id: "E", text: "Condutividade elétrica." }
    ],
    correctAnswer: "B",
    explanation: "Nas colunas de fracionamento, as diferentes moléculas de hidrocarbonetos condensam em alturas diferentes conforme sua temperatura de ebulição."
  },
  {
    id: 36,
    vestibular: "FUVEST 2022",
    materia: "Biologia",
    dificuldade: "facil",
    categoria: "Biológicas",
    enunciado: "O sangue humano transporta oxigênio ligado à proteína:",
    alternativas: [
      { id: "A", text: "Insulina" },
      { id: "B", text: "Colágeno" },
      { id: "C", text: "Hemoglobina" },
      { id: "D", text: "Fibrina" },
      { id: "E", text: "Anticorpo" }
    ],
    correctAnswer: "C",
    explanation: "A hemoglobina, presente nas hemácias, possui átomos de ferro que se ligam reversivelmente ao oxigênio."
  },
  {
    id: 37,
    vestibular: "ENEM 2023",
    materia: "Literatura",
    dificuldade: "medio",
    categoria: "Linguagens",
    enunciado: "O Modernismo brasileiro, iniciado em 1922, buscava:",
    alternativas: [
      { id: "A", text: "Imitar rigidamente os modelos clássicos gregos." },
      { id: "B", text: "Romper com o passado academicista e buscar uma identidade nacional autêntica." },
      { id: "C", text: "Escrever apenas em latim erudito." },
      { id: "D", text: "Ignorar a realidade social do Brasil." },
      { id: "E", text: "Promover a volta da monarquia literária." }
    ],
    correctAnswer: "B",
    explanation: "A Semana de Arte Moderna propôs a 'Antropofagia' e a libertação dos modelos europeus tradicionais."
  },
  {
    id: 38,
    vestibular: "UERJ 2023",
    materia: "Matemática",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "Qual a probabilidade de sair 'cara' no lançamento de uma moeda honesta?",
    alternativas: [
      { id: "A", text: "1/4" },
      { id: "B", text: "1/2" },
      { id: "C", text: "1/3" },
      { id: "D", text: "1/6" },
      { id: "E", text: "1 (100%)" }
    ],
    correctAnswer: "B",
    explanation: "Há 1 resultado favorável (cara) em 2 resultados possíveis (cara/coroa)."
  },
  {
    id: 39,
    vestibular: "ENEM 2021",
    materia: "Linguagens",
    dificuldade: "medio",
    categoria: "Linguagens",
    enunciado: "O gênero textual 'Crônica' é caracterizado por:",
    alternativas: [
      { id: "A", text: "Uso exclusivo de linguagem técnica e científica." },
      { id: "B", text: "Narrativas curtas inspiradas em fatos do cotidiano, com tom pessoal." },
      { id: "C", text: "Ser um documento oficial de justiça." },
      { id: "D", text: "Possuir centenas de páginas e muitos personagens complexos." },
      { id: "E", text: "Não possuir autoria definida." }
    ],
    correctAnswer: "B",
    explanation: "A crônica transita entre o jornalismo e a literatura, capturando momentos banais e dando-lhes reflexão poética."
  },
  {
    id: 40,
    vestibular: "UNICAMP 2023",
    materia: "História",
    dificuldade: "medio",
    categoria: "Humanas",
    enunciado: "O sistema de 'Parceria' no Brasil do século XIX foi uma tentativa de substituir a mão de obra escrava por:",
    alternativas: [
      { id: "A", text: "Robôs industriais importados." },
      { id: "B", text: "Imigrantes europeus (especialmente italianos) no cultivo do café." },
      { id: "C", text: "Crianças em regime de internato." },
      { id: "D", text: "Mão de obra exclusivamente argentina." },
      { id: "E", text: "Escravizados vindos da Ásia." }
    ],
    correctAnswer: "B",
    explanation: "A parceria visava atrair europeus para as fazendas de café através de um sistema de divisão de lucros (que muitas vezes gerava dívidas)."
  },
  {
    id: 41,
    vestibular: "ENEM 2022",
    materia: "Geografia",
    dificuldade: "facil",
    categoria: "Humanas",
    enunciado: "O movimento de rotação da Terra, realizado em torno de seu próprio eixo imaginário, é o principal responsável pela ocorrência de:",
    alternativas: [
      { id: "A", text: "Estações do ano bem definidas ao longo dos hemisférios." },
      { id: "B", text: "Sucessão dos dias e das noites." },
      { id: "C", text: "Ocorrência de eclipses solares totais mensais." },
      { id: "D", text: "Mudança repentina do clima global a cada trimestre." },
      { id: "E", text: "Derretimento total das calotas polares terrestres." }
    ],
    correctAnswer: "B",
    explanation: "O movimento de rotação da Terra leva aproximadamente 24 horas e determina a sucessão dos dias e das noites."
  },
  {
    id: 42,
    vestibular: "FUVEST 2023",
    materia: "Química",
    dificuldade: "facil",
    categoria: "Exatas",
    enunciado: "Dentre as misturas cotidianas a seguir, qual representa uma mistura heterogênea?",
    alternativas: [
      { id: "A", text: "Água potável filtrada." },
      { id: "B", text: "Soro fisiológico comercial." },
      { id: "C", text: "Água e óleo de cozinha." },
      { id: "D", text: "Vinagre de maçã purificado." },
      { id: "E", text: "Ar atmosférico filtrado e limpo." }
    ],
    correctAnswer: "C",
    explanation: "A água e o óleo são líquidos imiscíveis, formando duas fases visíveis, o que caracteriza uma mistura heterogênea."
  },
  {
    id: 43,
    vestibular: "ENEM 2021",
    materia: "Sociologia",
    dificuldade: "facil",
    categoria: "Humanas",
    enunciado: "O conceito de 'etnocentrismo' refere-se à tendência humana de:",
    alternativas: [
      { id: "A", text: "Valorizar igualmente todas as expressões culturais sem qualquer julgamento." },
      { id: "B", text: "Julgar a cultura alheia a partir dos padrões e valores da própria cultura." },
      { id: "C", text: "Aceitar a imposição de valores estrangeiros como superiores aos seus." },
      { id: "D", text: "Desenvolver estudos científicos exclusivamente baseados na biologia dos povos." },
      { id: "E", text: "Rejeitar qualquer forma de organização social tribal." }
    ],
    correctAnswer: "B",
    explanation: "Etnocentrismo é a visão de mundo onde o nosso próprio grupo é tomado como centro de tudo, julgando as outras culturas sob nossos parâmetros."
  },
  {
    id: 44,
    vestibular: "UNESP 2023",
    materia: "Filosofia",
    dificuldade: "facil",
    categoria: "Humanas",
    enunciado: "O célebre aforismo de René Descartes, 'Penso, logo existo' (Cogito, ergo sum), constitui a base de qual corrente filosófica?",
    alternativas: [
      { id: "A", text: "Empirismo radical inglês." },
      { id: "B", text: "Existencialismo ateu." },
      { id: "C", text: "Racionalismo moderno." },
      { id: "D", text: "Pragmatismo utilitarista." },
      { id: "E", text: "Escolástica medieval." }
    ],
    correctAnswer: "C",
    explanation: "Descartes fundamenta a busca pela verdade na razão (racionalismo), usando a dúvida metódica para encontrar uma certeza indubitável."
  },
  {
    id: 45,
    vestibular: "ENEM 2022",
    materia: "Inglês",
    dificuldade: "facil",
    categoria: "Linguagens",
    enunciado: "Na língua inglesa, a palavra 'actually' é classificada como um falso cognato (false friend). O seu real significado em português é:",
    alternativas: [
      { id: "A", text: "Atualmente (no momento presente)." },
      { id: "B", text: "Na verdade / Realmente (de fato)." },
      { id: "C", text: "Acontecer (realizar uma ação)." },
      { id: "D", text: "Agir com rapidez e precisão." },
      { id: "E", text: "Atuar em uma peça ou filme." }
    ],
    correctAnswer: "B",
    explanation: "'Actually' significa 'na verdade', 'realmente' ou 'de fato'. Para dizer 'atualmente', utiliza-se termos como 'currently' ou 'nowadays'."
  },
  {
    id: 46,
    vestibular: "FUVEST 2024",
    materia: "História",
    dificuldade: "facil",
    categoria: "Humanas",
    enunciado: "A Lei Áurea, assinada pela Princesa Isabel em 13 de maio de 1888, teve como principal consequência jurídica no Império do Brasil:",
    alternativas: [
      { id: "A", text: "A instituição do voto feminino direto e secreto." },
      { id: "B", text: "A extinção definitiva do regime de escravidão no território brasileiro." },
      { id: "C", text: "A proclamação imediata da República Federativa." },
      { id: "D", text: "A concessão automática de terras férteis para todos os ex-escravizados." },
      { id: "E", text: "A criação do Ministério do Trabalho e Previdência Social." }
    ],
    correctAnswer: "B",
    explanation: "A Lei Áurea extinguiu formal e legalmente a escravidão no Brasil, tornando ilegal a posse de seres humanos como propriedade."
  }
];

