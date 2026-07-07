import type { RedacaoRepertorio } from '@broto/shared'

export type HelpTab = 'dicas' | 'modelos' | 'repertorios'

export const HELP_TAB_LABELS: Record<HelpTab, string> = {
  dicas: 'Dicas',
  modelos: 'Modelos',
  repertorios: 'Repertórios',
}

export const ENEM_TEMPO_SEGUNDOS = 90 * 60

export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function repertorioTipoLabel(tipo: RedacaoRepertorio['tipo']): string {
  const labels: Record<RedacaoRepertorio['tipo'], string> = {
    dica: 'Dica',
    repertorio: 'Repertório',
    modelo_estrutura: 'Modelo',
    conectivos: 'Conectivos',
    proposta_intervencao: 'Proposta',
  }
  return labels[tipo]
}

export function helpTabForTipo(tipo: RedacaoRepertorio['tipo']): HelpTab {
  if (tipo === 'dica') return 'dicas'
  if (tipo === 'repertorio') return 'repertorios'
  return 'modelos'
}

export function groupRepertoriosByTab(items: RedacaoRepertorio[]): Record<HelpTab, RedacaoRepertorio[]> {
  const grouped: Record<HelpTab, RedacaoRepertorio[]> = {
    dicas: [],
    modelos: [],
    repertorios: [],
  }
  for (const item of items) {
    grouped[helpTabForTipo(item.tipo)].push(item)
  }
  return grouped
}

export function firstHelpTabWithContent(
  grouped: Record<HelpTab, RedacaoRepertorio[]>,
): HelpTab {
  const found = (Object.keys(HELP_TAB_LABELS) as HelpTab[]).find((tab) => grouped[tab].length > 0)
  return found ?? 'dicas'
}
