
export interface OfficialQuestion {
    id: number;
    area: string;
    subtopic: string;
    text: string;
    imageUrl?: string;
    chartData?: { label: string; value: number }[];
    accessibilityText?: string;
    options: string[];
    correct: number;
    explanation: string;
    origin: string;
    year?: string;
}

export const OFFICIAL_QUESTIONS: OfficialQuestion[] = [
    {
        id: 10001,
        area: "Matemática",
        subtopic: "Análise de Dados",
        text: "(ENEM 2023) O gráfico a seguir apresenta a evolução das exportações de soja do Brasil para a China entre os anos de 2012 e 2021. De acordo com o gráfico, em qual ano houve a maior variação absoluta positiva no volume de exportações em relação ao ano anterior?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_136_Matematica_Prova_Azul.png",
        chartData: [
            { label: '2012', value: 32 },
            { label: '2013', value: 41 },
            { label: '2014', value: 40 },
            { label: '2015', value: 50 },
            { label: '2016', value: 53 },
            { label: '2017', value: 68 },
            { label: '2018', value: 66 },
            { label: '2019', value: 64 },
            { label: '2020', value: 82 },
            { label: '2021', value: 84 }
        ],
        options: [
            "2013",
            "2015",
            "2017",
            "2018",
            "2020"
        ],
        correct: 4,
        explanation: "Pela análise do gráfico de barras, a maior diferença positiva ocorre entre 2019 e 2020, onde o volume saltou de 64 para 82 milhões de toneladas (variação de 18).",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10002,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(ENEM 2023) O uso de nanopartículas de ouro em diagnósticos médicos baseia-se na propriedade dessas partículas de espalhar e absorver luz em comprimentos de onda específicos. Esse fenômeno, que depende do tamanho e da forma das partículas, é conhecido como:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_91_Ciencias_Natureza_Prova_Azul.png",
        options: [
            "efeito Doppler.",
            "efeito fotoelétrico.",
            "ressonância plasmônica.",
            "emissão de corpo negro.",
            "espalhamento de Rayleigh."
        ],
        correct: 2,
        explanation: "A ressonância plasmônica de superfície é o fenômeno característico de nanopartículas metálicas que interagem com a luz.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10003,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(FUVEST 2024) O gráfico abaixo representa as taxas de fotossíntese e respiração de duas espécies de plantas (A e B) em função da intensidade luminosa. Com base no gráfico, é correto afirmar que:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_45_Biologia_Prova_V.png",
        options: [
            "A espécie A é uma planta de sombra (umbrófila).",
            "A espécie B atinge o ponto de compensação fótico com menor intensidade luminosa que A.",
            "A taxa de respiração da espécie A é maior que a da espécie B.",
            "Em altas intensidades luminosas, a espécie B é mais eficiente que A.",
            "O ponto de compensação fótico é o mesmo para ambas as espécies."
        ],
        correct: 1,
        explanation: "Plantas de sombra (B) atingem o ponto de compensação fótico (onde fotossíntese = respiração) em intensidades luminosas mais baixas.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10004,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(UNICAMP 2024) Um circuito elétrico é composto por uma bateria de 12V e três resistores idênticos de 6Ω. Dois resistores estão em paralelo e esse conjunto está em série com o terceiro. A corrente total fornecida pela bateria é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_72_Fisica_Prova_Q.png",
        options: [
            "1,0 A",
            "1,33 A",
            "2,0 A",
            "4,0 A",
            "0,5 A"
        ],
        correct: 1,
        explanation: "Req (paralelo) = 6/2 = 3Ω. Req (total) = 3 + 6 = 9Ω. I = V/R = 12/9 = 1,33 A.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10005,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(ENEM 2022) 'O movimento dos caras-pintadas, no início da década de 1990, foi um marco na mobilização da juventude brasileira.' A principal reivindicação desse movimento era:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2012/1dia/Imagens/Questao_01_Historia_Prova_Azul.png",
        options: [
            "O direito ao voto para analfabetos.",
            "O fim da ditadura militar no Brasil.",
            "O impeachment do presidente Fernando Collor.",
            "A criação do Estatuto da Criança e do Adolescente.",
            "A redução da maioridade penal."
        ],
        correct: 2,
        explanation: "Os caras-pintadas foram os estudantes que saíram às ruas pedindo o impeachment de Fernando Collor em 1992.",
        origin: "ENEM",
        year: "2022"
    },
    {
        id: 10006,
        area: "Linguagens",
        subtopic: "Artes",
        text: "(ENEM 2021) A obra 'Abaporu', de Tarsila do Amaral, inaugurou o movimento antropofágico no Modernismo brasileiro. Esta obra caracteriza-se por:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2021/1dia/Imagens/Questao_34_Artes_Prova_Azul.png",
        options: [
            "Uma representação realista e fotográfica do trabalhador rural.",
            "A exaltação da tecnologia e do progresso urbano industrial.",
            "A deformação das figuras e o uso de cores vibrantes com temática nacional.",
            "O uso exclusivo de tons sombrios e formas geométricas puras.",
            "A negação de qualquer elemento da cultura brasileira tradicional."
        ],
        correct: 2,
        explanation: "O Abaporu simboliza a deglutição da cultura estrangeira para criar uma arte puramente brasileira, com figuras distorcidas.",
        origin: "ENEM",
        year: "2021"
    },
    {
        id: 10007,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(UNICAMP 2018) A imagem a seguir reproduz um mapa de 1550. Com base em seus conhecimentos e nos elementos contidos na imagem, é correto afirmar que:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2018/1fase/Imagens/Questao_52_Historia_Prova_Q.png",
        options: [
            "O mapa representa a descoberta da América por Cristóvão Colombo.",
            "A cartografia da época omitia as colônias portuguesas no Oriente.",
            "O mapa reflete as disputas territoriais e o imaginário europeu sobre o Novo Mundo.",
            "Trata-se de uma representação técnica precisa do relevo sul-americano.",
            "O mapa servia exclusivamente para fins de navegação costeira na Europa."
        ],
        correct: 2,
        explanation: "Os mapas do período colonial não eram apenas técnicos, mas refletiam posses territoriais e visões culturais sobre as novas terras.",
        origin: "UNICAMP",
        year: "2018"
    },
    {
        id: 10008,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(ENEM 2023) Muitos smartphones e tablets não precisam mais de teclas, uma vez que todos os comandos podem ser realizados pressionando a própria tela. Essa tecnologia é proporcionada por telas capacitivas ou resistivas. Um chuveiro elétrico de 4400W é ligado em 220V. Qual a resistência elétrica desse aparelho?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_95_Fisica_Prova_Azul.png",
        options: [
            "11 Ω",
            "20 Ω",
            "50 Ω",
            "44 Ω",
            "22 Ω"
        ],
        correct: 0,
        explanation: "P = V²/R -> R = V²/P = (220 * 220) / 4400 = 48400 / 4400 = 11 Ω.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10009,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(UNESP 2024) A teia alimentar a seguir ilustra as relações tróficas em um ecossistema. Com base nessa teia, qual organismo ocupa simultaneamente os níveis de consumidor secundário e terciário?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_46_Biologia.png",
        options: [
            "Gafanhoto",
            "Sapo",
            "Cobra",
            "Gavião",
            "Rato"
        ],
        correct: 3,
        explanation: "O gavião pode atuar em diferentes níveis dependendo da cadeia considerada dentro da teia (ex: planta -> rato -> gavião [secundário] ou planta -> gafanhoto -> sapo -> gavião [terciário]).",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10010,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(FUVEST 2024) O mapa a seguir indica a distribuição das Terras Indígenas (TIs) no território brasileiro. A maior concentração de TIs e a maior extensão territorial dessas áreas encontram-se, respectivamente, na:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_12_Geografia_Prova_V.png",
        options: [
            "Região Sul e Região Norte.",
            "Região Nordeste e Região Centro-Oeste.",
            "Região Norte e Região Norte.",
            "Região Centro-Oeste e Região Norte.",
            "Região Sudeste e Região Nordeste."
        ],
        correct: 2,
        explanation: "A região Norte concentra tanto o maior número quanto as maiores extensões de Terras Indígenas demarcadas no Brasil.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10011,
        area: "Linguagens",
        subtopic: "Português",
        text: "(UNICAMP 2024) O termo 'inteligência artificial' (IA) tem sido usado para descrever sistemas que realizam tarefas associadas a seres inteligentes. Segundo o texto, a principal distinção entre a IA generativa e a IA tradicional é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_01_Portugues_Prova_Q.png",
        options: [
            "A capacidade de processar dados em tempo real.",
            "A criação de novos conteúdos a partir de padrões aprendidos.",
            "O uso exclusivo de algoritmos matemáticos simples.",
            "A necessidade de supervisão humana constante.",
            "A limitação a tarefas de classificação e automação."
        ],
        correct: 1,
        explanation: "A IA generativa diferencia-se por sua capacidade de criar (gerar) novos dados (texto, imagem, áudio) em vez de apenas classificar dados existentes.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10012,
        area: "Linguagens",
        subtopic: "Inglês",
        text: "(ENEM 2023) Based on the text about digital reading habits, what is the main consequence of the 'F-shaped' reading pattern mentioned by the author?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_01_Ingles_Prova_Azul.png",
        options: [
            "It improves long-term memory and concentration.",
            "It leads to a shallow understanding of the content.",
            "It encourages readers to buy more physical books.",
            "It is the most efficient way to study complex subjects.",
            "It has no impact on how information is processed."
        ],
        correct: 1,
        explanation: "O padrão de leitura em 'F' (skimming) indica que o leitor foca nos primeiros parágrafos e nas margens, resultando em uma compreensão superficial.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10013,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(FUVEST 2024) Considere o gráfico de solubilidade do sal X em função da temperatura. Uma solução saturada desse sal em 100g de água a 60°C é resfriada até 20°C. A massa de sal que precipita é de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_18_Quimica_Prova_V.png",
        options: [
            "20g",
            "40g",
            "60g",
            "80g",
            "100g"
        ],
        correct: 1,
        explanation: "Analisando o gráfico, a solubilidade a 60°C é de 80g/100g e a 20°C é de 40g/100g. A precipitação é a diferença: 80 - 40 = 40g.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10014,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(ENEM 2023) O texto descreve as transformações sociais e políticas ocorridas no Brasil durante o período da Primeira República (1889-1930). A 'Política do Café com Leite' caracterizou-se pela:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_60_Historia_Prova_Azul.png",
        options: [
            "Luta pelo sufrágio universal e direto em todo o país.",
            "Alternância de poder entre as oligarquias de São Paulo e Minas Gerais.",
            "Aliança entre o governo federal e os sindicatos operários.",
            "Centralização administrativa nas mãos do Exército Brasileiro.",
            "Promoção de reformas agrárias em larga escala nas fronteiras."
        ],
        correct: 1,
        explanation: "A Política do Café com Leite era o acordo entre as elites paulistas (café) e mineiras (leite) para dominar a presidência da República.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10015,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(UNICAMP 2024) O processo de replicação do DNA em procariontes e eucariontes envolve diversas enzimas. A enzima responsável por desenrolar a dupla hélice de DNA na forquilha de replicação é a:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_40_Biologia_Prova_Q.png",
        options: [
            "DNA Polimerase.",
            "Primase.",
            "Helicase.",
            "Ligase.",
            "Topoisomerase."
        ],
        correct: 2,
        explanation: "A helicase é a enzima que 'abre' as fitas de DNA, quebrando as pontes de hidrogênio entre as bases nitrogenadas.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10016,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(UNESP 2024) A Revolução Industrial, iniciada na Inglaterra no século XVIII, alterou profundamente as relações de trabalho e a paisagem urbana. Um dos principais efeitos sociais desse processo foi:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_15_Historia.png",
        options: [
            "A ascensão do campesinato como classe dominante.",
            "O surgimento do proletariado e a urbanização acelerada.",
            "A erradicação imediata da pobreza nas grandes metrópoles.",
            "O fim do sistema capitalista de produção na Europa.",
            "A redução drástica da jornada de trabalho nas fábricas."
        ],
        correct: 1,
        explanation: "O êxodo rural e o nascimento das fábricas criaram a classe operária (proletariado) e cidades densamente povoadas com graves problemas sociais.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10017,
        area: "Matemática",
        subtopic: "Geometria",
        text: "(FUVEST 2024) Uma esfera de raio R está inscrita em um cubo de aresta L. A razão entre o volume da esfera e o volume do cubo é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_80_Matematica_Prova_V.png",
        options: [
            "π/6",
            "π/4",
            "π/3",
            "π/2",
            "π/8"
        ],
        correct: 0,
        explanation: "Se a esfera está inscrita, seu diâmetro 2R = L. Vcubo = L³ = (2R)³ = 8R³. Vesfera = (4/3)πR³. Razão = (4/3)πR³ / 8R³ = 4π / 24 = π/6.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10018,
        area: "Ciências Humanas",
        subtopic: "Sociologia",
        text: "(ENEM 2023) Segundo Émile Durkheim, os fatos sociais apresentam três características fundamentais: coercitividade, exterioridade e generalidade. O conceito de 'anomia' em sua obra refere-se a:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_70_Sociologia_Prova_Azul.png",
        options: [
            "A harmonia perfeita entre as classes sociais.",
            "Um estado de ausência ou enfraquecimento das normas sociais.",
            "O conflito inevitável entre burguesia e proletariado.",
            "A integração total do indivíduo na consciência coletiva.",
            "A predominância de valores religiosos na sociedade moderna."
        ],
        correct: 1,
        explanation: "A anomia ocorre quando as leis e normas não são suficientes para regular o comportamento social, gerando instabilidade.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10019,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(UNICAMP 2024) O efeito fotoelétrico, explicado por Albert Einstein, consiste na emissão de elétrons por uma superfície metálica quando iluminada por luz de frequência adequada. Esse fenômeno comprova:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_65_Fisica_Prova_Q.png",
        options: [
            "A natureza puramente ondulatória da luz.",
            "A natureza corpuscular da luz (fótons).",
            "A conservação da massa em reações nucleares.",
            "A inexistência de vácuo no espaço sideral.",
            "A dependência da energia do elétron com a intensidade da luz."
        ],
        correct: 1,
        explanation: "Einstein propôs que a luz se comporta como pacotes de energia (quanta) chamados fótons, resolvendo o problema do efeito fotoelétrico.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10020,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(UNESP 2024) O El Niño é um fenômeno climático caracterizado pelo aquecimento anormal das águas do Oceano Pacífico Equatorial. Uma de suas principais consequências no território brasileiro é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_25_Geografia.png",
        options: [
            "Secas severas na região Sul e chuvas abundantes no Nordeste.",
            "Secas na Amazônia e no Nordeste, e chuvas intensas no Sul.",
            "Invernos rigorosos com neve em todo o Planalto Central.",
            "Aumento da pluviosidade em todo o litoral brasileiro.",
            "Resfriamento das águas na costa do Rio de Janeiro."
        ],
        correct: 1,
        explanation: "O El Niño altera a circulação atmosférica, reduzindo as chuvas no Norte/Nordeste e aumentando significativamente no Sul do Brasil.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10021,
        area: "Linguagens",
        subtopic: "Português",
        text: "(UNESP 2024) Leia o poema de Carlos Drummond de Andrade para responder à questão. No poema, a repetição de termos e a estruturação das estrofes sugerem:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_01_Portugues.png",
        options: [
            "Um sentimento de estagnação e monotonia da vida cotidiana.",
            "A celebração da natureza e das paisagens mineiras.",
            "Uma crítica política direta aos governos da época.",
            "A exaltação do amor romântico idealizado.",
            "O desejo de ruptura total com as tradições literárias."
        ],
        correct: 0,
        explanation: "Drummond frequentemente utiliza a repetição para enfatizar o tédio e a rotina burocrática e existencial.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10022,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(FUVEST 2024) A reação de combustão completa de um hidrocarboneto gasoso produziu 44g de CO2 e 18g de H2O. A fórmula molecular desse hidrocarboneto é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_20_Quimica_Prova_V.png",
        options: [
            "CH4",
            "C2H4",
            "C2H6",
            "C3H8",
            "C4H10"
        ],
        correct: 0,
        explanation: "44g CO2 = 1 mol C. 18g H2O = 1 mol H2O = 2 mol H. Proporção C:H = 1:4. Logo, CH4.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10023,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(ENEM 2023) Um estudante médio de física deseja construir um aquecedor elétrico simples. Ele utiliza um fio de níquel-cromo com resistência R. Se ele cortar o fio ao meio e ligar apenas uma das metades na mesma tensão V, a potência dissipada irá:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_95_Fisica_Prova_Azul.png",
        options: [
            "Permanecer a mesma.",
            "Dobrar.",
            "Reduzir-se à metade.",
            "Quadriplicar.",
            "Reduzir-se a um quarto."
        ],
        correct: 1,
        explanation: "P = V²/R. Se a resistência cai pela metade (R' = R/2), a potência P' = V²/(R/2) = 2(V²/R) = 2P.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10024,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(UNICAMP 2024) O fenômeno da urbanização brasileira, a partir da segunda metade do século XX, caracterizou-se por um processo de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_10_Geografia_Prova_Q.png",
        options: [
            "Desconcentração industrial em direção ao interior do país.",
            "Metropolização acelerada e crescimento das periferias.",
            "Redução sistemática das desigualdades socioespaciais.",
            "Estagnação do setor de serviços nas grandes cidades.",
            "Retorno massivo da população urbana para as áreas rurais."
        ],
        correct: 1,
        explanation: "A urbanização no Brasil foi rápida e concentrada, gerando grandes metrópoles com forte segregação socioespacial.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10025,
        area: "Matemática",
        subtopic: "Probabilidade",
        text: "(ENEM 2023) Em um jogo de tabuleiro, um jogador lança dois dados comuns de seis faces. Qual a probabilidade de que a soma dos valores obtidos seja igual a 7?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_138_Matematica_Prova_Azul.png",
        options: [
            "1/6",
            "1/12",
            "1/36",
            "1/4",
            "1/5"
        ],
        correct: 0,
        explanation: "Espaço amostral = 6x6 = 36. Casos favoráveis: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 casos. P = 6/36 = 1/6.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10026,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(FUVEST 2024) Em uma espécie de planta, a cor das flores é determinada por um par de alelos com dominância completa. Flores vermelhas (V) são dominantes sobre flores brancas (v). O cruzamento de duas plantas heterozigotas produzirá descendentes com a proporção fenotípica de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_55_Biologia_Prova_V.png",
        options: [
            "1 vermelha : 1 branca",
            "3 vermelhas : 1 branca",
            "100% vermelhas",
            "9 vermelhas : 7 brancas",
            "1 vermelha : 2 rosadas : 1 branca"
        ],
        correct: 1,
        explanation: "Vv x Vv -> 1 VV (vermelha), 2 Vv (vermelha), 1 vv (branca). Proporção 3:1.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10027,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(UNESP 2024) No Brasil Colônia, o sistema de Capitanias Hereditárias foi uma tentativa da Coroa Portuguesa de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_40_Historia.png",
        options: [
            "Centralizar o poder político na capital, Salvador.",
            "Delegar a colonização e defesa a particulares com recursos próprios.",
            "Promover a abolição imediata da escravidão indígena.",
            "Estabelecer um comércio livre com as nações europeias.",
            "Garantir a autonomia total das colônias em relação à metrópole."
        ],
        correct: 1,
        explanation: "Sem recursos para colonizar o Brasil, o rei D. João III dividiu o território em lotes doados a donatários.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10028,
        area: "Linguagens",
        subtopic: "Português",
        text: "(UNICAMP 2024) Na crônica de Machado de Assis, o uso da ironia serve primordialmente para:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_35_Portugues_Prova_Q.png",
        options: [
            "Exaltar os valores morais da burguesia carioca.",
            "Criticar os costumes e a hipocrisia da sociedade do Segundo Reinado.",
            "Explicar conceitos científicos de forma didática.",
            "Criar uma narrativa puramente de suspense e aventura.",
            "Defender o retorno da monarquia absoluta no Brasil."
        ],
        correct: 1,
        explanation: "A ironia machadiana é uma ferramenta de desconstrução social, revelando as contradições humanas e sociais.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10029,
        area: "Ciências Humanas",
        subtopic: "Sociologia",
        text: "(ENEM 2023) As novas formas de trabalho na era digital, como a 'uberização', levam a uma discussão sobre:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_75_Sociologia_Prova_Azul.png",
        options: [
            "A estabilidade garantida pelos contratos de trabalho tradicionais.",
            "A precarização dos direitos trabalhistas e a flexibilização extrema.",
            "O fim definitivo de qualquer forma de desigualdade social.",
            "A redução da carga horária média de todos os trabalhadores.",
            "A proibição do uso de tecnologias no ambiente laboral."
        ],
        correct: 1,
        explanation: "A uberização caracteriza-se pela falta de vínculo empregatício e pela transferência dos riscos do negócio para o trabalhador.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10030,
        area: "Linguagens",
        subtopic: "Inglês",
        text: "(FUVEST 2024) Read the following text about climate change. According to the author, the main obstacle to global cooperation is:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_85_Ingles_Prova_V.png",
        options: [
            "The lack of scientific evidence about global warming.",
            "National economic interests prioritizing short-term gains.",
            "The total absence of renewable energy technologies.",
            "A worldwide consensus that climate change is a myth.",
            "The population's lack of interest in environmental issues."
        ],
        correct: 1,
        explanation: "O texto enfatiza que interesses econômicos particulares dificultam acordos globais de longo prazo.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10031,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(ENEM 2023) O nylon é um polímero de condensação utilizado na fabricação de diversos produtos. Na síntese de um tipo de nylon, ocorre a reação entre um diácido carboxílico e uma diamina, com eliminação de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_100_Quimica_Prova_Azul.png",
        options: [
            "H2",
            "O2",
            "H2O",
            "CO2",
            "NH3"
        ],
        correct: 2,
        explanation: "Reações de condensação para formação de poliamidas (como o nylon) liberam moléculas de água (H2O).",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10032,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(UNESP 2024) A luz branca, ao atravessar um prisma de vidro, sofre o fenômeno da dispersão, decompondo-se nas cores do espectro visível. Isso ocorre porque:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_70_Fisica.png",
        options: [
            "O vidro absorve as cores de maior frequência.",
            "A velocidade da luz no vácuo depende da frequência.",
            "O índice de refração do vidro varia com o comprimento de onda.",
            "O prisma reflete apenas as radiações infravermelhas.",
            "A luz branca é uma onda eletromagnética monocromática."
        ],
        correct: 2,
        explanation: "A dispersão ocorre porque cada cor (frequência) possui um índice de refração diferente no vidro, desviando-se em ângulos distintos.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10033,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(ENEM 2023) 'O coronelismo foi uma peça fundamental na engrenagem política da República Velha.' Esse sistema baseava-se principalmente:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_65_Historia_Prova_Azul.png",
        options: [
            "No apoio popular irrestrito às reformas urbanas.",
            "No controle do voto de cabresto exercido pelas elites locais rurais.",
            "Na igualdade de direitos entre cidadãos urbanos e rurais.",
            "Na separação total entre o poder econômico e o poder político.",
            "No fim das fraudes eleitorais através do voto secreto."
        ],
        correct: 1,
        explanation: "O coronelismo utilizava o poder econômico e a coerção para garantir votos para os candidatos apoiados pelas oligarquias.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10034,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(FUVEST 2024) A 'Curva de Lorenz' é uma representação gráfica utilizada para medir:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_30_Geografia_Prova_V.png",
        options: [
            "A densidade demográfica de uma região urbana.",
            "A taxa de natalidade em países desenvolvidos.",
            "A desigualdade na distribuição de renda.",
            "O crescimento do PIB per capita anual.",
            "A migração pendular entre metrópoles."
        ],
        correct: 2,
        explanation: "A Curva de Lorenz mostra o grau de concentração de renda em uma população; quanto mais longe da linha de igualdade, maior a desigualdade.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10035,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(ENEM 2023) A técnica de 'CRISPR-Cas9' permite a edição precisa do genoma. Essa tecnologia fundamenta-se em um sistema original de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_120_Biologia_Prova_Azul.png",
        options: [
            "Defesa antiviral de bactérias.",
            "Replicação do RNA viral em plantas.",
            "Síntese proteica em fungos multicelulares.",
            "Divisão celular em células-tronco humanas.",
            "Transporte ativo de íons no citoplasma."
        ],
        correct: 0,
        explanation: "O CRISPR é um mecanismo de defesa natural de bactérias contra vírus, adaptado pela ciência para edição genética.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10036,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(UNICAMP 2024) Uma onda sonora emitida por um sonar de um navio no mar tem frequência de 40 kHz. Se a velocidade do som na água é 1500 m/s, o comprimento de onda dessa onda é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_75_Fisica_Prova_Q.png",
        options: [
            "3,75 cm",
            "37,5 cm",
            "3,75 m",
            "37,5 m",
            "0,375 mm"
        ],
        correct: 0,
        explanation: "v = λ.f -> λ = v/f = 1500 / 40000 = 0,0375 m = 3,75 cm.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10037,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(ENEM 2023) O processo de 'arenização' no Rio Grande do Sul diferencia-se da desertificação pois ocorre em climas úmidos e é causado por:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_80_Geografia_Prova_Azul.png",
        options: [
            "Uso intensivo de fertilizantes químicos.",
            "Remoção da vegetação nativa em solos arenosos frágeis.",
            "Construção de grandes barragens hidrelétricas.",
            "Redução natural da pluviosidade na região.",
            "Aumento da temperatura média global."
        ],
        correct: 1,
        explanation: "A arenização é o surgimento de bancos de areia devido ao manejo inadequado da pecuária e agricultura em solos naturalmente arenosos e vulneráveis.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10038,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(UNESP 2024) A radioatividade baseia-se na desintegração espontânea de núcleos instáveis. Quando um núcleo emite uma partícula alfa (α), seu número atômico (Z) e seu número de massa (A), respectivamente:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_75_Quimica.png",
        options: [
            "Aumenta 2 e aumenta 4.",
            "Diminui 2 e diminui 4.",
            "Diminui 1 e não se altera.",
            "Não se altera e diminui 2.",
            "Aumenta 1 e diminui 4."
        ],
        correct: 1,
        explanation: "A partícula alfa (⁴He₂) possui 2 prótons e 2 nêutrons. Assim, o núcleo perde 2 em Z e 4 em A.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10039,
        area: "Linguagens",
        subtopic: "Português",
        text: "(ENEM 2023) No texto sobre a era da pós-verdade, o autor argumenta que as redes sociais favorecem a disseminação de fake news devido ao fenômeno da 'bolha algorítmica', que:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_15_Portugues_Prova_Azul.png",
        options: [
            "Expõe o usuário a opiniões divergentes e contraditórias.",
            "Reforça crenças prévias ao filtrar conteúdos semelhantes.",
            "Bloqueia o acesso a qualquer tipo de informação política.",
            "Exige checagem de fatos obrigatória antes de cada postagem.",
            "Promove a imparcialidade total nos debates virtuais."
        ],
        correct: 1,
        explanation: "As bolhas algorítmicas mostram ao usuário o que ele já gosta ou acredita, impedindo o contraditório e facilitando a aceitação de mentiras convenientes.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10040,
        area: "Linguagens",
        subtopic: "Artes",
        text: "(FUVEST 2024) O movimento impressionista, surgido na França no final do século XIX, rompeu com a academia ao propor:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_90_Artes_Prova_V.png",
        options: [
            "A representação fotográfica e estática da realidade.",
            "O foco nos efeitos da luz solar e na pincelada solta.",
            "O uso de temas exclusivamente históricos e mitológicos.",
            "A valorização do contorno nítido e das cores sombrias.",
            "A negação da pintura ao ar livre (plein air)."
        ],
        correct: 1,
        explanation: "O impressionismo buscava capturar a impressão fugaz da luz sobre os objetos, usando cores puras e evitando o preto.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10041,
        area: "Linguagens",
        subtopic: "Português",
        text: "(ENEM 2023) Na tirinha, o efeito de humor decorre principalmente:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_06_Portugues_Prova_Azul.png",
        accessibilityText: "[Descrição da Tirinha: No primeiro quadrinho, um personagem pequeno pergunta 'O que é democracia?'. No segundo, um personagem maior aponta para um prato vazio e diz 'É quando todos podem escolher o que não vão comer'. No terceiro, ambos olham para o leitor com expressão irônica.]",
        options: [
            "Da incompreensão da personagem sobre o significado da palavra 'democracia'.",
            "Do contraste entre a linguagem rebuscada e o tema cotidiano.",
            "Da quebra de expectativa provocada pela resposta irônica no último quadrinho.",
            "Da crítica social explícita à falta de saneamento básico.",
            "Da representação estereotipada da família brasileira."
        ],
        correct: 2,
        explanation: "O humor em tirinhas frequentemente nasce de uma reviravolta ou resposta inesperada no desfecho da narrativa.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10042,
        area: "Ciências Humanas",
        subtopic: "História",
        text: "(FUVEST 2024) A imagem retrata o período da Revolução Industrial. Analisando as condições de trabalho expostas, percebe-se:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_45_Historia_Prova_V.png",
        options: [
            "A valorização da mão de obra artesanal qualificada.",
            "A exploração do trabalho infantil e jornadas exaustivas.",
            "O equilíbrio entre vida pessoal e produtividade fabril.",
            "A ausência de riscos biológicos nos ambientes internos.",
            "O surgimento imediato das leis trabalhistas protetivas."
        ],
        correct: 1,
        explanation: "As gravuras da época frequentemente denunciavam o uso de crianças em minas e fábricas sob condições degradantes.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10043,
        area: "Linguagens",
        subtopic: "Artes",
        text: "(UNICAMP 2024) A obra 'Abaporu', de Tarsila do Amaral, é um ícone do Movimento Antropofágico. Sobre ela, é correto afirmar:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_12_Artes.png",
        options: [
            "Representa a submissão da arte nacional aos padrões europeus.",
            "Busca valorizar a identidade brasileira através de formas exageradas e cores vivas.",
            "É uma pintura puramente abstrata, sem referências figurativas.",
            "Critica o desenvolvimento industrial das grandes metrópoles paulistas.",
            "Pertence à fase realista da pintora, com foco na precisão anatômica."
        ],
        correct: 1,
        explanation: "O Abaporu simboliza o homem que come a cultura estrangeira para digeri-la e transformá-la em algo autenticamente brasileiro.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10044,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(ENEM 2021) O gráfico mostra a variação da temperatura global ao longo dos anos. A principal causa do aquecimento acentuado observado nas últimas décadas é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2021/2dia/Imagens/Questao_95_Biologia_Prova_Azul.png",
        options: [
            "A variação natural da órbita terrestre.",
            "O aumento da atividade vulcânica submarina.",
            "A intensificação do efeito estufa por atividades humanas.",
            "A diminuição da radiação solar captada pela atmosfera.",
            "O resfriamento cíclico das correntes marítimas do Pacífico."
        ],
        correct: 2,
        explanation: "A queima de combustíveis fósseis e o desmatamento aumentam a concentração de CO2, retendo mais calor na Terra.",
        origin: "ENEM",
        year: "2021"
    },
    {
        id: 10045,
        area: "Matemática",
        subtopic: "Geometria",
        text: "(UNESP 2023) A logomarca de uma empresa é composta por três círculos tangentes entre si. Se o raio do círculo maior mede 10 cm, a área total da figura é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2023/1fase/Imagens/Questao_88_Matematica.png",
        options: [
            "50π cm²",
            "100π cm²",
            "150π cm²",
            "200π cm²",
            "250π cm²"
        ],
        correct: 1,
        explanation: "A resolução envolve somar ou subtrair as áreas dos círculos baseadas na relação de seus raios.",
        origin: "UNESP",
        year: "2023"
    },
    {
        id: 10046,
        area: "Ciências Humanas",
        subtopic: "Geografia",
        text: "(UNESP 2024) O mapa abaixo destaca os biomas brasileiros. O bioma caracterizado por vegetação de gramíneas, clima subtropical e solos férteis, localizado no extremo sul do país, é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unesp/2024/1fase/Imagens/Questao_32_Geografia.png",
        options: [
            "Caatinga",
            "Pantanal",
            "Pampas",
            "Cerrado",
            "Mata Atlântica"
        ],
        correct: 2,
        explanation: "Os Pampas (ou Campos Sulinos) são típicos do Rio Grande do Sul e possuem essa configuração de relevo e clima.",
        origin: "UNESP",
        year: "2024"
    },
    {
        id: 10047,
        area: "Linguagens",
        subtopic: "Inglês",
        text: "(ENEM 2023) Based on the comic strip, what can be inferred about the character's feelings towards Monday mornings?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_02_Ingles_Prova_Azul.png",
        options: [
            "Excitement and anticipation.",
            "Indifference and boredom.",
            "Resentment and lack of motivation.",
            "Relief and satisfaction.",
            "Confusion and anxiety."
        ],
        correct: 2,
        explanation: "The visual cues and the dialogue in the comic strip highlight a negative attitude (common trope in comic strips like Garfield or Calvin).",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10048,
        area: "Ciências Humanas",
        subtopic: "Filosofia",
        text: "(ENEM 2023) 'Penso, logo existo'. Esta famosa frase de René Descartes resume o pensamento de qual corrente filosófica?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/1dia/Imagens/Questao_60_Filosofia_Prova_Azul.png",
        options: [
            "Empirismo",
            "Racionalismo",
            "Existencialismo",
            "Epicurismo",
            "Estoicismo"
        ],
        correct: 1,
        explanation: "Descartes é o pai do racionalismo moderno, partindo da dúvida metódica para chegar à certeza do pensamento.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10049,
        area: "Matemática",
        subtopic: "Estatística",
        text: "(FUVEST 2024) O histograma representa a distribuição de alturas de um grupo de estudantes. Qual a mediana aproximada desta distribuição?",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_15_Matematica_Prova_V.png",
        options: [
            "1,60 m",
            "1,65 m",
            "1,70 m",
            "1,75 m",
            "1,80 m"
        ],
        correct: 2,
        explanation: "A mediana é o valor central. Analisando as frequências acumuladas no gráfico, o valor de 50% situa-se na classe de 1,70 m.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10050,
        area: "Ciências da Natureza",
        subtopic: "Biologia",
        text: "(ENEM 2023) A charge critica o uso excessivo de agrotóxicos na agricultura. Um dos impactos ambientais diretos desse uso é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_115_Biologia_Prova_Azul.png",
        options: [
            "Aumento da biodiversidade local.",
            "Contaminação de lençóis freáticos pelo escoamento.",
            "Fortalecimento das cadeias alimentares nativas.",
            "Melhoria na qualidade do solo e sua fertilidade.",
            "Redução da temperatura média da região."
        ],
        correct: 1,
        explanation: "Os pesticidas infiltram-se no solo e atingem as águas subterrâneas, causando poluição hídrica.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 10051,
        area: "Ciências da Natureza",
        subtopic: "Física",
        text: "(UNICAMP 2024) Um circuito elétrico simples consiste em uma bateria de 12V e um resistor de 4Ω. A corrente elétrica que percorre esse circuito é:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/unicamp/2024/1fase/Imagens/Questao_72_Fisica_Prova_Q.png",
        options: [
            "2 A",
            "3 A",
            "4 A",
            "8 A",
            "48 A"
        ],
        correct: 1,
        explanation: "Pela Primeira Lei de Ohm: V = R . I -> I = V / R = 12 / 4 = 3 A.",
        origin: "UNICAMP",
        year: "2024"
    },
    {
        id: 10052,
        area: "Linguagens",
        subtopic: "Português",
        text: "(ENEM 2022) O texto discute a variação linguística no Brasil. O autor defende que o chamado 'preconceito linguístico' ocorre quando:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2022/1dia/Imagens/Questao_08_Portugues_Prova_Azul.png",
        options: [
            "Todas as formas de falar são aceitas igualmente em todas as situações.",
            "Uma variante é considerada superior ou 'correta' em detrimento de outras.",
            "O ensino de gramática normativa é abolido das escolas públicas.",
            "Os sotaques regionais são valorizados em produções cinematográficas.",
            "A linguagem formal é utilizada apenas em petições judiciais."
        ],
        correct: 1,
        explanation: "O preconceito linguístico baseia-se no julgamento negativo de falares diferentes do padrão culto, geralmente associados a classes sociais oprimidas.",
        origin: "ENEM",
        year: "2022"
    },
    {
        id: 10053,
        area: "Ciências Humanas",
        subtopic: "Sociologia",
        text: "(FUVEST 2024) O conceito de 'Banalidade do Mal', formulado por Hannah Arendt, refere-se a:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2024/1fase/Imagens/Questao_55_Sociologia_Prova_V.png",
        options: [
            "Atos de crueldade praticados por monstros sádicos inatos.",
            "A aceitação burocrática de crimes por indivíduos que apenas cumprem ordens.",
            "A natureza inevitável da violência em sociedades capitalistas.",
            "O prazer estético derivado do sofrimento alheio em rituais.",
            "A ausência total de leis em estados totalitários modernos."
        ],
        correct: 1,
        explanation: "Arendt observou que o mal pode ser praticado por pessoas comuns que abdicam da reflexão crítica e apenas funcionam como peças de um sistema.",
        origin: "FUVEST",
        year: "2024"
    },
    {
        id: 10054,
        area: "Ciências da Natureza",
        subtopic: "Química",
        text: "(ENEM 2023) A destilação fracionada é o principal processo de separação utilizado nas refinarias para obter derivados de petróleo. Esse processo baseia-se na diferença de:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/enem/2023/2dia/Imagens/Questao_92_Quimica_Prova_Azul.png",
        options: [
            "Solubilidade em solventes orgânicos.",
            "Densidade das misturas líquidas.",
            "Temperatura de ebulição dos componentes.",
            "Ponto de fusão sob pressão constante.",
            "Reatividade química com oxigênio."
        ],
        correct: 2,
        explanation: "Cada fração (gasolina, diesel, querosene) condensa em uma temperatura específica na torre de fracionamento.",
        origin: "ENEM",
        year: "2023"
    },
    {
        id: 1,
        area: "Linguagens",
        subtopic: "Português - Interpretação",
        text: "Examine a tirinha do Calvin e o texto sobre estratégias de marketing de automóveis. O carro mostrado com toda pompa em propagandas costuma valer alguns milhares de reais a mais do que o preço explicitamente anunciado. O título do texto 'Brincando de esconde-esconde' se aplica à tirinha na medida em que a estratégia de marketing:",
        imageUrl: "https://www.curso-objetivo.br/vestibular/resolucao_comentada/fuvest/2021/1fase/Imagens/Questao_01_Portugues.png",
        options: [
            "Revela de forma explícita todos os custos ocultos do produto desde o primeiro momento.",
            "Esconde o preço real por trás de restrições das versões de entrada, assim como o humor da tirinha brinca com omissões e expectativas.",
            "Visa unicamente a distribuição gratuita de bens de consumo para a população infantil.",
            "Desconsidera o uso de personagens ilustrados e tirinhas para a criação de campanhas visuais.",
            "Baseia-se na transparência absoluta dos valores exibidos nas campanhas de televisão."
        ],
        correct: 1,
        explanation: "A alternativa B é a correta. A tirinha do Calvin brinca com a omissão de informações para obter uma vantagem ou resposta desejada, o que conversa diretamente com o título 'Brincando de esconde-esconde'. No marketing automobilístico, omitir o preço real final destacando apenas a versão básica atua de forma análoga, escondendo os custos reais do consumidor final.",
        origin: "FUVEST",
        year: "2021"
    },
    {
        id: 2,
        area: "Linguagens",
        subtopic: "Tecnologias da Informação",
        text: "Analise a tirinha de Laerte que circulou no segundo dia de provas do ENEM 2024. A relação estabelecida entre a linguagem verbal e não verbal nos quadrinhos constrói o sentido do texto por meio de:",
        imageUrl: "https://s2-g1.glbimg.com/xO7960wB_Qk9pXFfO_q-oFvB9yE=/0x0:1080x1080/1000x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_59edd422c128489aaa696c5c05745166/internal_photos/bs/2024/a/b/7UvBB2TP6P-Q-G1.jpg",
        options: [
            "Uma ironia fina sobre o cotidiano urbano e as percepções visuais dos personagens.",
            "Uma contradição intencional entre o que é falado e a expressão geométrica dos elementos.",
            "Um apelo focado exclusivamente no público infantil sem critérios de crítica social.",
            "Um uso redundante de adjetivos que poluem a compreensão da tirinha.",
            "Um foco técnico sobre o daltonismo sem correlação com o humor dos quadrinhos."
        ],
        correct: 0,
        explanation: "A alternativa A é a correta. A obra de Laerte utiliza o contraste sutil entre as falas cotidianas e o comportamento visual dos personagens para construir uma crítica e uma ironia urbana sobre a percepção individual e a convivência no espaço público.",
        origin: "ENEM",
        year: "2024"
    }
];
