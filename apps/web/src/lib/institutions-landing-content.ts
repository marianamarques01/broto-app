import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  Lock,
  Shield,
  Upload,
  Users,
  Zap,
} from 'lucide-react'

export type NavAnchor = { id: string; label: string }

export const NAV_ANCHORS: NavAnchor[] = [
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'para-quem', label: 'Para instituições' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'contato', label: 'Contato' },
]

export const PROBLEM_ITEMS = [
  {
    title: 'Materiais parados',
    text: 'Apostilas no Drive, PDFs no LMS, aulas gravadas que ninguém reassiste. O conteúdo existe; a jornada não.',
  },
  {
    title: 'Alunos invisíveis',
    text: 'Metade da turma some entre uma prova e outra. WhatsApp e planilha não escalam para 200 matrículas.',
  },
  {
    title: 'Decisões no escuro',
    text: 'Sem dados granulares, a coordenação intervê tarde — ou uniformiza a aula para quem já domina e para quem ficou para trás.',
  },
] as const

export const HOW_IT_WORKS_STEPS = [
  {
    n: '1',
    title: 'Centralize seus materiais',
    text: 'Envie PDFs, apostilas e conteúdos por turma. Tudo fica organizado por instituição — isolado e seguro.',
  },
  {
    n: '2',
    title: 'O aluno recebe uma jornada personalizada',
    text: 'Rotinas de estudo, prática e recomendações adaptadas ao tempo disponível e ao desempenho.',
  },
  {
    n: '3',
    title: 'Suporte contextual quando precisar',
    text: 'Dúvidas respondidas com base nos materiais oficiais da turma — não respostas genéricas da internet.',
  },
  {
    n: '4',
    title: 'Você enxerga a turma inteira',
    text: 'Dashboards por turma e perfil individual: engajamento, evolução por área, tópicos críticos e histórico.',
  },
] as const

export const AUDIENCE_ITEMS = [
  {
    icon: GraduationCap,
    title: 'Cursinhos e pré-vestibulares',
    text: 'Escale o acompanhamento individual. Ofereça experiência premium com a identidade do seu cursinho.',
  },
  {
    icon: Building2,
    title: 'Escolas e redes',
    text: 'Transforme material didático em estudo guiado. Dê à coordenação evidências para reuniões com pais e diretoria.',
  },
  {
    icon: BookOpen,
    title: 'Faculdades e extensão',
    text: 'Aumente engajamento em disciplinas assíncronas com trilhas e indicadores de conclusão.',
  },
  {
    icon: Users,
    title: 'Treinamento corporativo',
    text: 'Onboarding e upskilling com trilhas personalizadas e relatórios para RH — na marca da empresa.',
  },
] as const

export const PLATFORM_VIEWS = {
  admin: {
    label: 'Visão do gestor',
    items: [
      'Crie turmas e convide alunos com código de acesso',
      'Publique materiais que alimentam a experiência de estudo',
      'Acompanhe consistência e desempenho por área',
      'Analise cada aluno: acertos, erros, tópicos fortes e fracos',
    ],
  },
  student: {
    label: 'Visão do aluno',
    items: [
      'Rotina semanal alinhada à disponibilidade',
      'Prática com feedback imediato',
      'Acompanhamento de evolução e metas',
      'Suporte para tirar dúvidas com base nos materiais da turma',
    ],
  },
} as const

export const DIFFERENTIALS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Upload,
    title: 'Seu conteúdo, não uma biblioteca genérica',
    text: 'Alunos estudam com o material que você definiu como oficial. Mantém coerência pedagógica e autoridade da instituição.',
  },
  {
    icon: Zap,
    title: 'Personalização que opera em escala',
    text: 'Rotinas e foco automático nas lacunas — sem multiplicar monitores ou planilhas.',
  },
  {
    icon: BarChart3,
    title: 'Visibilidade pedagógica real',
    text: 'Saiba quem parou de estudar antes do churn. Intervenha com dados, não intuição.',
  },
  {
    icon: Layers,
    title: 'Multi-institucional e white-label',
    text: 'Cada cliente opera em ambiente isolado, com identidade própria. Ideal para redes, franquias e grupos educacionais.',
  },
]

export const USE_CASES = [
  {
    title: 'Preparação ENEM',
    badge: 'Exemplo',
    text: 'Turmas de 3º ano ou cursinho: rotina por área, banco de questões, simulados e acompanhamento por competência.',
  },
  {
    title: 'Reforço escolar',
    badge: null,
    text: 'Materiais do professor viram trilha de revisão com métricas para o coordenador.',
  },
  {
    title: 'Capacitação corporativa',
    badge: null,
    text: 'Manuais e procedimentos viram treinamento com quiz, progresso e certificação interna.',
  },
] as const

export const IMPLEMENTATION_WEEKS = [
  { week: 'Semana 1', text: 'Configuração da instituição, turmas piloto e upload de materiais' },
  { week: 'Semana 2', text: 'Onboarding de coordenadores e professores' },
  { week: 'Semana 3', text: 'Entrada dos alunos e acompanhamento contínuo' },
] as const

export const TRUST_ITEMS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Lock,
    title: 'Isolamento multi-tenant',
    text: 'Dados de cada organização separados.',
  },
  {
    icon: BookOpen,
    title: 'Conteúdo proprietário',
    text: 'Seus materiais permanecem seus.',
  },
  {
    icon: Shield,
    title: 'LGPD',
    text: 'Tratamento de dados conforme política institucional.',
  },
  {
    icon: Zap,
    title: 'Suporte contextual',
    text: 'Respostas ancoradas no material oficial da turma.',
  },
]

export const FAQ_ITEMS = [
  {
    q: 'Preciso trocar meu LMS?',
    a: 'Não necessariamente. O Broto complementa onde o LMS entrega arquivos mas não personaliza nem mede engajamento profundo.',
  },
  {
    q: 'Funciona com nosso material atual?',
    a: 'Sim. PDFs, apostilas e documentos que você já usa.',
  },
  {
    q: 'É só um chatbot de IA?',
    a: 'Não. IA é uma camada de suporte. O núcleo é jornada de estudo, prática, rotina e analytics pedagógico.',
  },
  {
    q: 'Serve só para ENEM?',
    a: 'Não. ENEM é um caso de uso comum no Brasil; a plataforma adapta-se a qualquer currículo ou programa de treinamento.',
  },
  {
    q: 'Quanto tempo leva para implantar?',
    a: 'Instituições piloto operam em 2–3 semanas, dependendo do volume de turmas e materiais.',
  },
  {
    q: 'Como funciona o white-label?',
    a: 'Cada instituição opera com identidade visual e configuração próprias — ideal para redes e franquias.',
  },
  {
    q: 'Qual o investimento?',
    a: 'Personalizado por número de alunos ativos e módulos. Conversamos na demonstração.',
  },
] as const

export const DEMO_FORM_SEGMENTS = [
  'Cursinho / pré-vestibular',
  'Escola / rede',
  'Faculdade / extensão',
  'Treinamento corporativo',
  'Outro',
] as const
