import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Landmark,
  Layers,
  Lightbulb,
  LineChart,
  ListChecks,
  MessageCircleQuestion,
  Palette,
  Rocket,
  School,
  Settings2,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserSearch,
  Users,
  Video,
} from 'lucide-react'

export const LP_PAGE_TITLE = 'Broto — Plataforma de aprendizagem adaptativa white-label'
export const LP_PAGE_DESCRIPTION =
  'Transforme o material que sua instituição já produz em uma plataforma de estudos inteligente — com a sua marca, seus conteúdos e visibilidade total sobre cada aluno.'

export const LP_CTA_LABEL = 'Solicitar demonstração'

export type LpNavAnchor = { id: string; label: string; hasChevron?: boolean }

export const LP_NAV_ANCHORS: LpNavAnchor[] = [
  { id: 'lp-solucao', label: 'Solução' },
  { id: 'lp-como-funciona', label: 'Como funciona' },
  { id: 'lp-casos-uso', label: 'Casos de uso' },
  { id: 'lp-para-quem', label: 'Para instituições' },
  { id: 'lp-faq', label: 'Recursos', hasChevron: true },
]

export const LP_HERO = {
  headlineBefore: 'Transforme o conteúdo da sua instituição em ',
  headlineHighlight: 'aprendizagem personalizada.',
  sub: 'O Broto organiza seus materiais, acompanha o desempenho dos alunos e cria jornadas de estudo personalizadas com apoio de IA — tudo no seu ambiente, com sua marca.',
  ctaSecondary: 'Ver como funciona',
  features: [
    { icon: Sparkles, label: 'Personaliza' },
    { icon: BarChart3, label: 'Acompanha' },
    { icon: Lightbulb, label: 'Recomenda' },
    { icon: Target, label: 'Evolui' },
  ],
  socialProof:
    'Instituições de todo o Brasil já utilizam o Broto para melhorar resultados e engajamento.',
} as const

export const LP_CONTEXT_BAR = [
  'Construído sobre seus conteúdos — não sobre os nossos',
  'Implantação em semanas, sem time de tecnologia',
  'Testado no cenário mais exigente: a preparação para o ENEM',
  'Multi-tenant: uma plataforma, todas as suas turmas e unidades',
] as const

export const LP_PROBLEM = {
  eyebrow: 'O desafio',
  headline: 'Sua instituição já tem conteúdo. O desafio é transformar isso em evolução real.',
  cards: [
    {
      icon: FolderOpen,
      title: 'Conteúdo disperso',
      text: 'Materiais, aulas, PDFs, listas, simulados e questões espalhados em diferentes lugares.',
    },
    {
      icon: User,
      title: 'Alunos sem direção',
      text: 'Cada aluno aprende em um ritmo diferente e não sabe o próximo melhor passo.',
    },
    {
      icon: BarChart3,
      title: 'Falta de visibilidade',
      text: 'A coordenação não tem clareza sobre quem está evoluindo, quem está travado e onde agir.',
    },
  ],
} as const

export const LP_SOLUTION = {
  eyebrow: 'A solução',
  headline: 'Um motor de aprendizagem adaptativa para o seu conteúdo.',
  body: 'Com o Broto, sua instituição envia materiais, documentos, aulas e questões. A plataforma organiza esse conhecimento e transforma tudo em uma experiência personalizada para cada estudante.',
  checklist: [
    'Rotinas de estudo personalizadas',
    'Recomendações inteligentes',
    'Acompanhamento contínuo',
    'Dashboards para educadores',
    'IA como apoio pedagógico',
  ],
  engineLabel: 'Motor de aprendizagem adaptativa',
  enginePills: ['Organiza', 'Analisa', 'Conecta', 'Personaliza'],
  inputs: {
    title: 'Seus materiais',
    items: [
      { icon: FileText, label: 'PDFs e documentos' },
      { icon: Video, label: 'Aulas e videoaulas' },
      { icon: ListChecks, label: 'Listas de exercícios' },
      { icon: ClipboardList, label: 'Simulados e provas' },
      { icon: Target, label: 'Questões' },
    ],
  },
  outputs: {
    title: 'Jornada personalizada',
    items: [
      { icon: CalendarCheck, label: 'Rotina de estudos' },
      { icon: Lightbulb, label: 'Recomendações' },
      { icon: Target, label: 'Questões adaptativas' },
      { icon: BookOpen, label: 'Resumos e explicações' },
      { icon: TrendingUp, label: 'Acompanhamento' },
    ],
  },
} as const

export type LpTargetCardTheme = 'green' | 'purple' | 'blue' | 'orange'

export type LpTargetCard = {
  icon: LucideIcon
  title: string
  text: string
  theme: LpTargetCardTheme
}

export const LP_TARGET_AUDIENCE = {
  eyebrow: 'Para quem é',
  headline: 'Uma infraestrutura flexível para diferentes contextos educacionais.',
  cards: [
    {
      icon: School,
      title: 'Cursinhos e escolas',
      text: 'Personalize preparação, simulados, revisões e acompanhamento por turma.',
      theme: 'green',
    },
    {
      icon: GraduationCap,
      title: 'Faculdades',
      text: 'Apoie disciplinas, nivelamento, revisão de conteúdo e monitoria digital.',
      theme: 'purple',
    },
    {
      icon: Building2,
      title: 'Empresas',
      text: 'Crie treinamentos adaptativos com trilhas, avaliações e acompanhamento de evolução.',
      theme: 'blue',
    },
    {
      icon: Landmark,
      title: 'Instituições educacionais',
      text: 'Lance uma experiência digital própria sem desenvolver uma plataforma do zero.',
      theme: 'orange',
    },
  ] satisfies LpTargetCard[],
} as const

export const LP_DIFFERENTIALS = {
  eyebrow: 'Diferenciais',
  headline: 'O que torna o Broto único para a sua instituição.',
  items: [
    {
      icon: Shield,
      title: 'Conteúdo da própria instituição',
      text: 'A experiência nasce a partir dos seus materiais, não de uma biblioteca genérica.',
    },
    {
      icon: Target,
      title: 'Aprendizagem adaptativa',
      text: 'Cada aluno recebe recomendações baseadas no seu desempenho real.',
    },
    {
      icon: Palette,
      title: 'White-label',
      text: 'A plataforma opera com a identidade da sua marca, do seu jeito.',
    },
    {
      icon: Layers,
      title: 'Multi-tenant',
      text: 'Ideal para redes, unidades, turmas, programas ou diferentes clientes.',
    },
    {
      icon: LineChart,
      title: 'Dashboards pedagógicos',
      text: 'Gestores acompanham evolução, dificuldades, engajamento e ações.',
    },
    {
      icon: Bot,
      title: 'IA como suporte',
      text: 'A IA ajuda a organizar, recomendar, explicar e apoiar — sem substituir sua estratégia.',
    },
  ] satisfies LpHighlight[],
} as const

export const LP_PRODUCT = {
  eyebrow: 'O produto',
  headline: 'Melhor experiência para o aluno. Mais inteligência para a gestão.',
  body: [
    'Para o estudante, o Broto mostra o que estudar, quando estudar e por onde continuar.',
    'Para a instituição, o Broto revela quais conteúdos funcionam, onde os alunos travam e quais ações pedagógicas podem melhorar resultados.',
  ],
  cta: 'Ver o Broto em ação',
} as const

export const LP_APPLICATION_EXAMPLE = {
  eyebrow: 'Exemplo de aplicação',
  headline: 'Do ENEM ao treinamento corporativo.',
  body: [
    'O primeiro caso de uso do Broto foi a preparação para o ENEM. Mas a tecnologia não depende do ENEM.',
    'A mesma lógica pode ser aplicada a vestibulares, cursos livres, disciplinas universitárias, capacitação interna, onboarding corporativo, certificações e programas educacionais personalizados.',
  ],
  stats: [
    { value: '+30%', label: 'Aumento médio de engajamento' },
    { value: '+25%', label: 'Melhora de desempenho em avaliações' },
    { value: '+40%', label: 'Redução de evasão e abandono' },
  ],
  note: 'Resultados observados em instituições parceiras.',
  noteLink: 'Saiba mais na demonstração.',
} as const

export type LpFaqItem = { q: string; a: string }

export const LP_FAQ_STYLED = {
  eyebrow: 'Perguntas frequentes',
  headline: 'Respostas para decisões seguras.',
  columns: [
    [
      {
        q: 'O Broto substitui nosso LMS?',
        a: 'Não. O Broto complementa o ambiente que você já usa — transforma seus materiais em jornadas de estudo adaptativas e dá visibilidade pedagógica que a maioria dos LMS não oferece nativamente.',
      },
      {
        q: 'Funciona com o conteúdo que já temos?',
        a: 'Sim. Apostilas, PDFs, listas, simulados e questões que sua equipe já produziu são a base da plataforma. Você não precisa recriar nada do zero.',
      },
      {
        q: 'A IA não pode gerar conteúdo incorreto?',
        a: 'A IA do Broto responde com base nos materiais que você enviou — ela é contextual, não genérica. Quando a resposta não está no seu conteúdo, ela diz isso, em vez de inventar.',
      },
      {
        q: 'É difícil de implementar?',
        a: 'Não. Você envia os materiais, nós configuramos a plataforma com a sua marca. A implantação típica leva semanas, não meses, e sua equipe recebe treinamento completo.',
      },
    ],
    [
      {
        q: 'Funciona para além do ENEM?',
        a: 'Sim. O ENEM foi nosso campo de prova por ser o cenário mais exigente. A plataforma funciona com qualquer conteúdo: vestibulares, concursos, disciplinas regulares e treinamentos corporativos.',
      },
      {
        q: 'Podemos usar nossa marca?',
        a: 'Sim. O Broto é white-label: sua logo, suas cores e seu conteúdo. Para o aluno e para os pais, a tecnologia é da sua instituição.',
      },
      {
        q: 'Como isso ajuda na retenção e engajamento?',
        a: 'Rotinas diárias claras, metas alcançáveis e progresso visível transformam estudo em hábito. Alunos que sabem o que fazer hoje voltam amanhã — com o seu conteúdo, na sua plataforma.',
      },
      {
        q: 'Como medimos resultados?',
        a: 'Painéis por turma e por aluno: engajamento, desempenho por área, tópicos críticos e evolução ao longo do tempo. Sua coordenação enxerga o que está funcionando antes do boletim.',
      },
    ],
  ] satisfies LpFaqItem[][],
} as const

export const LP_HOW_IT_WORKS = {
  headline: 'Em três passos, sua instituição ganha a própria plataforma de aprendizagem.',
  steps: [
    {
      n: '01',
      title: 'Envie o que você já tem',
      text: 'Apostilas, PDFs, resumos, listas de questões, materiais de aula. O Broto organiza o conhecimento da sua instituição e o torna pesquisável, estudável e vivo.',
    },
    {
      n: '02',
      title: 'A plataforma gera a experiência',
      text: 'Cada aluno recebe uma rotina de estudos personalizada, baseada no tempo disponível e nas próprias dificuldades. Questões, feedback imediato e uma IA que tira dúvidas usando o seu material — não respostas genéricas da internet.',
    },
    {
      n: '03',
      title: 'Você enxerga tudo',
      text: 'Painéis por turma e por aluno: quem está estudando, onde estão as lacunas, quem precisa de atenção esta semana. Sua equipe pedagógica intervém antes do problema virar estatística.',
    },
  ],
  ctaContext: 'Quer ver isso com os seus materiais?',
} as const

export type LpHighlight = { icon: LucideIcon; title: string; text: string }

export const LP_PILLAR_STUDENT = {
  eyebrow: 'Para o aluno',
  headline: 'Uma plataforma que o aluno abre todo dia — porque foi desenhada para isso.',
  body: [
    'A maioria das plataformas educacionais é abandonada na segunda semana. O Broto foi construído sobre ciência do hábito: cada aluno tem uma rotina diária clara, missões alcançáveis e progresso visível — incluindo um companheiro virtual que evolui junto com os estudos.',
    'O resultado não é "engajamento" como métrica de vaidade. É o aluno voltando à sua plataforma, com o seu conteúdo, todos os dias.',
  ],
  highlights: [
    {
      icon: CalendarCheck,
      title: 'Rotina inteligente',
      text: 'o aluno abre o app e sabe exatamente o que estudar hoje.',
    },
    {
      icon: Sparkles,
      title: 'Prática com feedback imediato',
      text: 'questões filtradas por área, tema e dificuldade.',
    },
    {
      icon: MessageCircleQuestion,
      title: 'IA que responde com o seu conteúdo',
      text: 'dúvidas resolvidas na hora, com base nos materiais da sua instituição.',
    },
    {
      icon: Flame,
      title: 'Mecânica de constância',
      text: 'sequências de estudo, missões diárias e evolução visível transformam estudo em hábito.',
    },
  ] satisfies LpHighlight[],
} as const

export const LP_PILLAR_MANAGER = {
  eyebrow: 'Para sua equipe pedagógica',
  headline: 'Pare de descobrir os problemas no boletim. Veja-os acontecendo — e aja.',
  body: 'Cada turma, cada aluno, cada lacuna de aprendizagem: visível em tempo real. O Broto mostra à sua coordenação quem está estudando, quais temas estão travando a turma e quais alunos precisam de atenção esta semana — não no fim do bimestre.',
  highlights: [
    {
      icon: Users,
      title: 'Visão de turma',
      text: 'engajamento, desempenho por área e evolução ao longo do tempo.',
    },
    {
      icon: UserSearch,
      title: 'Perfil individual',
      text: 'pontos fortes, pontos fracos e histórico de cada aluno.',
    },
    {
      icon: BellRing,
      title: 'Alertas de atenção',
      text: 'identifique cedo o aluno que está desengajando — antes que ele cancele.',
    },
    {
      icon: Settings2,
      title: 'Gestão simples',
      text: 'crie turmas, convide alunos por código e publique materiais em minutos.',
    },
  ] satisfies LpHighlight[],
} as const

export const LP_PILLAR_WHITELABEL = {
  eyebrow: 'Sua marca',
  headline: 'Não é "mais um app". É a plataforma da sua instituição.',
  body: [
    'O Broto é white-label e multi-tenant: a plataforma carrega o seu nome, as suas cores e o seu conteúdo. Para o aluno e para os pais, sua instituição não "contratou uma ferramenta" — ela lançou tecnologia própria.',
    'Num mercado em que toda escola promete inovação, a sua entrega: uma plataforma de aprendizagem com IA, com a sua marca, no bolso de cada aluno. Sem contratar um time de tecnologia. Sem anos de desenvolvimento.',
  ],
  comparison: {
    headers: ['O caminho tradicional', 'Com o Broto'] as [string, string],
    rows: [
      [
        'Comprar um sistema de ensino e adotar o conteúdo de outra empresa',
        'Manter seu método e seu material — potencializados',
      ],
      [
        'Distribuir PDFs num ambiente virtual que os alunos evitam',
        'Uma experiência que os alunos procuram diariamente',
      ],
      [
        'Desenvolver um app próprio: 12+ meses e um time de tecnologia',
        'Sua plataforma no ar em semanas',
      ],
    ] as [string, string][],
  },
} as const

/** Marcas fictícias para demonstrar o white-label nos mockups (nunca a marca Broto). */
export type LpFictionalBrand = {
  name: string
  initial: string
  accent: string
  accentSoft: string
  dark: string
}

export const LP_FICTIONAL_BRANDS: LpFictionalBrand[] = [
  {
    name: 'Cursinho Vetor',
    initial: 'V',
    accent: '#7C5CFC',
    accentSoft: 'rgba(124, 92, 252, 0.14)',
    dark: '#241A4F',
  },
  {
    name: 'Colégio Aurora',
    initial: 'A',
    accent: '#E8743B',
    accentSoft: 'rgba(232, 116, 59, 0.14)',
    dark: '#4A2410',
  },
  {
    name: 'Foco Carreiras',
    initial: 'F',
    accent: '#1B9AAA',
    accentSoft: 'rgba(27, 154, 170, 0.14)',
    dark: '#0D3B42',
  },
]

export const LP_ENEM_PROOF = {
  eyebrow: 'Prova de fogo',
  headline: 'Construído e testado no cenário mais competitivo da educação brasileira.',
  body: [
    'O Broto nasceu enfrentando o desafio mais exigente que existe: preparar alunos para o ENEM. Banco com questões oficiais de todas as áreas, rotinas adaptativas baseadas no desempenho real e diagnóstico fino de pontos fortes e fracos por tema — de Funções a Termologia.',
    'Se a plataforma funciona para a maratona do ENEM, funciona para o seu vestibular, seu concurso, seu curso técnico ou seu treinamento corporativo.',
  ],
  stats: [
    { value: '+3 mil', label: 'questões oficiais organizadas por área, tema e ano' },
    { value: '4 áreas', label: 'do conhecimento com diagnóstico por tópico' },
    { value: 'Rotina adaptativa', label: 'recalculada conforme o desempenho do aluno' },
  ],
} as const

export const LP_AUDIENCE = {
  headline: 'Feito para quem ensina com método próprio.',
  cards: [
    {
      icon: GraduationCap,
      title: 'Cursinhos preparatórios',
      text: 'Transforme seu diferencial pedagógico em diferencial tecnológico — e dê aos seus alunos um motivo a mais para escolher você, e ficar.',
    },
    {
      icon: Building2,
      title: 'Escolas',
      text: 'Acompanhe a aprendizagem além da sala de aula e mostre às famílias dados concretos de evolução.',
    },
    {
      icon: Layers,
      title: 'Faculdades',
      text: 'Apoie seus alunos em disciplinas críticas e processos seletivos com trilhas baseadas no material dos seus professores.',
    },
    {
      icon: Users,
      title: 'Empresas e treinamentos',
      text: 'Converta manuais, normas e treinamentos internos em trilhas de aprendizagem com acompanhamento individual.',
    },
    {
      icon: Rocket,
      title: 'Edtechs e produtores de conteúdo',
      text: 'Lance sua própria plataforma de aprendizagem sem construir tecnologia do zero.',
    },
  ] satisfies LpHighlight[],
} as const

export const LP_FAQ = {
  headline: 'Perguntas que todo gestor faz — respondidas sem rodeio.',
  items: [
    {
      q: 'Preciso de um time de tecnologia para implantar?',
      a: 'Não. Você envia os materiais, nós configuramos a plataforma com a sua marca. A implantação típica leva semanas, não meses, e sua equipe recebe treinamento completo.',
    },
    {
      q: 'A IA vai responder coisas erradas para os meus alunos?',
      a: 'A IA do Broto responde com base nos materiais que você enviou — ela é contextual, não genérica. Quando a resposta não está no seu conteúdo, ela diz isso, em vez de inventar.',
    },
    {
      q: 'Meus professores vão ter mais trabalho?',
      a: 'Menos. Publicar material leva minutos, as dúvidas recorrentes são absorvidas pela IA e os relatórios que hoje exigem planilhas chegam prontos no painel.',
    },
    {
      q: 'Nossos alunos vão realmente usar?',
      a: 'Essa é a pergunta certa — e é o problema central que o Broto resolve. Toda a experiência do aluno foi desenhada sobre mecânicas de hábito e constância: rotina diária clara, metas alcançáveis e progresso visível. Na demonstração, mostramos exatamente como isso funciona.',
    },
    {
      q: 'Só serve para ENEM?',
      a: 'Não. O ENEM foi nosso campo de prova por ser o cenário mais exigente. A plataforma funciona com qualquer conteúdo que sua instituição enviar: vestibulares, concursos, disciplinas regulares, treinamentos corporativos.',
    },
    {
      q: 'E os dados dos meus alunos?',
      a: 'Os dados são da sua instituição. Arquitetura multi-tenant com isolamento por cliente e conformidade com a LGPD.',
    },
  ],
} as const

export const LP_FINAL_CTA = {
  headline: 'Veja o seu material ganhando vida.',
  body: 'Em 30 minutos, mostramos o Broto funcionando — de preferência com um material real da sua instituição. Você sai da conversa sabendo exatamente como a plataforma ficaria com a sua marca e o seu conteúdo.',
  microcopy: 'Sem compromisso · Resposta em até 1 dia útil',
} as const

export const LP_FOOTER_TAGLINE = 'Broto — Plataforma de aprendizagem adaptativa white-label'

export const LP_FORM_STUDENT_RANGES = [
  'Menos de 100',
  '100 a 500',
  '500 a 2.000',
  'Mais de 2.000',
] as const

export const LP_FORM_PROFILES = ['Cursinho', 'Escola', 'Faculdade', 'Empresa', 'Outro'] as const

export const LP_FORM_MICROCOPY = 'Retornamos em até 1 dia útil para marcar o melhor horário.'
