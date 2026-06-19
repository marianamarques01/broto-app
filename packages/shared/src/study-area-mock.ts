/**
 * Conteúdo estático da Área de Estudo (ENEM), versionado no repositório.
 * Contrato consumido pelo app web: resumo, flashcards, questões de prática, mapa mental.
 * MVP: sem chamadas a NotebookLM neste fluxo — troca de fonte para API/LM fica pós-MVP mantendo o contrato.
 */

import { isAreaRollupTopicValue } from './enem-area-key'
import type { MindMapNode } from './types/content'
import type { TopicoStat } from './types/dashboard-progress'

export type { MindMapNode } from './types/content'

export interface StudySummary {
  title: string
  content: string
  keyPoints: string[]
}

export interface StudyFlashcard {
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface PracticeQuestion {
  question: string
  alternatives: { letter: string; text: string; isCorrect: boolean }[]
  explanation: string
}

export interface StudyPackage {
  id: string
  areaKey: string
  topicoValue: string
  topicoLabel: string
  performance: { accuracy: number; totalAnswered: number }
  summary: StudySummary
  flashcards: StudyFlashcard[]
  practiceQuestions: PracticeQuestion[]
  mindMap: { topic: string; root: MindMapNode }
}

export interface TopicOption {
  value: string
  label: string
  accuracy: number | null
  totalAnswered: number
  /**
   * Etapas da trilha guiada já concluídas (estado local do cliente — ex.: localStorage na web).
   * Usado no hub para refletir progresso mesmo sem dados no servidor.
   */
  journeyStagesCompleted?: number
}

export const MOCK_TOPICS: Record<string, TopicOption[]> = {
  linguagens: [
    {
      value: 'interpretacao-texto',
      label: 'Interpretação Textual',
      accuracy: 72,
      totalAnswered: 18,
    },
    { value: 'literatura', label: 'Literatura Brasileira', accuracy: 55, totalAnswered: 11 },
    { value: 'gramatica', label: 'Gramática e Norma Culta', accuracy: 48, totalAnswered: 9 },
    { value: 'generos-textuais', label: 'Gêneros Textuais', accuracy: 63, totalAnswered: 8 },
    {
      value: 'variacoes-linguisticas',
      label: 'Variações Linguísticas',
      accuracy: null,
      totalAnswered: 0,
    },
  ],
  'ciencias-humanas': [
    { value: 'historia-brasil', label: 'História do Brasil', accuracy: 60, totalAnswered: 15 },
    { value: 'geografia-politica', label: 'Geografia Política', accuracy: 42, totalAnswered: 12 },
    { value: 'filosofia', label: 'Filosofia', accuracy: 38, totalAnswered: 8 },
    { value: 'sociologia', label: 'Sociologia', accuracy: 67, totalAnswered: 6 },
    { value: 'geografia-fisica', label: 'Geografia Física', accuracy: null, totalAnswered: 0 },
  ],
  'ciencias-natureza': [
    { value: 'genetica', label: 'Genética', accuracy: 41, totalAnswered: 12 },
    { value: 'ecologia', label: 'Ecologia', accuracy: 67, totalAnswered: 9 },
    { value: 'quimica-organica', label: 'Química Orgânica', accuracy: 35, totalAnswered: 14 },
    { value: 'termodinamica', label: 'Termodinâmica', accuracy: 50, totalAnswered: 6 },
    { value: 'citologia', label: 'Citologia', accuracy: null, totalAnswered: 0 },
  ],
  matematica: [
    { value: 'funcoes', label: 'Funções', accuracy: 58, totalAnswered: 20 },
    { value: 'geometria-plana', label: 'Geometria Plana', accuracy: 44, totalAnswered: 16 },
    {
      value: 'probabilidade',
      label: 'Probabilidade e Estatística',
      accuracy: 70,
      totalAnswered: 10,
    },
    { value: 'porcentagem', label: 'Porcentagem e Razão', accuracy: 80, totalAnswered: 8 },
    { value: 'combinatoria', label: 'Análise Combinatória', accuracy: null, totalAnswered: 0 },
  ],
}

/**
 * Slugs alternativos → slug canônico do catálogo (dados legados / `topico_value` do banco).
 * Mantém um único `PACKAGES[key]` e rótulos do `MOCK_TOPICS`.
 */
const STUDY_TOPIC_VALUE_ALIASES: Record<string, string> = {
  'interpretacao-textual': 'interpretacao-texto',
}

export function resolveStudyTopicValue(value: string): string {
  return STUDY_TOPIC_VALUE_ALIASES[value] ?? value
}

const PACKAGES: Record<string, StudyPackage> = {
  genetica: {
    id: 'mock-pkg-genetica',
    areaKey: 'ciencias-natureza',
    topicoValue: 'genetica',
    topicoLabel: 'Genética',
    performance: { accuracy: 41, totalAnswered: 12 },
    summary: {
      title: 'Genética: dos genes à hereditariedade',
      content: `A **Genética** é o ramo da Biologia que estuda como as características são transmitidas de uma geração para outra. Tudo começa no **DNA** (ácido desoxirribonucleico), a molécula que carrega as instruções para construir e manter um organismo vivo.

### Conceitos fundamentais

O DNA é organizado em **genes**, que são trechos específicos que codificam proteínas ou regulam funções celulares. Os genes ficam nos **cromossomos**, estruturas presentes no núcleo das células. Humanos possuem **46 cromossomos** (23 pares).

### Leis de Mendel

Gregor Mendel, considerado o pai da Genética, formulou duas leis fundamentais:

- **1ª Lei (Segregação dos Fatores):** Cada característica é determinada por um par de fatores (alelos) que se separam na formação dos gametas.
- **2ª Lei (Segregação Independente):** Os fatores para duas ou mais características segregam-se de forma independente.

### Dominância e recessividade

Quando um organismo possui dois alelos diferentes para um gene (heterozigoto), o alelo **dominante** se expressa no fenótipo, enquanto o **recessivo** só se manifesta em homozigose.

### No ENEM

As questões de Genética no ENEM geralmente cobram interpretação de cruzamentos, probabilidade genética, heredogramas e relação genótipo-fenótipo. Fique atento a problemas que envolvem herança ligada ao sexo e codominância.`,
      keyPoints: [
        'DNA → Genes → Cromossomos (46 em humanos, 23 pares)',
        '1ª Lei de Mendel: alelos se separam nos gametas',
        '2ª Lei de Mendel: características segregam independentemente',
        'Dominante se expressa em heterozigose; recessivo só em homozigose',
        'ENEM: cruzamentos, heredogramas, probabilidade genética',
      ],
    },
    flashcards: [
      {
        front: 'O que é um gene?',
        back: 'Um trecho de DNA que codifica uma proteína ou regula uma função celular. É a unidade fundamental da hereditariedade.',
        difficulty: 'easy',
      },
      {
        front: 'Qual a diferença entre genótipo e fenótipo?',
        back: 'Genótipo é a composição genética (ex: Aa). Fenótipo é a característica observável (ex: olhos castanhos), resultado do genótipo + ambiente.',
        difficulty: 'easy',
      },
      {
        front: 'O que diz a 1ª Lei de Mendel?',
        back: 'Lei da Segregação dos Fatores: cada característica é determinada por um par de alelos que se separam durante a formação dos gametas, indo um para cada célula reprodutiva.',
        difficulty: 'medium',
      },
      {
        front: 'Um casal Aa x Aa: qual a probabilidade do filho ser "aa"?',
        back: '25% (1/4). O cruzamento gera: AA (25%), Aa (50%), aa (25%).',
        difficulty: 'medium',
      },
      {
        front: 'O que é herança ligada ao sexo?',
        back: 'Quando o gene está no cromossomo X. Exemplo: daltonismo e hemofilia. Homens (XY) manifestam com apenas um alelo recessivo; mulheres (XX) precisam de dois.',
        difficulty: 'hard',
      },
      {
        front: 'Qual a diferença entre dominância incompleta e codominância?',
        back: 'Dominância incompleta: heterozigoto tem fenótipo intermediário (ex: flor rosa de vermelho x branco). Codominância: ambos alelos se expressam simultaneamente (ex: sangue AB).',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Em uma espécie de planta, a cor vermelha da flor (V) é dominante sobre a cor branca (v). Se cruzarmos duas plantas heterozigotas (Vv x Vv), qual a proporção esperada de plantas com flores brancas na prole?',
        alternatives: [
          { letter: 'A', text: '100%', isCorrect: false },
          { letter: 'B', text: '75%', isCorrect: false },
          { letter: 'C', text: '50%', isCorrect: false },
          { letter: 'D', text: '25%', isCorrect: true },
          { letter: 'E', text: '0%', isCorrect: false },
        ],
        explanation:
          'O cruzamento Vv x Vv resulta em: VV (25%), Vv (50%), vv (25%). Apenas os indivíduos vv (homozigotos recessivos) terão flores brancas = 25%.',
      },
      {
        question:
          'O daltonismo é uma condição recessiva ligada ao cromossomo X. Uma mulher portadora (XᴰXᵈ) casa-se com um homem normal (XᴰY). Qual a probabilidade de terem um filho homem daltônico?',
        alternatives: [
          { letter: 'A', text: '0%', isCorrect: false },
          { letter: 'B', text: '25%', isCorrect: true },
          { letter: 'C', text: '50%', isCorrect: false },
          { letter: 'D', text: '75%', isCorrect: false },
          { letter: 'E', text: '100%', isCorrect: false },
        ],
        explanation:
          'A mãe XᴰXᵈ pode passar Xᴰ ou Xᵈ. O pai passa Y para filhos homens. Logo: metade dos filhos homens será XᵈY (daltônico) e metade XᴰY (normal). Como metade dos filhos são homens, a chance geral é 1/4 = 25%.',
      },
      {
        question: 'Na 2ª Lei de Mendel, a segregação independente ocorre porque:',
        alternatives: [
          { letter: 'A', text: 'Os genes estão sempre no mesmo cromossomo', isCorrect: false },
          {
            letter: 'B',
            text: 'Os cromossomos homólogos se separam aleatoriamente na meiose',
            isCorrect: true,
          },
          { letter: 'C', text: 'O DNA não sofre recombinação', isCorrect: false },
          { letter: 'D', text: 'Todos os alelos são codominantes', isCorrect: false },
          { letter: 'E', text: 'A mitose distribui os cromossomos igualmente', isCorrect: false },
        ],
        explanation:
          'A 2ª Lei de Mendel se aplica quando os genes estão em cromossomos diferentes. Na meiose I, os cromossomos homólogos se separam de forma independente e aleatória, gerando combinações variadas nos gametas.',
      },
    ],
    mindMap: {
      topic: 'Genética',
      root: {
        id: '1',
        label: 'Genética',
        children: [
          {
            id: '2',
            label: 'Bases Moleculares',
            children: [
              { id: '2a', label: 'DNA e RNA' },
              { id: '2b', label: 'Genes' },
              { id: '2c', label: 'Cromossomos (46)' },
            ],
          },
          {
            id: '3',
            label: 'Leis de Mendel',
            children: [
              { id: '3a', label: '1ª Lei: Segregação' },
              { id: '3b', label: '2ª Lei: Segregação Independente' },
              { id: '3c', label: 'Cruzamentos e Proporções' },
            ],
          },
          {
            id: '4',
            label: 'Padrões de Herança',
            children: [
              { id: '4a', label: 'Dominância completa' },
              { id: '4b', label: 'Codominância (ex: AB)' },
              { id: '4c', label: 'Herança ligada ao sexo' },
              { id: '4d', label: 'Heredogramas' },
            ],
          },
        ],
      },
    },
  },
  'geometria-plana': {
    id: 'mock-pkg-geometria',
    areaKey: 'matematica',
    topicoValue: 'geometria-plana',
    topicoLabel: 'Geometria Plana',
    performance: { accuracy: 44, totalAnswered: 16 },
    summary: {
      title: 'Geometria Plana: áreas, perímetros e relações',
      content: `A **Geometria Plana** estuda figuras bidimensionais — formas que existem em um plano. É um dos temas mais recorrentes no ENEM, cobrando cálculo de áreas, perímetros e relações entre figuras.

### Figuras fundamentais

- **Triângulo:** três lados, soma dos ângulos internos = 180°. Área = (base × altura) / 2.
- **Quadriláteros:** quadrado, retângulo, paralelogramo, trapézio, losango.
- **Círculo:** área = πr², perímetro (circunferência) = 2πr.

### Teorema de Pitágoras

Em todo **triângulo retângulo**: a² = b² + c², onde "a" é a hipotenusa. Fundamental para resolver problemas de distância e medidas indiretas.

### Semelhança de triângulos

Dois triângulos são semelhantes se têm ângulos iguais. Nesse caso, os lados são proporcionais. Muito cobrado no ENEM em contextos práticos (sombra, espelho, maquete).

### Dicas para o ENEM

Pratique converter situações do cotidiano em figuras geométricas. Muitas questões trazem contextos como: plantas de casas, terrenos, embalagens ou esportes.`,
      keyPoints: [
        'Triângulo: área = (b × h) / 2, ângulos somam 180°',
        'Pitágoras: a² = b² + c² (triângulo retângulo)',
        'Círculo: área = πr², circunferência = 2πr',
        'Semelhança: ângulos iguais → lados proporcionais',
        'ENEM: contextos práticos (terrenos, plantas, embalagens)',
      ],
    },
    flashcards: [
      {
        front: 'Qual a fórmula da área de um triângulo?',
        back: 'Área = (base × altura) / 2',
        difficulty: 'easy',
      },
      {
        front: 'Enuncie o Teorema de Pitágoras',
        back: 'Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: a² = b² + c²',
        difficulty: 'easy',
      },
      {
        front: 'Qual a área de um círculo de raio 5 cm?',
        back: 'A = πr² = π × 25 = 25π ≈ 78,54 cm²',
        difficulty: 'medium',
      },
      {
        front: 'Quando dois triângulos são semelhantes?',
        back: 'Quando têm todos os ângulos correspondentes iguais (AA). Nesse caso, os lados correspondentes são proporcionais.',
        difficulty: 'medium',
      },
      {
        front: 'Qual a área de um trapézio?',
        back: 'A = [(Base maior + Base menor) × altura] / 2',
        difficulty: 'medium',
      },
      {
        front: 'Um triângulo retângulo tem catetos 3 e 4. Qual a hipotenusa?',
        back: 'h² = 3² + 4² = 9 + 16 = 25 → h = 5',
        difficulty: 'easy',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Um terreno retangular tem 30 m de comprimento e 20 m de largura. Deseja-se construir um jardim circular de raio 5 m no centro do terreno. Qual a área restante do terreno?',
        alternatives: [
          { letter: 'A', text: '600 - 25π m²', isCorrect: true },
          { letter: 'B', text: '600 - 10π m²', isCorrect: false },
          { letter: 'C', text: '500 - 25π m²', isCorrect: false },
          { letter: 'D', text: '600 - 50π m²', isCorrect: false },
          { letter: 'E', text: '520 m²', isCorrect: false },
        ],
        explanation:
          'Área do terreno = 30 × 20 = 600 m². Área do jardim circular = πr² = π × 25 = 25π m². Área restante = 600 - 25π m².',
      },
      {
        question:
          'Uma escada de 10 m está apoiada em uma parede, com o pé a 6 m da base da parede. A que altura da parede a escada alcança?',
        alternatives: [
          { letter: 'A', text: '4 m', isCorrect: false },
          { letter: 'B', text: '6 m', isCorrect: false },
          { letter: 'C', text: '8 m', isCorrect: true },
          { letter: 'D', text: '10 m', isCorrect: false },
          { letter: 'E', text: '12 m', isCorrect: false },
        ],
        explanation:
          'Pelo Teorema de Pitágoras: 10² = 6² + h² → 100 = 36 + h² → h² = 64 → h = 8 m.',
      },
      {
        question:
          'Dois triângulos semelhantes têm lados na razão 2:3. Se a área do menor é 20 cm², qual a área do maior?',
        alternatives: [
          { letter: 'A', text: '30 cm²', isCorrect: false },
          { letter: 'B', text: '45 cm²', isCorrect: true },
          { letter: 'C', text: '40 cm²', isCorrect: false },
          { letter: 'D', text: '60 cm²', isCorrect: false },
          { letter: 'E', text: '50 cm²', isCorrect: false },
        ],
        explanation:
          'A razão das áreas é o quadrado da razão dos lados: (3/2)² = 9/4. Área do maior = 20 × 9/4 = 45 cm².',
      },
    ],
    mindMap: {
      topic: 'Geometria Plana',
      root: {
        id: '1',
        label: 'Geometria Plana',
        children: [
          {
            id: '2',
            label: 'Triângulos',
            children: [
              { id: '2a', label: 'Área = (b×h)/2' },
              { id: '2b', label: 'Pitágoras: a²=b²+c²' },
              { id: '2c', label: 'Semelhança (AA)' },
            ],
          },
          {
            id: '3',
            label: 'Quadriláteros',
            children: [
              { id: '3a', label: 'Retângulo: b×h' },
              { id: '3b', label: 'Trapézio: (B+b)×h/2' },
              { id: '3c', label: 'Losango: (D×d)/2' },
            ],
          },
          {
            id: '4',
            label: 'Círculos',
            children: [
              { id: '4a', label: 'Área = πr²' },
              { id: '4b', label: 'Circunferência = 2πr' },
              { id: '4c', label: 'Setor circular' },
            ],
          },
        ],
      },
    },
  },
  'interpretacao-texto': {
    id: 'mock-pkg-interpretacao-texto',
    areaKey: 'linguagens',
    topicoValue: 'interpretacao-texto',
    topicoLabel: 'Interpretação Textual',
    performance: { accuracy: 72, totalAnswered: 18 },
    summary: {
      title: 'Interpretação textual: sentido, inferência e coesão',
      content: `A **interpretação** não é “achismo”: você ancora respostas em **evidências** do texto (trechos, vocabulário, estrutura argumentativa e ilustrações).

### Níveis de leitura

- **Literal:** o que está explicitamente dito.
- **Inferencial:** o que se deduz sem contradizer o texto.
- **crítica/aplicada:** julgamento fundamentado ou efeitos de escolhas linguísticas — sempre amarrado ao enunciado.

### Coesão e progressão temática

Observe **conectores**, **sinônimos** de retomada, **anáfora** (o “ele” de quem?), substituições por **hipônimos/hiperônimos** e **paráfrases**. Eles costumam carregar a **tese**.

### Intertextualidade no ENEM

Charges, tirinhas, propaganda, notícia, crônica, artigo de opinião e literatura aparecem como **porteiras** para o mesmo núcleo: **intenção**, **público**, **tom** e **efeito de sentido**.`,
      keyPoints: [
        'Resposta apoiada no texto: citação lógica, não importação de conhecimento externo',
        'Inferência: consequência razoável a partir do que está dito',
        'Coesão lexical e gramatical guiam a continuidade do sentido',
        'Gênero e suporte (imagem, título, legenda) participam da construção de sentido',
      ],
    },
    flashcards: [
      {
        front: 'O que é inferência em interpretação?',
        back: 'Conclusão compatível com o texto, embora não esteja ditada palavra por palavra — desde que não haja contradição.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença entre tema e tese (uso prático no ENEM)?',
        back: '**Tema** é o assunto central; **tese** é a posição defendida (o “lado” do autor) — identifique verbos de modalização e julgamento.',
        difficulty: 'easy',
      },
      {
        front: 'Para que serve um conectivo adversativo (“porém”, “contudo”)?',
        back: 'Marca contraste ou restrição: o trecho seguinte costuma **qualificar ou limitar** o anterior — a questão muitas vezes testa esse giro.',
        difficulty: 'medium',
      },
      {
        front: 'Ironia no texto: como reconhecer?',
        back: 'Há **dissonância** entre literal e intenção: tom, contexto ou contradição interna indicam que o autor diz o oposto do que defende superficialmente.',
        difficulty: 'medium',
      },
      {
        front: 'Função de uma expressão destacada em negrito ou aspas?',
        back: 'Pode marcar **ênfase**, **citação**, **ironia**, **termo técnico** ou **efeito conotativo** — a resposta exige relação com o efeito no parágrafo.',
        difficulty: 'hard',
      },
      {
        front: 'Por que “verdade do mundo real” não autoriza mudar o sentido do texto?',
        back: 'No ENEM, prevalece o **universo discursivo** do texto. Conhecimento externo só entra quando o enunciado pede e **não contraria** o arranjo semântico.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Leia: “Ela chegou cedo, mas todas as cadeiras já estavam ocupadas.” O conectivo “mas” estabelece relação de:',
        alternatives: [
          { letter: 'A', text: 'Causa', isCorrect: false },
          { letter: 'B', text: 'Consequência', isCorrect: false },
          { letter: 'C', text: 'Oposição ou restrição', isCorrect: true },
          { letter: 'D', text: 'Conclusão', isCorrect: false },
          { letter: 'E', text: 'Exemplificação', isCorrect: false },
        ],
        explanation:
          '“Mas” introduz contraste entre “chegou cedo” e “sem lugar” — relação adversativa que restringe a expectativa criada na primeira oração.',
      },
      {
        question:
          'Um artigo afirma que “a pressa é inimiga da clareza” e em seguida descreve erros comuns em relatórios. A principal função da metáfora inicial é:',
        alternatives: [
          { letter: 'A', text: 'Antecipar o tom irónico do título', isCorrect: false },
          {
            letter: 'B',
            text: 'Sintetizar a ideia de que rapidez compromete a compreensão',
            isCorrect: true,
          },
          { letter: 'C', text: 'Caracterizar o ritmo da linguagem oral', isCorrect: false },
          { letter: 'D', text: 'Substituir dados estatísticos', isCorrect: false },
          { letter: 'E', text: 'Indicar que o texto é literário-ficcional', isCorrect: false },
        ],
        explanation:
          'A expressão condensa a tese: apressar-se gera texto confuso — alinhada aos exemplos de relatórios pouco claros.',
      },
      {
        question:
          'Em uma notícia, o lead diz que “o índice subiu”. No corpo, explica-se que a alta foi de 1 ponto percentual em uma base pequena. Qual leitura é inferencial e adequada?',
        alternatives: [
          {
            letter: 'A',
            text: 'O lead mente, pois números jamais sobem',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'A manchete pode sugerir impacto maior do que o detalhe numérico mostra',
            isCorrect: true,
          },
          { letter: 'C', text: 'O texto é predominantemente literário', isCorrect: false },
          { letter: 'D', text: '“Índice” sempre significa inflação', isCorrect: false },
          { letter: 'E', text: 'O lead anula o corpo da notícia', isCorrect: false },
        ],
        explanation:
          'Inferência válida: título e lead focam a “alta”, enquanto o corpo qualifica magnitude — leitor atento reconcilia as camadas informativas.',
      },
    ],
    mindMap: {
      topic: 'Interpretação Textual',
      root: {
        id: '1',
        label: 'Interpretação',
        children: [
          {
            id: '2',
            label: 'Evidências',
            children: [
              { id: '2a', label: 'Literal vs inferencial' },
              { id: '2b', label: 'Título e paratextos' },
            ],
          },
          {
            id: '3',
            label: 'Coesão',
            children: [
              { id: '3a', label: 'Conectivos' },
              { id: '3b', label: 'Referenciação (anafora)' },
            ],
          },
          {
            id: '4',
            label: 'Efeitos',
            children: [
              { id: '4a', label: 'Ironia e humor' },
              { id: '4b', label: 'Interdisciplinaridade' },
            ],
          },
        ],
      },
    },
  },
  literatura: {
    id: 'mock-pkg-literatura',
    areaKey: 'linguagens',
    topicoValue: 'literatura',
    topicoLabel: 'Literatura Brasileira',
    performance: { accuracy: 55, totalAnswered: 11 },
    summary: {
      title: 'Literatura brasileira: escolas, vozes e leitura de obra',
      content: `O ENEM costuma trabalhar **literatura como prática de leitura**: movimentos estéticos (arcadismo, barroco, romantismo, realismo-naturalismo, modernismo e vertentes contemporâneas), **procedimentos** (ironia, metalinguagem, intertextualidade) e **relação texto-contexto**.

### Como montar leitura rápida e segura

1. Identifique **época**, **tom** e **pessoa do discurso** (narrador omnisciente, testemunha, personagem).
2. Marque **núcleos conflitivos**: poder, identidade, cidade versus campo, desigualdade, memória.
3. Relacione trecho à **estrategia estética** — por exemplo, verossimilhança crítica no realismo versus idealização romântica.

### Autores de referência (não decorar data)

Esteja confortável para reconhecer **marcas de estilo** em trechos de: Gregório de Matos, Bocage, Gonçalves Dias, Alencar, Machado de Assis, Euclides da Cunha, Augusto dos Anjos, Manuel Bandeira, Drummond, Clarice Lispector — sem necessidade de “nomear escola” se o enunciado já contextualiza.`,
      keyPoints: [
        'Literatura no ENEM privilegia procedimentos de significação, não só biografia autoral',
        'Narrador e focalização moldam o que o leitor “sabe” do mundo ficcional',
        'Modernismo e contemporaneidade exploram linguagem, incompletude e hibridismo de gêneros',
      ],
    },
    flashcards: [
      {
        front: 'O que caracteriza fortemente o lirismo do Romantismo brasileiro?',
        back: 'Subjetividade intensa, idealização (nação, índio, natureza), e linguagem melodiosa — com exceções satíricas dependendo do autor.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença básica: Romantismo vs Realismo/Naturalismo?',
        back: 'Romantismo tende à **idealização**; realismo-naturalismo enfatiza **crítica social**, causalidade e descrição detalhada do ambiente.',
        difficulty: 'easy',
      },
      {
        front: 'Por que Machado de Assis é central no vestibular?',
        back: 'Ironia fina, **perspectiva** narrativa perspicaz e análise de costumes — frequentemente voz de narrador que **filtra** julgamentos.',
        difficulty: 'medium',
      },
      {
        front: 'O que é metalinguagem em literatura?',
        back: 'O texto fala **sobre** a própria linguagem ou o ato de escrever/ler — comum em modernismo e pós-modernidade leve.',
        difficulty: 'medium',
      },
      {
        front: 'Barroco no Brasil: eixo frecuente em questões?',
        back: 'Jogo de **antíteses**, moral religiosa, **conceptismo**, gradação, ironia — leia buscando oposições e paradoxo.',
        difficulty: 'hard',
      },
      {
        front: 'Literatura marginal / contemporânea: o que costuma cair?',
        back: 'Voz popular, crítica urbana, hibridização com música/cordel, desmontagem de canonicidade — atenção a **registro** e **interlocução**.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Em um conto, o narrador afirma que “ninguém sai ileso do próprio mito”. Esse tipo de formulação tende a configurar:',
        alternatives: [
          { letter: 'A', text: 'Descrição naturalista de laboratório', isCorrect: false },
          {
            letter: 'B',
            text: 'Reflexão sobre identidade e narrativas que moldam o sujeito',
            isCorrect: true,
          },
          {
            letter: 'C',
            text: 'Relato estritamente documental sem camada simbólica',
            isCorrect: false,
          },
          { letter: 'D', text: 'Panfleto publicitário', isCorrect: false },
          { letter: 'E', text: 'Manual de regras gramaticais', isCorrect: false },
        ],
        explanation:
          'A metáfora problematiza fantasias pessoais/coletivas (“mito”) e seus efeitos — eixo típico de ficção contemporânea e ensaística.',
      },
      {
        question:
          'Um soneto apresenta esquema ABBA ABBA CDE CDE em vocabulário arcaizante e moral religiosa explícita. Hipótese estilística mais provável:',
        alternatives: [
          { letter: 'A', text: 'Tropicalismo dos anos 1970', isCorrect: false },
          { letter: 'B', text: 'Fitinha de frevo', isCorrect: false },
          {
            letter: 'C',
            text: 'Marcas associáveis ao Arcadismo ou barroco tardio de feição culta',
            isCorrect: true,
          },
          { letter: 'D', text: 'Poesia concreta', isCorrect: false },
          { letter: 'E', text: 'Cordel contemporâneo nordestino', isCorrect: false },
        ],
        explanation:
          'Soneto fixo + léxico e moral religiosa apontam para ambiente classicista ou barroco culto — não para experimentação tipográfica concretista.',
      },
      {
        question:
          'Trecho em 3ª pessoa com focalização limitada em um adolescente. O leitor pode afirmar, sem extrapolar:',
        alternatives: [
          {
            letter: 'A',
            text: 'Todos os personagens pensam exatamente o que o narrador diz',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'O acesso a pensamentos se restringe, em regra, à consciência acompanhada',
            isCorrect: true,
          },
          { letter: 'C', text: 'Há certeza de autobiografia real do autor', isCorrect: false },
          {
            letter: 'D',
            text: 'O narrador é sempre personagem cúmplice em 1ª pessoa',
            isCorrect: false,
          },
          { letter: 'E', text: 'O texto é epístola obrigatória', isCorrect: false },
        ],
        explanation:
          'Focalização limitada filtra percepções: não autoriza omnisciência gratuita sobre demais personagens.',
      },
    ],
    mindMap: {
      topic: 'Literatura Brasileira',
      root: {
        id: '1',
        label: 'Literatura BR',
        children: [
          {
            id: '2',
            label: 'Estéticas',
            children: [
              { id: '2a', label: 'Barroco / Arcadismo' },
              { id: '2b', label: 'Romantismo / Realismo' },
              { id: '2c', label: 'Modernismo / Contemp.' },
            ],
          },
          {
            id: '3',
            label: 'Narração',
            children: [
              { id: '3a', label: 'Narrador e foco' },
              { id: '3b', label: 'Tempo e espaço' },
            ],
          },
          {
            id: '4',
            label: 'Procedimentos',
            children: [
              { id: '4a', label: 'Ironia' },
              { id: '4b', label: 'Intertextualidade' },
            ],
          },
        ],
      },
    },
  },
  gramatica: {
    id: 'mock-pkg-gramatica',
    areaKey: 'linguagens',
    topicoValue: 'gramatica',
    topicoLabel: 'Gramática e Norma Culta',
    performance: { accuracy: 48, totalAnswered: 9 },
    summary: {
      title: 'Gramática e norma culta: funções, regência e coerência',
      content: `**Norma culta** não é “gosto pessoal”: é conjunto de **padrões** de uso formal (oral e escrito) em contextos públicos. Questões misturam **análise sintática** (termos, períodos, concordância, regência, colocação pronominal) com **semântica** e **adequação** ao gênero.

### Funções sintáticas essenciais

Sujeito, predicado, complementos (**objeto direto/indireto**), adjunto adnominal/adverbial, aposto, vocativo. Saiba reconhecer **orações subordinadas** e **coordenadas**.

### Regência e crase

Verbo-nome **exige** complemento fixo? Preposição **obrigatória**? **Caso** da crase: fusão de preposição “a” + artigo “a(s)” — teste “substituir por ao/adigo”.

### Coerência x coesão

**Coesão** liga frases (gramaticalmente); **coerência** garante **sentido global** sem contradições.`,
      keyPoints: [
        'Identifique o núcleo do período antes de classificar funções',
        'Regência verbal e nominal vem de dicionário de regência — padronize verbos problemáticos',
        'Colocação pronominal: próclise, enclise, mesóclise em função de atrativo e início de frase',
      ],
    },
    flashcards: [
      {
        front: 'O que é predicado verbal?',
        back: 'Exige verbo **pleno de significação**; pode ser intransitivo, transitivo direto/indireto ou com dois complementos.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença entre objeto direto e indireto?',
        back: 'OD sem preposição obrigatória (salvo casos especiais); OI liga-se ao verbo/nome **com preposição**.',
        difficulty: 'easy',
      },
      {
        front: 'Quando a mesóclise é exigida?',
        back: 'Verbo no futuro do presente ou pretérito do subjuntivo **com** prónome átono em início sem atrativo: *Dar-se-á*, *Fá-lo-ei* (uso formal rarefeito no dia a dia, mas cai em prova).',
        difficulty: 'medium',
      },
      {
        front: 'Concordância com "um bando de / a maioria de"?',
        back: '"Um bando de X" concorda com **bando** (coletivo partitivo seguido de plural costuma flexionar plural o verbo em uso moderno — leia o enunciado: o ENEM explicita a variante pretendida). **A maioria de os** → plural popular; **maioria** como substantivo coletivo → singular possível.',
        difficulty: 'medium',
      },
      {
        front: 'Crase antes de palavras femininas: sempre?',
        back: 'Não. Precisa **a** artigo + **a** preposicional fusionáveis; locuções como *à noite* vs *a noite* dependem de sentido (hora vs período).',
        difficulty: 'hard',
      },
      {
        front: 'Por que "para mim fazer" costuma ser marcado como inadequado à norma culta?',
        back: 'Construção popular; culto prefere **para eu fazer** ou reestruturação (**de modo que eu faça**). ENEM testa adequação ao registro formal.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Assinale a frase em **norma culta** para contexto administrativo:',
        alternatives: [
          { letter: 'A', text: 'Houveram muitos problemas na entrega.', isCorrect: false },
          { letter: 'B', text: 'Houve muitos problemas na entrega.', isCorrect: true },
          { letter: 'C', text: 'Fizemos um contrato entre eu e ela.', isCorrect: false },
          { letter: 'D', text: 'Duvido ele vir amanhã.', isCorrect: false },
          { letter: 'E', text: 'Para mim entender, explica melhor.', isCorrect: false },
        ],
        explanation:
          '“Haver” no sentido de existir/ ocorrer usa-se impessoalmente: *Houve...*; demais alternativas apresentam colocação pronominal, crase ou concordância não cultas.',
      },
      {
        question:
          'Em “Entregaram-lhe os documentos”, o pronome “lhe” tem qual função sintática básica?',
        alternatives: [
          { letter: 'A', text: 'Sujeito simples', isCorrect: false },
          { letter: 'B', text: 'Objeto direto', isCorrect: false },
          {
            letter: 'C',
            text: 'Objeto indireto (beneficiário ou destinatário da entrega)',
            isCorrect: true,
          },
          { letter: 'D', text: 'Adjunto adnominal', isCorrect: false },
          { letter: 'E', text: 'Predicativo do sujeito', isCorrect: false },
        ],
        explanation:
          '“Entregar algo **a** alguém” — “lhe” substitui complemento com preposição → OI; “os documentos” é OD.',
      },
      {
        question: 'Crase opcional por **eufonia** ocorre tipicamente em:',
        alternatives: [
          { letter: 'A', text: 'Substantivo masculino iniciado por consoante', isCorrect: false },
          {
            letter: 'B',
            text: 'Palavra cujo início evita choque de sons iguais (ex.: *à_f* / gesto de pausa)',
            isCorrect: true,
          },
          { letter: 'C', text: 'Todos os verbos no infinitivo', isCorrect: false },
          { letter: 'D', text: 'Pronomes oblíquos átonos', isCorrect: false },
          { letter: 'E', text: 'Qualquer substantivo feminino sem artigo', isCorrect: false },
        ],
        explanation:
          'Eufonia dispensa crase quando o som duplicado seria incômodo — clássico exemplo debate *à escola* com pausa fonética vs uso editorial.',
      },
    ],
    mindMap: {
      topic: 'Gramática e Norma Culta',
      root: {
        id: '1',
        label: 'Norma culta',
        children: [
          {
            id: '2',
            label: 'Análise sintática',
            children: [
              { id: '2a', label: 'Termos da oração' },
              { id: '2b', label: 'Período composto' },
            ],
          },
          {
            id: '3',
            label: 'Acento normativo',
            children: [
              { id: '3a', label: 'Concordância/regência' },
              { id: '3b', label: 'Colocação pronominal' },
            ],
          },
          {
            id: '4',
            label: 'Uso adequado',
            children: [
              { id: '4a', label: 'Registro formal' },
              { id: '4b', label: 'Coesão' },
            ],
          },
        ],
      },
    },
  },
  'generos-textuais': {
    id: 'mock-pkg-generos-textuais',
    areaKey: 'linguagens',
    topicoValue: 'generos-textuais',
    topicoLabel: 'Gêneros Textuais',
    performance: { accuracy: 63, totalAnswered: 8 },
    summary: {
      title: 'Gêneros textuais: forma, função social e leitura estratégica',
      content: `**Gênero** é habit socialmente reconhecido: *notícia, editorial, receita, e-mail formal, resenha, verbete, carta ao leitor*. A prova cobra **finalidade**, **estrutura macro** (título, lead, corpo, conclusão) e **marca linguística** (modalização, objeividade).

### Dica de ouro

Pergunte sempre: **quem fala?** para **quem?** em **qual canal?** com **que intenção?** — isso previne confundir editorial com notícia, ou relatório com depoimento oral.

### Multimodalidade

Figuras, gráficos e botões de CTA participam do gênero publicitário ou informativo digital — leia **layout** como parte do sentido.`,
      keyPoints: [
        'Notícia: fato verificável, inverted pyramid; opinião restrita a citações',
        'Artigo de opinião / editorial: tese explícita e argumentos',
        'Gênero digital: hiperlink, hashtags e estrutura não linear importam',
      ],
    },
    flashcards: [
      {
        front: 'Diferença fundamental: notícia x comentário/opinião?',
        back: 'Notícia privilegia **imparcialidade factual**; comentário **posiciona** o autor sobre os fatos.',
        difficulty: 'easy',
      },
      {
        front: 'O que é lead?',
        back: 'Primeiro parágrafo da notícia que concentra **5W** (quem, o quê, quando, onde, por quê) de forma sintética.',
        difficulty: 'easy',
      },
      {
        front: 'Para que serve uma *resenha*?',
        back: 'Sintetiza e **julga** obra cultural (livro, filme) com critérios explícitos — não é apenas ficha catalográfica.',
        difficulty: 'medium',
      },
      {
        front: 'E-mail formal: marcas comuns?',
        back: 'Assunto objetivo, vocativo, desenvolvimento em parágrafos, despedida e assinatura — evita ícones informais.',
        difficulty: 'medium',
      },
      {
        front: 'Charge x cartum x tira?',
        back: 'Todos são **visuais + verbal**, mas charge tende à **crítica política/social** imediata; tira narrativa prolonga personagens.',
        difficulty: 'hard',
      },
      {
        front: 'Gênero híbrido em mídias sociais: leitura?',
        back: 'Legendas e áudio podem divergir (armadilha de ironia); vídeo curto pode usar **jogada** entre plano verbal e musical.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Texto A apresenta dados de pesquisa sem adjetivação; Texto B conclama boicote a uma marca. A classificação mais adequada seria:',
        alternatives: [
          { letter: 'A', text: 'Ambos editoriais', isCorrect: false },
          {
            letter: 'B',
            text: 'A como notícia ou fato; B como texto de opinião ou campanha',
            isCorrect: true,
          },
          { letter: 'C', text: 'Ambos são verbetes de enciclopédia', isCorrect: false },
          { letter: 'D', text: 'A é poesia épica; B é receita culinária', isCorrect: false },
          { letter: 'E', text: 'A é fábula; B é laudo pericial obrigatório', isCorrect: false },
        ],
        explanation:
          'Tom neutro e dados = gênero informativo; conclamação e apelo = opinião mobilizadora.',
      },
      {
        question:
          'Em anúncio com slogan imperativo (“Experimente já!”) e cores vibrantes, o efeito pretendido costuma ser:',
        alternatives: [
          { letter: 'A', text: 'Informar laudo técnico', isCorrect: false },
          { letter: 'B', text: 'Induzir ação imediata do consumidor', isCorrect: true },
          { letter: 'C', text: 'Neutralizar emoção', isCorrect: false },
          { letter: 'D', text: 'Formalizar contrato jurídico', isCorrect: false },
          { letter: 'E', text: 'Registrar patente científica', isCorrect: false },
        ],
        explanation: 'Imperativo + apelo visual = persuasão publicitária com CTA.',
      },
      {
        question:
          'Bula de remédio prioriza vocabulário denotativo, listas e pré-condições de uso por quê?',
        alternatives: [
          { letter: 'A', text: 'Cumprir função persuasiva humorística', isCorrect: false },
          {
            letter: 'B',
            text: 'Garantir instrução clara e minimizar ambiguidade de saúde',
            isCorrect: true,
          },
          { letter: 'C', text: 'Substituir receituário médico', isCorrect: false },
          { letter: 'D', text: 'Cumprir apenas função estética literária', isCorrect: false },
          { letter: 'E', text: 'Impedir leitura por leigos', isCorrect: false },
        ],
        explanation:
          'Gênero regulado/instrucional exige precisão e baixa carga conotativa — segurança do leitor.',
      },
    ],
    mindMap: {
      topic: 'Gêneros Textuais',
      root: {
        id: '1',
        label: 'Gêneros',
        children: [
          {
            id: '2',
            label: 'Informar',
            children: [
              { id: '2a', label: 'Notícia / reportagem' },
              { id: '2b', label: 'Infográfico' },
            ],
          },
          {
            id: '3',
            label: 'Opinar',
            children: [
              { id: '3a', label: 'Artigo / crônica' },
              { id: '3b', label: 'Review / resenha' },
            ],
          },
          {
            id: '4',
            label: 'Instruir',
            children: [
              { id: '4a', label: 'Manual / bula' },
              { id: '4b', label: 'Receita / tutorial' },
            ],
          },
        ],
      },
    },
  },
  'variacoes-linguisticas': {
    id: 'mock-pkg-variacoes-linguisticas',
    areaKey: 'linguagens',
    topicoValue: 'variacoes-linguisticas',
    topicoLabel: 'Variações Linguísticas',
    performance: { accuracy: 0, totalAnswered: 0 },
    summary: {
      title: 'Variação linguística: história, espaço, prestígio e preconceito',
      content: `Língua viva **varia** por **tempo** (histórica), **espaço** (regional), **situação** (culta x coloquial), **grupo social** (idade, etnia, profissão). Nenhuma variedade é “errada por natureza” — **adequação** depende de **contexto** e **efeito social**.

### Prestígio linguístico

Sociedade atribui **valor** a certas formas (norma culta escrita) — conhecer isso **não** legitima discriminação: o ENEM cobra **respeito** à diversidade e **uso consciente**.

### Contato linguístico

Emigração, mídia, tecnologia e bilinguismo produzem **hibridismos** e **empréstimos**.`,
      keyPoints: [
        'Diferenciar “norma” de “preconceito” — análise sociolingüística',
        'Marcas regionais (vocabulário, fonética) são sistemáticas dentro da variedade',
        'Registro informal pode ser adequado em conversa, inadequado em edital',
      ],
    },
    flashcards: [
      {
        front: 'O que é variedade regional?',
        back: 'Conjunto de traços (fonologia, léxico, morfossintaxe) típicos de uma região — ex.: *trem* por *ônibus* no Sul/Sudeste em alguns usos.',
        difficulty: 'easy',
      },
      {
        front: 'Variação histórica dá exemplo:',
        back: 'Arcaísmos, mudança semântica (*menina* já foi ‘criança de sexo masculino’ em português medieval) — texto antigo exige leitura contextual.',
        difficulty: 'easy',
      },
      {
        front: 'Por que “vulgar” não é sinônimo de “incorreto” na linguística?',
        back: '“Vulgar/popular” descreve **uso** frequente em interação informal — julgamento moral costuma ser **extralingüístico**.',
        difficulty: 'medium',
      },
      {
        front: 'O que é code-switching?',
        back: 'Alternância de idiomas ou variedades **na mesma interação** — comum em comunidades bilíngues.',
        difficulty: 'medium',
      },
      {
        front: 'Relação língua x poder no ENEM?',
        back: 'Textos denunciam **preconceito linguístico** contra falantes de variedades não hegemônicas — leia para posição crítica do autor.',
        difficulty: 'hard',
      },
      {
        front: 'Diferença: norma x padrão?',
        back: '“Padrão culto” é **idealização** pedagógica; “norma” descreve regularidades estatisticamente dominantes em um registro — sentidos se cruzam em prova.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Professor corrige sotaque de aluno dizendo que “falar certo é falar como TV”. O texto-base mais provável para o ENEM criticaria:',
        alternatives: [
          { letter: 'A', text: 'Uso de tecnologia', isCorrect: false },
          {
            letter: 'B',
            text: 'Pressuposto de superioridade de uma variedade em detrimento de identidade regional',
            isCorrect: true,
          },
          { letter: 'C', text: 'Importância da audição', isCorrect: false },
          { letter: 'D', text: 'Existência de fonemas', isCorrect: false },
          {
            letter: 'E',
            text: 'Diferença entre língua e dialeto (negação absoluta)',
            isCorrect: false,
          },
        ],
        explanation:
          'Crítica típica ao preconceito linguístico: confundir prestígio social com correção absoluta.',
      },
      {
        question:
          'Em conversa entre amigos, alta informalidade é marcada; no edital público, mesma forma seria:',
        alternatives: [
          { letter: 'A', text: 'Sempre obrigatória', isCorrect: false },
          { letter: 'B', text: 'Possível inadequação ao registro esperado', isCorrect: true },
          { letter: 'C', text: 'Obrigatoriamente humorística', isCorrect: false },
          { letter: 'D', text: 'sinônimo de oralidade incorreta', isCorrect: false },
          { letter: 'E', text: 'vedada em qualquer língua natural', isCorrect: false },
        ],
        explanation:
          'Adequação discursiva: mesma língua, registros diferentes — formalidade contextual.',
      },
      {
        question: 'Empréstimo lexical (*feedback*, *delivery*) indica:',
        alternatives: [
          { letter: 'A', text: 'Erro de digitação', isCorrect: false },
          { letter: 'B', text: 'Contato cultural e necessidade denominativa', isCorrect: true },
          { letter: 'C', text: 'Ausência de linguística', isCorrect: false },
          { letter: 'D', text: 'Uso exclusivo de poesia barroca', isCorrect: false },
          { letter: 'E', text: 'Fim da gramática', isCorrect: false },
        ],
        explanation:
          'Línguas emprestam vocabulário por contato — processo histórico normal, não “erro”.',
      },
    ],
    mindMap: {
      topic: 'Variações Linguísticas',
      root: {
        id: '1',
        label: 'Variação',
        children: [
          {
            id: '2',
            label: 'Dimensões',
            children: [
              { id: '2a', label: 'Geográfica' },
              { id: '2b', label: 'Social / situacional' },
            ],
          },
          {
            id: '3',
            label: 'Ideologia',
            children: [
              { id: '3a', label: 'Preconceito' },
              { id: '3b', label: 'Políticas linguísticas' },
            ],
          },
          {
            id: '4',
            label: 'Aplicação',
            children: [
              { id: '4a', label: 'Adequação' },
              { id: '4b', label: 'Multilinguismo' },
            ],
          },
        ],
      },
    },
  },
  'historia-brasil': {
    id: 'mock-pkg-historia-brasil',
    areaKey: 'ciencias-humanas',
    topicoValue: 'historia-brasil',
    topicoLabel: 'História do Brasil',
    performance: { accuracy: 60, totalAnswered: 15 },
    summary: {
      title: 'História do Brasil: colonização, escravidão e formação nacional',
      content: `Estude **períodos** articulando **economia**, **sociedade** e **política**: Brasil colônia (exportação, escravidão africana, microssistemas regionais); crise do sistema colonial; Independência (processos, não “data única”); Primeiro Reinado e Regência; Segundo Reinado e **crise escravista**; República Velha; **Estado Novo**; redemocratização e Ditadura — sempre conectando **estrutura agrária**, **trabalho** e **cidadania**.

### Como o ENEM cobra

Mapas, charges e trechos documentais pedem **interpretação** de **mudança e permanência** (ex.: reforma após abolição sem desmontar oligarquias; industrialização tardia; políticas indigenistas).

### Cuidado com anacronismo

Não projetar conceitos atuais sem mediação histórica; identifique **fontes** (cartas, leis, relatórios) e **posição do enunciado**.`,
      keyPoints: [
        'Escravidão estruturou riqueza e desigualdades — abolição não eliminou estruturas de exclusão',
        'Brasil Império: poder escravocrata e conflitos regionais marcam cronologia',
        'Republicano: café, coronelismo, urbanização e tensões trabalhistas aparecem como fio condutor',
      ],
    },
    flashcards: [
      {
        front: 'O que foi a Lei Áurea (1888)?',
        back: 'Abolição da escravatura no Brasil — sem indenização ampla nem reforma agrária; debates sobre transição trabalhista.',
        difficulty: 'easy',
      },
      {
        front: 'Inconfidência Mineira: significado histórico principal?',
        back: 'Movimento separatista/elitista de final do século XVIII punido pela Coroa — expressão de tensão colonial, sem independência imediata.',
        difficulty: 'easy',
      },
      {
        front: 'Por que falar em “pacto colonial”?',
        back: 'Exploração de metrópole sobre colônia via monopólios, tributação e divisão de trabalho exportador — varia por região.',
        difficulty: 'medium',
      },
      {
        front: 'Revolução de 1930: ruptura com quê?',
        back: 'Marcou fim da hegemonia paulista oligárquica na presidência e inflexão do modelo político da República Velha.',
        difficulty: 'medium',
      },
      {
        front: 'Diferença: Quilombo como resistência diária x epopeia romântica?',
        back: 'Historiografia recente destaca **microrresistências** e redes; visão romântica pode mitizar complexidade política interna.',
        difficulty: 'hard',
      },
      {
        front: '“Modernização” na Ditadura militar: leitura crítica típica?',
        back: 'Crescimento econômico com custos de **direitos**, censura e endividamento — interpretar gráficos de “milagre” com contexto social.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Um documento de 1850 defende a continuidade do tráfico negreiro ilegal por “economia”. A análise histórica adequada associa o texto a:',
        alternatives: [
          {
            letter: 'A',
            text: 'Defesa plebeu dos direitos trabalhistas urbanos',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'Interesses escravocratas ligados a exportações de valor',
            isCorrect: true,
          },
          { letter: 'C', text: 'Movimento abolicionista radical da Corte', isCorrect: false },
          {
            letter: 'D',
            text: 'Industrialização massiva do Sudeste já consumada',
            isCorrect: false,
          },
          { letter: 'E', text: 'Confirmação da República federativa', isCorrect: false },
        ],
        explanation:
          'Defesa do trabalho escravizado como base da economia exportadora — coerente com grupos dominantes antes da abolição.',
      },
      {
        question:
          'Após 1888, muitos ex-escravizados migraram em busca de trabalho sem terra; oligarquias rurais mantiveram poder. A interpretação mais sustentada é:',
        alternatives: [
          {
            letter: 'A',
            text: 'Abolição resolveu plenamente a desigualdade fundiária',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'Mudança legal coexiste com estrutura econômica e política excludente',
            isCorrect: true,
          },
          { letter: 'C', text: 'Campo brasileiro deixou de ser exportador', isCorrect: false },
          { letter: 'D', text: 'Indústria substitui agro em 1889 em todo país', isCorrect: false },
          { letter: 'E', text: 'Voto universal imediato para todos os homens', isCorrect: false },
        ],
        explanation:
          'História social enxerga continuidades: abolição sem reformas amplas perpetuou exclusão no campo.',
      },
      {
        question:
          'Cartaz dos anos 1970 elogia “grandes obras” e silencia greves. Cogita-se o contexto de:',
        alternatives: [
          { letter: 'A', text: 'Primeira República e cafeicultura', isCorrect: false },
          {
            letter: 'B',
            text: 'Regime autoritário com propaganda de desenvolvimento',
            isCorrect: true,
          },
          { letter: 'C', text: 'Confederação do Equador', isCorrect: false },
          { letter: 'D', text: 'Diretas já plebiscito de 1824', isCorrect: false },
          { letter: 'E', text: 'Revolução Farroupilha isolada', isCorrect: false },
        ],
        explanation:
          'Propaganda de obras e censura a conflitos trabalhistas conversa com ditadura e discurso de “modernização” por cima.',
      },
    ],
    mindMap: {
      topic: 'História do Brasil',
      root: {
        id: '1',
        label: 'Brasil',
        children: [
          {
            id: '2',
            label: 'Colônia',
            children: [
              { id: '2a', label: 'Exportação' },
              { id: '2b', label: 'Escravidão' },
            ],
          },
          {
            id: '3',
            label: 'Império / República',
            children: [
              { id: '3a', label: 'Abolição / República' },
              { id: '3b', label: 'Oligarquias' },
            ],
          },
          {
            id: '4',
            label: 'Séc. XX',
            children: [
              { id: '4a', label: 'Populismo / Ditadura' },
              { id: '4b', label: 'Redemocratização' },
            ],
          },
        ],
      },
    },
  },
  'geografia-politica': {
    id: 'mock-pkg-geografia-politica',
    areaKey: 'ciencias-humanas',
    topicoValue: 'geografia-politica',
    topicoLabel: 'Geografia Política',
    performance: { accuracy: 42, totalAnswered: 12 },
    summary: {
      title: 'Geografia política: Estado, fronteiras, soberania e conflitos',
      content: `**Geografia política** estuda como o espaço é **organizado pelo poder**: traçado de fronteiras, formas de Estado (unitário/federal), capital política, blocos econômicos, disputas territoriais e escalas (local-global).

### Soberania e reconhecimento internacional

Território delimitado + população + governo efetivo → **Estado**; ainda assim, fronteiras podem ser **porosas**, **contestadas** ou **herdadas colonialmente**.

### Escalas de análise

Mesmo fenômeno (migração, conflito ambiental) muda de significado se lido em **microrregião** versus **geopolítica global**.`,
      keyPoints: [
        'Fronteira não é só linha no mapa: é prática social e infraestrutura',
        'Geopolítica relaciona recursos estratégicos, alianças e projeção de poder',
        'Eleições e divisão administrativa reorganizam representação espacial',
      ],
    },
    flashcards: [
      {
        front: 'Diferença: Estado x nação?',
        back: '**Estado** é ente político-territorial com governo; **nação** é comunidade imaginada/cultural — nem sempre coincidem (plurinacionalidade, diásporas).',
        difficulty: 'easy',
      },
      {
        front: 'O que é enclave?',
        back: 'Território de um Estado **cercado** pelo território de outro — implica relações diplomáticas e logísticas específicas.',
        difficulty: 'easy',
      },
      {
        front: 'Escalão federal no Brasil: exemplo de mediação política?',
        back: 'União, estados e municípios dividem competências — mapas de renda e saúde costumam seguir essa Grade.',
        difficulty: 'medium',
      },
      {
        front: 'Brexit ilustra:',
        back: 'Recomposição de vínculos **supra-estatais** (UE) e tensões entre soberania nacional e integração.',
        difficulty: 'medium',
      },
      {
        front: 'Geopolítica do petróleo: eixo comum em questões?',
        back: 'Cordões de abastecimento, estreitos, cartéis / OPEP+ e segurança marítima aparecem como leitura espacial do poder.',
        difficulty: 'hard',
      },
      {
        front: '“Heartland” (teorias clássicas) ainda serve?',
        back: 'Como **história das ideias**: hoje análises somam dados, tecnologia e redes; prova pode citar críticas ao determinismo.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'País A reconhece governo insurgente em país B enquanto ONU mantém representante anterior. Trata-se de tensão em torno de:',
        alternatives: [
          { letter: 'A', text: 'Clima equatorial úmido', isCorrect: false },
          { letter: 'B', text: 'Legitimidade e reconhecimento de soberania', isCorrect: true },
          { letter: 'C', text: 'Zona de subducção', isCorrect: false },
          { letter: 'D', text: 'Latitude exclusivamente', isCorrect: false },
          { letter: 'E', text: 'Tipos de solo laterítico', isCorrect: false },
        ],
        explanation: 'Reconhecimento diplomático é dimensão clássica da geografia política.',
      },
      {
        question:
          'Bloco econônico reduz tarifas internas e harmoniza normas externas. Efeito geográfico imediato costuma ser:',
        alternatives: [
          { letter: 'A', text: 'Isolamento comercial total', isCorrect: false },
          { letter: 'B', text: 'Intensificação de fluxos intra-bloco', isCorrect: true },
          {
            letter: 'C',
            text: 'Extinção de fronteiras internas administrativas locais',
            isCorrect: false,
          },
          { letter: 'D', text: 'Congelamento de migrações', isCorrect: false },
          { letter: 'E', text: 'Eliminação de moeda nacional sem exceção', isCorrect: false },
        ],
        explanation:
          'Integração regional favorece trocas e cadeias produtivas dentro do bloco (com custos e ganhos distributivos).',
      },
      {
        question:
          'Cidade-satélite administrativa criada para descongestionar capital federal exemplifica:',
        alternatives: [
          { letter: 'A', text: 'Deriva continental', isCorrect: false },
          { letter: 'B', text: 'Reorganização político-territorial planejada', isCorrect: true },
          { letter: 'C', text: 'Zona de convergência intertropical', isCorrect: false },
          { letter: 'D', text: 'Ciclo hidrológico fechado', isCorrect: false },
          { letter: 'E', text: 'Planagem glacial', isCorrect: false },
        ],
        explanation:
          'Decisão de capital/satelites é decisão de Estado sobre grade administrativa e simbolismo político.',
      },
    ],
    mindMap: {
      topic: 'Geografia Política',
      root: {
        id: '1',
        label: 'Política espacial',
        children: [
          {
            id: '2',
            label: 'Estado',
            children: [
              { id: '2a', label: 'Soberania' },
              { id: '2b', label: 'Fronteiras' },
            ],
          },
          {
            id: '3',
            label: 'Escalas',
            children: [
              { id: '3a', label: 'Municipal / regional' },
              { id: '3b', label: 'Global / blocos' },
            ],
          },
          {
            id: '4',
            label: 'Conflitos',
            children: [
              { id: '4a', label: 'Recursos' },
              { id: '4b', label: 'Identidade' },
            ],
          },
        ],
      },
    },
  },
  filosofia: {
    id: 'mock-pkg-filosofia',
    areaKey: 'ciencias-humanas',
    topicoValue: 'filosofia',
    topicoLabel: 'Filosofia',
    performance: { accuracy: 38, totalAnswered: 8 },
    summary: {
      title: 'Filosofia: ética, política, epistemologia e correntes básicas',
      content: `O ENEM cobra **habilidade de posicionar argumentos**: ética (dever versus consequência, virtude), política (contrato, liberdade, justiça), epistemologia (ceticismo, racionalismo, empirismo, ciência).

### Leitura de trechos

Identifique **premissas**, **conclusão** e **tipo de raciocínio** (dedutivo, indutivo, analógico). Cuidado com **confusão** de termos entre autores.

### Autores frequentes (marcas)

Platão (Ideias, justiça na *República*), Aristóteles (virtude e meio-termo), Hobbes/Locke/Rousseau (contrato), Kant (imperativo), utilitarismo (Bentham/Mill), Marx (mais-valia, ideologia), Foucault (poder/saber), Rawls (justiça como equidade).`,
      keyPoints: [
        'Distinguir ética normativa de metaética na letra da questão',
        'Contratualismo explica legitimidade do Estado a partir de indivíduos',
        'Filosofia da ciência cobra limites do método e demarcação pseudociência',
      ],
    },
    flashcards: [
      {
        front: 'O que é imperativo categórico (esboço)?',
        back: 'Para Kant, mandamento moral universalizável que prescinde de fins contingentes — “age de modo que...” como dever puro.',
        difficulty: 'easy',
      },
      {
        front: 'Utilitarismo clássico defende:',
        back: 'Maximizar **felicidade/benefício agregado** das ações — julgamento pelas **consequências**.',
        difficulty: 'easy',
      },
      {
        front: 'Empirismo vs racionalismo (eixo central)?',
        back: 'Empirismo: conhecimento sensível; racionalismo: princípios **a priori** — textos de Hume vs Descartes ilustram.',
        difficulty: 'medium',
      },
      {
        front: 'Maieutica: de quem e para quê?',
        back: 'Sócrates: método de perguntas para **assistir** o interlocutor a extrair verdades como “parto” de ideias.',
        difficulty: 'medium',
      },
      {
        front: '“Homo homini lupus” em Hobbes significa?',
        back: 'Estado de natureza como tendência conflituosa sem soberano — fundamenta necessidade do Leviatã.',
        difficulty: 'hard',
      },
      {
        front: 'Falácia *ad hominem* ataca:',
        back: 'O proponente em vez do **argumento** — descredibiliza sem refutar premissas.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Argumento: “Se mentimos sempre, confiança desaparece; sem confiança, cooperamos pior; logo, regra universal de mentira é contraditória.” A estrutura remete a:',
        alternatives: [
          { letter: 'A', text: 'Empirismo radical', isCorrect: false },
          { letter: 'B', text: 'Teste de universalização deontológica', isCorrect: true },
          { letter: 'C', text: 'Hedonismo cirenaico', isCorrect: false },
          { letter: 'D', text: 'Existencialismo ateu exclusivamente', isCorrect: false },
          { letter: 'E', text: 'Slogan publicitário sem lógica', isCorrect: false },
        ],
        explanation:
          'Prova mostra contradição prática de universalizar mentira — eco kantiano de ética universal.',
      },
      {
        question:
          'Texto afirma que “justiça distributiva exige atenção aos piores situados”. Ideia mais próxima:',
        alternatives: [
          { letter: 'A', text: 'Rousseau sobre música', isCorrect: false },
          { letter: 'B', text: 'Rawls e princípio de diferença', isCorrect: true },
          { letter: 'C', text: 'Parmênides sobre Ilusão', isCorrect: false },
          { letter: 'D', text: 'Epicurismo sobre deuses intervenientes', isCorrect: false },
          { letter: 'E', text: 'Maquiavel sobre fortuna exclusiva', isCorrect: false },
        ],
        explanation: 'Rawls diferencia desigualdades só se beneficiarem os menos favorecidos.',
      },
      {
        question:
          'Crítica: “Não há fatos, só interpretações.” Uso ingênuo no ENEM seria confundir:',
        alternatives: [
          { letter: 'A', text: 'Ontologia com receita culinária', isCorrect: false },
          {
            letter: 'B',
            text: 'Interpretação hermenêutica com negação de evidências empíricas testáveis',
            isCorrect: true,
          },
          { letter: 'C', text: 'Lógica com matemática pura', isCorrect: false },
          { letter: 'D', text: 'Política com biologia molecular', isCorrect: false },
          { letter: 'E', text: 'Ética com estética musical', isCorrect: false },
        ],
        explanation:
          'Frase nietzschiana exige nuance: perspectivismo não autoriza desprezar dados sem argumento.',
      },
    ],
    mindMap: {
      topic: 'Filosofia',
      root: {
        id: '1',
        label: 'Filosofia',
        children: [
          {
            id: '2',
            label: 'Ética',
            children: [
              { id: '2a', label: 'Deontologia' },
              { id: '2b', label: 'Utilitarismo' },
            ],
          },
          {
            id: '3',
            label: 'Política',
            children: [
              { id: '3a', label: 'Contrato social' },
              { id: '3b', label: 'Justiça' },
            ],
          },
          {
            id: '4',
            label: 'Conhecimento',
            children: [
              { id: '4a', label: 'Racionalismo / empirismo' },
              { id: '4b', label: 'Ciência e pseudociência' },
            ],
          },
        ],
      },
    },
  },
  sociologia: {
    id: 'mock-pkg-sociologia',
    areaKey: 'ciencias-humanas',
    topicoValue: 'sociologia',
    topicoLabel: 'Sociologia',
    performance: { accuracy: 67, totalAnswered: 6 },
    summary: {
      title: 'Sociologia: desigualdade, cultura, instituições e métodos',
      content: `Estude **indivíduo x sociedade**: socialização (família, escola, mídia), **estratificação** (classe, raça, gênero), **instituições** (Estado, religião), **desvio** e controle, **movimentos sociais**, **métodos** (etnografia, survey, análise documental).

### Teóricos âncora

Durkheim (fato social, solidariedade), Weber (ação social, desencantamento, burocracia), Marx (exploração, alienação). Contemporâneos discutem **interseccionalidade** e **racismo estrutural**.

### Evite biologismo

Explicar desigualdade só por “natureza” ignora **história** e **instituições** — ENEM frequentemente cobra crítica a determinismos.`,
      keyPoints: [
        'Fatos sociais são externos e coercitivos (exercício clássico durkheimiano)',
        'Cultura = símbolos + práticas compartilhadas, em tensão com poder',
        'Indicadores (IDH, Gini) conectam método quantitativo a debate ético',
      ],
    },
    flashcards: [
      {
        front: 'O que é estratificação social?',
        back: 'Disposição hierárquica de grupos com acesso diferenciado a recursos, prestígio e poder.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença: estereótipo x preconceito x discriminação?',
        back: 'Estereótipo (crença cognitiva); preconceito (atitude); discriminação (**ação** excludente).',
        difficulty: 'easy',
      },
      {
        front: 'Posição de Weber sobre conflito:',
        back: 'Pluração de **esferas** de disputa (classe, status, poder político) — não só economia.',
        difficulty: 'medium',
      },
      {
        front: '“Anomia” durkheimiana?',
        back: 'Desregulação moral em mudanças rápidas — normas frágeis produzem suicídio/ desorientação.',
        difficulty: 'medium',
      },
      {
        front: 'Interseccionalidade: definição operacional?',
        back: 'Eixos de opressão (raça, gênero, classe) **compõem** experiências que não se somam linearmente.',
        difficulty: 'hard',
      },
      {
        front: 'Ética em pesquisa qualitativa: princípio básico?',
        back: 'Consentimento, minimização de danos, anonimização de dados e transparência — mesmo em prova de leitura.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Política pública prioriza escolas em bairros ricos “porque já há tradição de resultados”. Do ponto de vista sociológico, reproduz:',
        alternatives: [
          { letter: 'A', text: 'Meritocracia pura sem história', isCorrect: false },
          {
            letter: 'B',
            text: 'Ciclos de desigualdade estrutural na educação',
            isCorrect: true,
          },
          { letter: 'C', text: 'Lei de ferro oligárquica absoluta sem exceções', isCorrect: false },
          { letter: 'D', text: 'Destino individual independente de contexto', isCorrect: false },
          { letter: 'E', text: 'Endogamia biológica inevitável', isCorrect: false },
        ],
        explanation:
          'Acúmulo de vantagens espaciais e escolares sugere reprodução social — debate clássico pós-Bourdieu.',
      },
      {
        question:
          'Em estudo etnográfico de periferia, pesquisador convive com grupo por meses. A escolha prioriza:',
        alternatives: [
          { letter: 'A', text: 'Amostragem aleatória estratificada estática', isCorrect: false },
          { letter: 'B', text: 'Imersão para captar significados locais', isCorrect: true },
          { letter: 'C', text: 'Exclusão de subjetividade', isCorrect: false },
          { letter: 'D', text: 'Laboratório duplo-cego farmacêutico', isCorrect: false },
          { letter: 'E', text: 'Censo demográfico integral anual', isCorrect: false },
        ],
        explanation: 'Etnografia busca compreensão densa (Geertz) via participação observacional.',
      },
      {
        question:
          'Alta escolaridade pai-mãe correlaciona com melhor desempenho filial. Interpretação sociológica comum:',
        alternatives: [
          { letter: 'A', text: 'Gene único determinístico', isCorrect: false },
          {
            letter: 'B',
            text: 'Capital cultural e ambientes de aprendizagem medeiam resultado',
            isCorrect: true,
          },
          { letter: 'C', text: 'Sorteios estatísticos sem explicação', isCorrect: false },
          { letter: 'D', text: 'Temperatura média anual', isCorrect: false },
          { letter: 'E', text: 'Fases da lua', isCorrect: false },
        ],
        explanation:
          'Correlação social interpretada via recursos simbólicos e materiais familiares.',
      },
    ],
    mindMap: {
      topic: 'Sociologia',
      root: {
        id: '1',
        label: 'Sociedade',
        children: [
          {
            id: '2',
            label: 'Desigualdades',
            children: [
              { id: '2a', label: 'Classe / gênero / raça' },
              { id: '2b', label: 'Mobilidade' },
            ],
          },
          {
            id: '3',
            label: 'Instituições',
            children: [
              { id: '3a', label: 'Família / escola' },
              { id: '3b', label: 'Estado / religião' },
            ],
          },
          {
            id: '4',
            label: 'Teoria',
            children: [
              { id: '4a', label: 'Durkheim / Weber / Marx' },
              { id: '4b', label: 'Métodos' },
            ],
          },
        ],
      },
    },
  },
  'geografia-fisica': {
    id: 'mock-pkg-geografia-fisica',
    areaKey: 'ciencias-humanas',
    topicoValue: 'geografia-fisica',
    topicoLabel: 'Geografia Física',
    performance: { accuracy: 0, totalAnswered: 0 },
    summary: {
      title: 'Geografia física: clima, relevo, hidrografia e biomas',
      content: `Relaciona **energia solar**, **movimentos atmosféricos**, **oceanos**, **relevo**, **solos** e **vegetação** em **sistemas** dinâmicos (ex.: brisa, frentes, fenômenos El Niño/La Niña).

### Clima x tempo

**Tempo** é estado momentâneo; **clima** é média estatística de décadas (WMO usa períodos de referência).

### Brasil

Domínios equatorial, tropical, semiárido, subtropical — ligar mapas a **pressão**, **massas de ar**, **orografia** e **costa**.

### No ENEM

Interprete **perfil climático**, **hidrograma**, **rota de ciclone** e **cartas isóbaras simplificadas**.`,
      keyPoints: [
        'Gradiente térmico e umidade definem massas de ar que afetam o Brasil',
        'Relevo condiciona interceptação orográfica e drenagem',
        'Bioma não é só “lista de árvores”: é conjunto de adaptações a regimes ambientais',
      ],
    },
    flashcards: [
      {
        front: 'O que é efeito Coriolis na escala sinótica?',
        back: 'Deflexão aparente dos ventos e correntes devido à rotação terrestre — explica espiral de sistemas rotativos de grande escala.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença: chuva orográfica x convectiva?',
        back: 'Orográfica: barreira física levanta ar úmido; convectiva: instabilidade térmica intensa (típica tropical de verão).',
        difficulty: 'easy',
      },
      {
        front: 'El Niño costuma implicar no Pacífico Equatorial:',
        back: 'Aquecimento anômalo superficial → re(posiciona) chuvas/temperaturas em teleconexões globais, inclusive América do Sul.',
        difficulty: 'medium',
      },
      {
        front: 'Pediplano vs morfogenese andina (conceito geral)?',
        back: 'Superfície de aplainamento em clima semiárido versus orogênese recente — comparar processos de denudação.',
        difficulty: 'medium',
      },
      {
        front: 'Albedo e mudança de cobertura (leitura aplicada)?',
        back: 'Maior reflectância (gelo/nuvem) reduz absorção; desmatamento altera balanço energético local/regional.',
        difficulty: 'hard',
      },
      {
        front: 'Ordem de solos em encosta úmida bem drenada (visão pedológica básica)?',
        back: 'Lixiviação intensa tende a perfis mais intemperizados no topo — responder com diagrama esquemático da questão.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question:
          'Litoral recebe ventos úmidos que sobem serra; nuvens e chuva ocorrem só no lado de barlavento. O mecanismo é:',
        alternatives: [
          { letter: 'A', text: 'Subsidence estratosférica seca', isCorrect: false },
          { letter: 'B', text: 'Orográfica', isCorrect: true },
          { letter: 'C', text: 'Marés de quadratura apenas', isCorrect: false },
          { letter: 'D', text: 'Fusão nuclear no solo', isCorrect: false },
          { letter: 'E', text: 'Evapotranspiração zero', isCorrect: false },
        ],
        explanation:
          'Barreira topográfica força ascensão adiabática saturada → precipitação à barlavento.',
      },
      {
        question:
          'Em região equatorial oceânica com alta insolação uniforme ao longo do ano, amplitude térmica diária tende a:',
        alternatives: [
          {
            letter: 'A',
            text: 'Ser maior que anual média de altas latitudes interiores',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'Permanecer moderada diariamente face à nuvenidade',
            isCorrect: true,
          },
          { letter: 'C', text: 'Zerar sempre', isCorrect: false },
          {
            letter: 'D',
            text: 'Depender só da longitude absoluta ignorando mar',
            isCorrect: false,
          },
          { letter: 'E', text: 'Inverter com salinidade', isCorrect: false },
        ],
        explanation:
          'Mar e convecção profunda tendem a suavizar temperatura diária, mesmo com sol forte.',
      },
      {
        question:
          'Rio com planície de inundação ampla na foz transporta sedimentos finos que formam levee natural. Processo dominante na foz:',
        alternatives: [
          {
            letter: 'A',
            text: 'Transporte e deposição fluvial em ambiente de baixa energia',
            isCorrect: true,
          },
          { letter: 'B', text: 'Fusões magmáticas profundas exclusivas', isCorrect: false },
          { letter: 'C', text: 'Abrasão eólica em dunas polares', isCorrect: false },
          { letter: 'D', text: 'Cultura de coral em altiplano', isCorrect: false },
          { letter: 'E', text: 'Metamorfismo regional de xisto apenas', isCorrect: false },
        ],
        explanation:
          'Perfil de energia fluvial decrescente favorece deposição de finos nas margens baixas.',
      },
    ],
    mindMap: {
      topic: 'Geografia Física',
      root: {
        id: '1',
        label: 'Geo física',
        children: [
          {
            id: '2',
            label: 'Clima',
            children: [
              { id: '2a', label: 'Massas / frentes' },
              { id: '2b', label: 'Climatologia' },
            ],
          },
          {
            id: '3',
            label: 'Relevo / solo',
            children: [
              { id: '3a', label: 'Processos erosivos' },
              { id: '3b', label: 'Pedologia' },
            ],
          },
          {
            id: '4',
            label: 'Água / biomas',
            children: [
              { id: '4a', label: 'Hidrologia' },
              { id: '4b', label: 'Biogeografia' },
            ],
          },
        ],
      },
    },
  },
  ecologia: {
    id: 'mock-pkg-ecologia',
    areaKey: 'ciencias-natureza',
    topicoValue: 'ecologia',
    topicoLabel: 'Ecologia',
    performance: { accuracy: 67, totalAnswered: 9 },
    summary: {
      title: 'Ecologia: níveis, fluxos de energia, sucessão e conservação',
      content: `**Ecologia** estuda relações entre organismos e ambiente através de níveis: **indivíduo → população → comunidade → ecossistema → biosfera**.

### Energia e matéria

- Fluxo de **energia** é **unidirecional** (perda de calor em cada transferência — eficiência < 100%).
- **Matéria** circula em **ciclos** (água, carbono, nitrogênio).

### Sucessão ecológica

Sequência previsível de substituição de comunidades até certo **clímax** local; perturbações reiniciam fases.

### Serviços ecossistêmicos

Polinização, purificação hídrica, regulação climática — frequentemente cobrados em contextos **socioambientais** do ENEM.`,
      keyPoints: [
        'Cadeias tróficas representam fluxo energético; teias aumentam estabilidade e caminhos',
        'Nicho ecológico posiciona espécie no espaço de recursos (não só “habitat físico”)',
        'Biodiversidade costuma correlacionar-se a resiliência frente a distúrbios',
      ],
    },
    flashcards: [
      {
        front: 'O que é nicho ecológico?',
        back: 'Papel funcional da espécie: recursos que usa, relações e condições — “como vive”, não só “onde vive”.',
        difficulty: 'easy',
      },
      {
        front: 'Lei dos 10% (eficiência trófica) — ideia básica?',
        back: 'Apenas parcela (~10%) da energia de um nível passa ao seguinte; resto dissipada em metabolismo.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença: produtor x consumidor x decompositor?',
        back: 'Produtor fixa energia (fotossíntese); consumidor transfere; decompõe orgânico em nutrientes inorgânicos (decompositores).',
        difficulty: 'medium',
      },
      {
        front: 'Sucessão primária ocorre quando?',
        back: 'Surgimento de comunidade em **substrato sem solo** prévio (lava, rocha nua).',
        difficulty: 'medium',
      },
      {
        front: 'Efeito de espécies exóticas invasoras?',
        back: 'Podem desequilibrar teias e excluir nativas por competição, predatismo ou alteração de hábitat.',
        difficulty: 'medium',
      },
      {
        front: 'Compensation point ecológico (botanica) — ENEM costuma pedir?',
        back: 'Taxa fotossíntese = respiração líquida zero naquele instante — depende de luz/CO₂.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Redução drástica de espécie herbívora pode, a médio prazo, provocar:',
        alternatives: [
          {
            letter: 'A',
            text: 'Certeza de aumento ilimitado de todos os produtores',
            isCorrect: false,
          },
          {
            letter: 'B',
            text: 'Reorganização trófica — mais herbívoros competidores ou alteração vegetal, não linearidade simples',
            isCorrect: true,
          },
          {
            letter: 'C',
            text: 'Desaparecimento de toda energia solar incidente',
            isCorrect: false,
          },
          { letter: 'D', text: 'Fim do ciclo do nitrogênio', isCorrect: false },
          { letter: 'E', text: 'Cessação de decomposição fúngica global', isCorrect: false },
        ],
        explanation:
          'Cascata trófica tem respostas dependentes de contexto; ENEM evita caos único, cobra tensões reguladoras.',
      },
      {
        question: 'Lago eutrofizado por esgoto doméstico sem tratamento tende a:',
        alternatives: [
          { letter: 'A', text: 'Transparência alta e oligotrofia', isCorrect: false },
          {
            letter: 'B',
            text: 'Florecimento de algas, queda de oxigênio e morte de peixes',
            isCorrect: true,
          },
          { letter: 'C', text: 'Congelamento permanente da cadeia alimentar', isCorrect: false },
          {
            letter: 'D',
            text: 'Aumento homogêneo de pH acima de 12 em todos os pontos',
            isCorrect: false,
          },
          { letter: 'E', text: 'Eliminação total de decompositores', isCorrect: false },
        ],
        explanation:
          'Nutrientes limitantes deixam de limitar algas → bloom → decomposição consome O₂ → anoxia.',
      },
      {
        question: 'Corredor ecológico entre fragmentos florestais busca mitigar:',
        alternatives: [
          { letter: 'A', text: 'Tectônica de placas', isCorrect: false },
          {
            letter: 'B',
            text: 'Efeitos de fragmentação e isolamento populacional',
            isCorrect: true,
          },
          { letter: 'C', text: 'Deriva continental exclusivamente', isCorrect: false },
          { letter: 'D', text: 'Fusão nuclear estelar', isCorrect: false },
          { letter: 'E', text: 'Marés neap sem lua', isCorrect: false },
        ],
        explanation: 'Conectividade reduz efeitos de borda e permite fluxo gênico.',
      },
    ],
    mindMap: {
      topic: 'Ecologia',
      root: {
        id: '1',
        label: 'Ecologia',
        children: [
          {
            id: '2',
            label: 'Níveis',
            children: [
              { id: '2a', label: 'População' },
              { id: '2b', label: 'Comunidade' },
            ],
          },
          {
            id: '3',
            label: 'Fluxos',
            children: [
              { id: '3a', label: 'Energia' },
              { id: '3b', label: 'Ciclos da matéria' },
            ],
          },
          {
            id: '4',
            label: 'Mudanças',
            children: [
              { id: '4a', label: 'Sucessão' },
              { id: '4b', label: 'Conservação' },
            ],
          },
        ],
      },
    },
  },
  'quimica-organica': {
    id: 'mock-pkg-quimica-organica',
    areaKey: 'ciencias-natureza',
    topicoValue: 'quimica-organica',
    topicoLabel: 'Química Orgânica',
    performance: { accuracy: 35, totalAnswered: 14 },
    summary: {
      title: 'Química orgânica: carbono, grupos funcionais e reações básicas',
      content: `Carbono forma **esqueleto** de cadeias e anéis (saturados e insaturados). **Hibridização** sp³/sp²/sp explica geometrias. **Grupos funcionais** determinam polaridade e reatividade: álcool, aldeído, cetona, ácido carboxílico, amina, éster, éter.

### Isomeria

**Plana** (constitucional, geométrica cis-trans em dupla; óptica com quiralidade) versus conformações.

### Reações típicas (visão ENEM)

Oxidação de álcool primário pode gerar aldeído e ácido; **hidrólise** de éster forma ácido + álcool; **polimerização** une monômeros.

### Segurança e vida quotidiana

Combustíveis, plásticos, fármacos — interpretar fórmulas esqueléticas e polaridade em solventes.`,
      keyPoints: [
        'cadeia, posição do grupo funcional e ramificação mudam nome IUPAC simplificado da questão',
        'Ácido carboxilico dissocia parcialmente em água; hidrocarbonetos apolares',
        'Catálise enzimática biológica mapeia-se a reconhecimento de substrato orgânico',
      ],
    },
    flashcards: [
      {
        front: 'Fórmula geral de hidrocarboneto saturado acíclico?',
        back: 'Alcanos: CₙH₂ₙ₊₂ (sem duplas/triplas).',
        difficulty: 'easy',
      },
      {
        front: 'O que caracteriza carbono quiral?',
        back: 'Carbono com **quatro** substuintes diferentes → não superponhível à imagem especular (enantiômeros).',
        difficulty: 'easy',
      },
      {
        front: 'Diferença: aldeído x cetona?',
        back: 'Aldeído: carbonila no **final** de cadeia; cetona: carbonila **interna**.',
        difficulty: 'medium',
      },
      {
        front: 'Por que etanol é miscível em água?',
        back: 'Grupo -OH forma **pontes de hidrogênio** com água — polaridade compatível.',
        difficulty: 'medium',
      },
      {
        front: 'Trans- e cis- em alceno: condição?',
        back: 'Dupla C=C **impede rotação**; substituintes diferentes em cada carbono criam isomeria geométrica.',
        difficulty: 'hard',
      },
      {
        front: 'Polímero adição vs condensação (visão geral)?',
        back: 'Adição: monômeros insaturados (ex.: vinil); condensação: libera pequena molécula (água etc.) ao ligar monômeros.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Composto com grupo -COOH reage com NaOH aquoso produzindo principalmente:',
        alternatives: [
          { letter: 'A', text: 'Éster', isCorrect: false },
          { letter: 'B', text: 'Sal carboxilato e água', isCorrect: true },
          { letter: 'C', text: 'Amina primária', isCorrect: false },
          { letter: 'D', text: 'Haleto de alquila', isCorrect: false },
          { letter: 'E', text: 'Apenas hidrocarboneto apolar', isCorrect: false },
        ],
        explanation: 'Neutralização ácido-base forma carboxilato dissolv + água.',
      },
      {
        question: 'Molécula com fórmula C₄H₁₀ e ramificação apresenta frente à n-butano:',
        alternatives: [
          {
            letter: 'A',
            text: 'Mesma massa molecular mas menor ponto de ebulição em ramo (menor superfície)',
            isCorrect: true,
          },
          {
            letter: 'B',
            text: 'Sempre maior ponto de ebulição independentemente de ramificação',
            isCorrect: false,
          },
          { letter: 'C', text: 'Impossibilidade de isomeria', isCorrect: false },
          { letter: 'D', text: 'Formula diferente C₄H₈', isCorrect: false },
          { letter: 'E', text: 'Obrigatoriamente aromática', isCorrect: false },
        ],
        explanation:
          'Isômeros constitucionais mesma fórmula; ramificação diminui empacotamento e forças intermoleculares → Tb menor.',
      },
      {
        question: 'Éster metílico de ácido acético hidrolisado em meio ácido gera:',
        alternatives: [
          { letter: 'A', text: 'Apenas metano', isCorrect: false },
          { letter: 'B', text: 'Ácido acético e metanol (equilíbrio)', isCorrect: true },
          { letter: 'C', text: 'Eteno e água', isCorrect: false },
          { letter: 'D', text: 'Glicerol e triacilglicerídeos sempre', isCorrect: false },
          { letter: 'E', text: 'Aminoácido livre', isCorrect: false },
        ],
        explanation: 'Hidrólise de éster recupera álcool e ácido (catalisada).',
      },
    ],
    mindMap: {
      topic: 'Química Orgânica',
      root: {
        id: '1',
        label: 'Orgânica',
        children: [
          {
            id: '2',
            label: 'Estrutura',
            children: [
              { id: '2a', label: 'Cadeias / ramos' },
              { id: '2b', label: 'Isomeria' },
            ],
          },
          {
            id: '3',
            label: 'Funções',
            children: [
              { id: '3a', label: 'Oxigenados' },
              { id: '3b', label: 'Nitrogenados' },
            ],
          },
          {
            id: '4',
            label: 'Reações',
            children: [
              { id: '4a', label: 'Oxirredução orgânica' },
              { id: '4b', label: 'Ésteres / polímeros' },
            ],
          },
        ],
      },
    },
  },
  termodinamica: {
    id: 'mock-pkg-termodinamica',
    areaKey: 'ciencias-natureza',
    topicoValue: 'termodinamica',
    topicoLabel: 'Termodinâmica',
    performance: { accuracy: 50, totalAnswered: 6 },
    summary: {
      title: 'Termodinâmica: calor, trabalho, leis e entropia (introdução ENEM)',
      content: `**Calor** (Q) e **trabalho** (W) transferem energia; energia interna U muda com processos. **1ª Lei:** ΔU = Q − W (convenção comum de expansão: trabalho feito **pelo** sistema).

### 2ª Lei e entropia

Processos espontâneos isolados tendem a **aumentar entropia global**. Máquinas térmicas limitadas pela eficiência de Carnot: η = 1 − T_fria/T_quente (temperaturas absolutas).

### Mudanças de fase

Calor latente **sem** mudança de temperatura durante transição; calor sensível eleva T.

### Contextualização biológica

Organismos mantêm **não equilíbrio** dissipando energia — não viola 2ª lei porque sistema não é isolado total.`,
      keyPoints: [
        'Distinguir calor de temperatura: calor é energia em trânsito',
        'Gas ideal: trabalho em expansão aparece como área em diagrama P-V',
        'Entropia microscópica relaciona-se a número de microestados acessíveis',
      ],
    },
    flashcards: [
      {
        front: 'Zero absoluto em Kelvin: significado?',
        back: 'Referência termodinâmica onde pressão de gás ideal teórico tende a zero em volume constante clássico; movimento molecular mínimo na visão clássica.',
        difficulty: 'easy',
      },
      {
        front: 'Calor latente de fusão refere-se a:',
        back: 'Energia por massa para transição sólido ↔ líquido **na temperatura de mudança**.',
        difficulty: 'easy',
      },
      {
        front: 'Sistema termodinâmico fechado vs isolado?',
        back: 'Fechado: sem troca de **matéria**; isolado: sem troca de energia nem matéria com vizinhança.',
        difficulty: 'medium',
      },
      {
        front: 'Processo adiabático Q = 0 implica?',
        back: 'Sem troca de calor (idealização rápida ou isolamento térmico perfeito).',
        difficulty: 'medium',
      },
      {
        front: 'Eficiência de Carnot pode ser 100%?',
        back: 'Só se T_fria = 0 K (inatingível pela 3ª lei prática) — máquina real sempre < Carnot.',
        difficulty: 'hard',
      },
      {
        front: 'ΔS universo em processo espontâneo real isolado?',
        back: '≥ 0 ( igual em reversíveis ideais ciclo completo, >0 se irreversível ).',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Gás ideal expande isotermicamente absorvendo calor; energia interna:',
        alternatives: [
          { letter: 'A', text: 'Aumenta sempre', isCorrect: false },
          { letter: 'B', text: 'Permanece constante (função só de T para ideal)', isCorrect: true },
          { letter: 'C', text: 'Diminui na mesma razão irrelevante', isCorrect: false },
          { letter: 'D', text: 'Anula entropia', isCorrect: false },
          { letter: 'E', text: 'Independe de temperatura absoluta', isCorrect: false },
        ],
        explanation: 'Para gás ideal, U depende apenas de T; isotérmico → ΔU = 0.',
      },
      {
        question:
          'Gelo a 0 °C recebe calor latente fundindo-se; durante fusão parcial a temperatura do sistema:',
        alternatives: [
          { letter: 'A', text: 'Sobe linearmente com o calor adicionado', isCorrect: false },
          { letter: 'B', text: 'Permanece em 0 °C até completar a fase', isCorrect: true },
          { letter: 'C', text: 'Cai abruptamente', isCorrect: false },
          { letter: 'D', text: 'Oscila aleatoriamente sem patamar', isCorrect: false },
          { letter: 'E', text: 'Salta para 100 °C', isCorrect: false },
        ],
        explanation:
          'Transição de fase à pressão constante ocorre à temperatura de equilíbrio com patamar.',
      },
      {
        question:
          'Refrigerador retira calor do compartimento frio usando trabalho elétrico; sobre a 2ª lei:',
        alternatives: [
          { letter: 'A', text: 'Viola porque retira calor de fonte fria', isCorrect: false },
          {
            letter: 'B',
            text: 'Não viola: trabalho externo aumenta entropia do ambiente suficiente',
            isCorrect: true,
          },
          { letter: 'C', text: 'Implica eficiência = 1 necessariamente', isCorrect: false },
          { letter: 'D', text: 'Só funciona sem fonte quente', isCorrect: false },
          { letter: 'E', text: 'Anula gradient térmico global', isCorrect: false },
        ],
        explanation:
          'Transferência contrária ao gradient espontâneo exige pagamento de trabalho — 2ª lei vale para sistema + vizinhança.',
      },
    ],
    mindMap: {
      topic: 'Termodinâmica',
      root: {
        id: '1',
        label: 'Termo',
        children: [
          {
            id: '2',
            label: '1ª Lei',
            children: [
              { id: '2a', label: 'Energia interna' },
              { id: '2b', label: 'Calor / trabalho' },
            ],
          },
          {
            id: '3',
            label: 'Processos',
            children: [
              { id: '3a', label: 'Isotérmico / adiabático' },
              { id: '3b', label: 'Fases' },
            ],
          },
          {
            id: '4',
            label: '2ª Lei',
            children: [
              { id: '4a', label: 'Entropia' },
              { id: '4b', label: 'Máquinas térmicas' },
            ],
          },
        ],
      },
    },
  },
  citologia: {
    id: 'mock-pkg-citologia',
    areaKey: 'ciencias-natureza',
    topicoValue: 'citologia',
    topicoLabel: 'Citologia',
    performance: { accuracy: 0, totalAnswered: 0 },
    summary: {
      title: 'Citologia: célula, organelas, membranas e divisão',
      content: `Célula é **unidade** de vida (teoria celular). **Procariotos** sem núcleo delimitado; **eucariotos** com núcleo e organelas membranosas.

### Membrana plasmática

**Bicamada lipídica** com proteínas; **transporte** passivo (difusão, osmose) x **ativo** (bomba, cotransporte). **Potencial hídrico** explica turgência/plasmólise.

### Organelas-chave

Mitocôndria (**Oxphos**), cloroplasto (fotossínteses luz/fase escura), ribossomos (síntese proteica), RE rugoso/liso, aparelho de Golgi, lisossomos, citoesqueleto.

### Ciclo celular

Interface (G1, S, G2) e mitose (PMAT); meiose reduz ploidia para gametas.`,
      keyPoints: [
        'Célula animal típica não tem parede celular; planta tem parede e plastídios',
        'Mitose conserva número cromossômico na linhagem somática; meiose haloploidia',
        'Hipertônico: célula perde água (crenação em animal)',
      ],
    },
    flashcards: [
      {
        front: 'Função principal do ribossomo?',
        back: 'Síntese de proteínas (tradução do mRNA) — livre ou ligado ao RE rugoso.',
        difficulty: 'easy',
      },
      {
        front: 'O que é mitocôndria?',
        back: 'Organela de **respiração celular aeróbia** — ATP via cadeia transportadora elétrons.',
        difficulty: 'easy',
      },
      {
        front: 'Diferença: difusão simples x facilitada?',
        back: 'Simples: gradiente direto; facilitada: proteínas carreadoras/canais aceleram espécies polares/grandes.',
        difficulty: 'medium',
      },
      {
        front: 'Parede celular bacteriana típica contém:',
        back: 'Peptidoglucano (mureína) — alvo de alguns antibióticos beta-lactâmicos.',
        difficulty: 'medium',
      },
      {
        front: 'Profase I meiótica vs mitótica — distinção marcante?',
        back: 'Em meiose I ocorre **pareamento** sináptico e crossing-over entre homólogos.',
        difficulty: 'hard',
      },
      {
        front: 'Autofagia em estresse nutricional (noção)?',
        back: 'Lisossomos degradam componentes citoplasmáticos reciclando precursores — homeostase celular.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Célula vegetal colocada em meio hipertônico tende a:',
        alternatives: [
          { letter: 'A', text: 'Ganhar água até lise', isCorrect: false },
          {
            letter: 'B',
            text: 'Perder água e apresentar plasmólise com parede mantida',
            isCorrect: true,
          },
          { letter: 'C', text: 'Congelar metabolismo sem troca de água', isCorrect: false },
          {
            letter: 'D',
            text: 'Duplicar cloroplastos instantaneamente sem divisão',
            isCorrect: false,
          },
          { letter: 'E', text: 'Secretar parede externa se animal', isCorrect: false },
        ],
        explanation:
          'Osmose: água sai para meio mais concentrado; parede rígida impede ruptura como em osmose lise animal extrema.',
      },
      {
        question: 'Bloqueio de formação do fuso mitótico impede célula de:',
        alternatives: [
          { letter: 'A', text: 'Realizar tradução', isCorrect: false },
          { letter: 'B', text: 'Separar cromátides irmãs para núcleos filhos', isCorrect: true },
          { letter: 'C', text: 'Realizar glicólise anaeróbia', isCorrect: false },
          { letter: 'D', text: 'Absorver luz nos tilacoides', isCorrect: false },
          { letter: 'E', text: 'Sintetizar RNA mensageiro', isCorrect: false },
        ],
        explanation: 'Fuso microtubular essencial à anafase/telófase de segregação cromossômica.',
      },
      {
        question: 'Organela rica em enzimas hidrolíticas acidófilas digerindo macromoléculas:',
        alternatives: [
          { letter: 'A', text: 'Cloroplasto', isCorrect: false },
          { letter: 'B', text: 'Lisossomo', isCorrect: true },
          { letter: 'C', text: 'Peroxissomo exclusivamente fotossintético', isCorrect: false },
          { letter: 'D', text: 'Nucleolo durante tradução', isCorrect: false },
          { letter: 'E', text: 'Centrossomo digestivo', isCorrect: false },
        ],
        explanation: 'Lisossomos degradam material endógeno e fagocitado com pH baixo.',
      },
    ],
    mindMap: {
      topic: 'Citologia',
      root: {
        id: '1',
        label: 'Célula',
        children: [
          {
            id: '2',
            label: 'Membrana',
            children: [
              { id: '2a', label: 'Transporte' },
              { id: '2b', label: 'Osmose' },
            ],
          },
          {
            id: '3',
            label: 'Organelas',
            children: [
              { id: '3a', label: 'Energia / fotossíntese' },
              { id: '3b', label: 'Síntese / digestão' },
            ],
          },
          {
            id: '4',
            label: 'Divisão',
            children: [
              { id: '4a', label: 'Mitose' },
              { id: '4b', label: 'Meiose' },
            ],
          },
        ],
      },
    },
  },
  funcoes: {
    id: 'mock-pkg-funcoes',
    areaKey: 'matematica',
    topicoValue: 'funcoes',
    topicoLabel: 'Funções',
    performance: { accuracy: 58, totalAnswered: 20 },
    summary: {
      title: 'Funções: domínio, imagem, raízes e famílias básicas',
      content: `Função **f: A → B** associa cada elemento de A a **exatamente um** de B. **Domínio** (entradas válidas); **imagem** (valores de f realmente atingidos); **contradomínio** é o conjunto de chegada.

### Leitura gráfica

Zeros: interseções com eixo **x**; f(x)=k: retas horizontais. Crescente/decrescente analisando sinal da variação Δy/Δx.

### Famílias frequentes

Afim, quadrática, modular, exponencial, logarítmica. **Composição** f(g(x)) lê-se “de dentro para fora”.`,
      keyPoints: [
        'Parábola y = ax² + bx + c: concavidade por sinal de a; vértice útil em problemas de máximo/mínimo simples',
        'Função modular “dobra” gráfico onde expressão interna muda de sinal',
        'Injetividade / sobrejetividade aparecem em questões conceituais sobre inversa',
      ],
    },
    flashcards: [
      {
        front: 'Quando f é injetora?',
        back: 'x₁ ≠ x₂ ⇒ f(x₁) ≠ f(x₂) — reta horizontal toca o gráfico no máximo uma vez.',
        difficulty: 'easy',
      },
      {
        front: 'Raízes de afim f(x)=ax+b?',
        back: 'x = -b/a (a ≠ 0).',
        difficulty: 'easy',
      },
      {
        front: 'Relação exponencial y = a·bˣ com b>1?',
        back: 'Crescimento quando b>1, a>0; decrescimento se a<0; base entre 0 e 1 inverte tendência de |y| após sinal.',
        difficulty: 'medium',
      },
      {
        front: 'Domínio natural de ln(x)?',
        back: 'x > 0 (reais).',
        difficulty: 'medium',
      },
      {
        front: 'Como obter inversa de y = 2x + 3?',
        back: 'Trocar x↔y: x = 2y + 3 → y = (x−3)/2.',
        difficulty: 'hard',
      },
      {
        front: 'Delta da quadrática indica quantas raízes reais?',
        back: 'Δ>0 duas; Δ=0 uma; Δ<0 nenhuma real.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'f(x) = x² − 4x + 3. O menor valor em ℝ é:',
        alternatives: [
          { letter: 'A', text: '-1', isCorrect: true },
          { letter: 'B', text: '0', isCorrect: false },
          { letter: 'C', text: '1', isCorrect: false },
          { letter: 'D', text: '3', isCorrect: false },
          { letter: 'E', text: '4', isCorrect: false },
        ],
        explanation: 'Vértice em x = -b/(2a) = 2 → f(2) = 4 - 8 + 3 = -1.',
      },
      {
        question: '|x − 1| < 3 equivale a:',
        alternatives: [
          { letter: 'A', text: 'x < 4', isCorrect: false },
          { letter: 'B', text: '-2 < x < 4', isCorrect: true },
          { letter: 'C', text: 'x > -2', isCorrect: false },
          { letter: 'D', text: 'x < 2 ou x > 4', isCorrect: false },
          { letter: 'E', text: 'Conjunto vazio', isCorrect: false },
        ],
        explanation: 'Distância de x a 1 menor que 3 → intervalo centrado em 1 com raio 3.',
      },
      {
        question: 'Se g(x)=x+1 e f(x)=x², então f(g(2)) vale:',
        alternatives: [
          { letter: 'A', text: '5', isCorrect: false },
          { letter: 'B', text: '9', isCorrect: true },
          { letter: 'C', text: '4', isCorrect: false },
          { letter: 'D', text: '3', isCorrect: false },
          { letter: 'E', text: '12', isCorrect: false },
        ],
        explanation: 'g(2)=3; f(3)=9.',
      },
    ],
    mindMap: {
      topic: 'Funções',
      root: {
        id: '1',
        label: 'Funções',
        children: [
          {
            id: '2',
            label: 'Conceitos',
            children: [
              { id: '2a', label: 'Domínio / imagem' },
              { id: '2b', label: 'Raízes' },
            ],
          },
          {
            id: '3',
            label: 'Famílias',
            children: [
              { id: '3a', label: 'Afim / quadrática' },
              { id: '3b', label: 'Modular / composta' },
            ],
          },
          {
            id: '4',
            label: 'Crescimento',
            children: [
              { id: '4a', label: 'Exponencial / log' },
              { id: '4b', label: 'Leitura gráfica' },
            ],
          },
        ],
      },
    },
  },
  probabilidade: {
    id: 'mock-pkg-probabilidade',
    areaKey: 'matematica',
    topicoValue: 'probabilidade',
    topicoLabel: 'Probabilidade e Estatística',
    performance: { accuracy: 70, totalAnswered: 10 },
    summary: {
      title: 'Probabilidade e estatística: amostra, medidas e leitura de gráficos',
      content: `**Probabilidade** de evento A em espaço equiprovável: P(A) = casos favoráveis / casos possíveis (com axiomas em abordagem mais formal).

### Condicional

P(A|B) = P(A∩B)/P(B), B com probabilidade não nula. **Independência:** P(A∩B)=P(A)P(B).

### Estatística descritiva

**Média**, **mediana** (robusta a outliers), **moda**; desvio-padrão mede dispersão. Gráficos: histograma (contínuo agregado), barras (categórico), boxplot (quartis).

### Interpretação crítica

Correlação **não** implica causalidade; viés amostral distorce inferência.`,
      keyPoints: [
        'Esperança de variável discreta: Σ x_i P(x_i)',
        'Lei dos grandes números (intuição): frequências estabilizam com n grande',
        'Percentil e quartis aparecem em dados socioeconômicos do ENEM',
      ],
    },
    flashcards: [
      {
        front: 'Complementar de evento: fórmula?',
        back: 'P(complemento de A) = 1 − P(A) no mesmo espaço.',
        difficulty: 'easy',
      },
      {
        front: 'Probabilidade da união P(A∪B) geral?',
        back: 'P(A)+P(B)−P(A∩B).',
        difficulty: 'easy',
      },
      {
        front: 'Mediana vs média frente a outlier extremo?',
        back: 'Mediana pouco afetada; média puxada pelo valor extremo.',
        difficulty: 'medium',
      },
      {
        front: 'Variância amostral: por que divisor n−1 em estimativa não enviesada?',
        back: 'Correção por perda de um grau de liberdade ao usar média amostral — intuição ENEM conceitual.',
        difficulty: 'medium',
      },
      {
        front: 'Teorema de Bayes relaciona:',
        back: 'Probabilidade condicional invertida via evidência — atualiza crença P(A|B) partindo de P(B|A).',
        difficulty: 'hard',
      },
      {
        front: 'Diagrama de Venn útil para:',
        back: 'Visualizar interseções e partições em espaços finitos.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Dado honesto lançado duas vezes. Probabilidade da soma ser 7:',
        alternatives: [
          { letter: 'A', text: '1/12', isCorrect: false },
          { letter: 'B', text: '1/6', isCorrect: true },
          { letter: 'C', text: '1/2', isCorrect: false },
          { letter: 'D', text: '7/36', isCorrect: false },
          { letter: 'E', text: '1/36', isCorrect: false },
        ],
        explanation: 'Pares (1,6)...(6,1) são 6 de 36 resultados → 1/6.',
      },
      {
        question: 'Em urna 3 brancas e 2 pretas sem reposição, P(2ª branca | 1ª branca):',
        alternatives: [
          { letter: 'A', text: '3/5', isCorrect: false },
          { letter: 'B', text: '1/2', isCorrect: true },
          { letter: 'C', text: '9/25', isCorrect: false },
          { letter: 'D', text: '2/5', isCorrect: false },
          { letter: 'E', text: '3/10', isCorrect: false },
        ],
        explanation: 'Após 1ª branca restam 2 brancas e 2 pretas → 2/4 = 1/2.',
      },
      {
        question: 'Conjunto {2, 4, 6, 100} tem mediana:',
        alternatives: [
          { letter: 'A', text: '4', isCorrect: false },
          { letter: 'B', text: '5', isCorrect: true },
          { letter: 'C', text: '6', isCorrect: false },
          { letter: 'D', text: '25', isCorrect: false },
          { letter: 'E', text: '100', isCorrect: false },
        ],
        explanation: 'Quatro elementos: mediana = média dos dois centrais ordenados (4+6)/2 = 5.',
      },
    ],
    mindMap: {
      topic: 'Probabilidade e Estatística',
      root: {
        id: '1',
        label: 'Prob / Stats',
        children: [
          {
            id: '2',
            label: 'Probabilidade',
            children: [
              { id: '2a', label: 'Condicional' },
              { id: '2b', label: 'Independência' },
            ],
          },
          {
            id: '3',
            label: 'Amostragem',
            children: [
              { id: '3a', label: 'Viés' },
              { id: '3b', label: 'Representatividade' },
            ],
          },
          {
            id: '4',
            label: 'Resumo dados',
            children: [
              { id: '4a', label: 'Média / mediana' },
              { id: '4b', label: 'Dispersão' },
            ],
          },
        ],
      },
    },
  },
  porcentagem: {
    id: 'mock-pkg-porcentagem',
    areaKey: 'matematica',
    topicoValue: 'porcentagem',
    topicoLabel: 'Porcentagem e Razão',
    performance: { accuracy: 80, totalAnswered: 8 },
    summary: {
      title: 'Porcentagem, razão e regra de três no cotidiano',
      content: `A **porcentagem** expressa parte por cem: **p% = p/100**. Variações: “aumento de 20%” multiplica por 1,20; “desconto de 15%” paga **85%** do preço (×0,85).

### Razão e proporção

Grandezas **diretamente proporcionais**: crescem juntas; **inversamente**: produto constante. Montagem por regra de três lógica evita inversão errada.

### Juros simples (visão ENEM)

J = C·i·t em mesma unidade de tempo; montante M = C + J. Compostos: capitalização sucessiva M = C(1+i)ⁿ para taxa periódica.`,
      keyPoints: [
        'Fator multiplicativo unifica cadeias de aumentos/descontos sucessivos',
        'Diferença percentual relativa compara variação ao valor de referência',
        'Escalas em mapas usam razão de distâncias',
      ],
    },
    flashcards: [
      {
        front: '10% de 250?',
        back: '25.',
        difficulty: 'easy',
      },
      {
        front: 'Decimal correspondente a 7,5%?',
        back: '0,075.',
        difficulty: 'easy',
      },
      {
        front: 'Preço R$200 sobe 10% e depois cai 10%. Novo preço?',
        back: '200·1,10·0,90 = 198 (não volta ao original).',
        difficulty: 'medium',
      },
      {
        front: 'Índice multiplica por 1,05 vs aumento de 5 pontos percentuais em taxa 10%?',
        back: 'Índice 1,05 sobre taxa vira 10,5 pontos percentuais se era base 10%? — Cuidado: “pontos percentuais” é diferença absoluta de taxas; ENEM distingue de “por cento relativo”.',
        difficulty: 'medium',
      },
      {
        front: 'Duas grandezas inversamente proporcionais: produto constante?',
        back: 'x·y = k em modelos ideais típicos (ex.: velocidade × tempo em percurso fixo, quando demais fatores fixos).',
        difficulty: 'hard',
      },
      {
        front: 'Qual a representação de ⅜ em % aproximada?',
        back: '0,375 → 37,5%.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Salário 1200 aumenta 15%; depois há corte de 8% sobre o valor novo. Resultado:',
        alternatives: [
          { letter: 'A', text: '1200 exato', isCorrect: false },
          { letter: 'B', text: '1242', isCorrect: true },
          { letter: 'C', text: '1308', isCorrect: false },
          { letter: 'D', text: '1150', isCorrect: false },
          { letter: 'E', text: '1320', isCorrect: false },
        ],
        explanation: '1200·1,15 = 1380; 1380·0,92 = 1242.',
      },
      {
        question: 'Em mapa, 2 cm representam 5 km reais. Razão de escala (mesma unidade):',
        alternatives: [
          { letter: 'A', text: '1 : 250000', isCorrect: true },
          { letter: 'B', text: '1 : 25000', isCorrect: false },
          { letter: 'C', text: '1 : 500000', isCorrect: false },
          { letter: 'D', text: '2 : 5', isCorrect: false },
          { letter: 'E', text: '1 : 5000', isCorrect: false },
        ],
        explanation: '5 km = 500000 cm; 2 cm : 500000 cm → 1 : 250000.',
      },
      {
        question: 'De 40 alunos, 15 faltaram. Percentual de comparecimento:',
        alternatives: [
          { letter: 'A', text: '37,5%', isCorrect: false },
          { letter: 'B', text: '62,5%', isCorrect: true },
          { letter: 'C', text: '150%', isCorrect: false },
          { letter: 'D', text: '40%', isCorrect: false },
          { letter: 'E', text: '25%', isCorrect: false },
        ],
        explanation: '25 presentes / 40 = 62,5%.',
      },
    ],
    mindMap: {
      topic: 'Porcentagem e Razão',
      root: {
        id: '1',
        label: '% e razão',
        children: [
          {
            id: '2',
            label: 'Fatores',
            children: [
              { id: '2a', label: 'Aumentos / descontos' },
              { id: '2b', label: 'Encadeamento' },
            ],
          },
          {
            id: '3',
            label: 'Proporção',
            children: [
              { id: '3a', label: 'Direta / inversa' },
              { id: '3b', label: 'Regra de três' },
            ],
          },
          {
            id: '4',
            label: 'Aplicar',
            children: [
              { id: '4a', label: 'Juros simples' },
              { id: '4b', label: 'Escalas' },
            ],
          },
        ],
      },
    },
  },
  combinatoria: {
    id: 'mock-pkg-combinatoria',
    areaKey: 'matematica',
    topicoValue: 'combinatoria',
    topicoLabel: 'Análise Combinatória',
    performance: { accuracy: 0, totalAnswered: 0 },
    summary: {
      title: 'Análise combinatória: contagem, arranjo, combinação e princípios',
      content: `**Principio multiplicativo:** se uma decisão tem m caminhos e outra n, sequência tem m·n possibilidades (quando independente conforme enunciado).

**Permutação:** ordenar **todos** _n_ elementos distintos: n!.

**Arranjo simples:** escolher e **ordenar** _p_ elementos dentre _n_: A(n,p) = n!/(n−p)!.

**Combinação:** escolher **subconjunto** sem ordem: C(n,p) = n!/(p!(n−p)!).

Cuidado com **repetição** permitida ou indistinguibilidade (anagrama com letras repetidas).

**Princípio aditivo** para eventos **mutuamente exclusivos** (união disjunta).`,
      keyPoints: [
        'Identificar se ordem importa distingue arranjo de combinação',
        'Princípio de inclusão-exclusão aparece em contagem de uniões',
        'Binômio de Newton liga combinações a coeficientes de expansão (a+b)ⁿ',
      ],
    },
    flashcards: [
      {
        front: '5! vale?',
        back: '120.',
        difficulty: 'easy',
      },
      {
        front: 'C(5,2)?',
        back: '10.',
        difficulty: 'easy',
      },
      {
        front: 'Quantas anagramas da palavra ARARA?',
        back: '5!/(3!2!) = 10 — repetição de letras.',
        difficulty: 'medium',
      },
      {
        front: 'Diferença arranjo A(n,p) e combinação C(n,p)?',
        back: 'A conta ordenações; C remove duplicatas por permutação interna do subconjunto.',
        difficulty: 'medium',
      },
      {
        front: 'Coeficiente de a³b² em (a+b)⁵?',
        back: 'C(5,3)=C(5,2)=10 (binomial matching expoentes).',
        difficulty: 'hard',
      },
      {
        front: 'Principio da casa dos pombos: ideia?',
        back: 'Se n+1 objetos em n caixas, alguma caixa contém ≥2 — existência de colisão.',
        difficulty: 'hard',
      },
    ],
    practiceQuestions: [
      {
        question: 'Quantos números de 3 algarismos distintos usando {1,2,3,4}?',
        alternatives: [
          { letter: 'A', text: '24', isCorrect: true },
          { letter: 'B', text: '12', isCorrect: false },
          { letter: 'C', text: '64', isCorrect: false },
          { letter: 'D', text: '4', isCorrect: false },
          { letter: 'E', text: '81', isCorrect: false },
        ],
        explanation: '4 escolhas centena, 3 restantes dezena, 2 unidade → 4·3·2=24.',
      },
      {
        question: 'Comissão de 3 pessoas de grupo de 7 (ordem irrelevante):',
        alternatives: [
          { letter: 'A', text: 'P(7,3)=210', isCorrect: false },
          { letter: 'B', text: 'C(7,3)=35', isCorrect: true },
          { letter: 'C', text: '3^7', isCorrect: false },
          { letter: 'D', text: '21', isCorrect: false },
          { letter: 'E', text: '720', isCorrect: false },
        ],
        explanation: 'Combinação: 7!/(3!4!)=35.',
      },
      {
        question: 'Senha de 4 dígitos decimais (0-9) com repetição permitida:',
        alternatives: [
          { letter: 'A', text: '5040', isCorrect: false },
          { letter: 'B', text: '10000', isCorrect: true },
          { letter: 'C', text: '9999', isCorrect: false },
          { letter: 'D', text: '10^3', isCorrect: false },
          { letter: 'E', text: '9^4', isCorrect: false },
        ],
        explanation: '10 opções por casa → 10⁴.',
      },
    ],
    mindMap: {
      topic: 'Análise Combinatória',
      root: {
        id: '1',
        label: 'Contagem',
        children: [
          {
            id: '2',
            label: 'Princípios',
            children: [
              { id: '2a', label: 'Multiplicativo / aditivo' },
              { id: '2b', label: 'Inclusão-exclusão' },
            ],
          },
          {
            id: '3',
            label: 'Seleção',
            children: [
              { id: '3a', label: 'Permutação' },
              { id: '3b', label: 'Arranjo / combinação' },
            ],
          },
          {
            id: '4',
            label: 'Extras',
            children: [
              { id: '4a', label: 'Repetição' },
              { id: '4b', label: 'Binômio / pombos' },
            ],
          },
        ],
      },
    },
  },
}

/** Simulate API delay */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Catálogo da trilha (slugs + rótulos), sem desempenho — alinhado ao `user-progress`. */
export function getStudyTopicCatalog(areaKey: string): Array<{ value: string; label: string }> {
  return (MOCK_TOPICS[areaKey] ?? []).map(({ value, label }) => ({ value, label }))
}

/** Mescla catálogo com `topic_performance` do usuário. Inclui tópicos só na API fora do catálogo. */
export function mergeTopicCatalogWithStats(
  catalog: Array<{ value: string; label: string }>,
  topicos: TopicoStat[] | undefined,
): TopicOption[] {
  function findStatForCatalogTopic(catalogValue: string): TopicoStat | undefined {
    for (const t of topicos ?? []) {
      if (isAreaRollupTopicValue(t.value)) continue
      if (t.value === catalogValue) return t
      if (resolveStudyTopicValue(t.value) === catalogValue) return t
    }
    return undefined
  }

  const merged: TopicOption[] = catalog.map((t) => {
    const s = findStatForCatalogTopic(t.value)
    if (!s || s.totalAnswered < 1) {
      return {
        value: t.value,
        label: t.label,
        accuracy: null,
        totalAnswered: s?.totalAnswered ?? 0,
      }
    }
    return {
      value: t.value,
      label: t.label,
      accuracy: Math.round(s.accuracyPct),
      totalAnswered: s.totalAnswered,
    }
  })
  const catValues = new Set(catalog.map((c) => c.value))
  for (const s of topicos ?? []) {
    if (isAreaRollupTopicValue(s.value)) continue
    const raw = s.value
    const resolved = resolveStudyTopicValue(raw)
    if (catValues.has(raw) || catValues.has(resolved)) continue
    const labelFromCatalog = catalog.find((c) => c.value === resolved)?.label
    const label =
      s.label?.trim() || (labelFromCatalog?.trim() ? labelFromCatalog : undefined) || resolved
    merged.push({
      value: raw,
      label,
      accuracy: s.totalAnswered >= 1 ? Math.round(s.accuracyPct) : null,
      totalAnswered: s.totalAnswered,
    })
  }
  return merged
}

/** Get or "generate" a study package (mock) */
export async function getMockStudyPackage(
  areaKey: string,
  topicoValue: string,
): Promise<StudyPackage> {
  await delay(1500 + Math.random() * 1000)

  const canonical = resolveStudyTopicValue(topicoValue)
  const existing = PACKAGES[canonical]
  if (existing) {
    return { ...existing, topicoValue: canonical }
  }

  // Generate a generic package for topics without specific mock data
  const topics = MOCK_TOPICS[areaKey] ?? []
  const topic = topics.find((t) => t.value === canonical)
  const label = topic?.label ?? canonical

  return {
    id: `mock-pkg-${canonical}`,
    areaKey,
    topicoValue: canonical,
    topicoLabel: label,
    performance: { accuracy: topic?.accuracy ?? 0, totalAnswered: topic?.totalAnswered ?? 0 },
    summary: {
      title: `${label}: conceitos essenciais`,
      content: `Este é um resumo gerado sobre **${label}**. Na versão final, o conteúdo será personalizado pela IA com base nos materiais da sua turma e no seu desempenho.\n\nO tópico **${label}** é frequente no ENEM e exige atenção a contextos interdisciplinares.`,
      keyPoints: [
        `Conceito principal de ${label}`,
        'Relação com outros tópicos da área',
        'Aplicação em questões do ENEM',
      ],
    },
    flashcards: [
      {
        front: `O que é ${label}?`,
        back: `${label} é um tópico central da área. Na versão final, esta resposta será gerada pela IA.`,
        difficulty: 'easy',
      },
      {
        front: `Cite um exemplo de ${label} no cotidiano`,
        back: 'Exemplo contextualizado será gerado pela IA com base nos materiais da turma.',
        difficulty: 'medium',
      },
      {
        front: `Como ${label} aparece no ENEM?`,
        back: 'Geralmente em questões interdisciplinares com contextos práticos.',
        difficulty: 'medium',
      },
    ],
    practiceQuestions: [
      {
        question: `(Exemplo) Sobre ${label}, assinale a alternativa correta:`,
        alternatives: [
          { letter: 'A', text: 'Alternativa de exemplo A', isCorrect: false },
          { letter: 'B', text: 'Alternativa correta de exemplo', isCorrect: true },
          { letter: 'C', text: 'Alternativa de exemplo C', isCorrect: false },
          { letter: 'D', text: 'Alternativa de exemplo D', isCorrect: false },
          { letter: 'E', text: 'Alternativa de exemplo E', isCorrect: false },
        ],
        explanation:
          'Na versão final, a explicação será gerada pela IA com base nos materiais da turma.',
      },
    ],
    mindMap: {
      topic: label,
      root: {
        id: '1',
        label,
        children: [
          {
            id: '2',
            label: 'Conceito 1',
            children: [
              { id: '2a', label: 'Detalhe A' },
              { id: '2b', label: 'Detalhe B' },
            ],
          },
          {
            id: '3',
            label: 'Conceito 2',
            children: [
              { id: '3a', label: 'Detalhe C' },
              { id: '3b', label: 'Detalhe D' },
            ],
          },
          {
            id: '4',
            label: 'Aplicações',
            children: [
              { id: '4a', label: 'ENEM' },
              { id: '4b', label: 'Cotidiano' },
            ],
          },
        ],
      },
    },
  }
}
