import type { EnemCompetencia } from './enem-reference-chunking.ts'
import type { TextoMotivadorMapped } from './redacao-tema-map.ts'

export const REDACAO_PROMPT_VERSION = 'redacao-correct-v1.0'

export const REDACAO_CORRECT_TEMPERATURE = 0.1

const COMPETENCIA_TITLES: Record<EnemCompetencia, string> = {
  I: 'Domínio da modalidade escrita formal da língua portuguesa',
  II: 'Compreensão da proposta e estrutura dissertativo-argumentativa',
  III: 'Seleção, organização e interpretação de informações e argumentos',
  IV: 'Mecanismos linguísticos de coesão e articulação textual',
  V: 'Proposta de intervenção respeitando direitos humanos',
}

const COMPETENCIA_V_ESTRUTURAL = `
IMPORTANTE — Competência V:
Avalie APENAS a ESTRUTURA da proposta de intervenção (agente, ação, meio/meio de execução, finalidade, detalhamento).
Verifique compatibilidade com direitos humanos.
NÃO penalize posição política legítima do candidato.
NÃO avalie se a proposta é "boa política pública" — apenas se atende aos critérios estruturais da Cartilha INEP.
`.trim()

function formatMotivadores(motivadores: TextoMotivadorMapped[]): string {
  if (motivadores.length === 0) return '(sem textos motivadores cadastrados)'

  return motivadores
    .map((m, index) => {
      const titulo = m.titulo?.trim() ? `${m.titulo.trim()}\n` : ''
      return `Motivador ${index + 1}:\n${titulo}${m.conteudo.trim()}`
    })
    .join('\n\n')
}

export function buildRedacaoUserPrompt(params: {
  temaTitulo: string
  eixoTematico: string
  motivadores: TextoMotivadorMapped[]
  texto: string
  linhaCount: number
}): string {
  return [
    '## Tema da redação',
    params.temaTitulo,
    `Eixo temático: ${params.eixoTematico}`,
    '',
    '## Textos motivadores',
    formatMotivadores(params.motivadores),
    '',
    `## Texto do candidato (${params.linhaCount} linhas)`,
    params.texto,
  ].join('\n')
}

export function buildFatoresZeroSystemPrompt(ragContext: string | null): string {
  const ragBlock = ragContext
    ? `\n\n${ragContext}`
    : '\n\n(Aviso: trechos normativos da Cartilha não recuperados — aplique apenas critérios explícitos abaixo.)'

  return [
    'Você é corretor oficial de redação do ENEM, seguindo exclusivamente a Cartilha do Participante INEP.',
    'Tarefa: detectar fatores de ANULAÇÃO (nota zero total) ANTES da avaliação por competências.',
    ragBlock,
    '',
    'Motivos canônicos (use apenas estes valores em "motivos"):',
    '- fuga_tema — não desenvolve o tema proposto',
    '- texto_curto — menos de 7 linhas (já checado pelo sistema; só inclua se evidente no texto)',
    '- copia_motivadores — cópia integral ou quase integral dos textos motivadores',
    '- lingua_estrangeira — texto predominantemente em outra língua',
    '- identificacao_candidato — nome, assinatura ou identificação pessoal',
    '- nao_dissertativo — não atende à estrutura dissertativo-argumentativa',
    '',
    'Responda SOMENTE com JSON válido neste formato:',
    '{',
    '  "detectado": boolean,',
    '  "motivos": string[],',
    '  "detalhes": string,',
    '  "evidencias": [{ "trecho": string, "start_offset": number, "end_offset": number }]',
    '}',
    '',
    'Se não houver fator de anulação, retorne detectado=false e motivos=[].',
    'Seja conservador: só marque detectado=true com evidência clara no texto.',
  ].join('\n')
}

export function buildCompetenciaSystemPrompt(
  competencia: EnemCompetencia,
  ragContext: string | null,
): string {
  const ragBlock = ragContext
    ? `\n\n${ragContext}`
    : '\n\n(Aviso: trechos normativos da Cartilha não recuperados — use critérios ENEM padrão da competência.)'

  const extraV = competencia === 'V' ? `\n\n${COMPETENCIA_V_ESTRUTURAL}` : ''

  return [
    `Você é corretor oficial de redação do ENEM — Competência ${competencia}.`,
    COMPETENCIA_TITLES[competencia],
    ragBlock,
    extraV,
    '',
    'Atribua nota DISCRETA em múltiplos de 40: 0, 40, 80, 120, 160 ou 200.',
    'Justificativa em linguagem acessível para estudante do ensino médio (sem jargão excessivo).',
    'Marcações inline: destaque trechos específicos do texto com problema ou ponto de melhoria.',
    '',
    'Responda SOMENTE com JSON válido neste formato:',
    '{',
    `  "competencia": "${competencia}",`,
    '  "nota": number,',
    '  "justificativa": string,',
    '  "marcacoes": [{',
    '    "start_offset": number,',
    '    "end_offset": number,',
    '    "trecho": string,',
    '    "tipo_problema": string,',
    '    "comentario": string',
    '  }]',
    '}',
    '',
    'Offsets são posições no texto do candidato (0-indexed).',
    'Inclua marcações apenas quando houver trecho concreto a destacar.',
  ].join('\n')
}

export function buildRagQueryForCompetencia(
  competencia: EnemCompetencia,
  temaTitulo: string,
  texto: string,
): string {
  const excerpt = texto.slice(0, 600).trim()
  return `Competência ${competencia} ENEM — ${COMPETENCIA_TITLES[competencia]}. Tema: ${temaTitulo}. Trecho: ${excerpt}`
}

export function buildRagQueryForFatoresZero(temaTitulo: string, texto: string): string {
  const excerpt = texto.slice(0, 800).trim()
  return `Fatores de anulação redação ENEM. Tema: ${temaTitulo}. Texto: ${excerpt}`
}
