/**
 * Conteúdo estático da Área de Estudo (ENEM), versionado no repositório.
 * Contrato consumido pelo app web: resumo, flashcards, questões de prática, mapa mental.
 * MVP: sem chamadas a NotebookLM neste fluxo — troca de fonte para API/LM fica pós-MVP mantendo o contrato.
 */

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
}

export const MOCK_TOPICS: Record<string, TopicOption[]> = {
  linguagens: [
    {
      value: 'interpretacao-texto',
      label: 'Interpretação de Texto',
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
  const map = new Map((topicos ?? []).map((t) => [t.value, t]))
  const merged: TopicOption[] = catalog.map((t) => {
    const s = map.get(t.value)
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
    if (!catValues.has(s.value)) {
      merged.push({
        value: s.value,
        label: s.label,
        accuracy: s.totalAnswered >= 1 ? Math.round(s.accuracyPct) : null,
        totalAnswered: s.totalAnswered,
      })
    }
  }
  return merged
}

/** Get topics for an area (mock) */
export function getMockTopics(areaKey: string): TopicOption[] {
  return MOCK_TOPICS[areaKey] ?? []
}

/** Get or "generate" a study package (mock) */
export async function getMockStudyPackage(
  areaKey: string,
  topicoValue: string,
): Promise<StudyPackage> {
  await delay(1500 + Math.random() * 1000)

  const existing = PACKAGES[topicoValue]
  if (existing) return existing

  // Generate a generic package for topics without specific mock data
  const topics = MOCK_TOPICS[areaKey] ?? []
  const topic = topics.find((t) => t.value === topicoValue)
  const label = topic?.label ?? topicoValue

  return {
    id: `mock-pkg-${topicoValue}`,
    areaKey,
    topicoValue,
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
