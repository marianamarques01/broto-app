import type { PerformancePeriod } from '@/lib/performance-history'

export const PROGRESS_PERIOD_FILTERS: { id: PerformancePeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Tudo' },
]

/**
 * Heatmap estilo GitHub: 7 linhas domingo→sábado.
 * Só exibimos rótulos nas linhas de seg, qua e sex (como no GitHub).
 */
export const HEATMAP_GITHUB_ROW_LABELS: (string | null)[] = [
  null,
  'Seg',
  null,
  'Qua',
  null,
  'Sex',
  null,
]
